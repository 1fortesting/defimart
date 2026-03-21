import { AuthModal } from '@/components/auth-modal';
import { Suspense } from 'react';

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthModal initialView="signup" />
    </Suspense>
  );
}
