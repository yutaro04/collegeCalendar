'use client';

export type TabType = 'all' | 'thisWeek' | 'myEvents';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { key: TabType; label: string }[] = [
  { key: 'all', label: 'ALL EVENTS' },
  { key: 'thisWeek', label: 'THIS WEEK' },
  { key: 'myEvents', label: 'MY EVENTS' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex bg-[var(--color-surface-container)] rounded-xl p-1 mb-4">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 py-2.5 text-[11px] font-semibold tracking-wide rounded-lg border-none cursor-pointer transition-all duration-200
            ${activeTab === tab.key
              ? 'bg-white text-[var(--color-primary)] shadow-sm'
              : 'bg-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
