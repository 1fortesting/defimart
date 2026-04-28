import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import RequestsClientPage from './requests-client-page';

export type ProductRequestWithUser = Tables<'product_requests'> & {
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'phone_number'> | null;
};

export default async function SalesProductRequestsPage() {
    const supabase = createClient();
    // Temporarily fetching all requests to avoid a crash due to the missing 'department' column.
    // The proper fix is to run the ALTER TABLE command in the Supabase SQL editor.
    const { data, error } = await supabase
        .from('product_requests')
        .select('*, profiles(display_name, phone_number)')
        .order('created_at', { ascending: false })
        .returns<ProductRequestWithUser[]>();
    
    if (error) {
        // We log the error but don't crash the page if the column is missing.
        console.error("Failed to fetch product requests for sales:", error.message);
    }
    
    // Filtering in code as a temporary workaround.
    const salesRequests = (data || []).filter(req => req.department === 'sales');
    
    return <RequestsClientPage initialRequests={salesRequests || []} />;
}
