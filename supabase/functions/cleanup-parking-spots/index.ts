import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current hour in Munich timezone (Europe/Berlin)
    const now = new Date()
    const munichTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
    const currentHour = munichTime.getHours()
    
    // Determine threshold based on time of day
    // 8-20 Uhr (daytime): 30 minutes
    // 20-8 Uhr (nighttime): 90 minutes (1.5 hours)
    const isDaytime = currentHour >= 8 && currentHour < 20
    const thresholdMinutes = isDaytime ? 30 : 90
    
    // Calculate cutoff time
    const cutoffTime = new Date(now.getTime() - thresholdMinutes * 60 * 1000)
    
    console.log(`Cleanup running at ${munichTime.toISOString()}`)
    console.log(`Current hour in Munich: ${currentHour}`)
    console.log(`Is daytime (8-20): ${isDaytime}`)
    console.log(`Threshold: ${thresholdMinutes} minutes`)
    console.log(`Deleting spots available before: ${cutoffTime.toISOString()}`)

    // Delete parking spots that are available and older than threshold
    const { data, error } = await supabase
      .from('parking_spots')
      .delete()
      .eq('available', true)
      .lt('available_since', cutoffTime.toISOString())
      .select()

    if (error) {
      console.error('Error deleting parking spots:', error)
      throw error
    }

    const deletedCount = data?.length || 0
    console.log(`Deleted ${deletedCount} expired parking spots`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        isDaytime,
        thresholdMinutes,
        currentHourMunich: currentHour
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
