import { redirect } from 'next/navigation';

// The root admin page now redirects to the main department dashboard.
export default function AdminRootPage() {
    redirect('/admin/central-admin');
}
