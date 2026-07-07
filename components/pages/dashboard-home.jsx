'use client';

import React, { useState, useEffect } from 'react';
import { Package, ChevronRight } from 'lucide-react';
import { dashboardActions } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';
import { WelcomeModal } from '@/components/modals/WelcomeModal';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- COMPONENT: MOBILE ACTION BUTTON ---
function ActionButtonMobile({ item, onClick }) {
  let shortTitle = item.title;
  if (item.title === 'Add Items') shortTitle = 'Add';
  if (item.title === 'Remove Items') shortTitle = 'Remove';
  if (item.title === 'View Inventory') shortTitle = 'Stock';
  if (item.title === 'Recent Changes') shortTitle = 'History';

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 group min-w-[60px]"
    >
      <div className="h-14 w-14 rounded-full flex items-center justify-center text-gray-700 bg-gray-100 border border-gray-200 group-hover:bg-[#d97757] group-hover:text-white transition-colors shadow-sm">
        <item.icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <span className="text-[12px] font-medium text-gray-600 group-hover:text-[#d97757] transition-colors">
        {shortTitle}
      </span>
    </button>
  );
}

// --- COMPONENT: GRAPHICAL METRIC CARD (Mobile & Desktop) ---
function GraphicalMetricCard({ title, value, subtitle, isError, onClick, type }) {
  const isClickable = !!onClick;
  const Wrapper = isClickable ? 'button' : 'div';
  
  const renderGraphic = () => {
    switch(type) {
      case 'value':
        return (
          <div className="absolute bottom-3 right-5 flex items-end gap-1 opacity-80">
            <div className="w-2 sm:w-3 bg-green-100 h-2 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-green-200 h-4 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-green-300 h-6 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-green-400 h-8 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-green-500 h-10 rounded-t-[2px]" />
          </div>
        );
      case 'items':
        return (
          <div className="absolute bottom-3 right-5 flex items-end gap-1 opacity-80">
            <div className="w-2 sm:w-3 bg-[#d97757]/20 h-3 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-[#d97757]/40 h-5 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-[#d97757]/60 h-7 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-[#d97757]/80 h-9 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-[#d97757] h-10 rounded-t-[2px]" />
          </div>
        );
      case 'expiring':
        return (
          <svg className="absolute bottom-2 right-4 w-[60px] sm:w-[70px] h-[40px] sm:h-[50px] opacity-40 text-orange-400" viewBox="0 0 100 100">
             <path d="M10,80 Q30,50 50,80 T90,80 L90,100 L10,100 Z" fill="currentColor" />
             <circle cx="70" cy="55" r="10" fill="currentColor" opacity="0.8" />
          </svg>
        );
      case 'expired':
        return (
          <div className="absolute bottom-3 right-5 flex items-end gap-1 opacity-80">
            <div className="w-2 sm:w-3 bg-red-200 h-8 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-red-300 h-6 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-red-400 h-4 rounded-t-[2px]" />
            <div className="w-2 sm:w-3 bg-red-500 h-2 rounded-t-[2px]" />
          </div>
        );
      default: return null;
    }
  };

  return (
    <Wrapper 
      onClick={onClick}
      className={`bg-white p-4 sm:p-5 rounded-[28px] border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between text-left relative overflow-hidden h-[140px] sm:h-[150px] w-full ${isClickable ? 'hover:shadow-md hover:border-gray-200 cursor-pointer active:scale-[0.98] transition-all group' : ''}`}
    >
      <div className="flex justify-between items-start z-10 relative">
        <h3 className="font-bold text-gray-900 text-[13px] sm:text-[15px] tracking-tight">{title}</h3>
        {isClickable && <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#d97757] transition-colors" />}
      </div>
      
      <div className="z-10 relative mt-2">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{subtitle}</p>
        <h3 className={`text-[28px] sm:text-[32px] font-medium tracking-tight ${isError ? 'text-red-500' : type === 'value' ? 'text-green-600' : 'text-[#d97757]'}`}>{value}</h3>
      </div>
      
      {renderGraphic()}
    </Wrapper>
  );
}

// --- MAIN DASHBOARD COMPONENT ---
export function DashboardHome({ setActiveView }) {
  const { pantryId } = usePantry();
  
  // State
  const [stats, setStats] = useState({ 
    inventoryCount: 0, 
    totalPeopleServed: 0, 
    totalValue: 0, 
    totalItemsDistributed: 0,
    chartDataAllTime: []
  });
  const [notifications, setNotifications] = useState({ alerts: [], expiringItems: [] });
  const [loading, setLoading] = useState(true);
  
  // Filter Actions: Keep specific ones, exclude View Clients and Settings
  const filteredActions = dashboardActions.filter(item => 
    !['View Clients', 'Settings'].includes(item.title)
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

  // Expiration Calculations
  const actuallyExpiredCount = notifications.expiredCount || 0;
  const soonExpiringValue = (notifications.expiringCount || 0).toString();

  // Date Helpers
  const currentDateShort = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const currentDateLong = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <WelcomeModal />
      
      {/* ========================================================= */}
      {/* MOBILE LAYOUT */}
      {/* ========================================================= */}
      <div className="md:hidden flex flex-col space-y-6">
        
        {/* Mobile Header */}
        <div className="flex items-end justify-between px-1 border-b border-gray-100 pb-2">
          <h1 className="text-[26px] font-semibold text-gray-900 tracking-tight leading-none">Dashboard</h1>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{currentDateShort}</span>
        </div>

        {/* Mobile Current Stock Card */}
        <div 
          onClick={() => setActiveView('View Inventory')} 
          className="bg-[#d97757] rounded-[32px] p-6 text-white cursor-pointer relative overflow-hidden shadow-[0_4px_15px_-3px_rgba(217,119,87,0.3)] active:scale-[0.98] transition-transform"
        >
          {/* Background SVG Graphics */}
          <svg className="absolute bottom-0 right-0 w-48 h-48 text-white opacity-10 transform translate-x-12 translate-y-12" fill="currentColor" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="absolute top-0 right-0 w-24 h-24 text-white opacity-10 transform translate-x-8 -translate-y-8" fill="currentColor" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="50" />
          </svg>

          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-inner">
              <Package className="h-4 w-4 text-white" />
            </div>
            <ChevronRight className="h-5 w-5 opacity-80" />
          </div>

          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-90">Current Stock</p>
            <h3 className="text-[52px] leading-none font-medium tracking-tight mb-1">{stats.inventoryCount.toLocaleString()}</h3>
            <p className="text-xs font-medium opacity-90 mt-2">Unique items available</p>
          </div>
        </div>

        {/* Mobile Quick Actions */}
        <div className="px-1 pt-2">
          <h3 className="text-[14px] font-medium text-gray-700 mb-4">Quick Actions</h3>
          <div className="bg-white rounded-[32px] p-5 flex justify-between items-center shadow-sm border border-gray-100">
            {filteredActions.map((action) => (
              <ActionButtonMobile key={action.title} item={action} onClick={() => setActiveView(action.view)} />
            ))}
          </div>
        </div>

        {/* Mobile Metrics */}
        <div className="px-1 pt-2">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <GraphicalMetricCard 
              title="Est. Value" 
              value={`$${Math.round(stats.totalValue).toLocaleString()}`} 
              subtitle="AID PROVIDED" 
              type="value"
            />
            <GraphicalMetricCard 
              title="Items Out" 
              value={stats.totalItemsDistributed?.toLocaleString() || "0"} 
              subtitle="TOTAL DISTRIBUTED" 
              type="items"
            />
            <GraphicalMetricCard 
              title="Expiring Soon" 
              value={soonExpiringValue} 
              subtitle="NEXT 7 DAYS" 
              type="expiring"
              onClick={() => setActiveView('View Inventory')} 
            />
            <GraphicalMetricCard 
              title="Expired Stock" 
              value={actuallyExpiredCount.toString()} 
              subtitle="PAST EXPIRATION" 
              type="expired"
              isError={actuallyExpiredCount > 0} 
              onClick={() => setActiveView('View Inventory')} 
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP LAYOUT (Minimalist & Graphical) */}
      {/* ========================================================= */}
      <div className="hidden md:flex flex-col space-y-6">
        
        {/* Desktop Header - Scaled down & minimal */}
        <div className="flex items-end justify-between px-1 border-b border-gray-100 pb-4 mb-2">
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-none">Dashboard</h1>
          <span className="text-sm font-semibold text-gray-500">{currentDateLong}</span>
        </div>

        {/* Hero Row: Graph & Current Stock */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Chart Panel */}
          <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[260px]">
             <div className="mb-4">
               <h3 className="font-bold text-gray-900 text-lg">Distributions Over Time</h3>
             </div>
             
             {/* Recharts Area Chart - ALL TIME ONLY */}
             <div className="h-48 w-full">
               {stats.chartDataAllTime && stats.chartDataAllTime.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={stats.chartDataAllTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#d97757" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#d97757" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <XAxis 
                       dataKey="label" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 11, fill: '#9CA3AF' }} 
                       dy={10}
                     />
                     <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 11, fill: '#9CA3AF' }}
                     />
                     <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                       itemStyle={{ color: '#d97757', fontWeight: 'bold' }}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="items" 
                       stroke="#d97757" 
                       strokeWidth={3}
                       fillOpacity={1} 
                       fill="url(#colorItems)" 
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                   {loading ? "Loading data..." : "No distribution data available yet."}
                 </div>
               )}
             </div>
          </div>

          {/* Current Stock Prominent Card */}
          <div 
            onClick={() => setActiveView('View Inventory')} 
            className="col-span-12 lg:col-span-4 bg-[#d97757] rounded-[32px] p-6 text-white cursor-pointer relative overflow-hidden shadow-[0_4px_15px_-3px_rgba(217,119,87,0.3)] hover:shadow-[0_8px_25px_-5px_rgba(217,119,87,0.4)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between min-h-[260px]"
          >
            {/* Abstract Background SVG Graphics */}
            <svg className="absolute bottom-0 right-0 w-56 h-56 text-white opacity-10 transform translate-x-16 translate-y-16" fill="currentColor" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="50" />
            </svg>
            <svg className="absolute top-0 right-0 w-32 h-32 text-white opacity-10 transform translate-x-12 -translate-y-12" fill="currentColor" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="50" />
            </svg>

            <div className="relative z-10 flex justify-between items-start mb-6">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shadow-inner">
                <Package className="h-5 w-5 text-white" />
              </div>
              <ChevronRight className="h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            
            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1 opacity-90">Current Stock</p>
              <h3 className="text-5xl font-medium tracking-tight mb-1">{stats.inventoryCount.toLocaleString()}</h3>
              <p className="text-xs font-medium opacity-90 mt-1">Unique items available</p>
            </div>
          </div>
        </div>

        {/* Desktop Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          <GraphicalMetricCard 
            title="Est. Value" 
            value={`$${Math.round(stats.totalValue).toLocaleString()}`} 
            subtitle="AID PROVIDED" 
            type="value"
          />
          <GraphicalMetricCard 
            title="Items Out" 
            value={stats.totalItemsDistributed?.toLocaleString() || "0"} 
            subtitle="TOTAL DISTRIBUTED" 
            type="items"
          />
          <GraphicalMetricCard 
            title="Expiring Soon" 
            value={soonExpiringValue} 
            subtitle="NEXT 7 DAYS" 
            type="expiring"
            onClick={() => setActiveView('View Inventory')} 
          />
          <GraphicalMetricCard 
            title="Expired Stock" 
            value={actuallyExpiredCount.toString()} 
            subtitle="PAST EXPIRATION" 
            type="expired"
            isError={actuallyExpiredCount > 0} 
            onClick={() => setActiveView('View Inventory')} 
          />
        </div>
      </div>
    </div>
  );
}