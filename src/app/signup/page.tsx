'use client';

import { AuthModal } from '@/components/auth-modal';

export default function SignupPage() {
  // This page now simply renders the authentication modal.
  // The modal is configured to show the 'signup' view by default.
  return <AuthModal initialView="signup" />;
}
