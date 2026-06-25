import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface AdmissionRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cnic: string;
  program_id: string;
  status: string;
  created_at: string;
}

const db = () => createAdminClient();

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body as { id: string; action: 'approved' | 'rejected' };

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'Missing id or action' }, { status: 400 });
    }

    const supabase = db();

    const { data: admission, error: fetchError } = await (supabase.from('admissions') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !admission) {
      return NextResponse.json({ success: false, error: 'Admission not found' }, { status: 404 });
    }

    const record = admission as AdmissionRecord;

    if (action === 'approved') {
      const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: record.email,
        password: 'hitec123',
        email_confirm: true,
        user_metadata: { role: 'student', full_name: record.full_name },
        app_metadata: { role: 'student' },
      });

      if (createUserError || !authUser.user) {
        return NextResponse.json(
          { success: false, error: createUserError?.message ?? 'Failed to create user' },
          { status: 500 },
        );
      }

      const userId = authUser.user.id;

      const { error: studentError } = await (supabase.from('students') as any)
        .insert({ id: userId, program_id: record.program_id, name: record.full_name, email: record.email, cnic: record.cnic, enrollment_semester: 'Fall 2026' });

      if (studentError) {
        await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json({ success: false, error: studentError.message }, { status: 500 });
      }

      const { error: updateError } = await (supabase.from('admissions') as any)
        .update({ status: 'approved' })
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: { email: record.email, tempPassword: 'hitec123', fullName: record.full_name },
      });
    }

    const { error: rejectError } = await (supabase.from('admissions') as any)
      .update({ status: 'rejected' })
      .eq('id', id);

    if (rejectError) {
      return NextResponse.json({ success: false, error: rejectError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { status: 'rejected' } });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
