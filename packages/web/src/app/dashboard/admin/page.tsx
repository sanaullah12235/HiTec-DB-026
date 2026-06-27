import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { GraduationCap, Users, BookOpen, Building2, LayoutGrid, ScrollText } from 'lucide-react';
import { AdminCharts } from './admin-charts';

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient();

  const [studentsRes, facultyRes, staffRes, coursesRes, sectionsRes, auditRes] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('faculty').select('id', { count: 'exact', head: true }),
    supabase.from('staff').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('sections').select('id', { count: 'exact', head: true }),
    supabase.from('audit_log').select('*').order('changed_at', { ascending: false }).limit(10),
  ]);

  const studentCount = studentsRes.count ?? 0;
  const facultyCount = facultyRes.count ?? 0;
  const staffCount = staffRes.count ?? 0;
  const courseCount = coursesRes.count ?? 0;
  const sectionCount = sectionsRes.count ?? 0;
  const auditLogs = auditRes.data ?? [];

  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('id, sections(course_id, courses(name))');

  const courseEnrollmentMap = new Map<string, number>();
  for (const e of enrollmentData ?? []) {
    const s = e.sections as unknown as Record<string, unknown> | null;
    const c = s?.courses as unknown as Record<string, unknown> | null;
    const name = c?.name as string ?? 'Unknown';
    courseEnrollmentMap.set(name, (courseEnrollmentMap.get(name) ?? 0) + 1);
  }
  const enrollmentDistribution = Array.from(courseEnrollmentMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gray-900">
          <span className="text-gradient from-blue-600 to-blue-400">Admin Dashboard</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">System overview & key metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Students', value: studentCount, icon: GraduationCap, color: '#6366f1', cls: 'animate-fade-up animate-delay-100' },
          { label: 'Faculty Members', value: facultyCount, icon: Users, color: '#06b6d4', cls: 'animate-fade-up animate-delay-200' },
          { label: 'Staff Members', value: staffCount, icon: Building2, color: '#f59e0b', cls: 'animate-fade-up animate-delay-300' },
          { label: 'Active Courses', value: courseCount, icon: BookOpen, color: '#10b981', cls: 'animate-fade-up animate-delay-400' },
          { label: 'Sections', value: sectionCount, icon: LayoutGrid, color: '#ec4899', cls: 'animate-fade-up animate-delay-500' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all p-4 sm:p-5 ${stat.cls}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
              <div className="rounded-xl p-3 shadow-sm" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 animate-fade-up animate-delay-200">
          <AdminCharts data={enrollmentDistribution} />
        </div>

        <div className="lg:col-span-2 animate-fade-up animate-delay-300">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm h-full p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">System Audit & Logs</h3>
            </div>
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {auditLogs.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">No logs yet.</p>
              )}
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-gray-50">
                  <Badge variant={log.operation === 'INSERT' ? 'success' : log.operation === 'DELETE' ? 'error' : 'info'}>
                    {log.operation}
                  </Badge>
                  <span className="flex-1 truncate text-gray-700">{log.table_name}</span>
                  <span className="shrink-0 text-gray-400">{new Date(log.changed_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
