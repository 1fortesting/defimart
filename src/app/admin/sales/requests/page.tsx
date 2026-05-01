export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import RequestsClientPage from './requests-client-page';

export type ProductRequestWithUser = Tables<'product_requests'> & {
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'phone_number'> | null;
};

export default async function SalesProductRequestsPage() {
    const cookieStore = await cookies();

    // Using SERVICE_ROLE_KEY to ensure admin can see all requests bypass RLS
    const supabaseAdmin = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
    );
    
    const { data, error } = await supabaseAdmin
        .from('product_requests')
        .select('*, profiles(display_name, phone_number)')
        .order('created_at', { ascending: false })
        .returns<ProductRequestWithUser[]>();
    
    if (error) {
        console.error("Failed to fetch product requests for sales:", error.message);
    }

    return <RequestsClientPage initialRequests={data || []} />;
}
