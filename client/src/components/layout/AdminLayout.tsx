import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  User,
  GraduationCap,
  LogOut,
  ChevronLeft,
  Menu,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Events', path: '/admin/events', icon: CalendarDays },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Registrations', path: '/admin/registrations', icon: ClipboardList },
  { label: 'Profile', path: '/admin/profile', icon: User },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ collapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex items-center gap-3 p-4 border-b border-sidebar-border', collapsed && 'justify-center')}>
        <div className="bg-sidebar-primary rounded-lg p-1.5 flex-shrink-0">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-sidebar-foreground text-sm leading-tight">
            EduActivity<br />
            <span className="text-sidebar-primary font-normal text-xs flex items-center gap-1">
              <Shield className="h-3 w-3" /> Admin Panel
            </span>
          </span>
        )}
        <button
          onClick={onToggle}
          className={cn('ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground', collapsed && 'ml-0')}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        {collapsed && currentUser && (
          <div className="flex items-center justify-center mb-2">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full object-cover border border-sidebar-border"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-white text-xs font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
        {!collapsed && currentUser && (
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full object-cover border border-sidebar-border flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sidebar-foreground text-xs font-medium truncate">{currentUser.name}</p>
              <p className="text-sidebar-foreground/50 text-xs truncate">Administrator</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminSidebar;
