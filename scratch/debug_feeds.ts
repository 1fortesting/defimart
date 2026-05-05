import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log('Checking feeds table structure...');
    // We can't directly check schema with anon key easily, but we can try to select all and see what we get
    const { data, error } = await supabase
        .from('feeds')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching feeds:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Available columns in feeds table:');
        console.log(Object.keys(data[0]).join(', '));
        console.log('Sample data:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No data found in feeds table.');
    }
}

checkSchema();
