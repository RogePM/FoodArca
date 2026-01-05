'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { usePantry } from '@/components/providers/PantryProvider';
import { getPlanDetails } from '@/lib/plans';

import { BillingTab } from '@/components/tabs/BillingTab';
import { GeneralTab } from '@/components/tabs/GeneralTab'; 

export function SettingsView() {
    const { pantryId, userRole, pantryDetails, refreshPantry } = usePantry();
    
    // Default to 'general'
    const [activeTab, setActiveTab] = useState('general'); 
    const [details, setDetails] = useState(pantryDetails);
    
    // Usage State
    const [clientCount, setClientCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // --- Listen for URL Hash on Load ---
    useEffect(() => {
        const checkHash = () => {
            if (window.location.hash === '#billing') {
                setActiveTab('billing');
            }
        };
        checkHash();
        window.addEventListener('hashchange', checkHash);
        return () => window.removeEventListener('hashchange', checkHash);
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!pantryId) return;

            try {
                // 1. Fetch Pantry Details (if not already synced)
                // This ensures we get the latest 'max_clients_limit' from your DB
                let currentDetails = pantryDetails;
                
                if (!currentDetails) {
                    const { data } = await supabase
                        .from('food_pantries')
                        .select('*')
                        .eq('pantry_id', pantryId)
                        .single();
                    if (data) {
                        setDetails(data);
                        currentDetails = data;
                    }
                } else {
                    setDetails(pantryDetails);
                }

                // 2. Fetch Real-time Client Usage
                // We count the ACTUAL rows in the clients table to ensure accuracy
                const { count, error } = await supabase
                    .from('clients')
                    .select('*', { count: 'exact', head: true }) 
                    .eq('pantry_id', pantryId);

                if (!error) {
                    setClientCount(count || 0);
                }

            } catch (err) {
                console.error("Error loading settings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [pantryId, pantryDetails, supabase]);

    if (loading) return <div className="p-20 text-center text-gray-400">Loading settings...</div>;

    // --- LIMIT CALCULATION LOGIC ---
    const currentTier = details?.subscription_tier || 'pilot';
    const currentPlan = getPlanDetails(currentTier);
    const hasProFeatures = currentPlan.features.csv_export;
    
    // 1. Check if the Database Row has a specific limit (Override)
    // 2. If null, fallback to the Generic Plan Limit
    const dbLimit = details?.max_clients_limit;
    const planLimit = currentPlan.features.max_clients;
    
    // Use the DB limit if it exists (even if it is 0), otherwise use plan default
    const maxClients = (dbLimit !== null && dbLimit !== undefined) ? dbLimit : planLimit;
    
    const isUnlimited = maxClients > 100000; 

    const commonProps = {
        pantryId,
        details,
        setDetails,
        supabase,
        userRole,
        refreshPantry,
        currentPlan,
        hasProFeatures,
        currentTier,
        // Pass the calculated stats
        usageStats: {
            current: clientCount,
            limit: maxClients,
            isUnlimited,
            percentUsed: isUnlimited ? 0 : Math.min(100, (clientCount / maxClients) * 100)
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-6 py-10">
                
                {/* HEADER & TABS */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-[#d97757] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                {details?.name?.[0]?.toUpperCase() || 'P'}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-medium text-gray-900">{details?.name}</span>
                                <span className="text-gray-300">/</span>
                                <h1 className="font-bold text-gray-900 text-lg">Settings</h1>
                            </div>
                        </div>

                        {/* Resource Indicator */}
                        <div className={`hidden md:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${
                            commonProps.usageStats.percentUsed >= 100 
                                ? 'bg-red-50 border-red-200 text-red-700' 
                                : 'bg-gray-50 border-gray-100 text-gray-500'
                        }`}>
                            <span>Clients:</span>
                            <span className="font-bold">
                                {clientCount} / {isUnlimited ? '∞' : maxClients}
                            </span>
                        </div>
                    </div>

                    {/* TAB NAVIGATION */}
                    <div className="flex gap-8 border-b border-gray-100">
                        {['general', 'billing'].map((tab) => (
                            <button
                                key={tab}
                                data-tab={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium transition-all relative ${
                                    activeTab === tab 
                                    ? 'text-gray-900' 
                                    : 'text-gray-500 hover:text-gray-800'
                                } capitalize`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                    {activeTab === 'general' && <GeneralTab {...commonProps} />}
                    {activeTab === 'billing' && <BillingTab {...commonProps} />}
                </div>

            </div>
        </div>
    );
}