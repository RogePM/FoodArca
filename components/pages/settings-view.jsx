'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { usePantry } from '@/components/providers/PantryProvider';
import { PLANS, getPlanDetails } from '@/lib/plans';

// Sub-components
import { TeamTab } from '@/components/tabs/TeamTab';
import { BillingTab } from '@/components/tabs/BillingTab';
import { GeneralTab } from '@/components/tabs/GeneralTab';

export function SettingsView() {
    const { pantryId, userRole, pantryDetails, refreshPantry } = usePantry();
    const [activeTab, setActiveTab] = useState('team'); 
    const [details, setDetails] = useState(pantryDetails);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchSettings = async () => {
            if (pantryDetails) {
                setDetails(pantryDetails);
                setLoading(false);
                return;
            }
            if (!pantryId) return;

            const { data } = await supabase
                .from('food_pantries')
                .select('*')
                .eq('pantry_id', pantryId)
                .single();

            if (data) setDetails(data);
            setLoading(false);
        };
        fetchSettings();
    }, [pantryId, pantryDetails]);

    if (loading) return <div className="p-20 text-center text-gray-400">Loading settings...</div>;

    // --- SHARED PROPS ---
    const currentTier = details?.subscription_tier || 'pilot';
    const currentPlan = getPlanDetails(currentTier);
    const hasProFeatures = currentPlan.features.csv_export;

    const commonProps = {
        pantryId,
        details,
        setDetails,
        supabase,
        userRole,
        refreshPantry,
        currentPlan,
        hasProFeatures,
        currentTier
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-10">
                
                {/* HEADER & TABS */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                             {/* 👇 UPDATED: Matches Brand Color (#d97757) */}
                            <div className="h-8 w-8 rounded-lg bg-[#d97757] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                {details?.name?.[0]?.toUpperCase() || 'P'}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-medium text-gray-900">{details?.name}</span>
                                <span className="text-gray-300">/</span>
                                <h1 className="font-bold text-gray-900 text-lg">Settings</h1>
                            </div>
                        </div>
                    </div>

                    {/* TAB NAVIGATION */}
                    <div className="flex gap-8 border-b border-gray-100">
                        {['team', 'billing', 'general'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium transition-all relative ${
                                    activeTab === tab 
                                    ? 'text-gray-900' 
                                    : 'text-gray-500 hover:text-gray-800'
                                } capitalize`}
                            >
                                {tab}
                                {/* Active Tab Indicator */}
                                {activeTab === tab && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                    {activeTab === 'team' && <TeamTab {...commonProps} />}
                    {activeTab === 'billing' && <BillingTab {...commonProps} />}
                    {activeTab === 'general' && <GeneralTab {...commonProps} />}
                </div>

            </div>
        </div>
    );
}