// This is the code for your Supabase Edge Function
// Deploy using: supabase functions deploy send-fcm

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const FCM_URL = "https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send"

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { title, body, audience, type } = await req.json()

    // 1. Get tokens based on audience
    let query = supabaseClient.from('fcm_tokens').select('token')
    if (audience === 'active') {
      // Add custom logic for active users if needed
    }
    const { data: tokens } = await query

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No tokens found" }), { status: 200 })
    }

    // 2. Send via FCM (simplified for batching)
    // In production, use the Google Auth library to get a token for HTTP v1
    const results = await Promise.all(tokens.map(async (t) => {
      // FCM logic here
      return { status: 'success' }
    }))

    return new Response(JSON.stringify({ success: true, count: results.length }), {
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