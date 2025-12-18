'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Loader2, Mail, Shield, User,
    CheckCircle2, Plus, Copy, MapPin, Trash2,
    BarChart3, Package, Users, Zap, FileDown, Lock
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export function GeneralTab({ supabase, pantryId, details, userRole, currentPlan, refreshPantry, hasProFeatures }) {

    // --- STATE ---
    const [members, setMembers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [usage, setUsage] = useState({ items: 0, clients: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [copied, setCopied] = useState(false);

    // --- STATE: Settings ---
    const [isFastMode, setIsFastMode] = useState(false);
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
    const [downloading, setDownloading] = useState(null);

    // --- STATE: Invites ---
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('volunteer');
    const [isInviting, setIsInviting] = useState(false);

    // --- CALCULATIONS ---
    const isAdmin = userRole === 'admin' || userRole === 'owner';
    const maxUsers = details?.max_users_limit ?? currentPlan?.limits?.users ?? 1;
    const maxItems = details?.max_items_limit ?? currentPlan?.limits?.items ?? 100;
    const maxClients = details?.max_clients_limit ?? currentPlan?.limits?.clients ?? 100;

    const activeCount = members.length;
    const pendingCount = invitations.length;
    const totalCount = activeCount + pendingCount;
    const teamPercent = Math.min((totalCount / maxUsers) * 100, 100);

    // --- EFFECT: Init Data ---
    useEffect(() => {
        if (!pantryId) return;

        // 1. Settings
        const trackingEnabled = details?.settings?.enable_client_tracking ?? true;
        setIsFastMode(!trackingEnabled);

        // 2. Members
        const fetchMembers = async () => {
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

        // 3. Stats
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/pantry-stats', {
                    headers: { 'x-pantry-id': pantryId }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsage({
                        items: data.billing?.totalSkus || 0,
                        clients: data.billing?.totalClients || 0
                    });
                }
            } catch (error) {
                console.error("Failed to load stats", error);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchMembers();
        fetchStats();
    }, [pantryId, isAdmin, supabase, details]);

    // --- ACTIONS ---

    const handleFastModeToggle = async (checked) => {
        if (!isAdmin) return;
        setIsFastMode(checked);
        setIsUpdatingSettings(true);
        const newTrackingStatus = !checked;

        try {
            const currentSettings = details?.settings || {};
            const updatedSettings = { ...currentSettings, enable_client_tracking: newTrackingStatus };
            const { error } = await supabase
                .from('food_pantries')
                .update({ settings: updatedSettings })
                .eq('pantry_id', pantryId);

            if (error) throw error;
            await refreshPantry();
        } catch (error) {
            console.error("Failed to update settings:", error);
            setIsFastMode(!checked);
            alert("Failed to save setting.");
        } finally {
            setIsUpdatingSettings(false);
        }
    };

    // ... inside GeneralTab component

    const handleExport = async (type) => {
        if (!hasProFeatures) return; // UI blocks it, but safety check here too

        setDownloading(type);
        try {
            // 1. Request the CSV
            const res = await fetch(`/api/export?type=${type}`, {
                method: 'GET',
                headers: {
                    'x-pantry-id': pantryId
                }
            });

            if (res.status === 403) {
                alert("You must upgrade to Pro to export data.");
                return;
            }

            if (!res.ok) throw new Error("Export failed");

            // 2. Trigger Browser Download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Download error:", error);
            alert("Failed to download file. Please try again.");
        } finally {
            setDownloading(null);
        }
    };

    // ... rest of your component

    const handleCopyCode = () => {
        if (details?.join_code) {
            navigator.clipboard.writeText(details.join_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRevokeInvite = async (inviteId) => {
        if (!confirm("Are you sure you want to cancel this invitation?")) return;
        const { error } = await supabase.from('pantry_invitations').delete().eq('id', inviteId);
        if (!error) setInvitations(prev => prev.filter(i => i.id !== inviteId));
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        const cleanEmail = inviteEmail.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) return;

        if (totalCount >= maxUsers) {
            alert(`Limit reached (${maxUsers} users). Please upgrade.`);
            return;
        }

        setIsInviting(true);
        try {
            const { data: newInvite, error } = await supabase
                .from('pantry_invitations')
                .insert({
                    pantry_id: pantryId,
                    email: cleanEmail,
                    role: inviteRole,
                    invited_by: (await supabase.auth.getUser()).data.user.id
                })
                .select().single();

            if (error) throw error;

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
        } catch (err) {
            alert("Failed to invite.");
        } finally {
            setIsInviting(false);
        }
    };

    const calculatePercent = (val, max) => {
        if (max >= 100000) return 0;
        if (!max) return 0;
        return Math.min((val / max) * 100, 100);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">

            {/* --- HEADER: Identity & Code --- */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{details?.name}</h2>
                        {details?.address && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <MapPin className="h-4 w-4" />
                                <span>{details.address}</span>
                            </div>
                        )}
                    </div>

                    <div onClick={handleCopyCode} className="cursor-pointer group self-start flex items-center gap-4 px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-all hover:shadow-sm">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Team Join Code</p>
                            <p className="font-mono text-xl font-bold text-gray-900 tracking-wider">{details?.join_code}</p>
                        </div>
                        <div className="pl-4 border-l border-gray-200">
                            {copied ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <Copy className="h-6 w-6 text-gray-400 group-hover:text-gray-600" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN GRID LAYOUT --- */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

                {/* --- LEFT COLUMN: Team List (Span 2) --- */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Removed min-h-[400px] to fix white space issue */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" /> Team Members
                            </h3>
                            {isAdmin && !showInviteForm && (
                                <Button onClick={() => setShowInviteForm(true)} size="sm" className="w-full sm:w-auto bg-[#d97757] hover:bg-[#c06245] text-white gap-2 shadow-sm">
                                    <Plus className="h-4 w-4" /> Invite New
                                </Button>
                            )}
                        </div>

                        {showInviteForm && (
                            <div className="p-6 bg-orange-50/40 border-b border-orange-100 animate-in slide-in-from-top-2">
                                <form onSubmit={handleSendInvite} className="flex flex-col gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="sm:col-span-2">
                                            <Input placeholder="colleague@email.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="bg-white border-gray-300 focus:border-orange-500" autoFocus />
                                        </div>
                                        <div>
                                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                                <SelectTrigger className="w-full bg-white border-gray-300"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-white z-50 shadow-lg border-gray-200">
                                                    <SelectItem value="volunteer">Volunteer</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end pt-2">
                                        <Button type="button" variant="ghost" onClick={() => setShowInviteForm(false)} size="sm">Cancel</Button>
                                        <Button type="submit" disabled={isInviting} size="sm" className="bg-gray-900 text-white hover:bg-black">
                                            {isInviting ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Mail className="h-3 w-3 mr-2" />} Send Invitation
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="divide-y divide-gray-100 flex-1">
                            {invitations.map(invite => (
                                <div key={invite.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-orange-50/20 hover:bg-orange-50/40 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-4 ring-orange-100 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Pending Invite</span>
                                                <span className="text-[10px] text-gray-400">•</span>
                                                <span className="text-xs text-gray-500 capitalize">{invite.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {isAdmin && <Button variant="ghost" size="sm" onClick={() => handleRevokeInvite(invite.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 self-end sm:self-center"><Trash2 className="h-4 w-4" /></Button>}
                                </div>
                            ))}

                            {members.map(member => (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold 
                                            ${member.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {member.user?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-gray-900">{member.user?.name}</p>
                                                {member.role === 'owner' && <Shield className="h-3 w-3 text-[#d97757]" />}
                                            </div>
                                            <p className="text-xs text-gray-500">{member.user?.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border 
                                        ${member.role === 'owner' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            member.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {member.role}
                                    </span>
                                </div>
                            ))}

                            {totalCount === 0 && (
                                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                                    <Users className="h-10 w-10 mb-3 opacity-20" />
                                    <p className="text-sm">No team members yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: Settings Sidebar (Sticky) --- */}
                {/* 'self-start' prevents it from stretching to match left column height */}
                <div className="space-y-6 xl:sticky xl:top-6 self-start">

                    {/* 1. LIMITS & USAGE */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" /> Seat Usage
                            </h4>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                {totalCount} / {maxUsers}
                            </span>
                        </div>
                        <Progress value={teamPercent} indicatorColor={teamPercent >= 100 ? "bg-red-500" : "bg-green-500"} className="mb-6 h-2" />

                        <div className="h-px bg-gray-100 my-5" />

                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-gray-400" /> Resource Usage
                        </h4>

                        {/* Item Usage */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-500">Inventory Items</span>
                                <span className="text-xs font-bold text-gray-900">{usage.items} / {maxItems >= 10000 ? '∞' : maxItems}</span>
                            </div>
                            {maxItems < 10000 && <Progress value={(usage.items / maxItems) * 100} className="h-1.5" indicatorColor="bg-[#d97757]" />}
                        </div>

                        {/* Client Usage */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-500">Client Families</span>
                                <span className="text-xs font-bold text-gray-900">{usage.clients} / {maxClients >= 10000 ? '∞' : maxClients}</span>
                            </div>
                            {maxClients < 10000 && <Progress value={(usage.clients / maxClients) * 100} className="h-1.5" indicatorColor="bg-blue-600" />}
                        </div>

                        {isAdmin && (
                            <Button variant="ghost" size="sm" className="w-full mt-5 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8 font-medium" onClick={() => document.querySelector('[data-tab="billing"]')?.click()}>
                                Increase Limits &rarr;
                            </Button>
                        )}
                    </div>

                    {/* 2. WORKFLOW SETTINGS */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-2 text-gray-900 mb-4">
                            <Zap className="h-4 w-4 text-[#d97757]" />
                            <h3 className="font-semibold text-sm">Workflow Settings</h3>
                        </div>

                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">Fast Speed Mode</Label>
                            <div className="flex items-center gap-2">
                                {isUpdatingSettings && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                                <Switch
                                    checked={isFastMode}
                                    onCheckedChange={handleFastModeToggle}
                                    disabled={!isAdmin || isUpdatingSettings}
                                    className="data-[state=checked]:bg-[#d97757]"
                                />
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            Hides client tracking to speed up distribution.
                        </p>

                        <div className={`mt-4 px-3 py-2 rounded-lg text-[10px] font-medium border flex items-center gap-2 ${isFastMode ? 'bg-orange-50 text-orange-800 border-orange-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isFastMode ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'}`} />
                            {isFastMode ? "Client Tracking HIDDEN" : "Client Tracking VISIBLE"}
                        </div>
                    </div>

                    {/* 3. DATA EXPORTS */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-2 text-gray-900 mb-4">
                            <FileDown className="h-4 w-4 text-[#d97757]" />
                            <h3 className="font-semibold text-sm">Data Exports</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={!hasProFeatures || downloading} onClick={() => handleExport('inventory')} className="flex-1 text-xs h-9 border-gray-200 shadow-sm">
                                    {downloading === 'inventory' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Inventory CSV'}
                                </Button>
                                {!hasProFeatures && <Lock className="h-4 w-4 text-gray-300 self-center" />}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!hasProFeatures || downloading}
                                    // 👇 Change 'history' to 'clients'
                                    onClick={() => handleExport('clients')}
                                    className="flex-1 text-xs h-9 border-gray-200 shadow-sm"
                                >
                                    {/* 👇 Update the loading check and the button label */}
                                    {downloading === 'clients' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Client List CSV'}
                                </Button>
                                {!hasProFeatures && <Lock className="h-4 w-4 text-gray-300 self-center" />}
                            </div>
                        </div>
                        {!hasProFeatures && (
                            <p className="text-[10px] text-gray-400 mt-3 text-center italic">Upgrade to Pro to export data.</p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}