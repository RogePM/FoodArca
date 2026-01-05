'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Loader2, CheckCircle2, ShieldAlert,
    BarChart3, Zap, Mail
} from 'lucide-react';
import { PLANS } from '@/lib/plans';

export function BillingTab({ details, currentPlan, currentTier, userRole, usageStats }) {

    const [isRedirecting, setIsRedirecting] = useState(false);
    const isOwner = userRole === 'owner';

    // --- 1. GET COUNTS (Live from Supabase Props) ---
    // Items: Use the column from your 'food_pantries' table
    const currentItems = details?.total_items_created || 0;
    // Clients: Use the live count passed from the parent component
    const currentClients = usageStats?.current || 0;

    // --- 2. GET LIMITS (Database Priority > Plan Fallback) ---
    // Use the specific limit columns from your DB. If null/undefined, fall back to the generic plan defaults.
    
    // Items Limit
    const maxItems = details?.max_items_limit ?? currentPlan?.limits?.items ?? 100;
    
    // Clients Limit (The "Family" count limit)
    const maxClients = details?.max_clients_limit ?? currentPlan?.limits?.clients ?? 100;
    
    // Users Limit
    const maxUsers = details?.max_users_limit ?? currentPlan?.limits?.users ?? 1;

    // --- HANDLERS ---
    const handleManageSubscription = async () => {
        if (!isOwner) return;
        setIsRedirecting(true);
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Could not open billing portal. Do you have an active subscription?");
            }
        } catch (error) {
            console.error("Billing error:", error);
            alert("Failed to load billing portal.");
        } finally {
            setIsRedirecting(false);
        }
    };

    const handleUpgrade = async (tierKey) => {
        if (!isOwner) return;
        setIsRedirecting(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: tierKey })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Failed to start checkout session.");
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("An error occurred starting checkout.");
        } finally {
            setIsRedirecting(false);
        }
    };

    const calculatePercent = (val, max) => {
        if (max >= 100000) return 0; // Unlimited
        if (!max || max === 0) return 100; // Prevent divide by zero
        return Math.min((val / max) * 100, 100);
    };

    return (
        <div className="space-y-10 max-w-5xl mx-auto">

            {/* --- SECTION 1: CURRENT PLAN STATUS --- */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold text-gray-900 capitalize">
                            {currentPlan.name} Plan
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${currentTier === 'pro' || currentTier === 'enterprise'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                            Active
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        {currentPlan.price === 0
                            ? 'You are currently on the free pilot tier.'
                            : 'Your next billing cycle renews automatically.'}
                    </p>
                </div>

                {isOwner ? (
                    <Button
                        variant="outline"
                        onClick={handleManageSubscription}
                        disabled={isRedirecting || currentTier === 'pilot'}
                        className="border-gray-300 text-gray-700"
                    >
                        {isRedirecting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Manage Subscription'}
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-500 text-xs">
                        <ShieldAlert className="h-3 w-3" />
                        <span>Only owner can manage billing</span>
                    </div>
                )}
            </div>

            {/* --- SECTION 2: AVAILABLE PLANS (Grid) --- */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#d97757]" />
                    Available Plans
                </h3>

                <div className="grid md:grid-cols-3 gap-6">
                    {['basic', 'pro', 'enterprise'].map((tierKey) => {
                        const plan = PLANS[tierKey];
                        const isCurrent = currentTier === tierKey;

                        return (
                            <div
                                key={tierKey}
                                className={`relative flex flex-col rounded-xl p-6 border transition-all duration-200 ${isCurrent
                                    ? 'border-green-500 ring-1 ring-green-500 bg-green-50/10'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                }`}
                            >
                                {isCurrent && (
                                    <span className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold uppercase tracking-wide">
                                        Current Plan
                                    </span>
                                )}

                                <div className="mb-4">
                                    <h3 className="font-bold text-lg text-gray-900 capitalize">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-3xl font-bold text-gray-900">
                                            {plan.price !== null ? `$${plan.price}` : 'Custom'}
                                        </span>
                                        {plan.price !== null && <span className="text-sm text-gray-500">/mo</span>}
                                    </div>
                                </div>

                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                        <span>
                                            {plan.limits.items >= 10000 ? 'Unlimited' : plan.limits.items.toLocaleString()} Items
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                        <span>
                                            {plan.limits.clients >= 10000 ? 'Unlimited' : plan.limits.clients.toLocaleString()} Clients
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                        <span>
                                            {plan.limits.users >= 10000 ? 'Unlimited' : plan.limits.users} Team Members
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    {isCurrent ? (
                                        <Button disabled variant="outline" className="w-full bg-gray-50 text-gray-400">
                                            Active
                                        </Button>
                                    ) : tierKey === 'enterprise' ? (
                                        <Button
                                            className="w-full bg-gray-900 text-white hover:bg-black"
                                            onClick={() => window.location.href = 'mailto:rogeliopmdev@gmail.com'}
                                        >
                                            <Mail className="h-4 w-4 mr-2" /> Contact Sales
                                        </Button>
                                    ) : (
                                        <Button
                                            className={`w-full ${tierKey === 'pro' ? 'bg-[#d97757] hover:bg-[#c06245] text-white' : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-900'}`}
                                            onClick={() => handleUpgrade(tierKey)}
                                            disabled={!isOwner || isRedirecting}
                                        >
                                            {isRedirecting ? <Loader2 className="h-4 w-4 animate-spin" /> : (tierKey === 'pro' ? 'Upgrade to Pro' : 'Select Basic')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- SECTION 3: USAGE METRICS --- */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-gray-400" />
                    Resource Usage
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Usage Card (Items) */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Inventory Items</p>
                                <h4 className="text-3xl font-bold text-gray-900">
                                    {currentItems.toLocaleString()}
                                </h4>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Limit</span>
                                <p className="text-sm font-semibold text-gray-700">
                                    {maxItems >= 100000 ? 'Unlimited' : maxItems.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        {maxItems < 100000 && (
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${calculatePercent(currentItems, maxItems) > 90 ? 'bg-red-500' : 'bg-[#d97757]'}`}
                                        style={{ width: `${calculatePercent(currentItems, maxItems)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 text-right">
                                    {Math.round(calculatePercent(currentItems, maxItems))}% Used
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Usage Card (Clients) */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Client Families</p>
                                <h4 className="text-3xl font-bold text-gray-900">
                                    {currentClients.toLocaleString()}
                                </h4>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Limit</span>
                                <p className="text-sm font-semibold text-gray-700">
                                    {maxClients >= 100000 ? 'Unlimited' : maxClients.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        {maxClients < 100000 && (
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${calculatePercent(currentClients, maxClients) > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                                        style={{ width: `${calculatePercent(currentClients, maxClients)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 text-right">
                                    {Math.round(calculatePercent(currentClients, maxClients))}% Used
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}