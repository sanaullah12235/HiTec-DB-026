import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { redirect } from 'next/navigation';
import { NavSidebar } from '@/components/nav-sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { Role } from '@hisup/config/database.types';
import { GraduationCap } from 'lucide-react';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const role = (user.app_metadata?.role ?? 'student') as Role;
  const displayName = user.user_metadata?.full_name ?? user.email ?? 'User';

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)]">
      <NavSidebar role={role} userName={displayName} />
      <div className="flex flex-1 flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-nav)] bg-[var(--nav-bg)] px-6 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/30 lg:hidden">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-heading)]">Dashboard</p>
              <p className="text-xs text-[var(--text-muted)] capitalize font-medium">{role} Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-[var(--text-muted)] font-medium sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <ThemeToggle />
            <button className="relative rounded-xl border border-[var(--border-card)] bg-[var(--card-bg-from)] p-2.5 text-[var(--text-muted)] shadow-sm transition-all duration-200 hover:bg-[var(--card-bg-to)] hover:text-[var(--text-heading)] hover:shadow-md">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[8px] font-bold text-white shadow-sm shadow-red-500/30">3</span>
            </button>
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
