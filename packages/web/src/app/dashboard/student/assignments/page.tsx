'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { AnimatedCard } from '@/components/ui/animated-card';
import { DataTable } from '@/components/ui/data-table';
import { FileText, Download, Upload, Award, CheckCircle2, Clock, AlertTriangle, Eye } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  file_url: string | null;
  due_date: string;
  max_marks: number;
  published: boolean;
  section: {
    section_name: string;
    courses: { name: string; code: string };
  };
}

interface Submission {
  id: string;
  assignment_id: string;
  file_url: string | null;
  marks: number | null;
  feedback: string | null;
  submitted_at: string;
  status: string;
}

export default function AssignmentsPage() {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<(Assignment & { submission?: Submission })[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: student } = await supabase
          .from('students').select('id').eq('email', user.email!).maybeSingle();
        if (!student) { setLoading(false); return; }

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('section_id')
          .eq('student_id', student.id);

        const sectionIds = (enrollments ?? []).map((e) => e.section_id);
        if (sectionIds.length === 0) { setLoading(false); return; }

        const { data: assignData } = await supabase
          .from('assignments')
          .select('*, section:sections!inner(section_name, courses!inner(name, code))')
          .in('section_id', sectionIds)
          .eq('published', true)
          .order('due_date', { ascending: false });

        const fetchedAssignments = (assignData ?? []) as unknown as Assignment[];

        // Fetch submissions for each assignment
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('student_id', student.id);

        const subMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s as Submission]));

        setAssignments(
          fetchedAssignments.map((a) => ({
            ...a,
            submission: subMap.get(a.id),
          }))
        );

        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(assignmentId: string) {
    if (!selectedFile) return;
    setSubmittingId(assignmentId);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not authenticated.'); return; }

      const { data: student } = await supabase
        .from('students').select('id').eq('email', user.email!).maybeSingle();
      if (!student) { setError('Student not found.'); return; }

      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${student.id}/${assignmentId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, selectedFile);

      if (uploadError) { setError(uploadError.message); return; }

      const { error: insertError } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: student.id,
          file_url: filePath,
          submitted_at: new Date().toISOString(),
          status: 'submitted',
        }, { onConflict: 'assignment_id,student_id' });

      if (insertError) { setError(insertError.message); return; }

      setSuccess('Assignment submitted successfully!');
      setSelectedFile(null);

      // Refresh
      const { data: updatedSub } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', student.id)
        .maybeSingle();

      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, submission: updatedSub as Submission ?? a.submission } : a))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmittingId(null);
    }
  }

  function getFileUrl(path: string | null) {
    if (!path) return '';
    const { data } = supabase.storage.from('assignment-submissions').getPublicUrl(path);
    return data.publicUrl;
  }

  function isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Assignments" subtitle="View and submit course assignments" />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" message={success} onClose={() => setSuccess(null)} />}

      <AnimatedCard delay={0}>
        <DataTable
          columns={[
            { key: 'title', header: 'Assignment', render: (r) => (
              <div>
                <p className="font-medium text-gray-900">{r.title as string}</p>
                {(r.description as string) && (
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{r.description as string}</p>
                )}
              </div>
            )},
            { key: 'course', header: 'Course', render: (r) => {
              const section = r.section as Record<string, unknown> | undefined;
              const course = section?.courses as Record<string, unknown> | undefined;
              return course ? `${course.name as string}` : '-';
            }},
            { key: 'max_marks', header: 'Max Marks', render: (r) => r.max_marks as number },
            { key: 'due_date', header: 'Due Date', render: (r) => {
              const due = r.due_date as string;
              const overdue = isOverdue(due);
              return (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className={overdue ? 'text-red-600' : 'text-gray-700'}>
                    {new Date(due).toLocaleDateString()}
                  </span>
                  {overdue && <Badge variant="error">Overdue</Badge>}
                </div>
              );
            }},
            { key: 'status', header: 'Status', render: (r) => {
              const sub = (r as unknown as Assignment & { submission?: Submission }).submission;
              if (sub?.status === 'graded') return <Badge variant="success">Graded</Badge>;
              if (sub?.status === 'submitted') return <Badge variant="info">Submitted</Badge>;
              return <Badge variant="warning">Pending</Badge>;
            }},
            { key: 'actions', header: 'Actions', render: (r) => {
              const row = r as unknown as Assignment & { submission?: Submission };
              const hasSubmission = !!row.submission;
              const overdue = isOverdue(row.due_date);

              return (
                <div className="flex items-center gap-2">
                  {row.file_url && (
                    <a href={getFileUrl(row.file_url)} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                        <Download className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                  {!hasSubmission && !overdue && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
                      {selectedFile && (
                          <Button
                            size="sm"
                            className="h-8 px-2 text-xs"
                            loading={submittingId === row.id}
                          onClick={() => handleSubmit(row.id)}
                        >
                          Submit
                        </Button>
                      )}
                    </>
                  )}
                  {hasSubmission && row.submission?.marks != null && (
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Eye className="h-3 w-3" /> {row.submission.marks}/{row.max_marks}
                    </Button>
                  )}
                </div>
              );
            }},
          ]}
          data={assignments as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => r.id as string}
          emptyMessage="No assignments available."
        />
      </AnimatedCard>

      {/* Submissions with Marks */}
      {assignments.some((a) => a.submission?.marks != null) && (
        <AnimatedCard delay={0.2}>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Graded Assignments</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignments
              .filter((a) => a.submission?.marks != null)
              .map((a) => (
                <div key={a.id} className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{a.title}</p>
                      <p className="text-xs font-medium text-gray-500">{a.section?.courses?.name}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                      <Award className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Marks</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-700">
                        {a.submission!.marks} / {a.max_marks}
                      </p>
                    </div>
                    <div className="h-10 w-px bg-emerald-200" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Percentage</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {Math.round(((a.submission!.marks ?? 0) / a.max_marks) * 100)}%
                      </p>
                    </div>
                  </div>
                  {a.submission!.feedback && (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-white/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Feedback</p>
                      <p className="mt-1 text-sm text-gray-700">{a.submission!.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </AnimatedCard>
      )}
    </div>
  );
}
