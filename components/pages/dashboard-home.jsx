'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Users,
  TrendingUp,
  Leaf,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { dashboardActions } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';

// --- COMPONENT: STAT CARD (UNCHANGED STYLE, TIGHTER PADDING) ---
function StatCard({ title, value, subtitle, icon: Icon, delay, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay, type: "spring", stiffness: 100 }}
      className="h-full"
    >
      <div className="group relative h-full bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden">

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d97757] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#d97757]/0 via-[#d97757]/0 to-[#d97757]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* TIGHTER PADDING: p-4 instead of p-5 */}
        <div className="p-4 flex flex-col justify-between h-full relative z-10">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {title}
            </span>
            <div className="h-8 w-8 rounded-full bg-[#d97757]/10 flex items-center justify-center text-[#d97757] group-hover:scale-110 transition-transform duration-300">
              <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
          </div>

          <div>
            {loading ? (
              <div className="h-8 w-24 bg-gray-100 rounded-md animate-pulse mb-1" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-[#40723694] tracking-tighter tabular-nums">
                  {value}
                </h3>
              </div>
            )}
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-gray-500 font-medium leading-tight truncate">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- COMPONENT: ACTION CARD (UNCHANGED STYLE, TIGHTER PADDING) ---
function ActionCard({ item, onClick, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full h-full text-left"
    >
      {/* TIGHTER PADDING: py-4 px-5 instead of py-5 px-6 */}
      <Card className={`
        h-full bg-white border border-gray-200 shadow-sm 
        group relative overflow-hidden transition-all duration-300
        hover:border-[#d97757]/50 hover:shadow-lg
        flex flex-col items-center justify-center p-4 gap-3
        md:flex-row md:items-center md:justify-start md:px-5 md:py-4 md:gap-4
      `}>
        <div className={`
          shrink-0 flex items-center justify-center text-[#d97757] transition-all duration-300
          bg-white/10
          h-14 w-14 rounded-2xl
          md:h-12 md:w-12 md:rounded-xl
          group-hover:bg-[#d97757] group-hover:text-white
          group-hover:shadow-md
        `}>
          <item.icon className="h-7 w-7 md:h-6 md:w-6" strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-center md:items-start text-center md:text-left">
          <h4 className="font-medium text-gray-800 text-sm md:text-base leading-tight group-hover:text-[#d97757] transition-colors">
            {item.title}
          </h4>
          <p className="hidden md:block text-xs text-gray-500 mt-1 line-clamp-2 font-medium">
            {item.description}
          </p>
        </div>

        <div className="hidden md:block text-gray-300 group-hover:text-[#d97757] group-hover:translate-x-1 transition-all">
          <ChevronRight className="h-5 w-5" />
        </div>
      </Card>
    </motion.button>
  );
}

export function DashboardHome({ setActiveView }) {
  const { pantryId, pantryDetails } = usePantry();

  const [stats, setStats] = useState({
    inventoryCount: 0,
    totalPeopleServed: 0,
    totalValue: 0,
    totalItemsDistributed: 0
  });
  const [loading, setLoading] = useState(true);

  const showClientTracking = pantryDetails?.settings?.enable_client_tracking ?? true;
  const filteredActions = dashboardActions.filter(item =>
    showClientTracking || item.view !== 'View Clients'
  );

  useEffect(() => {
    const fetchStats = async () => {
      if (!pantryId) return;
      try {
        const res = await fetch('/api/pantry-stats', {
          headers: { 'x-pantry-id': pantryId }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [pantryId]);

  return (
    // REDUCED VERTICAL PADDING (py-6 -> py-4) AND SPACING (space-y-6 -> space-y-4)
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">

      {/* SECTION 1: QUICK ACTIONS (TOP) */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          Quick Actions
        </h2>
        {/* REVERTED TO lg:grid-cols-3 (Original Layout) but slightly tighter gap */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredActions.map((item, index) => (
            <ActionCard
              key={item.title}
              item={item}
              index={index}
              onClick={() => setActiveView(item.view)}
            />
          ))}
        </div>
      </div>

      {/* SECTION 2: ANALYTICS (BOTTOM) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Overview</h2>
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
            All time stats
          </span>
        </div>

        {/* 4 COLUMNS ON DESKTOP FOR SINGLE ROW STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Distributions"
            value={stats.totalPeopleServed.toLocaleString()}
            subtitle="Total visits logged"
            icon={Users}
            delay={0.3}
            loading={loading}
          />
          <StatCard
            title="Est. Value"
            value={`$${Math.round(stats.totalValue).toLocaleString()}`}
            subtitle="Market value given"
            icon={TrendingUp}
            delay={0.4}
            loading={loading}
          />
          <StatCard
            title="Items Out"
            value={stats.totalItemsDistributed?.toLocaleString() || "0"}
            subtitle="Units distributed"
            icon={Leaf}
            delay={0.5}
            loading={loading}
          />
          <StatCard
            title="Stock"
            value={stats.inventoryCount.toLocaleString()}
            subtitle="Unique items on hand"
            icon={Package}
            delay={0.6}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}