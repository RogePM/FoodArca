'use client';

import React, { useState } from 'react';
import { X, Check, Loader2, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/plans';

export function UpgradeModal({ isOpen, onClose, currentTier }) {
    const [loadingTier, setLoadingTier] = useState(null);

    if (!isOpen) return null;

    const handleUpgrade = async (tierKey) => {
        setLoadingTier(tierKey);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: tierKey })
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else alert("Failed to start checkout.");
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setLoadingTier(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-[#d97757]" fill="#d97757" /> Upgrade your Team
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Unlock more seats and features to grow your impact.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Plans Grid */}
                <div className="p-6 md:p-8 grid md:grid-cols-2 gap-6">
                    {['basic', 'pro'].map((tier) => {
                        const plan = PLANS[tier];
                        const isPro = tier === 'pro';
                        
                        return (
                            <div key={tier} className={`relative border rounded-xl p-6 transition-all ${isPro ? 'border-[#d97757] bg-orange-50/10 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                {isPro && (
                                    <div className="absolute -top-3 right-4 bg-[#d97757] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Recommended
                                    </div>
                                )}
                                
                                <h3 className="font-bold text-lg capitalize text-gray-900">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mt-2 mb-4">
                                    <span className="text-3xl font-bold">${plan.price}</span>
                                    <span className="text-gray-500 text-sm">/mo</span>
                                </div>

                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <Check className="h-4 w-4 text-green-600" /> {plan.limits.users} Team Seats
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <Check className="h-4 w-4 text-green-600" /> {plan.limits.items >= 10000 ? 'Unlimited' : plan.limits.items} Items
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <Check className="h-4 w-4 text-green-600" /> {plan.limits.clients >= 10000 ? 'Unlimited' : plan.limits.clients} Clients
                                    </li>
                                </ul>

                                <Button 
                                    onClick={() => handleUpgrade(tier)}
                                    disabled={!!loadingTier}
                                    className={`w-full ${isPro ? 'bg-[#d97757] hover:bg-[#c06245] text-white' : 'bg-gray-900 text-white hover:bg-black'}`}
                                >
                                    {loadingTier === tier ? <Loader2 className="animate-spin h-4 w-4" /> : `Upgrade to ${plan.name}`}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}