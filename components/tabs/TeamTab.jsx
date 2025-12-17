'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, Mail, Shield, User, Clock, CheckCircle2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; 

export function TeamTab({ supabase, pantryId, details, userRole, currentPlan }) {
    const [members, setMembers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    
    // Invite State
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('volunteer');
    const [isInviting, setIsInviting] = useState(false);

    const isAdmin = userRole === 'admin' || userRole === 'owner';
    const maxUsers = details?.max_users_limit ?? currentPlan?.limits?.users ?? 1;
    
    // Calculate distinct counts
    const activeCount = members.length;
    const pendingCount = invitations.length;
    const totalCount = activeCount + pendingCount;

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            if(!pantryId) return;
            
            // 1. Get Members
            const { data: m } = await supabase
                .from('pantry_members')
                .select('*, user:user_profiles(name, email)')
                .eq('pantry_id', pantryId);
            if(m) setMembers(m);
            
            // 2. Get Pending Invitations (Only for Admins)
            if(isAdmin) {
                const { data: i } = await supabase
                    .from('pantry_invitations')
                    .select('*')
                    .eq('pantry_id', pantryId)
                    .eq('status', 'pending');
                if(i) setInvitations(i);
            }
        };
        fetchData();
    }, [pantryId, isAdmin, supabase]);

    // --- ACTIONS ---

    const handleRevokeInvite = async (inviteId) => {
        if (!confirm("Are you sure you want to cancel this invitation?")) return;
        
        const { error } = await supabase
            .from('pantry_invitations')
            .delete()
            .eq('id', inviteId);

        if (!error) {
            setInvitations(prev => prev.filter(i => i.id !== inviteId));
        } else {
            alert("Failed to revoke invitation.");
        }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        const cleanEmail = inviteEmail.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) return;

        if (totalCount >= maxUsers) {
            alert(`Limit reached (${maxUsers} users). Please upgrade to invite more team members.`);
            return;
        }

        setIsInviting(true);
        try {
            // 1. DB Insert
            const { data: newInvite, error } = await supabase
                .from('pantry_invitations')
                .insert({
                    pantry_id: pantryId,
                    email: cleanEmail,
                    role: inviteRole,
                    invited_by: (await supabase.auth.getUser()).data.user.id
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Send Email
            const res = await fetch('/api/invite', {
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

            if (!res.ok) throw new Error("Failed to send email");

            setInvitations(prev => [...prev, newInvite]);
            setInviteEmail('');
            setShowInviteForm(false);
            
        } catch (err) {
            console.error("Invite failed:", err);
            alert("Failed to invite. User may already be invited.");
        } finally {
            setIsInviting(false);
        }
    };

    // --- RENDER HELPERS ---
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            
            {/* 1. ORGANIZATION HEADER */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Brand Avatar */}
                <div className="h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-br from-orange-400 to-[#d97757] flex items-center justify-center text-3xl font-bold text-white shadow-md">
                    {details?.name?.[0]?.toUpperCase() || 'P'}
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900">{details?.name}</h2>
                    <p className="text-sm text-gray-500">
                        Managing team access and permissions
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{activeCount}</span> Active
                        </div>
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <span className="font-medium text-gray-900">{pendingCount}</span> Pending
                            </div>
                        )}
                        <div className="text-sm text-gray-400">
                            (Limit: {maxUsers})
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. TEAM MANAGEMENT */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
                    <h3 className="font-semibold text-gray-900">Team Members</h3>
                    
                    {isAdmin && !showInviteForm && (
                        <Button 
                            onClick={() => setShowInviteForm(true)} 
                            className="bg-[#d97757] hover:bg-[#c06245] text-white shadow-sm gap-2"
                        >
                            <Plus className="h-4 w-4" /> Invite Member
                        </Button>
                    )}
                </div>

                {/* Invite Form (Collapsible) */}
                {showInviteForm && (
                    <div className="p-4 bg-orange-50 border-b border-orange-100 animate-in slide-in-from-top-2">
                        <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <div className="flex-1 w-full">
                                <Input 
                                    placeholder="colleague@email.com" 
                                    value={inviteEmail} 
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="bg-white border-orange-200 focus-visible:ring-orange-500" 
                                    autoFocus
                                />
                            </div>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger className="w-full sm:w-[140px] bg-white border-orange-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="volunteer">Volunteer</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button type="submit" disabled={isInviting} className="flex-1 sm:flex-none bg-black text-white hover:bg-gray-800">
                                    {isInviting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Send Invite'}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setShowInviteForm(false)} className="px-3 hover:bg-orange-100 text-orange-700">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Combined List */}
                <div className="divide-y divide-gray-100">
                    
                    {/* A. Pending Invitations */}
                    {invitations.map(invite => (
                        <div key={invite.id} className="p-4 flex items-center justify-between bg-orange-50/30">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white border border-orange-100 flex items-center justify-center text-orange-300">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                            Pending
                                        </span>
                                        <span className="text-xs text-gray-500 capitalize">{invite.role}</span>
                                    </div>
                                </div>
                            </div>
                            {isAdmin && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleRevokeInvite(invite.id)} 
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs"
                                >
                                    Revoke
                                </Button>
                            )}
                        </div>
                    ))}

                    {/* B. Active Members */}
                    {members.map(member => (
                        <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 border border-gray-200">
                                    <AvatarFallback className="bg-gray-100 text-gray-600 font-bold text-xs">
                                        {getInitials(member.user?.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-900">
                                            {member.user?.name || 'Unknown User'}
                                        </p>
                                        {member.role === 'owner' && (
                                            <Shield className="h-3 w-3 text-[#d97757]" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{member.user?.email}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className={`
                                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize
                                    ${member.role === 'owner' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                      member.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                      'bg-gray-100 text-gray-700 border-gray-200'}
                                `}>
                                    {member.role}
                                </span>
                            </div>
                        </div>
                    ))}

                    {totalCount === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No members found.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}