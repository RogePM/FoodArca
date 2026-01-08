'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Assuming you have this, or use standard div
import {
    Loader2, Check, ShieldCheck, Zap,
    CreditCard, Building2, ExternalLink, ArrowRight, Star
} from 'lucide-react';
import { PLANS } from '@/lib/plans';

export function BillingTab({ details, currentPlan, currentTier, userRole }) {

    const [isRedirecting, setIsRedirecting] = useState(false);
    const isOwner = userRole === 'owner';

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
                alert("Could not open billing portal.");
            }
        } catch (error) {
            console.error("Billing error:", error);
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
        } finally {
            setIsRedirecting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">

            {/* --- HERO: CURRENT SUBSCRIPTION --- */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    
                    {/* Left: Plan Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${currentTier === 'pro' ? 'bg-[#d97757]/10 text-[#d97757]' : 'bg-gray-100 text-gray-600'}`}>
                                <CreditCard className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Subscription & Billing</h2>
                                <p className="text-gray-500">Manage your organization's plan and payment details.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    {isOwner && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <Button
                                variant="outline"
                                onClick={handleManageSubscription}
                                disabled={isRedirecting || currentTier === 'pilot'}
                                className="h-12 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                            >
                                {isRedirecting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                                Billing Portal
                            </Button>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="bg-gray-50/50 border-t border-gray-100 px-8 py-4 flex flex-col sm:flex-row gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Current Plan:</span>
                        <span className="font-bold text-gray-900 capitalize flex items-center gap-2">
                            {currentPlan.name}
                            {currentTier === 'pro' && <Star className="h-3 w-3 fill-[#d97757] text-[#d97757]" />}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Status:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                        </span>
                    </div>
                    {!isOwner && (
                         <div className="flex items-center gap-2 ml-auto text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                            <ShieldCheck className="h-3 w-3" />
                            <span className="text-xs font-semibold">View Only (Owner Managed)</span>
                         </div>
                    )}
                </div>
            </div>

            {/* --- PRICING GRID --- */}
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <Zap className="h-5 w-5 text-[#d97757]" />
                    <h3 className="text-xl font-bold text-gray-900">Available Plans</h3>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {['basic', 'pro', 'enterprise'].map((tierKey) => {
                        const plan = PLANS[tierKey];
                        const isCurrent = currentTier === tierKey;
                        const isPro = tierKey === 'pro';

                        return (
                            <div
                                key={tierKey}
                                className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${
                                    isCurrent
                                        ? 'bg-white border-2 border-gray-900 shadow-lg scale-[1.01] z-10'
                                        : isPro 
                                            ? 'bg-white border border-gray-200 hover:border-[#d97757]/50 hover:shadow-lg'
                                            : 'bg-white border border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {isCurrent && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                        Current Plan
                                    </div>
                                )}

                                {/* Header */}
                                <div className="mb-6">
                                    <h3 className={`font-bold text-lg capitalize ${isPro ? 'text-[#d97757]' : 'text-gray-900'}`}>
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-4xl font-bold text-gray-900">
                                            {plan.price !== null ? `$${plan.price}` : 'Custom'}
                                        </span>
                                        {plan.price !== null && <span className="text-gray-500 font-medium">/mo</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 h-8 leading-tight">
                                        {tierKey === 'basic' && "Perfect for small pantries just getting started."}
                                        {tierKey === 'pro' && "Advanced tools for growing community organizations."}
                                        {tierKey === 'enterprise' && "For networks and large scale operations."}
                                    </p>
                                </div>

                                {/* Features */}
                                <div className="space-y-4 flex-1 mb-8">
                                    <FeatureItem label={`${formatLimit(plan.limits.items)} Inventory Items`} />
                                    <FeatureItem label={`${formatLimit(plan.limits.clients)} Client Families`} />
                                    <FeatureItem label={`${formatLimit(plan.limits.users)} Team Members`} />
                                    {isPro && <FeatureItem label="Data Export & Reporting" highlighted />}
                                    {tierKey === 'enterprise' && <FeatureItem label="Dedicated Support" />}
                                </div>

                                {/* Action Button */}
                                <div>
                                    {isCurrent ? (
                                        <Button disabled variant="outline" className="w-full bg-gray-50 border-gray-200 text-gray-400 font-medium">
                                            Active Plan
                                        </Button>
                                    ) : tierKey === 'enterprise' ? (
                                        <Button
                                            className="w-full bg-gray-900 text-white hover:bg-black"
                                            onClick={() => window.location.href = 'mailto:sales@foodarca.com'}
                                        >
                                            Contact Sales
                                        </Button>
                                    ) : (
                                        <Button
                                            className={`w-full ${
                                                isPro 
                                                ? 'bg-[#d97757] hover:bg-[#c06245] text-white shadow-md shadow-orange-100' 
                                                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-900'
                                            }`}
                                            onClick={() => handleUpgrade(tierKey)}
                                            disabled={!isOwner || isRedirecting}
                                        >
                                            {isRedirecting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                                <span className="flex items-center">
                                                    Upgrade <ArrowRight className="ml-2 h-4 w-4" />
                                                </span>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// --- SUB COMPONENTS ---

function FeatureItem({ label, highlighted = false }) {
    return (
        <div className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-full p-0.5 ${highlighted ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Check className={`h-3 w-3 ${highlighted ? 'text-[#d97757]' : 'text-gray-600'}`} strokeWidth={3} />
            </div>
            <span className={`text-sm ${highlighted ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {label}
            </span>
        </div>
    );
}

function formatLimit(num) {
    if (num >= 10000) return 'Unlimited';
    return num.toLocaleString();
}