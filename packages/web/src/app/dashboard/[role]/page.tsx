import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { notFound, redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, Shield, UserCheck, Building2 } from 'lucide-react';
import Link from 'next/link';

const VALID_ROLES = ['student', 'faculty', 'finance', 'admin', 'librarian'] as const;
type Role = (typeof VALID_ROLES)[number];

const ROLE_CONFIG: Record<Role, { label: string; description: string; icon: React.ReactNode; gradient: string }> = {
  student: { label: 'Student Dashboard', description: 'View your courses, grades, and academic progress.', icon: <GraduationCap className="h-6 w-6" />, gradient: 'from-indigo-500 to-indigo-600' },
  faculty: { label: 'Faculty Dashboard', description: 'Manage courses, sections, and student grades.', icon: <UserCheck className="h-6 w-6" />, gradient: 'from-teal-500 to-teal-600' },
  finance: { label: 'Finance Dashboard', description: 'Manage fee records, invoices, and payment tracking.', icon: <Building2 className="h-6 w-6" />, gradient: 'from-purple-500 to-purple-600' },
  admin: { label: 'Admin Dashboard', description: 'System-wide management and configuration.', icon: <Shield className="h-6 w-6" />, gradient: 'from-blue-600 to-blue-700' },
  librarian: { label: 'Librarian Dashboard', description: 'Library inventory, circulation, and overdue tracking.', icon: <BookOpen className="h-6 w-6" />, gradient: 'from-amber-500 to-amber-600' },
};

const QUICK_LINKS: Record<string, { label: string; href: string }[]> = {
  student: [
    { label: 'My Dashboard', href: '/dashboard/student' },
    { label: 'Course Registration', href: '/dashboard/student/register' },
    { label: 'Library Catalog', href: '/dashboard/library' },
    { label: 'Fee Management', href: '/dashboard/student/fees' },
  ],
  faculty: [
    { label: 'My Dashboard', href: '/dashboard/faculty' },
    { label: 'Take Attendance', href: '/dashboard/faculty/attendance' },
    { label: 'Import Grades', href: '/dashboard/faculty/grades' },
  ],
  admin: [
    { label: 'Admin Dashboard', href: '/dashboard/admin' },
    { label: 'Manage Users', href: '/dashboard/admin/users' },
    { label: 'Manage Courses', href: '/dashboard/admin/courses' },
    { label: 'Approvals', href: '/dashboard/admin/approvals' },
  ],
  librarian: [
    { label: 'Library Dashboard', href: '/dashboard/librarian' },
    { label: 'Inventory', href: '/dashboard/librarian/inventory' },
    { label: 'Circulation', href: '/dashboard/librarian/circulation' },
  ],
  finance: [],
};

export default async function RoleDashboard({ params }: { params: { role: string } }) {
  const { role } = params;

  if (!VALID_ROLES.includes(role as Role)) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const userRole = user.app_metadata?.role as string | undefined;
  if (userRole !== role) redirect(`/dashboard/${userRole}`);

  const config = ROLE_CONFIG[role as Role];
  const links = QUICK_LINKS[role] ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-up">
        <div className={`mb-4 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r ${config.gradient} p-4 text-white shadow-lg`}>
          {config.icon}
          <div>
            <h1 className="text-xl font-bold">{config.label}</h1>
            <p className="text-sm text-white/80">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Account info cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="animate-fade-up animate-delay-100 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account</p>
          <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          <Badge variant="info" className="mt-2">{role}</Badge>
        </div>
        <div className="animate-fade-up animate-delay-200 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">User ID</p>
          <p className="mt-1 truncate text-sm font-mono text-gray-900">{user.id}</p>
        </div>
        <div className="animate-fade-up animate-delay-300 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last Sign In</p>
          <p className="mt-1 text-sm text-gray-900">
            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="animate-fade-up animate-delay-400">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            {links.length === 0 && (
              <p className="text-sm text-gray-400">Features coming soon.</p>
            )}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-200 hover:text-gray-900 hover:shadow-md"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
