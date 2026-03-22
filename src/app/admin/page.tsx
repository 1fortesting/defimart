import { redirect } from 'next/navigation';

// The root admin page now redirects to the departments hub.
export default function AdminRootPage() {
    redirect('/admin/departments');
}
