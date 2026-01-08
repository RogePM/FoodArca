'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, ArrowRight, Check, Loader2,
  LogOut, Leaf, ArrowLeft, Plus, X, Mail, MapPin, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OnboardingApp({ user, inviteCode }) {
  const router = useRouter();
  
  // --- UI State ---
  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState(null); // 'create' or 'join'
  const [isLoading, setIsLoading] = useState(false);
  const [verifyingInvite, setVerifyingInvite] = useState(false);
  
  // --- Error State ---
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // --- Data State ---
  const [session, setSession] = useState(null);
  const [createData, setCreateData] = useState({ name: '', address: '', type: 'standalone', generatedCode: '' });
  const [joinData, setJoinData] = useState({ code: '', pantryName: '', address: '', pantryId: '' });
  // Invites state is kept for potential future use or logic compatibility, but stays empty for Pilot creation
  const [invites, setInvites] = useState([]); 
  
  // Pre-fill name from Auth User if available
  const [profileData, setProfileData] = useState({ 
    fullName: user?.user_metadata?.full_name || '', 
    phone: '' 
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // --- VALIDATION ENGINE ---
  const validateField = (field, value) => {
    let error = "";
    const val = value ? value.trim() : "";

    const safeTextRegex = /^[a-zA-Z0-9\s\.,'\-&]+$/;
    const cityStateRegex = /^[a-zA-Z\s\.-]+,\s*[a-zA-Z]{2}$/;

    if (!val) return "This field is required.";

    if (field === 'address') {
       if (!cityStateRegex.test(val)) {
         return "Format must be 'City, State' (e.g. Austin, TX)";
       }
    }

    if (field === 'name' || field === 'pantryName') {
       if (!safeTextRegex.test(val)) {
         return "Invalid characters. Please remove special symbols (<, >, ;, --).";
       }
       if (val.length < 3) return "Name is too short.";
    }

    return error;
  };

  const handleInputChange = (setter, field, value) => {
    setter(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
        setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleBlur = (field, value) => {
    const error = validateField(field, value);
    if (error) {
        setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // --- 1. HANDLE INVITE CODE (Auto-Join) ---
  const handleCodeLookup = async (codeOverride = null) => {
    setIsLoading(true);
    setGlobalError('');
    const codeToTest = (codeOverride || joinData.code).trim().toUpperCase();

    try {
      if (!codeToTest) throw new Error("No code provided");

      const { data, error } = await supabase
        .rpc('get_pantry_by_code', { code_input: codeToTest })
        .single();

      if (error || !data) throw new Error("Invalid or expired invite code.");

      setJoinData({
        code: codeToTest,
        pantryName: data.name,
        address: data.address,
        pantryId: data.pantry_id
      });

      setIntent('join');
      setStep(3); // Skip to confirmation
    } catch (err) {
      setGlobalError(err.message);
      if (codeOverride) { setIntent('join'); setStep(2); } // Fallback to manual entry
    } finally {
      setIsLoading(false);
      setVerifyingInvite(false);
    }
  };

  useEffect(() => {
    if (inviteCode) {
        setVerifyingInvite(true);
        handleCodeLookup(inviteCode);
    }
    
    if (!user) {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setSession(session);
            else router.push('/');
        };
        getSession();
    }
  }, [inviteCode, user]);

  // --- 2. CREATE PANTRY LOGIC ---
  const handleCreatePantry = async () => {
    // Validation
    const nameErr = validateField('name', createData.name);
    const addrErr = validateField('address', createData.address);
    if (nameErr || addrErr) {
        setFieldErrors({ name: nameErr, address: addrErr });
        return;
    }

    setIsLoading(true);
    setGlobalError('');

    try {
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const userId = user?.id || session?.user?.id;

      // A. Create Pantry
      const { data: pantry, error: pantryError } = await supabase
        .from('food_pantries')
        .insert({
          name: createData.name,
          address: createData.address,
          type: createData.type,
          join_code: generatedCode,
          // Explicitly setting seats used to 1 (Admin)
          total_seats_used: 0
        })
        .select('pantry_id')
        .single();

      if (pantryError) throw pantryError;
      const newPantryId = pantry.pantry_id;

      // B. Setup Admin Member & Profile
      const [memberResult, profileResult] = await Promise.all([
        supabase.from('pantry_members').insert({
          user_id: userId,
          pantry_id: newPantryId,
          role: 'owner',
          is_active: true
        }),
        supabase.from('user_profiles').upsert({
          user_id: userId,
          name: profileData.fullName,
          current_pantry_id: newPantryId,
          phone: profileData.phone || null
        })
      ]);

      if (memberResult.error || profileResult.error) {
        throw new Error("Pantry created, but profile setup failed.");
      }

      setCreateData(prev => ({ ...prev, generatedCode }));
      setStep('success');

    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. JOIN PANTRY LOGIC ---
  const handleJoinPantry = async () => {
    setIsLoading(true);
    setGlobalError('');
    const userId = user?.id || session?.user?.id;
    const userEmail = user?.email || session?.user?.email;

    try {
      const { data: invite } = await supabase
        .from('pantry_invitations')
        .select('role')
        .eq('pantry_id', joinData.pantryId)
        .eq('email', userEmail)
        .eq('status', 'pending')
        .maybeSingle();

      const assignedRole = invite?.role || 'volunteer';

      const { error: memberError } = await supabase
        .from('pantry_members')
        .insert({
          user_id: userId,
          pantry_id: joinData.pantryId,
          role: assignedRole,
          is_active: true
        });

      if (memberError) {
        if (memberError.code === '23505') throw new Error("You are already a member of this team.");
        throw memberError;
      }

      await supabase.from('user_profiles').upsert({
        user_id: userId,
        name: profileData.fullName,
        current_pantry_id: joinData.pantryId,
        phone: profileData.phone || null
      });

      if (invite) {
        await supabase
          .from('pantry_invitations')
          .delete()
          .eq('pantry_id', joinData.pantryId)
          .eq('email', userEmail);
      }

      setStep('success');
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // --- RENDER: LOADING STATE ---
  if (verifyingInvite) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
        <Loader2 className="animate-spin h-8 w-8 text-[#d97757]" />
        <p className="text-gray-500 font-medium animate-pulse">Checking invite...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-gray-900">

      <header className="w-full h-16 px-6 flex items-center justify-between bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#d97757] text-white flex items-center justify-center shadow-sm">
            <Leaf className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-serif font-bold tracking-tight text-[#d97757]">Food Arca</span>
        </div>
        <button onClick={handleSignOut} className="text-sm font-medium text-gray-400 hover:text-red-600 transition-colors flex items-center gap-2">
          Sign Out <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">

        {globalError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm max-w-md w-full flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {globalError}</span>
            <button onClick={() => setGlobalError('')}><X className="h-4 w-4 opacity-50 hover:opacity-100" /></button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">

          {/* STEP 1: QUICK ACTIONS */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-5xl">
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-serif font-medium mb-3 text-gray-900">Welcome, {profileData.fullName.split(' ')[0] || 'Friend'}.</h1>
                <p className="text-gray-500 text-lg">How would you like to get started?</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <QuickActionCard
                  icon={<Building2 className="h-6 w-6" />}
                  title="Create Organization"
                  desc="I am a Director setting up a new pantry."
                  onClick={() => { setIntent('create'); setStep(2); }}
                />
                <QuickActionCard
                  icon={<Users className="h-6 w-6" />}
                  title="Join Existing Team"
                  desc="I have an invite code and want to help."
                  onClick={() => { setIntent('join'); setStep(2); }}
                />
              </div>
            </motion.div>
          )}

          {/* STEP 2 (CREATE): ORG FORM - NOW THE FINAL STEP */}
          {intent === 'create' && step === 2 && (
            <WizardStep title="Tell us about your Pantry" subtitle="This will create your Pilot account." onBack={() => setStep(1)}>
              <div className="space-y-5">
                <div>
                  <Label>Organization Name</Label>
                  <Input 
                    value={createData.name} 
                    onChange={e => handleInputChange(setCreateData, 'name', e.target.value)} 
                    onBlur={(e) => handleBlur('name', e.target.value)}
                    placeholder="e.g. Hope Community Fridge" 
                    className={`h-11 mt-1 bg-white ${fieldErrors.name ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
                  />
                  {fieldErrors.name && <span className="text-xs text-red-500 mt-1">{fieldErrors.name}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location</Label>
                    <Input 
                        value={createData.address} 
                        onChange={e => handleInputChange(setCreateData, 'address', e.target.value)}
                        onBlur={(e) => handleBlur('address', e.target.value)} 
                        placeholder="City, State" 
                        className={`h-11 mt-1 bg-white ${fieldErrors.address ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
                    />
                    {fieldErrors.address && <span className="text-xs text-red-500 mt-1">{fieldErrors.address}</span>}
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select onValueChange={(val) => setCreateData(prev => ({ ...prev, type: val }))} defaultValue="standalone">
                      <SelectTrigger className="h-11 mt-1 bg-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standalone">Independent Pantry</SelectItem>
                        <SelectItem value="network_hq">Network HQ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Your Full Name</Label>
                  <Input value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} placeholder="For your admin profile" className="h-11 mt-1 bg-white" />
                </div>

                {/* MODIFIED BUTTON: Direct Create Action */}
                <Button
                  onClick={handleCreatePantry}
                  disabled={!createData.name || !createData.address || !!fieldErrors.name || !!fieldErrors.address || isLoading}
                  className="w-full h-12 bg-[#d97757] hover:bg-[#c06245] mt-2 font-bold shadow-md shadow-orange-100"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Launch Pilot Pantry'}
                </Button>
                
                <p className="text-[10px] text-center text-gray-400 mt-2">
                    Pilot plan includes 1 User seat. Upgrade later to invite your team.
                </p>
              </div>
            </WizardStep>
          )}

          {/* REMOVED: Step 3 (Create/Invite) - Because Pilot is 1 user only */}

          {/* STEP 2 (JOIN): CODE ENTRY */}
          {intent === 'join' && step === 2 && (
            <WizardStep title="Enter Invite Code" subtitle="Get the 6-character code from your admin." onBack={() => setStep(1)}>
              <div className="space-y-4">
                <Input
                  value={joinData.code}
                  onChange={e => setJoinData({ ...joinData, code: e.target.value.toUpperCase() })}
                  maxLength={6}
                  placeholder="XXXXXX"
                  className="h-16 text-center text-4xl font-mono tracking-[0.5em] uppercase bg-white border-gray-200 focus-visible:ring-[#d97757] text-gray-900 placeholder:text-gray-200"
                />
                <Button onClick={() => handleCodeLookup()} disabled={joinData.code.length < 6 || isLoading} className="w-full h-12 bg-[#d97757] hover:bg-[#c06245] font-bold shadow-md shadow-orange-100">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Find Team'}
                </Button>
              </div>
            </WizardStep>
          )}

          {/* STEP 3 (JOIN): CONFIRM */}
          {intent === 'join' && step === 3 && (
            <WizardStep title="Is this correct?" subtitle="Confirm the organization details." onBack={() => setStep(2)}>
              <div className="bg-white border border-gray-200 p-6 rounded-xl text-center mb-6 shadow-sm">
                <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 text-[#d97757]">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{joinData.pantryName}</h3>
                <p className="text-gray-500 flex items-center justify-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {joinData.address}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Your Full Name</Label>
                  <Input value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} className="h-11 mt-1 bg-white" />
                </div>
                <Button onClick={handleJoinPantry} disabled={isLoading} className="w-full h-12 bg-[#d97757] hover:bg-[#c06245] font-bold shadow-md shadow-orange-100">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Join Organization'}
                </Button>
              </div>
            </WizardStep>
          )}

          {/* SUCCESS STATE */}
          {step === 'success' && (
            <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
              <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 border border-green-100">
                <Check className="h-12 w-12" />
              </div>
              <h1 className="text-3xl font-serif font-medium mb-2 text-gray-900">You're all set!</h1>
              <p className="text-gray-500 mb-8">
                Welcome to <span className="font-bold text-gray-900">{intent === 'create' ? createData.name : joinData.pantryName}</span>.
              </p>

              {intent === 'create' && (
                <div className="bg-[#1f2937] text-white p-6 rounded-xl mb-8 text-left relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Leaf className="h-24 w-24" /></div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold mb-1">Your Pilot Status</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-white">Active</p>
                      {/* UPDATED: Reflects new plan limits */}
                      <p className="text-sm text-gray-400 mt-1">50 Items • 1 User</p>
                    </div>
                    <div className="text-right z-10">
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Join Code</p>
                      <p className="font-mono text-2xl font-bold tracking-widest text-[#d97757]">{createData.generatedCode}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={() => { window.location.href = '/dashboard'; }} className="w-full h-14 bg-[#d97757] hover:bg-[#c06245] text-white text-lg shadow-xl shadow-orange-200 font-bold rounded-xl transition-all hover:scale-[1.02]">
                Enter Dashboard
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function QuickActionCard({ icon, title, desc, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className="group flex flex-col items-start p-6 bg-white rounded-xl border border-gray-200 hover:border-[#d97757]/30 hover:shadow-lg hover:shadow-[#d97757]/5 transition-all duration-300 text-left w-full h-full relative overflow-hidden"
    >
      <div className="flex items-center justify-between w-full mb-4">
          <div className="h-12 w-12 rounded-lg bg-orange-50 text-[#d97757] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              {icon}
          </div>
          <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#d97757] group-hover:text-white transition-colors duration-300">
              <ArrowRight className="h-4 w-4" />
          </div>
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#d97757] transition-colors">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </button>
  );
}

function WizardStep({ title, subtitle, children, onBack }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-md">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-lg">{subtitle}</p>
      </div>
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200/60">
        {children}
      </div>
    </motion.div>
  );
}