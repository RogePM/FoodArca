'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, ArrowRight, Check, Loader2,
  LogOut, Leaf, ArrowLeft, Plus, X, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifyingInvite, setVerifyingInvite] = useState(false);

  // --- Form States ---
  const [createData, setCreateData] = useState({ name: '', address: '', type: 'standalone', generatedCode: '' });
  const [invites, setInvites] = useState([]);
  const [currentInvite, setCurrentInvite] = useState('');
  const [joinData, setJoinData] = useState({ code: '', pantryName: '', address: '', pantryId: '' });
  const [profileData, setProfileData] = useState({ fullName: '', phone: '' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // --- 1. CODE LOOKUP ---
  const handleCodeLookup = async (codeOverride = null) => {
    setIsLoading(true);
    setErrorMsg('');
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
      setStep(3);
    } catch (err) {
      setErrorMsg(err.message);
      if (codeOverride) { setIntent('join'); setStep(2); }
    } finally {
      setIsLoading(false);
      setVerifyingInvite(false);
    }
  };

  // --- 2. AUTH & URL DETECTION ---
  useEffect(() => {
    const initWizard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      setSession(session);

      if (session.user?.user_metadata?.full_name && !profileData.fullName) {
        setProfileData(prev => ({ ...prev, fullName: session.user.user_metadata.full_name }));
      }

      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code') || params.get('invite_code');
      if (urlCode) {
        setVerifyingInvite(true);
        handleCodeLookup(urlCode);
      }
    };
    initWizard();
  }, []);

  // --- 3. CREATE PANTRY (ATOMIC LOGIC) ---
  const handleCreatePantry = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Step A: Create the Pantry
      const { data: pantry, error: pantryError } = await supabase
        .from('food_pantries')
        .insert({
          name: createData.name,
          address: createData.address,
          type: createData.type,
          join_code: generatedCode,
        })
        .select('pantry_id')
        .single();

      if (pantryError) throw pantryError;
      const newPantryId = pantry.pantry_id;

      // Step B: Multi-table setup (Membership + Profile)
      const [memberResult, profileResult] = await Promise.all([
        supabase.from('pantry_members').insert({
          user_id: session.user.id,
          pantry_id: newPantryId,
          role: 'admin', // Consistent with your backend
          is_active: true
        }),
        supabase.from('user_profiles').upsert({
          user_id: session.user.id,
          name: profileData.fullName,
          current_pantry_id: newPantryId,
          phone: profileData.phone || null
        })
      ]);

      // ✅ FIX: Check BOTH for errors
      if (memberResult.error || profileResult.error) {
        console.error("Setup Error:", memberResult.error || profileResult.error);
        throw new Error("We created your pantry, but failed to set up your profile. Please refresh and try again.");
      }

      // Step C: Handle Invites (Bulk)
      if (invites.length > 0) {
        // We don't 'await' the email API so the user doesn't have to wait for 10 emails to send
        fetch('/api/invite/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emails: invites,
            pantryId: newPantryId,
            pantryName: createData.name,
            joinCode: generatedCode
          })
        }).catch(e => console.error("Non-fatal Email Error:", e));
      }

      setCreateData(prev => ({ ...prev, generatedCode }));
      setStep('success');

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. JOIN PANTRY ---
  const handleJoinPantry = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Step A: Join Team
      const { error: memberError } = await supabase
        .from('pantry_members')
        .insert({
          user_id: session.user.id,
          pantry_id: joinData.pantryId,
          role: 'volunteer',
          is_active: true // Ensure they are active by default
        });

      if (memberError) {
        if (memberError.code === '23505') throw new Error("You are already a member of this team.");
        throw memberError;
      }

      // Step B: Update Profile
      await supabase.from('user_profiles').upsert({
        user_id: session.user.id,
        name: profileData.fullName,
        current_pantry_id: joinData.pantryId,
        phone: profileData.phone || null
      });

      // Step C: Cleanup Invitation (Admin's pending list)
      await supabase
        .from('pantry_invitations')
        .delete()
        .eq('pantry_id', joinData.pantryId)
        .eq('email', session.user.email);

      setStep('success');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!session || verifyingInvite) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
        <Loader2 className="animate-spin h-8 w-8 text-[#d97757]" />
        {verifyingInvite && <p className="text-gray-500 font-medium animate-pulse">Checking invite...</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-gray-900">

      {/* Header */}
      <header className="w-full h-20 px-6 md:px-12 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#d97757] text-white flex items-center justify-center shadow-sm">
            <Leaf className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-serif font-medium tracking-tight hidden md:block">Food Arca</span>
        </div>
        <button onClick={handleSignOut} className="text-sm font-medium text-gray-500 hover:text-red-600 flex items-center gap-2">
          Sign Out <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md w-full flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')}><X className="h-4 w-4" /></button>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* STEP 1: THE FORK */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-4xl">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-serif font-medium mb-3">Welcome, {profileData.fullName.split(' ')[0] || 'Friend'}.</h1>
                <p className="text-gray-500 text-lg">How would you like to get started?</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <SelectionCard
                  icon={<Building2 className="h-7 w-7" />}
                  color="orange"
                  title="Create Organization"
                  desc="I am a Director or Admin setting up a new pantry."
                  onClick={() => { setIntent('create'); setStep(2); }}
                />
                <SelectionCard
                  icon={<Users className="h-7 w-7" />}
                  color="blue"
                  title="Join Existing Team"
                  desc="I have an invite code and want to help as a volunteer."
                  onClick={() => { setIntent('join'); setStep(2); }}
                />
              </div>
            </motion.div>
          )}

          {/* --- CREATE FLOW --- */}

          {/* Create Step 2: Org Details */}
          {intent === 'create' && step === 2 && (
            <WizardStep title="Tell us about your Pantry" subtitle="This will create your Pilot account." onBack={() => setStep(1)}>
              <div className="space-y-4">
                <div>
                  <Label>Organization Name</Label>
                  <Input value={createData.name} onChange={e => setCreateData({ ...createData, name: e.target.value })} placeholder="e.g. Hope Community Fridge" className="h-11 mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location (City, State)</Label>
                    <Input value={createData.address} onChange={e => setCreateData({ ...createData, address: e.target.value })} placeholder="e.g. Austin, TX" className="h-11 mt-1" />
                  </div>
                  <div>
                    <Label>Organization Type</Label>
                    <Select onValueChange={(val) => setCreateData({ ...createData, type: val })} defaultValue="standalone">
                      <SelectTrigger className="h-11 mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standalone">Independent Pantry</SelectItem>
                        <SelectItem value="network_hq">Network HQ (Enterprise)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Your Full Name</Label>
                  <Input value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} placeholder="For your admin profile" className="h-11 mt-1" />
                </div>

                <Button
                  onClick={() => setStep(3)}
                  disabled={!createData.name || !createData.address}
                  className="w-full h-12 bg-[#d97757] hover:bg-[#c06245] mt-2 font-bold"
                >
                  Continue
                </Button>
              </div>
            </WizardStep>
          )}

          {/* Create Step 3: Invites */}
          {intent === 'create' && step === 3 && (
            <WizardStep title="Invite your Team" subtitle="Your Pilot Plan includes 10 staff seats." onBack={() => setStep(2)}>
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <Label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Add Team Members</Label>
                  <form onSubmit={handleAddInvite} className="flex gap-2 mt-2">
                    <Input
                      value={currentInvite}
                      onChange={e => setCurrentInvite(e.target.value)}
                      placeholder="volunteer@email.com"
                      type="email"
                      className="bg-white"
                    />
                    <Button type="submit" variant="outline" size="icon" className="shrink-0"><Plus className="h-4 w-4" /></Button>
                  </form>
                </div>

                <div className="space-y-2 min-h-[100px]">
                  {invites.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                      No invites added yet. You can do this later too.
                    </div>
                  )}
                  {invites.map(email => (
                    <div key={email} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-1.5 rounded text-blue-600"><Mail className="h-4 w-4" /></div>
                        <span className="text-sm font-medium">{email}</span>
                      </div>
                      <button onClick={() => removeInvite(email)} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>

                <Button onClick={handleCreatePantry} disabled={isLoading} className="w-full h-12 bg-[#d97757] hover:bg-[#c06245] shadow-lg shadow-[#d97757]/20">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Launch Pilot Pantry'}
                </Button>

                <p className="text-xs text-center text-gray-400">
                  By launching, you agree to our Terms of Service. <br />
                  No credit card required for Pilot.
                </p>
              </div>
            </WizardStep>
          )}

          {/* --- JOIN FLOW --- */}

          {/* Join Step 2: Code */}
          {intent === 'join' && step === 2 && (
            <WizardStep title="Enter Invite Code" subtitle="Get the 6-character code from your admin." onBack={() => setStep(1)}>
              <div className="space-y-4">
                <Input
                  value={joinData.code}
                  onChange={e => setJoinData({ ...joinData, code: e.target.value.toUpperCase() })}
                  maxLength={6}
                  placeholder="XXXXXX"
                  className="h-16 text-center text-3xl font-mono tracking-widest uppercase bg-gray-50"
                />
                <Button onClick={() => handleCodeLookup()} disabled={joinData.code.length < 6 || isLoading} className="w-full h-12 bg-[#d97757] hover:bg-[#c06245]">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Find Team'}
                </Button>
              </div>
            </WizardStep>
          )}

          {/* Join Step 3: Confirm */}
          {intent === 'join' && step === 3 && (
            <WizardStep title="Is this correct?" subtitle="Confirm the organization details." onBack={() => setStep(2)}>
              <div className="bg-white border border-gray-200 p-6 rounded-xl text-center mb-6 shadow-sm">
                <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 text-[#d97757]">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{joinData.pantryName}</h3>
                <p className="text-gray-500">{joinData.address}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Your Full Name</Label>
                  <Input value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} className="h-11 mt-1" />
                </div>
                <Button onClick={handleJoinPantry} disabled={isLoading} className="w-full h-12 bg-[#d97757] hover:bg-[#c06245]">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Join Organization'}
                </Button>
              </div>
            </WizardStep>
          )}

          {/* --- SUCCESS STATE --- */}
          {step === 'success' && (
            <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
              <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                <Check className="h-12 w-12" />
              </div>
              <h1 className="text-3xl font-serif font-medium mb-2">You're all set!</h1>
              <p className="text-gray-500 mb-8">
                Welcome to <span className="font-bold text-gray-900">{intent === 'create' ? createData.name : joinData.pantryName}</span>.
              </p>

              {intent === 'create' && (
                <div className="bg-gray-900 text-white p-6 rounded-xl mb-8 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Leaf className="h-24 w-24" /></div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Your Pilot Status</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-white">Active</p>
                      <p className="text-sm text-gray-400">50 Items • 10 Users</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">Join Code</p>
                      <p className="font-mono text-xl font-bold">{createData.generatedCode}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={() => { window.location.href = '/dashboard'; }} className="w-full h-14 bg-[#d97757] hover:bg-[#c06245] text-white text-lg shadow-xl font-bold">
                Enter Dashboard
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub Components ---

function SelectionCard({ icon, color, title, desc, onClick }) {
  const colorStyles = {
    orange: "text-[#d97757] bg-orange-50 hover:border-[#d97757]/50 hover:shadow-[#d97757]/5",
    blue: "text-blue-600 bg-blue-50 hover:border-blue-400/50 hover:shadow-blue-500/5"
  };

  return (
    <button onClick={onClick} className={`group flex flex-col items-start p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 text-left ${colorStyles[color]}`}>
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${color === 'orange' ? 'bg-orange-100 text-[#d97757]' : 'bg-blue-100 text-blue-600'}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-500 leading-relaxed mb-6">{desc}</p>
      <div className={`mt-auto flex items-center font-bold text-sm ${color === 'orange' ? 'text-[#d97757]' : 'text-blue-600'}`}>
        Start <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
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
        <h2 className="text-3xl font-serif font-medium text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-lg">{subtitle}</p>
      </div>
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        {children}
      </div>
    </motion.div>
  );
}