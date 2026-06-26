'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, FileEdit, BookOpen, ClipboardCheck, Download,
  Users, BookMarked, ShieldCheck, ScrollText, RotateCcw,
  GraduationCap, LogOut, Menu, X, User, ClipboardList, Award,
  CalendarDays, DollarSign, Bell, Settings, Building2, LayoutList,
  BarChart3, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

type Role = 'student' | 'faculty' | 'finance' | 'admin' | 'librarian';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-5 w-5" />,
  register: <FileEdit className="h-5 w-5" />,
  library: <BookOpen className="h-5 w-5" />,
  attendance: <ClipboardCheck className="h-5 w-5" />,
  grades: <Download className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  courses: <BookMarked className="h-5 w-5" />,
  approvals: <ShieldCheck className="h-5 w-5" />,
  audit: <ScrollText className="h-5 w-5" />,
  circulation: <RotateCcw className="h-5 w-5" />,
  user: <User className="h-5 w-5" />,
  assignments: <ClipboardList className="h-5 w-5" />,
  results: <Award className="h-5 w-5" />,
  timetable: <CalendarDays className="h-5 w-5" />,
  fees: <DollarSign className="h-5 w-5" />,
  notifications: <Bell className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  departments: <Building2 className="h-5 w-5" />,
  programs: <LayoutList className="h-5 w-5" />,
  reports: <BarChart3 className="h-5 w-5" />,
  students: <Users className="h-5 w-5" />,
  faculty: <GraduationCap className="h-5 w-5" />,
  fines: <DollarSign className="h-5 w-5" />,
};

const ROLE_NAV: Record<Role, NavItem[]> = {
  student: [
    { label: 'Dashboard', href: '/dashboard/student', icon: iconMap.dashboard },
    { label: 'Profile', href: '/dashboard/student/profile', icon: iconMap.user },
    { label: 'Courses', href: '/dashboard/student', icon: iconMap.courses },
    { label: 'Attendance', href: '/dashboard/student/attendance', icon: iconMap.attendance },
    { label: 'Assignments', href: '/dashboard/student/assignments', icon: iconMap.assignments },
    { label: 'Results', href: '/dashboard/student/results', icon: iconMap.results },
    { label: 'Timetable', href: '/dashboard/student/timetable', icon: iconMap.timetable },
    { label: 'Fees', href: '/dashboard/student/fees', icon: iconMap.fees },
    { label: 'Library', href: '/dashboard/library', icon: iconMap.library },
    { label: 'Notifications', href: '/dashboard/student/notifications', icon: iconMap.notifications },
    { label: 'Settings', href: '/dashboard/student/settings', icon: iconMap.settings },
  ],
  faculty: [
    { label: 'Dashboard', href: '/dashboard/faculty', icon: iconMap.dashboard },
    { label: 'Attendance', href: '/dashboard/faculty/attendance', icon: iconMap.attendance },
    { label: 'Assignments', href: '/dashboard/faculty/assignments', icon: iconMap.assignments },
    { label: 'Results', href: '/dashboard/faculty/results', icon: iconMap.results },
    { label: 'Grades', href: '/dashboard/faculty/grades', icon: iconMap.grades },
    { label: 'Timetable', href: '/dashboard/faculty/timetable', icon: iconMap.timetable },
    { label: 'Notifications', href: '/dashboard/faculty/notifications', icon: iconMap.notifications },
    { label: 'Library', href: '/dashboard/library', icon: iconMap.library },
  ],
  finance: [
    { label: 'Dashboard', href: '/dashboard/finance', icon: iconMap.dashboard },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: iconMap.dashboard },
    { label: 'Students', href: '/dashboard/admin/students', icon: iconMap.students },
    { label: 'Faculty', href: '/dashboard/admin/faculty', icon: iconMap.faculty },
    { label: 'Courses', href: '/dashboard/admin/courses', icon: iconMap.courses },
    { label: 'Departments', href: '/dashboard/admin/departments', icon: iconMap.departments },
    { label: 'Programs', href: '/dashboard/admin/programs', icon: iconMap.programs },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: iconMap.reports },
    { label: 'Admissions', href: '/dashboard/admin/admissions', icon: iconMap.user },
    { label: 'Approvals', href: '/dashboard/admin/approvals', icon: iconMap.approvals },
    { label: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: iconMap.audit },
  ],
  librarian: [
    { label: 'Dashboard', href: '/dashboard/librarian', icon: iconMap.dashboard },
    { label: 'Inventory', href: '/dashboard/librarian/inventory', icon: iconMap.library },
    { label: 'Circulation', href: '/dashboard/librarian/circulation', icon: iconMap.circulation },
    { label: 'Fines', href: '/dashboard/fines', icon: iconMap.fines },
  ],
};

