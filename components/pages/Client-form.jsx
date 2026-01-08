'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Loader2, Save, User, Mail, Phone, MapPin, Baby, Users as UsersIcon, GraduationCap, History as HistoryIcon, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { usePantry } from '@/components/providers/PantryProvider';

// 🔧 CONFIG: How many past visits to show?
const VISIT_LIMIT = 4;

export function ClientFormDrawer({ isOpen, onOpenChange, client, onClientUpdated }) {
  const { pantryId } = usePantry();

  const initialData = {
    firstName: '',
    lastName: '',
    clientId: '',
    childrenCount: 0,
    adultCount: 1, 
    seniorCount: 0,
    email: '',
    phone: '',
    address: ''
  };

  const [formData, setFormData] = useState(initialData);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // --- 1. LOAD DATA ---
  useEffect(() => {
    if (isOpen) {
      setMessage({ type: '', text: '' });
      if (client) {
        setFormData({
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          clientId: client.clientId || '',
          childrenCount: client.childrenCount ?? 0,
          adultCount: client.adultCount ?? 1,
          seniorCount: client.seniorCount ?? 0,
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || ''
        });
        fetchVisitHistory(client.clientId);
      } else {
        setFormData(initialData);
        setHistory([]);
      }
    }
  }, [isOpen, client]);

  // --- 2. FETCH HISTORY ---
  const fetchVisitHistory = async (cid) => {
    if (!cid) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/client-distributions?clientId=${cid}`, {
        headers: { 'x-pantry-id': pantryId }
      });
      if(res.ok) {
        const data = await res.json();
        const clientHistory = data.data.filter(h => h.clientId === cid);
        setHistory(clientHistory || []);
      }
    } catch (e) { console.error("History fetch error", e); }
    finally { setLoadingHistory(false); }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- 3. HELPER: GROUP HISTORY BY DATE ---
  const getGroupedHistory = (historyData) => {
    const groups = {};
    historyData.forEach(item => {
      const rawDate = item.distributionDate || item.dateDistributed;
      const dateObj = new Date(rawDate);
      const dateKey = dateObj.toLocaleDateString(); 
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateObj,
          items: []
        };
      }
      groups[dateKey].items.push(item);
    });
    // Sort newest date first
    return Object.values(groups).sort((a, b) => b.date - a.date);
  };

  // --- 4. HANDLE SAVE ---
  const handleSubmit = async () => {
    if (!formData.firstName) {
      setMessage({ type: 'error', text: 'First Name is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const kids = Number(formData.childrenCount) || 0;
      const adults = Number(formData.adultCount) || 0;
      const seniors = Number(formData.seniorCount) || 0;
      
      const payload = {
        ...formData,
        childrenCount: kids,
        adultCount: adults,
        seniorCount: seniors,
      };

      const isEditing = !!client;
      const url = isEditing ? `/api/clients?id=${client._id}` : '/api/clients';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pantry-id': pantryId },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      setMessage({ type: 'success', text: 'Saved successfully!' });
      
      setTimeout(() => { 
        onClientUpdated(); 
        onOpenChange(false); 
      }, 500);

    } catch (error) { 
      setMessage({ type: 'error', text: error.message }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // --- 5. HANDLE DELETE ---
  const handleDelete = async () => {
    if (!client?._id || !confirm("Delete this client permanently?")) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/clients?id=${client._id}`, {
        method: 'DELETE',
        headers: { 'x-pantry-id': pantryId },
      });
      onClientUpdated();
      onOpenChange(false);
    } catch(e) { setIsSubmitting(false); }
  };

  // Common input class for consistency + No Zoom
  const inputClass = "h-11 border-2 border-gray-100 rounded-xl focus:border-[#d97757] focus:ring-0 transition-all text-base md:text-sm";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {/* FIX: Added h-[100dvh] to force full viewport height on mobile.
          overflow-hidden ensures no body scroll.
      */}
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-[100dvh] md:h-full p-0 bg-white shadow-2xl border-l border-gray-200 overflow-hidden">
        
        {/* Header with Explicit Close Button */}
        <SheetHeader className="px-6 py-5 border-b bg-gray-50/50 flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-[#d97757]" strokeWidth={3} />
              {client ? 'Edit Profile' : 'New Registration'}
            </SheetTitle>
            {message.text && (
              <div className={`text-[10px] font-bold uppercase tracking-wide ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        {/* Scrollable Body - Added overscroll-none */}
        <div className="flex-1 overflow-y-auto overscroll-none px-6 py-6 space-y-8">
          
          {/* Identity Inputs */}
          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-gray-400 uppercase">First Name</Label>
                <Input 
                    value={formData.firstName} 
                    onChange={(e) => handleChange('firstName', e.target.value)} 
                    className={inputClass} 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-gray-400 uppercase">Last Name</Label>
                <Input 
                    value={formData.lastName} 
                    onChange={(e) => handleChange('lastName', e.target.value)} 
                    className={inputClass} 
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-gray-400 uppercase">Client ID</Label>
              <Input 
                value={formData.clientId} 
                onChange={(e) => handleChange('clientId', e.target.value)} 
                className={`${inputClass} font-mono text-gray-600`} 
                placeholder={client ? client.clientId : "Auto-generated if empty"}
              />
            </div>
            
            <div className="space-y-1">
                <Label className="text-[10px] font-black text-gray-400 uppercase">Address / Zip</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                    <Input 
                        value={formData.address} 
                        onChange={(e) => handleChange('address', e.target.value)} 
                        className={`${inputClass} pl-9`} 
                    />
                </div>
            </div>
            
            <div className="space-y-1">
               <Label className="text-[10px] font-black text-gray-400 uppercase">Contact (Optional)</Label>
               <div className="grid grid-cols-2 gap-2">
                  <Input 
                    value={formData.email} 
                    onChange={(e) => handleChange('email', e.target.value)} 
                    placeholder="Email" 
                    className={`${inputClass} text-xs h-10`} 
                  />
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => handleChange('phone', e.target.value)} 
                    placeholder="Phone" 
                    className={`${inputClass} text-xs h-10`} 
                  />
               </div>
            </div>
          </section>

          {/* Household Breakdown */}
          <section className="space-y-4 bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 shadow-inner">
            <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                <UsersIcon className="h-3.5 w-3.5" /> Household
                </Label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Total: <span className="text-gray-900">{(Number(formData.childrenCount)||0) + (Number(formData.adultCount)||0) + (Number(formData.seniorCount)||0)}</span>
                </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SegmentedCounter label="Kids" icon={<Baby className="h-3.5 w-3.5 text-blue-500" />} val={formData.childrenCount} set={(v) => handleChange('childrenCount', v)} />
              <SegmentedCounter label="Adults" icon={<User className="h-3.5 w-3.5 text-green-500" />} val={formData.adultCount} set={(v) => handleChange('adultCount', v)} />
              <SegmentedCounter label="Seniors" icon={<GraduationCap className="h-3.5 w-3.5 text-orange-500" />} val={formData.seniorCount} set={(v) => handleChange('seniorCount', v)} />
            </div>
          </section>

          {/* Visit History */}
          {client && (
            <section className="space-y-4 pt-4 border-t border-gray-100 pb-20">
              <div className="flex justify-between items-end">
                  <Label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                    <HistoryIcon className="h-3.5 w-3.5" /> Visit History
                  </Label>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Last {VISIT_LIMIT} Visits</span>
              </div>
              
              <div className="space-y-3">
                {loadingHistory ? (
                    <div className="text-center py-4"><Loader2 className="animate-spin h-5 w-5 text-gray-300 mx-auto" /></div>
                ) : history.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-[10px] text-gray-400 font-bold uppercase">No visits recorded</div>
                ) : (
                  getGroupedHistory(history).slice(0, VISIT_LIMIT).map((visit, i) => (
                    <VisitHistoryCard key={i} visit={visit} />
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer - Fixed with Safe Area Padding */}
        <SheetFooter className="p-6 border-t bg-gray-50 flex flex-row justify-between items-center gap-3 shrink-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {client && (
            <Button variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600 font-bold h-11 px-4" onClick={handleDelete} disabled={isSubmitting}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
          <div className="flex gap-2 flex-1 justify-end">
            <SheetClose asChild>
                <Button variant="outline" className="rounded-xl font-bold h-11 border-2">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#d97757] hover:bg-[#c06245] text-white rounded-xl px-6 font-bold shadow-lg shadow-orange-100 h-11">
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Profile
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// --- NEW COMPONENT: Collapsible Visit Card ---
function VisitHistoryCard({ visit }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-gray-300">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-50/50 px-3 py-3 flex justify-between items-center hover:bg-gray-100/80 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-xs text-gray-700 leading-none">
                            {visit.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">
                        {visit.items.length} Items
                    </span>
                    {isOpen ? <ChevronUp className="h-3 w-3 text-gray-400" /> : <ChevronDown className="h-3 w-3 text-gray-400" />}
                </div>
            </button>

            {isOpen && (
                <div className="p-2 space-y-1 bg-white border-t border-gray-100 animate-in slide-in-from-top-1 duration-200">
                    {visit.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-gray-600 px-2 py-1.5 hover:bg-gray-50 rounded-lg">
                            <span className="font-medium truncate pr-4">{item.itemName}</span>
                            <span className="font-bold text-gray-900 shrink-0">{item.quantityDistributed} {item.unit}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SegmentedCounter({ label, icon, val, set }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-1.5">{icon} <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{label}</span></div>
      <div className="flex items-center justify-between w-full">
        <button onClick={() => set(Math.max(0, (Number(val)||0) - 1))} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 border border-gray-100 transition-colors font-bold">-</button>
        <span className="text-sm font-black text-gray-900 w-6 text-center">{val}</span>
        <button onClick={() => set((Number(val)||0) + 1)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-900 border border-gray-100 transition-colors font-bold">+</button>
      </div>
    </div>
  );
}