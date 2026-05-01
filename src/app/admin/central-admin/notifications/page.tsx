export const dynamic = 'force-dynamic';

import { NotificationPanel } from '@/components/admin/notification-panel';

export default function CentralAdminNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">CEO Notification Command</h1>
      <NotificationPanel role="CEO" />
    </div>
  );
}
