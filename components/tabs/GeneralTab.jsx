import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; 
import { 
    Copy, Check, FileDown, Lock, 
    Building2, Loader2, Share2, Zap 
} from 'lucide-react';

import { createBrowserClient } from '@supabase/ssr';
import { usePantry } from '@/components/providers/PantryProvider';

export function GeneralTab({ details, hasProFeatures }) {
    
    const { pantryId, userRole, refreshPantry } = usePantry();

    // 🔥 FIX: Allow both 'admin' AND 'owner' to change settings
    const isAdmin = userRole === 'admin' || userRole === 'owner';

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const [isFastMode, setIsFastMode] = useState(
        details?.settings?.enable_client_tracking === false
    );

    useEffect(() => {
        const trackingEnabled = details?.settings?.enable_client_tracking ?? true;
        setIsFastMode(!trackingEnabled);
    }, [details?.settings?.enable_client_tracking]);

    const handleCopyCode = () => {
        if (!details?.join_code) return;
        navigator.clipboard.writeText(details.join_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExport = (type) => {
        setDownloading(type);
        setTimeout(() => {
            setDownloading(null);
            alert(`Downloaded ${type}.csv`); 
        }, 1500);
    };

    const handleFastModeToggle = async (checked) => {
        if (!isAdmin) return; 

        setIsFastMode(checked);
        setIsUpdating(true);
        
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
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            
            {/* 1. ORGANIZATION PROFILE */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-gray-900">
                    <Building2 className="h-5 w-5 text-[#d97757]" />
                    <h3 className="text-lg font-semibold">Organization Profile</h3>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pantry Name</Label>
                            <Input 
                                value={details?.name || ''} 
                                disabled 
                                className="bg-gray-50 border-gray-200 text-gray-700 font-medium" 
                            />
                            <p className="text-[10px] text-gray-400">Contact support to rename your organization.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex justify-between">
                                Join Code
                                {copied && <span className="text-green-600 normal-case font-medium animate-in fade-in">Copied to clipboard!</span>}
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Share2 className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <Input 
                                        value={details?.join_code || '...'} 
                                        readOnly 
                                        className="pl-9 bg-white border-[#d97757]/30 text-gray-900 font-mono text-lg tracking-wider" 
                                    />
                                </div>
                                <Button 
                                    onClick={handleCopyCode} 
                                    className="bg-gray-900 text-white hover:bg-black w-24 shrink-0"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 mr-2" />}
                                    {copied ? 'Done' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. WORKFLOW SETTINGS */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-gray-900">
                    <Zap className="h-5 w-5 text-[#d97757]" />
                    <h3 className="text-lg font-semibold">Workflow Settings</h3>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-base font-semibold text-gray-900">Fast Speed Mode</Label>
                            <p className="text-sm text-gray-500 max-w-md">
                                Optimize for high-volume distributions. This <span className="font-bold text-gray-700">disables client tracking</span> and hides the client selection screen to speed up checkout.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                            <Switch 
                                checked={isFastMode}
                                onCheckedChange={handleFastModeToggle}
                                disabled={!isAdmin || isUpdating}
                                className="data-[state=checked]:bg-[#d97757]"
                            />
                        </div>
                    </div>
                    
                    <div className={`mt-4 p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${isFastMode ? 'bg-orange-50 text-orange-800 border-orange-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                        <div className={`w-2 h-2 rounded-full ${isFastMode ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'}`} />
                        {isFastMode 
                            ? "Client Selection is currently HIDDEN from layout." 
                            : "Standard Mode: Client Selection is visible."}
                    </div>

                    {/* Helper text for non-admins/owners */}
                    {!isAdmin && (
                        <div className="mt-2 text-[10px] text-gray-400 italic">
                            * Only owners and admins can change this setting.
                        </div>
                    )}
                </div>
            </section>

            {/* 3. DATA EXPORTS */}
            <section className="space-y-4">
                 <div className="flex items-center gap-2 text-gray-900">
                    <FileDown className="h-5 w-5 text-[#d97757]" />
                    <h3 className="text-lg font-semibold">Data Exports</h3>
                </div>

                 <div className="grid md:grid-cols-2 gap-4">
                    <div className={`
                        border rounded-xl p-5 flex flex-col justify-between gap-4 transition-all
                        ${hasProFeatures ? 'bg-white border-gray-200 hover:border-[#d97757]/50' : 'bg-gray-50 border-gray-100 opacity-80'}
                    `}>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-gray-900">Current Inventory</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Download a snapshot of all active stock items, quantities, and expiration dates.
                                </p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                <FileDown className="h-4 w-4 text-gray-600" />
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={!hasProFeatures || downloading === 'inventory'}
                            onClick={() => handleExport('inventory')}
                            className="w-full border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                        >
                            {downloading === 'inventory' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Download CSV'}
                        </Button>
                    </div>

                    <div className={`
                        border rounded-xl p-5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden
                        ${hasProFeatures ? 'bg-white border-gray-200 hover:border-[#d97757]/50' : 'bg-gray-50 border-gray-100'}
                    `}>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-gray-900">Distribution History</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Full log of every item distributed, including timestamps and client data.
                                </p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                {hasProFeatures ? <FileDown className="h-4 w-4 text-gray-600" /> : <Lock className="h-4 w-4 text-gray-400" />}
                            </div>
                        </div>

                        {hasProFeatures ? (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={downloading === 'history'}
                                onClick={() => handleExport('history')}
                                className="w-full border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                            >
                                {downloading === 'history' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Download CSV'}
                            </Button>
                        ) : (
                            <Button disabled size="sm" variant="secondary" className="w-full bg-gray-200 text-gray-500 cursor-not-allowed">
                                <Lock className="h-3 w-3 mr-2" /> Pro Feature
                            </Button>
                        )}
                    </div>

                 </div>
            </section>
        </div>
    );
}