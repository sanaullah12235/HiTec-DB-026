'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Bell, ChevronRight, CheckCheck, MailOpen, Mail, AlertTriangle, Info, Calendar, Award, DollarSign, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  info: <Info className="h-5 w-5 text-blue-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  fee: <DollarSign className="h-5 w-5 text-green-500" />,
  result: <Award className="h-5 w-5 text-purple-500" />,
  attendance: <Calendar className="h-5 w-5 text-cyan-500" />,
  assignment: <BookOpen className="h-5 w-5 text-indigo-500" />,
};

const TYPE_COLORS: Record<string, string> = {
  info: 'border-l-blue-400',
  warning: 'border-l-amber-400',
  fee: 'border-l-green-400',
  result: 'border-l-purple-400',
  attendance: 'border-l-cyan-400',
  assignment: 'border-l-indigo-400',
};

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setNotifications((notifs ?? []) as Notification[]);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function markAsRead(id: string) {
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (updateError) { setError(updateError.message); return; }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', ids);

    if (updateError) { setError(updateError.message); return; }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      >
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </Button>
        )}
      </PageHeader>

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      {notifications.length === 0 ? (
        <AnimatedCard delay={0}>
          <div className="flex flex-col items-center py-12">
            <Bell className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm text-gray-400">No notifications yet.</p>
          </div>
        </AnimatedCard>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notif, i) => (
            <AnimatedCard
              key={notif.id}
              delay={i * 0.03}
              hover={false}
              className={`border-l-4 ${TYPE_COLORS[notif.type] ?? 'border-l-gray-300'} ${!notif.read ? 'bg-indigo-50/30' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {TYPE_ICONS[notif.type] ?? <Info className="h-5 w-5 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${notif.read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                        )}
                      </div>
                      {selectedNotif === notif.id && (
                        <p className="mt-1 text-sm text-gray-500">{notif.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                      <Badge variant={notif.read ? 'default' : 'info'}>
                        {notif.read ? <MailOpen className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                        {notif.read ? 'Read' : 'New'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedNotif(selectedNotif === notif.id ? null : notif.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {selectedNotif === notif.id ? 'Show less' : 'Show more'}
                    </button>
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                    {notif.link && (
                      <Link
                        href={notif.link}
                        className="flex items-center gap-0.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
