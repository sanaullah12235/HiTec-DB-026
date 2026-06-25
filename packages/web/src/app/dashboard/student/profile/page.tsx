'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { AnimatedCard } from '@/components/ui/animated-card';
import { User, Mail, BookOpen, Calendar, Eye, EyeOff, CreditCard, Save } from 'lucide-react';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  cnic: string;
  gpa: number;
  enrollment_semester: string;
}

interface ProgramInfo {
  name: string;
}

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCnic, setShowCnic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: stu } = await supabase
          .from('students')
          .select('id, name, email, cnic, gpa, enrollment_semester, program_id')
          .eq('email', user.email!)
          .maybeSingle();

        if (!stu) { setLoading(false); return; }
        setProfile(stu as unknown as StudentProfile);
        setEditName(stu.name ?? '');

        if (stu.program_id) {
          const { data: prog } = await supabase
            .from('programs')
            .select('name')
            .eq('id', stu.program_id)
            .maybeSingle();
          if (prog) setProgram(prog as ProgramInfo);
        }

        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('students')
        .update({ name: editName })
        .eq('id', profile.id);

      if (updateError) { setError(updateError.message); return; }

      setProfile((prev) => prev ? { ...prev, name: editName } : prev);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (!profile) return <div className="flex flex-col items-center justify-center py-16"><p className="text-sm font-medium text-gray-400">Student profile not found.</p></div>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Profile" subtitle="View and edit your personal information" />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <AnimatedCard delay={0} className="lg:col-span-1">
          <div className="flex flex-col items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <span className="text-3xl font-bold text-white">
                {profile.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="mt-4 flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
              <BookOpen className="h-4 w-4" />
              {program?.name ?? 'Program'}
            </div>
          </div>
        </AnimatedCard>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Personal Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              <Input
                label="Email"
                value={profile.email}
                disabled
                hint="Email cannot be changed"
              />
              <div className="relative">
                <Input
                  label="CNIC"
                  value={showCnic ? profile.cnic : '•••••••••••••'}
                  disabled
                  hint={showCnic ? 'CNIC number' : 'Click eye to view'}
                />
                <button
                  type="button"
                  onClick={() => setShowCnic(!showCnic)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showCnic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Input
                label="GPA"
                value={profile.gpa?.toFixed(2) ?? 'N/A'}
                disabled
              />
              <Input
                label="Enrollment Semester"
                value={profile.enrollment_semester ?? 'N/A'}
                disabled
              />
              <Input
                label="Program"
                value={program?.name ?? 'N/A'}
                disabled
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          </Card>

          <Card title="Account Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Enrolled Since</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">{profile.enrollment_semester ?? 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Student ID</p>
                  <p className="mt-0.5 text-sm font-semibold font-mono text-gray-900">{profile.id}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
