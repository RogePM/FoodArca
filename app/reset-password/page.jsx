import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata = {
  title: 'Reset password | Food Arca',
};

export default async function ResetPasswordPage() {
  // The emailed link lands here via /auth/callback, which sets the session.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/?error=auth_code_error');

  return <ResetPasswordForm />;
}
