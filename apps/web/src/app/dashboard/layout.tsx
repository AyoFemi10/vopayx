'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, LayoutDashboard, ArrowLeftRight, CreditCard, Settings, LogOut, Menu, X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return null; // Let AuthContext handle redirect

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Wallets', href: '/dashboard/wallets', icon: Wallet },
    { name: 'Transfers', href: '/dashboard/transfers', icon: ArrowLeftRight },
    { name: 'Cards', href: '/dashboard/cards', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* ─── SIDEBAR ───────────────────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-bg-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-20 flex items-center px-6 border-b border-bg-border shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black font-display tracking-tight text-white">VOPayX</span>
          </Link>
          <button className="ml-auto lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group",
                  isActive 
                    ? "bg-accent/10 text-accent" 
                    : "text-text-secondary hover:text-white hover:bg-bg-hover"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-accent" : "text-text-muted group-hover:text-white")} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-bg-border shrink-0">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-text-secondary hover:text-error hover:bg-error-bg transition-colors group"
          >
            <LogOut className="w-5 h-5 text-text-muted group-hover:text-error" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── MAIN CONTENT ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-bg-primary border-b border-bg-border flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6 text-text-secondary hover:text-white" />
            </button>
            <h1 className="text-xl font-display font-semibold hidden sm:block">
              {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {!user.isVerified && (
              <Link href="/auth/verify" className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-bg text-error text-xs font-semibold">
                Verify Email
              </Link>
            )}
            
            <button className="w-10 h-10 rounded-full bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white hover:border-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-error border-2 border-bg-secondary"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-bg-border">
              <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center font-bold text-white shadow-glow">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white leading-none mb-1">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-text-muted leading-none">{user.email}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto no-scrollbar">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
