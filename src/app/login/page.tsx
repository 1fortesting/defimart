'use client';

import { AuthModal } from '@/components/auth-modal';

export default function LoginPage() {
  // This page now simply renders the authentication modal.
  // The modal is configured to show the 'login' view by default.
  return <AuthModal initialView="login" />;
}
