'use client';

export type NavItem = 'home' | 'laundry' | 'bathroom' | 'notifications';

interface BottomNavProps {
  active: NavItem;
  onSelect: (item: NavItem) => void;
  notificationGranted: boolean;
}

export function BottomNav({ active, onSelect, notificationGranted }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 z-50">
      <div className="flex max-w-180 mx-auto">
        <NavButton label="Home" active={active === 'home'} onClick={() => onSelect('home')}>
          <HomeIcon />
        </NavButton>
        <NavButton label="Laundry" active={active === 'laundry'} onClick={() => onSelect('laundry')}>
          <LaundryIcon />
        </NavButton>
        <NavButton label="Bathroom" active={active === 'bathroom'} onClick={() => onSelect('bathroom')}>
          <BathroomIcon />
        </NavButton>
        <NavButton label="Notifications" active={active === 'notifications'} onClick={() => onSelect('notifications')}>
          <BellIcon hasIndicator={notificationGranted} />
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

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-8 9 8" /><path d="M5 10v9a1 1 0 001 1h3v-5h6v5h3a1 1 0 001-1v-9" />
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

function BellIcon({ hasIndicator }: { hasIndicator: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
      {hasIndicator && <circle cx="18" cy="4" r="3" fill="currentColor" stroke="none" />}
    </svg>
  );
}
