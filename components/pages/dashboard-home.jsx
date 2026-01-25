'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, Users, TrendingUp, Leaf, 
  Clock, ArrowUpRight, AlertCircle, AlertTriangle,
  ChevronRight, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboardActions } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';
import { WelcomeModal } from '@/components/modals/WelcomeModal';

// --- HELPER: CIRCLE CHART (Powered by Framer Motion) ---
const CircleChart = ({ percentage, color, icon: Icon }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  
  // Ensure we don't break the SVG with weird numbers
  const safePercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="relative h-20 w-20 flex items-center justify-center">
      {/* Background Circle */}
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 70 70">
        <circle
          cx="35"
          cy="35"
          r={radius}
          stroke="#f3f4f6" // gray-100
          strokeWidth="6"
          fill="transparent"
        />
        {/* Animated Progress Circle */}
        <motion.circle
          cx="35"
          cy="35"
          r={radius}
          stroke={color} // ✅ FIXED: Accepts raw HEX color now
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }} // Start empty
          animate={{ strokeDashoffset: strokeDashoffset }} // Animate to value
          transition={{ duration: 1.5, ease: "easeOut" }} // Smooth 1.5s animation
          strokeLinecap="round"
        />
      </svg>
      {/* Icon in Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* We use the style prop for dynamic coloring to match the circle */}
        <Icon className="h-5 w-5" style={{ color: color }} />
      </div>
    </div>
  );
};

// --- COMPONENT: STAT CARD ---
function StatCard({ title, value, subtitle, percentage, icon }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex items-center justify-between group hover:border-[#d97757]/20 hover:shadow-lg transition-all duration-300">
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
        <p className="text-xs text-gray-500 font-medium mt-1">{subtitle}</p>
      </div>
      {/* ✅ FIXED: Passing raw HEX color instead of class name */}
      <CircleChart percentage={percentage} color="#d97757" icon={icon} />
    </div>
  );
}

// --- COMPONENT: QUICK ACTION BUTTON ---
function ActionButton({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-[#d97757]/5 hover:scale-105 transition-all duration-200 group min-w-[110px]"
    >
      <div className="h-12 w-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-[#d97757] group-hover:border-[#d97757] shadow-sm transition-colors">
        <item.icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <span className="text-xs font-bold text-gray-700 group-hover:text-[#d97757] text-center whitespace-nowrap">
        {item.title}
      </span>
    </button>
  );
}

export function DashboardHome({ setActiveView }) {
  const { pantryId, pantryDetails } = usePantry();
  
  // State
  const [stats, setStats] = useState({ inventoryCount: 0, totalPeopleServed: 0, totalValue: 0, totalItemsDistributed: 0 });
  const [notifications, setNotifications] = useState({ alerts: [], expiringItems: [] });
  const [loading, setLoading] = useState(true);

  // Filter Actions
  const showClientTracking = pantryDetails?.settings?.enable_client_tracking ?? true;
  const filteredActions = dashboardActions.filter(item => 
    showClientTracking || item.view !== 'View Clients'
  );

  // Fetch Data
  useEffect(() => {
    if (!pantryId) return;

    const fetchData = async () => {
      try {
        const [statsRes, notifRes] = await Promise.all([
          fetch('/api/pantry-stats', { headers: { 'x-pantry-id': pantryId } }),
          fetch('/api/notifications', { headers: { 'x-pantry-id': pantryId } })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (notifRes.ok) setNotifications(await notifRes.json());
        
      } catch (error) {
        console.error('Dashboard Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pantryId]);

  // --- VISUAL LOGIC: PROGRESS MULTIPLIER ---
  const calculateVisualProgress = (value, multiplier = 2) => {
    if (!value || value === 0) return 5; // Always show tiny 5% bar
    // Cap at 100% so it doesn't break the circle
    return Math.min(100, value * multiplier);
  };

  // Adjusted multipliers for visual satisfaction
  const inventoryProgress = calculateVisualProgress(stats.inventoryCount, 0.5); 
  const impactProgress = calculateVisualProgress(stats.totalValue, 0.05); // Lower multiplier for Value as it is usually high ($)
  const distributionProgress = calculateVisualProgress(stats.totalItemsDistributed, 1); 

  // Date Helpers
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateString));
  };
  const getDaysLeft = (dateString) => {
    const diff = new Date(dateString) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 0 ? 'Today' : `${days}d`;
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <WelcomeModal />
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Here is what's happening at {pantryDetails?.name || 'your pantry'} today.</p>
        </div>
        
        <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-[#d97757]">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {currentDate}
          </span>
        </div>
      </div>

      {/* 2. QUICK ACTIONS BAR */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 w-full md:w-auto border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-8 text-center md:text-left justify-center md:justify-start">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Quick Actions</h3>
              <p className="text-xs text-gray-500">Manage Pantry</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-wrap justify-center items-center gap-4 w-full">
            {filteredActions.map((action) => (
              <ActionButton key={action.title} item={action} onClick={() => setActiveView(action.view)} />
            ))}
          </div>
        </div>
      </div>

      {/* 3. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Current Stock" 
          value={stats.inventoryCount.toLocaleString()} 
          subtitle="Unique Items Available"
          percentage={inventoryProgress}
          icon={Package}
        />
        <StatCard 
          title="Est. Value" 
          value={`$${Math.round(stats.totalValue).toLocaleString()}`} 
          subtitle="Community Aid Provided"
          percentage={impactProgress}
          icon={TrendingUp}
        />
        <StatCard 
          title="Items Out" 
          value={stats.totalItemsDistributed?.toLocaleString() || "0"} 
          subtitle="Total Units Distributed"
          percentage={distributionProgress} 
          icon={Leaf}
        />
      </div>

      {/* 4. ACTIVITY & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* EXPIRING SOON */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#d97757]" />
              <h3 className="font-bold text-gray-900">Expiring Soon</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveView('View Inventory')} className="text-xs text-gray-400 hover:text-[#d97757]">
              View Inventory <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex-1 p-0">
            {loading ? (
              <div className="p-10 text-center text-gray-400 text-sm">Scanning shelves...</div>
            ) : notifications.expiringItems.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-900 font-bold">Stock is Fresh</p>
                <p className="text-gray-500 text-sm mt-1">No items expire in the next 7 days.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.expiringItems.map((item, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-[#FAFAF9] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-12 rounded-lg bg-orange-50 text-[#d97757] border border-orange-100 flex flex-col items-center justify-center leading-none">
                        <span className="text-xs font-bold">{getDaysLeft(item.expirationDate)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm group-hover:text-[#d97757] transition-colors">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(item.expirationDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ALERTS */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-full">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-400" /> 
              System Status
            </h3>

            {notifications.alerts.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-medium">All systems normal.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.alerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl border-l-4 shadow-sm bg-white ${
                      alert.type === 'critical' 
                        ? 'border-l-red-500 border-gray-100' 
                        : 'border-l-[#d97757] border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                        alert.type === 'critical' ? 'text-red-500' : 'text-[#d97757]'
                      }`} />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{alert.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{alert.message}</p>
                        {alert.action && (
                          <button 
                            onClick={() => setActiveView(alert.targetView)}
                            className="text-xs font-bold mt-2 text-[#d97757] hover:underline flex items-center gap-1"
                          >
                            {alert.action} <ArrowUpRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}