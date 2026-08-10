"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader } from "@zxing/library";

export function BarcodeScannerOverlay({
  onScan,
  onClose,
  isPaused = false,
  className = "fixed inset-0 z-[9999]",
  showCloseButton = true,
}) {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [detectedItem, setDetectedItem] = useState(null);
  const [useNative, setUseNative] = useState(false);

  // Stable refs so effects don't re-run when parent re-renders
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // 1. Detect if the device supports the native high-speed GPU engine
  useEffect(() => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const hasNativeSupport = "BarcodeDetector" in window;
    setUseNative(hasNativeSupport && !isIOS);
  }, []);

  // --- ENGINE A: Native BarcodeDetector (Android/Chrome) ---
  useEffect(() => {
    if (!useNative) return;

    let animationFrameId;
    let cancelled = false;
    const detector = new window.BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "code_128"],
    });

    const startNativeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            focusMode: "continuous",
            exposureMode: "continuous",
            whiteBalance: "continuous",
          },
        });
        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (_) {
          /* safe to ignore */
        }
        setIsReady(true);
      } catch (err) {
        console.error(err);
      }
    };

    let scanCooldown = false;

    const nativeHunt = async () => {
      if (cancelled) return;
      if (isPausedRef.current || scanCooldown) {
        animationFrameId = requestAnimationFrame(nativeHunt);
        return;
      }

      if (videoRef.current?.readyState === 4) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (cancelled) return;
          if (barcodes.length > 0) {
            const { x, y, width, height } = barcodes[0].boundingBox;
            const video = videoRef.current;
            const rect = video.getBoundingClientRect();
            const scaleX = rect.width / video.videoWidth;
            const scaleY = rect.height / video.videoHeight;

            setDetectedItem({
              left: x * scaleX,
              top: y * scaleY,
              width: width * scaleX,
              height: height * scaleY,
            });

            if (navigator.vibrate) navigator.vibrate(60);
            onScanRef.current(barcodes[0].rawValue);

            scanCooldown = true;
            setTimeout(() => {
              scanCooldown = false;
              setDetectedItem(null);
            }, 1500);
          } else {
            setDetectedItem(null);
          }
        } catch (e) {
          /* ignore */
        }
      }
      animationFrameId = requestAnimationFrame(nativeHunt);
    };

    startNativeCamera().then(() => {
      if (!cancelled) animationFrameId = requestAnimationFrame(nativeHunt);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current?.srcObject)
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    };
  }, [useNative]);

  // --- ENGINE B: ZXing BrowserMultiFormatReader (iOS Safari / fallback) ---
  // We drive BrowserMultiFormatReader ourselves instead of react-zxing's useZxing
  // hook. useZxing's internal useEffect/useCallback dependency chain re-calls
  // decodeFromConstraints (and therefore video.play()) on every parent re-render,
  // causing "Trying to play video that is already playing" warnings and scan delays.
  // By calling decodeFromConstraints exactly ONCE on mount with stable refs,
  // the video is played once and the decode loop runs until cleanup.
  useEffect(() => {
    if (useNative) return; // Only run for fallback

    let cancelled = false;
    let startTimer;
    const reader = new BrowserMultiFormatReader();
    reader.timeBetweenDecodingAttempts = 100; // Fast polling

    const startZxing = async () => {
      if (cancelled || !videoRef.current) return;
      try {
        await reader.decodeFromConstraints(
          {
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result, error) => {
            if (cancelled) return;
            if (result) {
              if (isPausedRef.current) return; // Ignore while sheet is open
              if (navigator.vibrate) navigator.vibrate(60);
              onScanRef.current(result.getText());
            }
            // errors are normal (no barcode in frame) — ignore
          },
        );
        if (!cancelled) setIsReady(true);
      } catch (err) {
        // Suppress "video play" warnings from BrowserCodeReader — harmless on mount
        if (!cancelled) console.error("ZXing init error:", err);
      }
    };

    // Small delay lets React Strict Mode's cleanup/remount cycle settle
    // before we acquire the camera, preventing the double-play race.
    startTimer = setTimeout(startZxing, 120);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      reader.reset(); // Stops decoding, releases camera
    };
  }, [useNative]);

  return (
    <div
      className={`${className} bg-black overflow-hidden touch-none select-none`}
    >
      {/* CAMERA FEED — single video element for whichever engine is active */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* THE SCANNING HUD */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        <AnimatePresence>
          {detectedItem ? (
            /* LOCK-ON RETICLE: Snaps to the barcode anywhere on screen */
            <motion.div
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{
                opacity: 1,
                scale: 1,
                left: detectedItem.left,
                top: detectedItem.top,
                width: detectedItem.width,
                height: detectedItem.height,
              }}
              exit={{ opacity: 0 }}
              className="absolute border-[2px] border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.4)]"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {/* Internal Scanning Glow */}
              <div className="absolute inset-0 bg-[#22c55e]/10 animate-pulse rounded-xl" />
            </motion.div>
          ) : (
            /* CENTER TARGET: Clear sign for where to aim */
            <div className="absolute inset-0">
              {/* Lighter Vignette Overlay */}
              <div
                className="absolute inset-0 bg-black/15"
                style={{
                  maskImage:
                    "radial-gradient(circle at center 40%, transparent 120px, black 180px)",
                  WebkitMaskImage:
                    "radial-gradient(circle at center 40%, transparent 120px, black 180px)",
                }}
              />

              <div className="absolute left-1/2 -translate-x-1/2 top-[40%] -translate-y-1/2 flex flex-col items-center gap-6">
                <div className="relative w-64 h-48 flex items-center justify-center">
                  {/* Sharp White Corners (Sam's Club Style) */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white shadow-sm" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white shadow-sm" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white shadow-sm" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white shadow-sm" />

                  {/* Center Crosshair */}
                  <div className="relative w-8 h-8 flex items-center justify-center opacity-80">
                    <div className="absolute w-[2px] h-full bg-white shadow-sm" />
                    <div className="absolute h-[2px] w-full bg-white shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* TOP CONTROLS: Large Visible Close Button */}
      {showCloseButton && (
        <div className="absolute top-0 left-0 right-0 p-8 flex justify-end items-start z-50 pointer-events-auto">
          <Button
            variant="secondary"
            onClick={onClose}
            className="h-16 w-16 rounded-full bg-white text-black shadow-2xl hover:bg-gray-100 active:scale-90 transition-all border-4 border-black/10"
          >
            <X className="h-8 w-8 stroke-[3]" />
          </Button>
        </div>
      )}

      {/* LOADING STATE */}
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[100]">
          <Loader2 className="h-12 w-12 text-[#d97757] animate-spin mb-6" />
          <p className="text-white font-black uppercase tracking-[0.2em] text-sm">
            Activating Lens
          </p>
        </div>
      )}
    </div>
  );
}
