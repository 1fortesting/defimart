import { AuthModal } from '@/components/auth-modal';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthModal initialView="login" />
    </Suspense>
  );
}
