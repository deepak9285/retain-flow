import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
  LogOut,
  Flower2,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/customers', label: 'Customers',  icon: Users },
  { to: '/campaigns', label: 'Campaigns',  icon: Megaphone },
  { to: '/settings',  label: 'Settings',   icon: Settings },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { signOut, isDemoMode } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-56 bg-gray-50 border-r border-gray-200 z-30 flex flex-col
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-md flex items-center justify-center">
              <Flower2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">RetainFlow</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden btn-ghost p-1"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo badge */}
        {isDemoMode && (
          <div className="mx-3 mt-3 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 font-medium text-center">
            Demo Mode
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scroll">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Salon name & logout */}
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="px-3 mb-3">
            <p className="text-xs font-semibold text-gray-900 truncate">Bloom Salon</p>
            <p className="text-xs text-gray-500 truncate">Pune, Maharashtra</p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
