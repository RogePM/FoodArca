'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Loader2, Mail, User, CheckCircle2, Plus, Copy, MapPin, Trash2,
    BarChart3, Zap, Users, Crown, Building2, MoreHorizontal, Lock,
    FileText, Download // ✅ Added Icons
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
// Import the new modal
import { UpgradeModal } from '@/components/modals/UpgradeModal';

export function GeneralTab({ supabase, pantryId, details, userRole, currentPlan, refreshPantry, hasProFeatures, usageStats }) {

    // --- STATE ---
    const [members, setMembers] = useState([]);
    const [invitations, setInvitations] = useState([]);

    // UI States
    const [copied, setCopied] = useState(false);
    const [isFastMode, setIsFastMode] = useState(false);
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

    // ✅ NEW: Export State
    const [isExporting, setIsExporting] = useState(false);

    // Modal State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Invite States
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('volunteer');
    const [isInviting, setIsInviting] = useState(false);

    // --- LOGIC ---
    const isAdmin = userRole === 'admin' || userRole === 'owner';
    // Check if on Pilot Plan
    const isPilot = details?.subscription_tier === 'pilot';

    // SEAT TOKENS
    const maxSeats = details?.max_users_limit ?? currentPlan?.limits?.users ?? 5;
    const currentSeats = details?.total_seats_used ?? 1;
    const isSeatsFull = currentSeats >= maxSeats;

    // RESOURCE TOKENS
    const maxItems = details?.max_items_limit ?? currentPlan?.limits?.items ?? 100;
    const currentItems = details?.total_items_created || 0;
    const maxClients = usageStats?.limit ?? (details?.max_clients_limit ?? 100);
    const currentClients = usageStats?.current || 0;

    // --- HELPERS ---
    const calculatePercent = (val, max) => {
        if (max >= 100000) return 0;
        if (!max || max === 0) return 100;
        return Math.min((val / max) * 100, 100);
    };

    // --- EFFECT ---
    useEffect(() => {
        if (!pantryId) return;

        const trackingEnabled = details?.settings?.enable_client_tracking ?? true;
        setIsFastMode(!trackingEnabled);

        const fetchLists = async () => {
            const { data: m } = await supabase
                .from('pantry_members')
                .select('*, user:user_profiles(name, email)')
                .eq('pantry_id', pantryId);
            if (m) setMembers(m);

            if (isAdmin) {
                const { data: i } = await supabase
                    .from('pantry_invitations')
                    .select('*')
                    .eq('pantry_id', pantryId)
                    .eq('status', 'pending');
                if (i) setInvitations(i);
            }
        };

        fetchLists();
    }, [pantryId, isAdmin, supabase, details]);

    // --- ACTIONS ---
    const handleInviteClick = () => {
        if (isPilot) {
            setShowUpgradeModal(true);
            return;
        }
        setShowInviteForm(true);
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        const cleanEmail = inviteEmail.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) return;

        if (isSeatsFull) {
            alert(`Seat limit reached (${maxSeats}). Please upgrade your plan.`);
            return;
        }

        setIsInviting(true);
        try {
            const { data: newInvite, error: dbError } = await supabase
                .from('pantry_invitations')
                .insert({
                    pantry_id: pantryId,
                    email: cleanEmail,
                    role: inviteRole,
                    invited_by: (await supabase.auth.getUser()).data.user.id
                })
                .select().single();

            if (dbError) throw dbError;

            await fetch('/api/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: cleanEmail,
                    pantryId,
                    role: inviteRole,
                    pantryName: details.name,
                    joinCode: details.join_code
                })
            });

            setInvitations(prev => [...prev, newInvite]);
            setInviteEmail('');
            setShowInviteForm(false);
            await refreshPantry();

        } catch (err) {
            console.error(err);
            alert("Failed to send invitation.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleRevokeInvite = async (inviteId) => {
        if (!confirm("Cancel this invitation?")) return;
        const { error } = await supabase.from('pantry_invitations').delete().eq('id', inviteId);
        if (!error) {
            setInvitations(prev => prev.filter(i => i.id !== inviteId));
            await refreshPantry();
        }
    };

    const handleFastModeToggle = async (checked) => {
        if (!isAdmin) return;
        setIsFastMode(checked);
        setIsUpdatingSettings(true);
        try {
            const currentSettings = details?.settings || {};
            const updatedSettings = { ...currentSettings, enable_client_tracking: !checked };
            const { error } = await supabase.from('food_pantries').update({ settings: updatedSettings }).eq('pantry_id', pantryId);
            if (error) throw error;
            await refreshPantry();
        } catch (error) {
            setIsFastMode(!checked);
        } finally {
            setIsUpdatingSettings(false);
        }
    };

    const handleCopyCode = () => {
        if (details?.join_code) {
            navigator.clipboard.writeText(details.join_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // ✅ NEW: Handle CSV Export
    // ✅ UPDATED: Accepts 'inventory' or 'clients'
    const handleExportReport = async (type) => {
        if (!isAdmin) return;

        if (!hasProFeatures) {
            setShowUpgradeModal(true);
            return;
        }

        setIsExporting(true);
        try {
            // ✅ Dynamic URL based on button click
            const response = await fetch(`/api/export?type=${type}`, {
                method: 'GET',
                headers: { 'x-pantry-id': pantryId }
            });

            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // ✅ Filename matches the type (e.g. Clients-2023-10-25.csv)
            a.download = `${type.charAt(0).toUpperCase() + type.slice(1)}_Report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error(error);
            alert("Error exporting report. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* MODAL INJECTION */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                currentTier={details?.subscription_tier}
            />

            {/* HERO: IDENTITY CARD (No Changes) */}
            <div className="relative bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-6 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-[#d97757]/10 text-[#d97757] rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">{details?.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                    {details?.subscription_tier || 'Pilot'} Plan
                                </span>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <MapPin className="h-3 w-3" />
                                    <span>{details?.address || "No address set"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div onClick={handleCopyCode} className="relative z-10 group cursor-pointer bg-white border border-dashed border-gray-300 hover:border-[#d97757] hover:bg-orange-50/30 rounded-xl p-1 pr-4 pl-4 flex items-center gap-4 transition-all duration-300">
                    <div className="flex flex-col items-start py-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#d97757]/70 transition-colors">Join Code</p>
                        <p className="font-mono text-xl font-bold text-gray-900 tracking-widest">{details?.join_code}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 group-hover:bg-[#d97757]/20 transition-colors" />
                    {copied ? (
                        <div className="flex items-center gap-1.5 text-green-600 animate-in fade-in zoom-in">
                            <CheckCircle2 className="h-5 w-5" /> <span className="text-xs font-bold">Copied</span>
                        </div>
                    ) : (
                        <Copy className="h-5 w-5 text-gray-400 group-hover:text-[#d97757] transition-colors" />
                    )}
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* LEFT: Team Management (No Changes) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">Team Members</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Manage access and roles.</p>
                            </div>

                            {isAdmin && !showInviteForm && (
                                <Button
                                    onClick={handleInviteClick}
                                    disabled={isSeatsFull && !isPilot}
                                    className={`shadow-sm transition-all ${isSeatsFull && !isPilot
                                        ? 'bg-gray-100 text-gray-400 border border-gray-200'
                                        : 'bg-white text-gray-900 border border-gray-200 hover:border-[#d97757] hover:text-[#d97757]'}`}
                                >
                                    {isPilot ? <Lock className="h-4 w-4 mr-2 text-orange-500" /> : <Plus className="h-4 w-4 mr-2" />}
                                    {isSeatsFull && !isPilot ? 'Seat Limit Reached' : 'Invite Member'}
                                </Button>
                            )}
                        </div>

                        {showInviteForm && (
                            <div className="p-6 bg-orange-50/30 border-b border-orange-100 animate-in slide-in-from-top-2">
                                <form onSubmit={handleSendInvite} className="flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs font-semibold text-gray-500 uppercase">Email Address</Label>
                                            <Input
                                                placeholder="colleague@example.com"
                                                value={inviteEmail}
                                                onChange={e => setInviteEmail(e.target.value)}
                                                className="bg-white border-gray-200 focus-visible:ring-[#d97757]"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="w-full md:w-40 space-y-1">
                                            <Label className="text-xs font-semibold text-gray-500 uppercase">Role</Label>
                                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                                <SelectTrigger className="bg-white border-gray-200"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-white z-50 shadow-lg border-gray-200">
                                                    <SelectItem value="volunteer">Volunteer</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end pt-2">
                                        <Button type="button" variant="ghost" onClick={() => setShowInviteForm(false)} className="text-gray-500 hover:text-gray-900">Cancel</Button>
                                        <Button type="submit" disabled={isInviting} className="bg-[#d97757] hover:bg-[#c06245] text-white min-w-[100px]">
                                            {isInviting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Send Invite'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="divide-y divide-gray-50">
                            {invitations.map(invite => (
                                <div key={invite.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center"><Mail className="h-5 w-5 text-orange-600" /></div>
                                        <div>
                                            <p className="font-medium text-gray-900">{invite.email}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wide border border-orange-100">Pending Invite</span>
                                                <span className="text-xs text-gray-400">• {invite.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRevokeInvite(invite.id)} className="text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}

                            {members.map(member => (
                                <div key={member.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <AvatarPlaceholder name={member.user?.name} role={member.role} />
                                        <div>
                                            <p className="font-medium text-gray-900">{member.user?.name}</p>
                                            <p className="text-xs text-gray-500">{member.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <RoleBadge role={member.role} />
                                        {isAdmin && <Button variant="ghost" size="icon" disabled className="text-gray-200"><MoreHorizontal className="h-4 w-4" /></Button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Stats */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-gray-50 rounded-lg"><BarChart3 className="h-5 w-5 text-gray-700" /></div>
                            <h3 className="font-bold text-gray-900">Plan Usage</h3>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-medium text-gray-600">Seat Tokens</span>
                                    <span className={`text-sm font-bold ${isSeatsFull ? 'text-red-600' : 'text-gray-900'}`}>{currentSeats}<span className="text-gray-400 font-normal">/{maxSeats}</span></span>
                                </div>
                                <Progress value={calculatePercent(currentSeats, maxSeats)} className="h-2" indicatorColor={isSeatsFull ? "bg-red-500" : "bg-gray-900"} />
                            </div>
                            <div className="h-px bg-gray-100" />
                            <div className="space-y-4">
                                <StatRow label="Inventory Items" current={currentItems} max={maxItems} color="bg-[#d97757]" />
                                <StatRow label="Registered Families" current={currentClients} max={maxClients} color="bg-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-[#d97757]/10 rounded-lg"><Zap className="h-5 w-5 text-[#d97757]" /></div>
                            <h3 className="font-bold text-gray-900">Workflow</h3>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-sm font-semibold text-gray-900 cursor-pointer" htmlFor="fast-mode">Fast Check-in</Label>
                                <p className="text-xs text-gray-500 leading-tight pr-4">Skips Client Registration. Best for high-traffic days.</p>
                            </div>
                            <Switch id="fast-mode" checked={isFastMode} onCheckedChange={handleFastModeToggle} disabled={!isAdmin || isUpdatingSettings} className="data-[state=checked]:bg-[#d97757]" />
                        </div>
                    </div>

                    {/* ✅ NEW: Grant Reporting Card (Only for Admins) */}
                    {/* ✅ NEW: Grant Reporting Card (Two Buttons) */}
                    {isAdmin && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div>
                                <h3 className="font-bold text-gray-900">Grant Compliance</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                Export your data for federal and state grant reporting.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                {/* BUTTON 1: CLIENTS */}
                                <Button
                                    onClick={() => handleExportReport('clients')} // <--- Passes 'clients'
                                    disabled={isExporting}
                                    variant={hasProFeatures ? "outline" : "default"}
                                    className={`w-full group ${!hasProFeatures && 'bg-[#1C1917] hover:bg-[#000]'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        {isExporting ? <Loader2 className="animate-spin h-4 w-4" /> : hasProFeatures ? <Users className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                        {hasProFeatures ? 'Clients' : 'Unlock'}
                                    </span>
                                </Button>

                                {/* BUTTON 2: INVENTORY */}
                                <Button
                                    onClick={() => handleExportReport('inventory')} // <--- Passes 'inventory'
                                    disabled={isExporting}
                                    variant={hasProFeatures ? "outline" : "default"}
                                    className={`w-full group ${!hasProFeatures && 'bg-[#1C1917] hover:bg-[#000]'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        {isExporting ? <Loader2 className="animate-spin h-4 w-4" /> : hasProFeatures ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                        {hasProFeatures ? 'Inventory' : 'Unlock'}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ... Sub-components remain the same ...
function AvatarPlaceholder({ name, role }) {
    const initial = name?.[0]?.toUpperCase() || 'U';
    const isOwner = role === 'owner';
    const isAdmin = role === 'admin';
    const bgClass = isOwner ? 'bg-purple-100 text-purple-700' : isAdmin ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600';
    return (
        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${bgClass}`}>
            {isOwner ? <Crown className="h-4 w-4" /> : initial}
        </div>
    );
}

function RoleBadge({ role }) {
    const styles = {
        owner: "bg-purple-50 text-purple-700 border-purple-100",
        admin: "bg-gray-100 text-gray-700 border-gray-200",
        volunteer: "bg-green-50 text-green-700 border-green-100"
    };
    return (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[role] || styles.volunteer}`}>
            {role}
        </span>
    );
}

function StatRow({ label, current, max, color }) {
    const isUnlimited = max >= 100000;
    const percent = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
    return (
        <div>
            <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                <span className="text-xs font-bold text-gray-700">{current} / {isUnlimited ? '∞' : max}</span>
            </div>
            {!isUnlimited && <Progress value={percent} className="h-1.5 bg-gray-100" indicatorColor={color} />}
        </div>
    );
}