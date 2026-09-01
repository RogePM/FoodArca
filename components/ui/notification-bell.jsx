'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, AlertTriangle, ArrowUpCircle, Package, X as XIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { usePantry } from '@/components/providers/PantryProvider';
import { useDashboardRoute } from '@/components/layout/use-dashboard-route';

export function NotificationBell({ activeView, setActiveView, className }) {
    const { navigateToView } = useDashboardRoute(activeView);
    const handleNav = setActiveView || navigateToView;
    const { pantryId } = usePantry();

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [dismissedIds, setDismissedIds] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasSeenAlerts, setHasSeenAlerts] = useState(false);

    useEffect(() => {
        if (pantryId) {
            const savedDismissed = JSON.parse(localStorage.getItem(`dismissed-alerts-${pantryId}`) || '[]');
            setDismissedIds(savedDismissed);
        }
    }, [pantryId]);

    const dismissedIdsRef = useRef(dismissedIds);
    useEffect(() => {
        dismissedIdsRef.current = dismissedIds;
    }, [dismissedIds]);

    useEffect(() => {
        if (!pantryId) return;

        const fetchNotifications = async () => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                return; // Don't fetch on mobile since the bell is hidden
            }
            try {
                const res = await fetch('/api/notifications', {
                    headers: { 'x-pantry-id': pantryId }
                });

                if (res.ok) {
                    const data = await res.json();
                    const allAlerts = data.alerts || [];
                    const activeAlerts = allAlerts.filter(alert => !dismissedIdsRef.current.includes(alert.id));

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
    }, [pantryId]);

    const handleDismiss = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        const newDismissed = [...dismissedIds, id];
        setDismissedIds(newDismissed);
        localStorage.setItem(`dismissed-alerts-${pantryId}`, JSON.stringify(newDismissed));
        
        // Optimistically update the notifications list
        setNotifications(prev => {
            const next = prev.filter(n => n.id !== id);
            setUnreadCount(next.length);
            return next;
        });
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
        if (notification.action === 'billing' || notification.id?.includes('limit')) {
            handleNav('/dashboard/settings#billing');
            if (typeof window !== 'undefined') {
                window.location.hash = 'billing';
            }
            return;
        }
        if (notification.targetView) {
            handleNav(notification.targetView);
        }
    };

    const getAlertIcon = (type, id) => {
        if (id.includes('expiry') || id.includes('expired')) return Package;
        if (type === 'critical') return ArrowUpCircle;
        return AlertTriangle;
    };

    return (
        <DropdownMenu open={isNotifOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={`relative text-[#3c4257] hover:text-gray-900 hover:bg-gray-200/50 rounded-full h-10 w-10 transition-transform active:scale-95 ${className || ''}`}>
                    <Bell className="h-[21px] w-[21px] text-[#3c4257]" strokeWidth={2.2} />
                    {unreadCount > 0 && !hasSeenAlerts && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-[1.5px] border-white shadow-sm" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            
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
    );
}
