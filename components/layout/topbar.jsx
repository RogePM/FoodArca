'use client';

import React, { useEffect, useState } from 'react';
import {
    Menu, ChevronDown, Copy, Check, MapPin, Settings, Leaf, Search, Command,
    Building2, LogOut, RefreshCw, Bell, AlertTriangle, ArrowUpCircle, Package, X as XIcon, CreditCard, Sparkles, Plus, Minus, LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { usePantry } from '@/components/providers/PantryProvider';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';

export function TopBar({ activeView, onMenuClick, setActiveView }) {
    const {
        pantryId,
        pantryDetails,
        availablePantries,
        switchPantry,
        isLoading
    } = usePantry();

    const [userData, setUserData] = useState({ name: '', email: '', avatarUrl: '' });
    const [isCopied, setIsCopied] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [dismissedIds, setDismissedIds] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasSeenAlerts, setHasSeenAlerts] = useState(false);

    // Global Command Palette Search State
    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const [commandQuery, setCommandQuery] = useState('');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Keyboard shortcut handler for Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        setIsMounted(true);
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserData({
                    name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
                    email: user.email,
                    avatarUrl: user.user_metadata?.avatar_url || ''
                });
            }
        };
        fetchUser();

        if (pantryId) {
            const savedDismissed = JSON.parse(localStorage.getItem(`dismissed-alerts-${pantryId}`) || '[]');
            setDismissedIds(savedDismissed);
        }
    }, [supabase, pantryId]);

    useEffect(() => {
        if (!pantryId) return;

        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/notifications', {
                    headers: { 'x-pantry-id': pantryId }
                });

                if (res.ok) {
                    const data = await res.json();
                    const allAlerts = data.alerts || [];
                    const activeAlerts = allAlerts.filter(alert => !dismissedIds.includes(alert.id));

                    setNotifications(activeAlerts);
                    setUnreadCount(activeAlerts.length);

                    const lastSeenCount = parseInt(localStorage.getItem(`notif-count-${pantryId}`) || '0');
                    if (activeAlerts.length > lastSeenCount) {
                        setHasSeenAlerts(false);
                    } else {
                        setHasSeenAlerts(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);

    }, [pantryId, dismissedIds]);

    const handleDismiss = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        const newDismissed = [...dismissedIds, id];
        setDismissedIds(newDismissed);
        localStorage.setItem(`dismissed-alerts-${pantryId}`, JSON.stringify(newDismissed));
    };

    const handleOpenChange = (isOpen) => {
        setIsNotifOpen(isOpen);
        if (isOpen) {
            setHasSeenAlerts(true);
            localStorage.setItem(`notif-count-${pantryId}`, unreadCount.toString());
        }
    };

    const handleNotificationClick = (notification) => {
        setIsNotifOpen(false);
        if (notification.targetView && setActiveView) {
            setActiveView(notification.targetView);
        } else if (notification.action === 'billing' && setActiveView) {
            setActiveView('Settings');
        }
        if (notification.action === 'billing' || notification.id?.includes('limit')) {
            window.location.hash = 'billing';
        }
    };

    const getAlertIcon = (type, id) => {
        if (id.includes('expiry') || id.includes('expired')) return Package;
        if (type === 'critical') return ArrowUpCircle;
        return AlertTriangle;
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const handleCopyCode = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (pantryDetails?.join_code) {
            navigator.clipboard.writeText(pantryDetails.join_code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : 'U';

    const quickNavigation = [
        { name: 'Dashboard', icon: LayoutDashboard, view: 'Overview', category: 'Navigation' },
        { name: 'Add Items (Receive Intake)', icon: Plus, view: 'Add Items', category: 'Actions' },
        { name: 'Full Inventory Table', icon: Package, view: 'Inventory', category: 'Navigation' },
        { name: 'Remove Items (Distribution)', icon: Minus, view: 'Remove Items', category: 'Actions' },
        { name: 'Settings & Organization', icon: Settings, view: 'Settings', category: 'Preferences' }
    ];

    const filteredNav = quickNavigation.filter(item =>
        item.name.toLowerCase().includes(commandQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(commandQuery.toLowerCase())
    );

    const handleSelectView = (view) => {
        if (setActiveView) setActiveView(view);
        setIsCommandOpen(false);
        setCommandQuery('');
    };

    if (!isMounted) {
        return (
            <header className="sticky top-0 z-30 flex h-[72px] w-full items-center justify-between bg-[#f7f7f5]/80 px-4 backdrop-blur-md md:px-6">
                <div className="h-5 w-32 bg-gray-100/60 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-100/60 rounded-full animate-pulse"></div>
            </header>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-30 flex h-[72px] w-full items-center bg-[#fafafa] px-4 md:px-6 transition-all">
                <div className="w-full max-w-[1400px] mx-auto flex items-center justify-between">

                {/* --- LEFT: Search Bar adjusted for Laptops and Centered for Large Desktops --- */}
                <div className="flex items-center flex-1">
                    {/* Desktop Search Bar (Responsive spacing for laptops & centered alignment on large desktops) */}
                    <div className="hidden md:flex items-center md:ml-2 lg:ml-4">
                        <button
                            onClick={() => setIsCommandOpen(true)}
                            className="flex items-center gap-2.5 bg-[#eef1f6] hover:bg-[#e4e8f0] text-[#3c4257] px-3.5 py-2 rounded-xl w-[210px] md:w-[240px] lg:w-[300px] xl:w-[340px] transition-all text-left group border border-transparent hover:border-slate-300/40 shadow-none"
                        >
                            <Search className="h-4 w-4 text-[#4f566b] group-hover:text-gray-900 transition-colors shrink-0" strokeWidth={2.2} />
                            <span className="text-[14px] font-semibold text-[#4f566b] group-hover:text-gray-900 flex-1 truncate">
                                Search
                            </span>
                            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold font-mono text-slate-400 bg-white/80 rounded border border-slate-200/70 shadow-2xs">
                                <span>⌘</span>
                                <span className="text-[9px] text-slate-300 font-sans">+</span>
                                <span>K</span>
                            </kbd>
                        </button>
                    </div>

                    {/* Mobile App Logo */}
                    <div className="flex md:hidden items-center gap-2.5">
                        <div className="h-[34px] w-[34px] rounded-lg bg-gradient-to-br from-[#d97757] to-[#c06245] text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
                            <Leaf className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <span className="text-[19px] font-serif font-semibold tracking-tight text-gray-900">
                            Food Arca
                        </span>
                    </div>
                </div>

                {/* --- RIGHT: Controls (Org Switcher, Notification Bell, User Profile) --- */}
                <div className="flex items-center gap-2.5 md:gap-4 shrink-0">

                    {/* 1. ORGANIZATION SWITCHER (Desktop Only) */}
                    <div className="hidden md:block">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 py-1.5 px-2 pl-2 pr-3 rounded-full border border-gray-200/60 bg-white/80 hover:bg-white hover:border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all outline-none group active:scale-95 duration-200">
                                <div className="h-6 w-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                                    {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Building2 className="h-3 w-3" />}
                                </div>
                                <span className="text-sm font-medium tracking-tight text-gray-700 max-w-[120px] truncate">
                                    {isLoading ? 'Loading...' : (pantryDetails?.name || 'Select')}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl shadow-xl border-gray-100/50 bg-white/95 backdrop-blur-sm mt-2">
                            <DropdownMenuItem className="p-0 focus:bg-transparent outline-none mb-2" onClick={() => setActiveView && setActiveView('Settings')}>
                                <div className="w-full bg-gray-50/80 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors group/card">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900 leading-none mb-1 group-hover/card:text-[#2b2b2b] transition-colors">
                                                {pantryDetails?.name}
                                            </p>
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <MapPin className="h-3 w-3" />
                                                {pantryDetails?.address || 'No location set'}
                                            </div>
                                        </div>
                                        {pantryDetails?.join_code && (
                                            <button onClick={handleCopyCode} className="group/code flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 hover:border-gray-300 transition-colors shadow-sm">
                                                <code className="text-[10px] font-mono font-bold text-gray-600">
                                                    {pantryDetails.join_code}
                                                </code>
                                                {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 pb-1">
                                Your Organization
                            </DropdownMenuLabel>

                            <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                                {availablePantries.map((membership) => {
                                    const isSelected = membership.pantry_id === pantryId;
                                    return (
                                        <DropdownMenuItem key={membership.pantry_id} onClick={() => switchPantry(membership.pantry_id)} className={`cursor-pointer rounded-lg py-2 px-2 flex items-center justify-between transition-colors ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${isSelected ? 'bg-white border-gray-200 text-gray-800 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <span className={`font-medium text-sm truncate ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {membership.pantry.name}
                                                    </span>
                                                </div>
                                            </div>
                                            {isSelected && <Check className="h-3.5 w-3.5 text-gray-800" />}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* 2. NOTIFICATIONS BELL */}
                <DropdownMenu open={isNotifOpen} onOpenChange={handleOpenChange}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-[#3c4257] hover:text-gray-900 hover:bg-gray-200/50 rounded-full h-10 w-10 transition-transform active:scale-95">
                            <Bell className="h-[21px] w-[21px] text-[#3c4257]" strokeWidth={2.2} />
                            {unreadCount > 0 && !hasSeenAlerts && (
                                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-[1.5px] border-white shadow-sm" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    
                    {/* SLEEK RESPONSIVE NOTIFICATION POPOVER (GUARANTEED 16px GUTTER ON MOBILE & DESKTOP) */}
                    <DropdownMenuContent 
                        align="end" 
                        sideOffset={8}
                        collisionPadding={16}
                        className="w-[calc(100vw-32px)] sm:w-[380px] max-w-[360px] sm:max-w-[380px] rounded-2xl shadow-2xl border border-gray-200/90 p-0 mt-1.5 overflow-hidden bg-white/95 backdrop-blur-xl z-50 font-sans"
                    >
                        <div className="p-3.5 sm:p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <span className="font-bold text-sm text-[#1a1f36] tracking-tight">Notifications</span>
                            {notifications.length > 0 && (
                                <span className="bg-[#d97757]/10 text-[#d97757] text-[11px] font-bold px-2 py-0.5 rounded-full">
                                    {notifications.length} New
                                </span>
                            )}
                        </div>
                        <div className="max-h-[340px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center bg-gray-50/40">
                                    <Sparkles className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-[#4f566b]">All caught up!</p>
                                    <p className="text-[11px] text-[#8792a2] mt-0.5">No new notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    <AnimatePresence>
                                        {notifications.map((notif) => {
                                            const Icon = getAlertIcon(notif.type, notif.id);
                                            const isCritical = notif.type === 'critical';
                                            return (
                                                <motion.div
                                                    key={notif.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="p-3.5 hover:bg-gray-50/80 cursor-pointer transition-colors relative group"
                                                    onClick={() => handleNotificationClick(notif)}
                                                >
                                                    <div className="flex gap-3 items-start">
                                                        <div className={`mt-0.5 h-8.5 w-8.5 rounded-xl flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                            <Icon className="h-4 w-4" strokeWidth={2.2} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <p className="text-xs font-bold text-[#1a1f36] leading-tight mb-1">
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-[11.5px] text-[#697386] leading-relaxed line-clamp-2">
                                                                {notif.message}
                                                            </p>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => handleDismiss(e, notif.id)}
                                                            className="text-gray-300 hover:text-gray-500 p-1 rounded-md hover:bg-gray-100 transition-colors"
                                                            title="Dismiss"
                                                        >
                                                            <XIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* 3. USER PROFILE (Moved all the way to the right for both mobile and desktop) */}
                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-transparent focus-visible:ring-0 outline-none ml-1">
                                <Avatar className="h-9 w-9 border border-gray-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-transform hover:scale-105">
                                    <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                                    <AvatarFallback className="bg-[#2b2b2b] text-white font-medium text-xs tracking-wide">
                                        {getInitials(userData.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-gray-100/50 p-1 mt-2 bg-white/95 backdrop-blur-xl">
                            <div className="px-3 py-3 bg-gray-50/50 rounded-xl mb-2 border border-gray-100/50">
                                <p className="text-sm font-semibold text-gray-900">{userData.name}</p>
                                <p className="text-[12px] text-gray-500 truncate">{userData.email}</p>
                            </div>
                            
                            {/* Settings moved here! */}
                            <DropdownMenuItem
                                className="cursor-pointer rounded-lg text-gray-700 text-sm py-2.5 px-3 font-medium transition-colors"
                                onClick={() => setActiveView && setActiveView('Settings')}
                            >
                                <Settings className="mr-2 h-4 w-4 text-gray-400" /> Settings
                            </DropdownMenuItem>

                            <div className="h-[1px] bg-gray-100 my-1 mx-2" />

                            <DropdownMenuItem
                                className="cursor-pointer rounded-lg focus:bg-red-50 text-red-600 text-sm py-2.5 px-3 font-medium transition-colors"
                                onClick={handleSignOut}
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    </header>

        {/* --- GLOBAL COMMAND PALETTE MODAL (⌘K) --- */}
        <AnimatePresence>
            {isCommandOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setIsCommandOpen(false)}
                    />

                    {/* Dialog Card (Sleek Linear/Stripe Command Palette) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -8 }}
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden z-10 font-sans"
                    >
                        {/* Input Header */}
                        <div className="flex items-center px-4 py-3.5 border-b border-gray-100 gap-3">
                            <Search className="h-4.5 w-4.5 text-[#4f566b] shrink-0" strokeWidth={2.2} />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Type a command or search view..."
                                value={commandQuery}
                                onChange={(e) => setCommandQuery(e.target.value)}
                                className="w-full bg-transparent text-sm text-[#1a1f36] placeholder-[#8792a2] outline-none font-medium"
                            />
                            <button
                                onClick={() => setIsCommandOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <XIcon className="h-4.5 w-4.5" />
                            </button>
                        </div>

                        {/* Quick Navigation List */}
                        <div className="max-h-[300px] overflow-y-auto p-2">
                            <div className="px-3 py-2 text-[11px] font-semibold text-[#8792a2] uppercase tracking-wider">
                                Navigation & Actions
                            </div>

                            {filteredNav.length > 0 ? (
                                filteredNav.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => handleSelectView(item.view)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#f4f4f6] transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-gray-100/70 text-[#4f566b] group-hover:bg-[#fff5f2] group-hover:text-[#d97757] group-hover:border group-hover:border-[#fcd5c7] flex items-center justify-center transition-all shrink-0">
                                                <item.icon className="h-4 w-4" strokeWidth={2} />
                                            </div>
                                            <span className="text-xs font-semibold text-[#3c4257] group-hover:text-[#1a1f36] tracking-tight">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-medium text-[#697386] bg-gray-100/80 group-hover:bg-white px-2 py-0.5 rounded-md border border-gray-200/60 shadow-2xs">
                                            {item.category}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-xs font-medium text-[#8792a2]">
                                    No commands found matching &quot;{commandQuery}&quot;
                                </div>
                            )}
                        </div>

                        {/* Footer info */}
                        <div className="px-4 py-2.5 bg-gray-50/70 border-t border-gray-100 flex justify-between items-center text-[11px] font-medium text-[#8792a2]">
                            <span>Tip: Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200/80 shadow-2xs text-[#4f566b]">⌘ + K</kbd> to search anytime</span>
                            <span>Esc to close</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </>
);
}