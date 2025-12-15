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
    const { data: deletedSpots, error: spotsError } = await supabase
      .from('parking_spots')
      .delete()
      .eq('available', true)
      .lt('available_since', cutoffTime.toISOString())
      .select()

    if (spotsError) {
      console.error('Error deleting parking spots:', spotsError)
      throw spotsError
    }

    const deletedSpotsCount = deletedSpots?.length || 0
    console.log(`Deleted ${deletedSpotsCount} expired parking spots`)

    // Cleanup handshake deals:
    // Open deals where departure_time + threshold has passed should be cancelled
    // This gives users the configured time window after departure_time before cleanup
    
    // First, get all 'open' deals that have passed their departure_time + threshold
    const { data: expiredDeals, error: fetchDealsError } = await supabase
      .from('handshake_deals')
      .select('*')
      .eq('status', 'open')
      .not('departure_time', 'is', null)
      .lt('departure_time', cutoffTime.toISOString())

    if (fetchDealsError) {
      console.error('Error fetching expired handshake deals:', fetchDealsError)
      throw fetchDealsError
    }

    console.log(`Found ${expiredDeals?.length || 0} expired open handshake deals`)

    // Cancel expired open deals
    let cancelledDealsCount = 0
    if (expiredDeals && expiredDeals.length > 0) {
      const expiredDealIds = expiredDeals.map(d => d.id)
      
      const { data: cancelledDeals, error: cancelError } = await supabase
        .from('handshake_deals')
        .update({ status: 'cancelled', updated_at: now.toISOString() })
        .in('id', expiredDealIds)
        .select()

      if (cancelError) {
        console.error('Error cancelling expired handshake deals:', cancelError)
        throw cancelError
      }

      cancelledDealsCount = cancelledDeals?.length || 0
      console.log(`Cancelled ${cancelledDealsCount} expired handshake deals`)

      // Also make the associated parking spots available again
      const spotIds = expiredDeals.map(d => d.spot_id)
      const { error: spotUpdateError } = await supabase
        .from('parking_spots')
        .update({ available: true, available_since: now.toISOString() })
        .in('id', spotIds)

      if (spotUpdateError) {
        console.error('Error updating parking spots for cancelled deals:', spotUpdateError)
      } else {
        console.log(`Made ${spotIds.length} parking spots available again`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedSpotsCount,
        cancelledDealsCount,
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
