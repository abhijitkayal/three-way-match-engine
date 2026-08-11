'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/sku-master', icon: Package, label: 'SKU Master' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  return (
    <aside
      className={`h-screen bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`}
    >
      <div className={`h-16 flex items-center border-b border-border px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-semibold text-lg">Finifi</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center rounded-lg transition-all duration-200 ${
                collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 h-10 w-full'
              } ${
                isActive
                  ? 'bg-primary-50 dark:bg-white text-primary-600 dark:text-black'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`group relative flex items-center rounded-lg text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-colors ${
            collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 h-10 w-full'
          }`}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
