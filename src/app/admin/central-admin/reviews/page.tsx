export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { subDays, startOfDay, endOfDay, format, isValid, parseISO } from 'date-fns';
import ReviewsClientPage from './reviews-client-page';

export type ReviewWithProductAndProfile = Tables<'reviews'> & {
    products: Pick<Tables<'products'>, 'name'> | null;
    profiles: Pick<Tables<'profiles'>, 'display_name' | 'avatar_url'> | null;
};

export default async function ReviewsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
    const cookieStore = await cookies();

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

    const params = await searchParams;
    const selectedDateStr = params?.date as string;
    const selectedProductId = params?.productId as string;
    const selectedDate = selectedDateStr && isValid(parseISO(selectedDateStr)) ? parseISO(selectedDateStr) : null;
    const startDate = selectedDate ? startOfDay(selectedDate) : startOfDay(subDays(new Date(), 29)); // Default to last 30 days
    const endDate = selectedDate ? endOfDay(selectedDate) : new Date();

    let reviewsQuery = supabaseAdmin
        .from('reviews')
        .select('*, products(name), profiles(display_name, avatar_url)')
        .order('created_at', { ascending: false });

    if (selectedDate) {
        reviewsQuery = reviewsQuery.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    }
    if (selectedProductId) {
        reviewsQuery = reviewsQuery.eq('product_id', selectedProductId);
    }
    const { data: reviews, error: reviewsError } = await reviewsQuery.returns<ReviewWithProductAndProfile[]>();
    if (reviewsError) console.error("Error fetching reviews:", reviewsError.message);

    const { data: allProductsForFilter, error: allProductsError } = await supabaseAdmin.from('products').select('id, name');
    if(allProductsError) console.error("Error fetching all products for filter:", allProductsError.message);

    return (
        <div className="flex flex-col gap-6">
            <ReviewsClientPage
                reviews={reviews ?? []}
                allProducts={allProductsForFilter ?? []}
                currentFilters={{ date: selectedDateStr, productId: selectedProductId }}
            />
        </div>
    );
}
