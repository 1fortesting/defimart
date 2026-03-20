import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { EditProductForm } from './edit-form';

export default async function EditProductPage({ params }: { params: { id: string } }) {
    const supabase = createClient();

    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!product) {
        notFound();
    }

    return <EditProductForm product={product} />;
}
