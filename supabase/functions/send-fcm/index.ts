import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
      // In a real app, you might filter by users who have been active recently
      // For now, we'll just get all tokens if no specific logic is provided
    }
    
    const { data: tokens, error: tokenError } = await query
    if (tokenError) throw tokenError

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No tokens found for target audience" }), { status: 200 })
    }

    // 2. Prepare the notification payload
    // Note: To use the FCM v1 API, you usually need a Google Service Account.
    // For this implementation, we assume you have set up a Firebase Admin SDK 
    // or a similar relay. If using the direct HTTP API, you'd need an OAuth2 token.
    
    const results = await Promise.all(tokens.map(async (t) => {
      try {
        // This is a placeholder for the actual FCM HTTP v1 call.
        // You would typically use a library like 'googleapis' to get an access token
        // and then POST to: https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send
        
        console.log(`Sending "${title}" to token: ${t.token.substring(0, 10)}...`);
        
        // Return a mock success for this implementation
        return { token: t.token, status: 'success' }
      } catch (e) {
        return { token: t.token, status: 'failed', error: e.message }
      }
    }))

    const successCount = results.filter(r => r.status === 'success').length

    return new Response(JSON.stringify({ 
        success: true, 
        count: successCount,
        details: results 
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
