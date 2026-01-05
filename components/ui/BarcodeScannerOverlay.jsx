'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useZxing } from "react-zxing";

export function BarcodeScannerOverlay({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [detectedItem, setDetectedItem] = useState(null);
  const [useNative, setUseNative] = useState(false);

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
            onScan(barcodes[0].rawValue);
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
  }, [useNative, onScan]);

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

  const { ref: zxingRef } = useZxing({
    paused: useNative,
    onDecodeResult(result) {
      if (navigator.vibrate) navigator.vibrate(60);
      onScan(result.getText());
    },
    constraints: zxingConstraints,
    timeBetweenDecodingAttempts: 100, // Ultra-fast polling
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden touch-none select-none">
      
      {/* CAMERA FEED */}
      {useNative ? (
        <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <video ref={zxingRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" onPlay={() => setIsReady(true)} />
      )}

      {/* THE SCANNING HUD */}
      <div className="absolute inset-0 z-10 pointer-events-none">
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
              className="absolute border-[6px] border-[#22c55e] rounded-2xl shadow-[0_0_50px_rgba(34,197,94,0.8)]"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
                {/* Internal Scanning Glow */}
                <div className="absolute inset-0 bg-[#22c55e]/10 animate-pulse rounded-xl" />
            </motion.div>
          ) : (
            /* CENTER TARGET: Clear sign for where to aim */
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-80 h-56 flex items-center justify-center">
                    {/* Glowing Brackets */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-white/40 rounded-tl-3xl shadow-lg" />
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-white/40 rounded-tr-3xl shadow-lg" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-white/40 rounded-bl-3xl shadow-lg" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-white/40 rounded-br-3xl shadow-lg" />
                    
                    {/* Center Laser Line */}
                    <motion.div 
                        animate={{ opacity: [0.2, 0.8, 0.2], scaleX: [0.95, 1.05, 0.95] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-[80%] h-1 bg-[#d97757] shadow-[0_0_20px_#d97757]" 
                    />
                </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* TOP CONTROLS: Large Visible Close Button */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-end items-start z-50">
        <Button 
          variant="secondary" 
          onClick={onClose} 
          className="h-16 w-16 rounded-full bg-white text-black shadow-2xl hover:bg-gray-100 active:scale-90 transition-all border-4 border-black/10"
        >
          <X className="h-8 w-8 stroke-[3]" />
        </Button>
      </div>

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