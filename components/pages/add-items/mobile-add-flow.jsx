'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePantry } from '@/components/providers/PantryProvider';
import { categories } from '@/lib/constants';
import { UpgradeModal } from '@/components/modals/UpgradeModal';

// 1. Import Sibling View Components
import { ScanView } from './scan-view';
import { FormView } from './form-view';
import { SuccessView } from './sucess-view';

// 2. Import External Components
const BarcodeScannerOverlay = dynamic(
  () => import('@/components/ui/BarcodeScannerOverlay').then(mod => mod.BarcodeScannerOverlay),
  { ssr: false }
);

export function MobileAddFlow() {
  const { pantryId } = usePantry();

  // --- STATE ---
  const [currentView, setCurrentView] = useState('SCAN_VIEW'); 
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Form State
  const [barcode, setBarcode] = useState('');
  const [isInternalBarcode, setIsInternalBarcode] = useState(false);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(categories[0]?.value || 'canned');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('units');
  const [expirationDate, setExpirationDate] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBarcode, setIsLoadingBarcode] = useState(false);

  // --- LOGIC: Barcode API Lookup ---
  useEffect(() => {
    const lookup = async () => {
      if (currentView !== 'FORM_VIEW' || !barcode || barcode.length < 3 || isInternalBarcode) return;
      
      setIsLoadingBarcode(true);
      try {
        const res = await fetch(`/api/barcode/${encodeURIComponent(barcode)}`, {
          headers: { 'x-pantry-id': pantryId },
          cache: 'no-store'
        });
        const data = await res.json();
        if (data.found && data.data) {
          setItemName(data.data.name || '');
          setCategory(data.data.category || categories[0]?.value);
        }
      } catch (e) {
        console.error("Lookup failed", e);
      } finally {
        setIsLoadingBarcode(false);
      }
    };
    const timeout = setTimeout(lookup, 800);
    return () => clearTimeout(timeout);
  }, [barcode, isInternalBarcode, pantryId, currentView]);

  // --- ACTIONS ---
  const generateInternalBarcode = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    setBarcode(`INT-${randomCode}`);
    setIsInternalBarcode(true);
  };

  const handleManualAdd = () => {
    generateInternalBarcode();
    setCurrentView('FORM_VIEW');
  };

  const handleScanSuccess = (scannedCode) => {
    setBarcode(scannedCode);
    setIsInternalBarcode(false);
    setCurrentView('FORM_VIEW');
  };

  const resetFlow = () => {
    setBarcode('');
    setIsInternalBarcode(false);
    setItemName('');
    setCategory(categories[0]?.value || 'canned');
    setQuantity('');
    setUnit('units');
    setExpirationDate('');
    setStorageLocation('');
    setNotes('');
    setShowNotes(false);
    setCurrentView('SCAN_VIEW');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!itemName || !quantity) return;

    setIsSubmitting(true);

    try {
      const finalBarcode = barcode.trim() || `GEN-${Date.now().toString().slice(-6)}`;
      const res = await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pantry-id': pantryId },
        body: JSON.stringify({
          barcode: finalBarcode, name: itemName, category, 
          quantity: parseFloat(quantity), unit, expirationDate, 
          storageLocation, notes,
        })
      });

      if (res.status === 403) {
        setIsSubmitting(false);
        setShowUpgradeModal(true);
        return;
      }

      if (!res.ok) throw new Error("Failed");
      setCurrentView('SUCCESS_VIEW');
    } catch (err) {
      alert("Error adding item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // FIX: Match background color to #f2f2f7. Use a calc height subtracting the nav bar height.
    // Replace "4rem" or "64px" with whatever the exact height of your top nav bar is.
    <div className="flex flex-col w-full bg-[#f2f2f7] relative overflow-hidden h-[calc(100dvh-4rem)]">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {currentView === 'SCAN_VIEW' && (
        <ScanView 
          onScanClick={() => setCurrentView('CAMERA_VIEW')} 
          onManualClick={handleManualAdd} 
        />
      )}

      {currentView === 'CAMERA_VIEW' && (
        <BarcodeScannerOverlay 
          onScan={handleScanSuccess} 
          onClose={resetFlow} 
        />
      )}

      {currentView === 'FORM_VIEW' && (
        <FormView 
          onBack={() => setCurrentView('SCAN_VIEW')}
          onCameraClick={() => setCurrentView('CAMERA_VIEW')}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isLoadingBarcode={isLoadingBarcode}
          generateInternalBarcode={generateInternalBarcode}
          isInternalBarcode={isInternalBarcode}
          barcode={barcode} setBarcode={setBarcode} setIsInternalBarcode={setIsInternalBarcode}
          itemName={itemName} setItemName={setItemName}
          category={category} setCategory={setCategory}
          quantity={quantity} setQuantity={setQuantity}
          unit={unit} setUnit={setUnit}
          expirationDate={expirationDate} setExpirationDate={setExpirationDate}
          storageLocation={storageLocation} setStorageLocation={setStorageLocation}
          notes={notes} setNotes={setNotes}
          showNotes={showNotes} setShowNotes={setShowNotes}
        />
      )}

      {currentView === 'SUCCESS_VIEW' && (
        <SuccessView 
          quantity={quantity} 
          unit={unit} 
          itemName={itemName} 
          expirationDate={expirationDate}
          onDone={resetFlow}
          onScanAnother={() => {
            resetFlow();
            setCurrentView('CAMERA_VIEW');
          }}
        />
      )}
    </div>
  );
}