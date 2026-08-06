'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useZxing } from "react-zxing";

export function BarcodeScannerOverlay({ onScan, onClose, isPaused = false, className = "fixed inset-0 z-[9999]", showCloseButton = true }) {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [detectedItem, setDetectedItem] = useState(null);
  const [useNative, setUseNative] = useState(false);

  // onScan/isPaused change identity on every parent re-render (e.g. while a scan
  // is being looked up). Read them via refs inside the hunt loops instead of
  // closing over the props directly, so neither engine's setup effect below has
  // to depend on them — that dependency was tearing down and re-acquiring the
  // camera (getUserMedia/video.play() race) on every re-render, which is what
  // made scans feel slow/glitchy even though per-frame detection itself was fine.
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // 1. Detect if the device supports the native high-speed GPU engine
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const hasNativeSupport = 'BarcodeDetector' in window;
    setUseNative(hasNativeSupport && !isIOS); 
  }, []);

  // --- ENGINE A: Native Hardware Hunting (Android/Chrome) ---
  useEffect(() => {
    if (!useNative) return;

    let animationFrameId;
    const detector = new window.BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'code_128']
    });

    const startNativeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 },
            focusMode: "continuous",   // Force focus hunting
            exposureMode: "continuous",
            whiteBalance: "continuous"
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsReady(true);
        }
      } catch (err) { console.error(err); }
    };

    const nativeHunt = async () => {
      if (isPausedRef.current) {
        animationFrameId = requestAnimationFrame(nativeHunt);
        return;
      }

      if (videoRef.current?.readyState === 4) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const { x, y, width, height } = barcodes[0].boundingBox;
            const video = videoRef.current;
            const rect = video.getBoundingClientRect();
            const scaleX = rect.width / video.videoWidth;
            const scaleY = rect.height / video.videoHeight;

            setDetectedItem({ left: x * scaleX, top: y * scaleY, width: width * scaleX, height: height * scaleY });

            // Physical vibration feedback
            if (navigator.vibrate) navigator.vibrate(60);
            onScanRef.current(barcodes[0].rawValue);
            return;
          } else { setDetectedItem(null); }
        } catch (e) { console.error(e); }
      }
      animationFrameId = requestAnimationFrame(nativeHunt);
    };

    startNativeCamera().then(() => { animationFrameId = requestAnimationFrame(nativeHunt); });
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    };
  }, [useNative]);

  // --- ENGINE B: Fallback Optimized (iOS Safari) ---
  const zxingConstraints = useMemo(() => ({
    video: { 
        facingMode: "environment", 
        width: { ideal: 1280 }, 
        height: { ideal: 720 }, 
        focusMode: "continuous",
        exposureMode: "continuous"
    }
  }), []);

  // Memoized so this options object only changes identity when useNative flips
  // (once, on mount) — otherwise react-zxing tears down and replays the video
  // on every parent re-render, racing its own play()/pause() calls.
  const zxingOptions = useMemo(() => ({
    paused: useNative, // Do not toggle this rapidly with isPaused, it causes browser .play() race conditions
    onDecodeResult(result) {
      if (isPausedRef.current) return; // Ignore scans while sheet is open or looking up
      if (navigator.vibrate) navigator.vibrate(60);
      onScanRef.current(result.getText());
    },
    constraints: zxingConstraints,
    timeBetweenDecodingAttempts: 100, // Ultra-fast polling
  }), [useNative, zxingConstraints]);

  const { ref: zxingRef } = useZxing(zxingOptions);

  return (
    <div className={`${className} bg-black overflow-hidden touch-none select-none`}>
      
      {/* CAMERA FEED */}
      {useNative ? (
        <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <video ref={zxingRef} muted playsInline className="absolute inset-0 w-full h-full object-cover" onPlay={() => setIsReady(true)} />
      )}

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
                height: detectedItem.height 
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
                <div className="absolute inset-0 bg-black/15" style={{ 
                  maskImage: 'radial-gradient(circle at center 40%, transparent 120px, black 180px)',
                  WebkitMaskImage: 'radial-gradient(circle at center 40%, transparent 120px, black 180px)'
                }} />

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
          <p className="text-white font-black uppercase tracking-[0.2em] text-sm">Activating Lens</p>
        </div>
      )}
    </div>
  );
}