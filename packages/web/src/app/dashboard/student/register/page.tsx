'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, GraduationCap, BookOpen } from 'lucide-react';

interface SectionOption {
  id: string;
  course_name: string;
  course_code: string;
  section_name: string;
  semester: string;
  total_seats: number;
  allocated_seats: number;
  available: boolean;
}

export default function CourseRegistrationPage() {
  const supabase = createClient();
  const [sectionId, setSectionId] = useState('');
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setFetching(true);
      const { data: sectRes } = await supabase
        .from('sections')
        .select('id, section_name, semester, total_seats, allocated_seats, courses!inner(id, name, code)');
      if (sectRes?.length) {
        setSections(
          sectRes.map((s: Record<string, unknown>) => {
            const course = s.courses as { name: string; code: string } | null;
            return {
              id: s.id as string,
              course_name: course?.name ?? '',
              course_code: course?.code ?? '',
              section_name: s.section_name as string,
              semester: s.semester as string,
              total_seats: s.total_seats as number,
              allocated_seats: s.allocated_seats as number,
              available: (s.allocated_seats as number) < (s.total_seats as number),
            };
          }),
        );
      }
      setFetching(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!sectionId) { setError('Please select a section.'); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not authenticated.'); return; }
      const { data: student } = await supabase
        .from('students').select('id').eq('email', user.email!).maybeSingle();
      if (!student) { setError('No student record found. Contact admin.'); return; }
      const { error: enrollError } = await supabase
        .from('enrollments').insert({ student_id: student.id, section_id: sectionId });
      if (enrollError) {
        if (enrollError.message?.includes('unique') || enrollError.message?.includes('duplicate')) {
          setError('You are already enrolled in this section.');
        } else { setError(enrollError.message); }
        return;
      }
      const sec = sections.find(s => s.id === sectionId);
      setSuccess(`Successfully enrolled in ${sec?.course_name ?? 'course'} (${sec?.section_name ?? ''}).`);
      setSectionId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally { setLoading(false); }
  }

  const selected = sections.find(s => s.id === sectionId);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">Course Registration</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Select a course section to enroll</p>
        </div>
      </div>
      {error && <div className="mb-4"><Alert variant="error" message={error} onClose={() => setError(null)} /></div>}
      {success && <div className="mb-4"><Alert variant="success" message={success} onClose={() => setSuccess(null)} /></div>}
      <Card>
        {fetching ? (
          <div className="flex flex-col items-center py-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <BookOpen className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-gray-400">Loading available sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
              <BookOpen className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No sections available for registration.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Select
              label="Select Course Section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              required
              options={sections.map((s) => ({
                value: s.id,
                label: `${s.course_name} (${s.course_code}) — Section ${s.section_name} (${s.semester}) [${s.allocated_seats}/${s.total_seats} seats]`,
              }))}
            />
            {selected && !selected.available && (
              <Alert variant="warning" message="This section is full. Please choose another." />
            )}
            <Button type="submit" loading={loading} className="mt-2">
              <CheckCircle2 className="h-4 w-4" />
              Enroll Now
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