const roleConfig: Record<Role, { gradient: string; activeBg: string; activeText: string; border: string; label: string }> = {
  student: {
    gradient: 'from-indigo-600 to-indigo-500',
    activeBg: 'bg-indigo-500/10',
    activeText: 'text-indigo-400',
    border: 'border-l-2 border-indigo-400',
    label: 'Student',
  },
  faculty: {
    gradient: 'from-teal-600 to-teal-500',
    activeBg: 'bg-teal-500/10',
    activeText: 'text-teal-400',
    border: 'border-l-2 border-teal-400',
    label: 'Faculty',
  },
  finance: {
    gradient: 'from-purple-600 to-purple-500',
    activeBg: 'bg-purple-500/10',
    activeText: 'text-purple-400',
    border: 'border-l-2 border-purple-400',
    label: 'Finance',
  },
  admin: {
    gradient: 'from-blue-600 to-blue-500',
    activeBg: 'bg-blue-500/10',
    activeText: 'text-blue-400',
    border: 'border-l-2 border-blue-400',
    label: 'Admin',
  },
  librarian: {
    gradient: 'from-amber-600 to-amber-500',
    activeBg: 'bg-amber-500/10',
    activeText: 'text-amber-400',
    border: 'border-l-2 border-amber-400',
    label: 'Librarian',
  },
};

function getInitials(name: string): string {
  return name
    .split(/[@.\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

export function NavSidebar({ role, userName }: { role: Role; userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const items = ROLE_NAV[role] ?? [];
  const config = roleConfig[role];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const sidebarWidth = collapsed ? 'w-20' : 'w-64';

  return (
    <>
      <button
        className="fixed left-4 top-3 z-50 rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-2.5 shadow-lg backdrop-blur-md lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="h-5 w-5 text-[var(--sidebar-text)]" /> : <Menu className="h-5 w-5 text-[var(--sidebar-text)]" />}
      </button>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-[var(--sidebar-mobile-overlay)] backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]/95 backdrop-blur-xl transition-all duration-300 lg:static lg:translate-x-0 ${
          sidebarWidth
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with collapse button */}
        <div className={`flex items-center bg-gradient-to-r ${config.gradient} px-4 py-5 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sidebar-icon-bg)] shadow-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-base font-bold text-white tracking-tight">HiSUP</p>
              <p className="text-xs capitalize text-white/70 font-medium">{config.label} Portal</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden shrink-0 rounded-lg border border-[var(--sidebar-collapse-btn-border)] bg-[var(--sidebar-collapse-btn-bg)] p-1.5 text-[var(--sidebar-collapse-btn-text)] transition-all duration-200 hover:bg-[var(--sidebar-collapse-btn-hover-bg)] hover:text-[var(--sidebar-collapse-btn-hover-text)] hover:scale-105 lg:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4">
          <nav className="flex flex-col gap-1">
            {items.map((item, i) => {
              const active = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={item.href}
                    className={`group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                      collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                    } ${
                      active
                        ? `${config.activeBg} ${config.activeText} shadow-sm`
                        : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-hover)]'
                    }`}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && !collapsed && (
                      <motion.span
                        layoutId="activeTab"
                        className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-current"
                      />
                    )}
                    {active && collapsed && (
                      <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-[var(--sidebar-active-ring)]" />
                    )}
                    <span className={`${active ? '' : 'opacity-70 group-hover:opacity-100'} transition-opacity`}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </div>

        {/* User menu */}
        <div className={`border-t border-[var(--sidebar-border)] px-3 py-3 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${config.gradient} text-xs font-bold text-white shadow-lg`}>
                {getInitials(userName)}
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-lg p-2 text-[var(--sidebar-signout)] transition-all duration-200 hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-signout-hover)]"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${config.gradient} text-xs font-bold text-white shadow-lg`}>
                {getInitials(userName)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-[var(--sidebar-user-text)]">{userName}</p>
                <p className="truncate text-xs text-[var(--sidebar-user-role)] capitalize font-medium">{config.label} Portal</p>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-lg p-2 text-[var(--sidebar-signout)] transition-all duration-200 hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-signout-hover)]"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
