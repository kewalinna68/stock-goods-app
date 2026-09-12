import React from 'react';
import { 
  LayoutDashboard, 
  ArrowUpFromLine, 
  Package, 
  AlertTriangle, 
  Settings2,
  CalendarClock,
  BarChart3
} from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  restockCount: number;
  fifoCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  restockCount,
  fifoCount = 0,
}) => {
  const navItems: { 
    id: ActiveTab; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    badgeCount?: number;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'stock-out', label: 'ขาย/ออก', icon: ArrowUpFromLine },
    { 
      id: 'fifo', 
      label: 'FIFO หมดอายุ', 
      icon: CalendarClock,
      badgeCount: fifoCount,
      badgeColor: 'bg-amber-500'
    },
    { id: 'analytics', label: 'วิเคราะห์กำไร', icon: BarChart3 },
    { 
      id: 'restock', 
      label: 'ต้องเติม', 
      icon: AlertTriangle,
      badgeCount: restockCount,
      badgeColor: 'bg-rose-600'
    },
    { id: 'products', label: 'สินค้า', icon: Package },
    { id: 'manage', label: 'จัดการ', icon: Settings2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe">
      <div className="max-w-xl mx-auto flex items-center justify-around px-0.5 py-1.5 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasBadge = (item.badgeCount || 0) > 0;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all min-h-[48px] ${
                isActive
                  ? 'text-purple-700 font-bold scale-105'
                  : 'text-slate-500 hover:text-purple-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {hasBadge && (
                  <span className={`absolute -top-1.5 -right-2 ${item.badgeColor || 'bg-rose-600'} text-white text-[9px] font-bold px-1 py-0.2 rounded-full min-w-[16px] text-center shadow-xs animate-pulse leading-tight`}>
                    {item.badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] mt-0.5 tracking-tight leading-none whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5 shadow-2xs"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
