'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { AlertList } from '@/components/ui/alert';
import { Spinner, PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import {
  Bell, Mail, MailOpen, AlertTriangle, Info, CheckCircle2,
  Calendar, ExternalLink, Filter,
} from 'lucide-react';

interface Notification {
  id: string; user_id: string; title: string; message: string;
  type: string; link: string | null; read: boolean; created_at: string;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  info: { bg: 'bg-blue-100', text: 'text-blue-600', icon: <Info className="h-4 w-4" /> },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: <AlertTriangle className="h-4 w-4" /> },
  success: { bg: 'bg-green-100', text: 'text-green-600', icon: <CheckCircle2 className="h-4 w-4" /> },
  error: { bg: 'bg-red-100', text: 'text-red-600', icon: <AlertTriangle className="h-4 w-4" /> },
  default: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Info className="h-4 w-4" /> },
};

export default function NotificationsPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const addAlert = useCallback((v: 'info' | 'success' | 'warning' | 'error', m: string) => {
    setAlerts((p) => [...p, { id: `${Date.now()}-${Math.random()}`, variant: v, message: m }]);
  }, []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: fac } = await supabase
          .from('faculty')
          .select('id')
          .eq('email', user.email!)
          .maybeSingle();
        if (!fac) { setLoading(false); return; }

        const { data: sections } = await supabase
          .from('sections')
          .select('id')
          .eq('faculty_id', fac.id);

        if (!sections || sections.length === 0) { setLoading(false); return; }

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id')
          .in('section_id', sections.map((s) => s.id));

        if (!enrollments || enrollments.length === 0) { setLoading(false); return; }

        const studentIds = [...new Set(enrollments.map((e) => e.student_id))];

        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .in('user_id', studentIds)
          .order('created_at', { ascending: false })
          .limit(100);

        setNotifications(notifs ?? []);
      } catch {
        addAlert('error', 'Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = typeFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === typeFilter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification(s) across your students`}
        gradient="from-teal-600 to-emerald-500"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </PageHeader>

      <AlertList alerts={alerts} />

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 shadow-sm"
        >
          <Bell className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">No notifications found</p>
          <p className="mt-1 text-xs font-medium text-gray-400">
            {notifications.length === 0
              ? 'Your students have no notifications yet.'
              : 'No notifications match the selected filter.'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col gap-2"
        >
          {filtered.map((n, i) => {
            const style = (TYPE_STYLES[n.type] ?? TYPE_STYLES.default)!;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.03, duration: 0.3 }}
              >
                <Card>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.text}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className={`text-sm font-semibold ${n.read ? 'text-gray-500' : 'text-gray-900'}`}>
                          {n.title}
                        </h3>
                        <Badge variant={n.type as 'info' | 'success' | 'warning' | 'error' || 'default'} className="text-[10px] font-semibold">
                          {n.type}
                        </Badge>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-brand-500" title="Unread" />
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600">{n.message}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs font-medium text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                        {n.link && (
                          <a
                            href={n.link}
                            className="flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
