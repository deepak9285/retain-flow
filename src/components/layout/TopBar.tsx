import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/campaigns': 'Campaigns',
  '/settings':  'Settings',
};

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'RetainFlow';

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="btn-ghost lg:hidden p-1.5"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
    </header>
  );
}
