'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';

interface TimetableEntry {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  section: {
    section_name: string;
    courses: { name: string; code: string };
  };
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_COLORS: Record<string, string> = {
  Monday: 'border-l-indigo-400 bg-indigo-50',
  Tuesday: 'border-l-emerald-400 bg-emerald-50',
  Wednesday: 'border-l-amber-400 bg-amber-50',
  Thursday: 'border-l-rose-400 bg-rose-50',
  Friday: 'border-l-cyan-400 bg-cyan-50',
  Saturday: 'border-l-purple-400 bg-purple-50',
  Sunday: 'border-l-gray-400 bg-gray-50',
};

export default function TimetablePage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email!)
          .maybeSingle();

        if (!student) { setLoading(false); return; }

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('section_id')
          .eq('student_id', student.id);

        const sectionIds = (enrollments ?? []).map((e) => e.section_id);
        if (sectionIds.length === 0) { setLoading(false); return; }

        const { data: tt } = await supabase
          .from('timetable')
          .select('*, section:sections!inner(section_name, courses!inner(name, code))')
          .in('section_id', sectionIds)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });

        setEntries((tt ?? []) as unknown as TimetableEntry[]);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageSpinner />;

  const groupedByDay = DAY_NAMES.map((day, idx) => ({
    day,
    dayNum: idx + 1,
    entries: entries.filter((e) => e.day_of_week === idx + 1),
  }));

  function formatTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h ?? '', 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Weekly Timetable" subtitle="Your class schedule" />

      {entries.length === 0 ? (
        <AnimatedCard delay={0}>
          <div className="flex flex-col items-center py-12">
            <Calendar className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm text-gray-400">No timetable entries found for your enrolled courses.</p>
          </div>
        </AnimatedCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {groupedByDay.map(({ day, dayNum, entries: dayEntries }, i) => (
            <AnimatedCard key={day} delay={i * 0.05} className={`border-l-4 ${DAY_COLORS[day] ?? 'border-l-gray-300'}`}>
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">{day}</h3>
                <Badge variant="info" className="ml-auto">{dayEntries.length} class{dayEntries.length !== 1 ? 'es' : ''}</Badge>
              </div>
              {dayEntries.length === 0 ? (
                <div className="flex flex-col items-center py-6">
                  <Calendar className="h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm font-medium text-gray-400">No classes</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{entry.section?.courses?.name}</p>
                          <p className="text-xs text-gray-500">{entry.section?.courses?.code} - {entry.section?.section_name}</p>
                        </div>
                        <Badge variant="info">{entry.section?.section_name}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {entry.room || 'TBA'}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {entry.section?.courses?.code}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
