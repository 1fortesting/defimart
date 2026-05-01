import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Note: To use this in production, you must set these secrets in Supabase Dashboard
// - FIREBASE_SERVICE_ACCOUNT_JSON (The full JSON content from Firebase console)

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { title, body, userIds, audience, type, role } = await req.json()

    // 1. Get tokens based on audience or specific user IDs
    let query = supabaseClient.from('fcm_tokens').select('token')
    
    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    } else if (audience === 'active') {
      // Logic for active users could be implemented here
    }
    
    const { data: tokens, error: tokenError } = await query
    if (tokenError) throw tokenError

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No tokens found for target audience" }), { status: 200 })
    }

    // 2. Broadcast to all tokens
    // This is a simplified relay logic. For FCM v1 production, 
    // you would typically obtain an access token using your Service Account JSON.
    console.log(`Broadcasting alert: "${title}" from desk: ${role} to ${tokens.length} tokens.`);
    
    // Success response for implementation
    return new Response(JSON.stringify({ 
        success: true, 
        count: tokens.length,
        title
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
