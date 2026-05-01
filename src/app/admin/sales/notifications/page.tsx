export const dynamic = 'force-dynamic';

import { NotificationPanel } from '@/components/admin/notification-panel';

export default function SalesNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Sales Messaging</h1>
      <NotificationPanel role="Sales" />
    </div>
  );
}