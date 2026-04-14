'use client';

export type NavItem = 'calendar' | 'laundry' | 'bathroom' | 'recruit' | 'settings';

interface BottomNavProps {
  active: NavItem;
  onSelect: (item: NavItem) => void;
  notificationGranted: boolean;
}

export function BottomNav({ active, onSelect, notificationGranted }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 z-50">
      <div className="flex max-w-180 mx-auto">
        <NavButton label="Calendar" active={active === 'calendar'} onClick={() => onSelect('calendar')}>
          <CalendarIcon />
        </NavButton>
        <NavButton label="Laundry" active={active === 'laundry'} onClick={() => onSelect('laundry')}>
          <LaundryIcon />
        </NavButton>
        <NavButton label="Bathroom" active={active === 'bathroom'} onClick={() => onSelect('bathroom')}>
          <BathroomIcon />
        </NavButton>
        <NavButton label="ゆる募" active={active === 'recruit'} onClick={() => onSelect('recruit')}>
          <RecruitIcon />
        </NavButton>
        <NavButton label="Settings" active={active === 'settings'} onClick={() => onSelect('settings')}>
          <SettingsIcon hasIndicator={notificationGranted} />
        </NavButton>
      </div>
    </nav>
  );
}

function NavButton({ children, label, active, onClick }: {
  children: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-2.5 border-none cursor-pointer bg-transparent transition-colors duration-150
        ${active ? 'text-(--color-primary)' : 'text-gray-300 hover:text-gray-500'}`}
    >
      <span className="w-6 h-6">{children}</span>
      <span className="text-[10px] font-medium mt-0.5">{label}</span>
    </button>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function LaundryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <path d="M12 8a5 5 0 0 1 3.54 1.46" />
      <circle cx="7" cy="5" r="0.5" fill="currentColor" />
      <circle cx="10" cy="5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function BathroomIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z" />
      <path d="M6 12V5a2 2 0 0 1 2-2h3v2.25" />
      <path d="M4 20v1" /><path d="M20 20v1" />
    </svg>
  );
}

function RecruitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-9l-4 3v-3H5a2 2 0 0 1-2-2z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </svg>
  );
}

function SettingsIcon({ hasIndicator }: { hasIndicator: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      {hasIndicator && <circle cx="20" cy="4" r="3" fill="currentColor" stroke="none" />}
    </svg>
  );
}
