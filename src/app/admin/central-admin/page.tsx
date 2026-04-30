export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

// The root admin page now redirects to the main department dashboard.
export default function CentralAdminRootPage() {
    redirect('/admin/central-admin/dashboard');
}
