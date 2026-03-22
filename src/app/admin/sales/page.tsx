import { redirect } from 'next/navigation';

export default function SalesRootPage() {
    redirect('/admin/sales/orders');
}
