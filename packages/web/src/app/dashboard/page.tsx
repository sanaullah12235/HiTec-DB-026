import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { redirect } from 'next/navigation';

export default async function DashboardHub() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = user.app_metadata?.role as string | undefined;

  switch (role) {
    case 'student':
      redirect('/dashboard/student');
    case 'faculty':
      redirect('/dashboard/faculty');
    case 'finance':
      redirect('/dashboard/finance');
    case 'admin':
      redirect('/dashboard/admin');
    default:
      redirect('/login?error=invalid_role');
  }
}
