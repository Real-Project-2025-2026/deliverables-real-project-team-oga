import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreditAction {
  action: 'parking_used' | 'complete_handshake' | 'check_balance';
  spotId?: string;
  dealId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Create client with user's token for auth
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreditAction = await req.json();
    console.log('Processing credit action:', body, 'for user:', user.id);

    // Get user's current credit balance
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (creditsError) {
      console.error('Error fetching credits:', creditsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch credits' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If user has no credits record, create one with welcome bonus
    let currentBalance = credits?.balance ?? 0;
    if (!credits) {
      console.log('Creating credits record for user:', user.id);
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({ user_id: user.id, balance: 20 });
      
      if (insertError) {
        console.error('Error creating credits:', insertError);
      } else {
        currentBalance = 20;
        // Record welcome bonus
        await supabase.from('credit_transactions').insert({
          user_id: user.id,
          amount: 20,
          type: 'welcome_bonus',
          description: 'Willkommens-Credits'
        });
      }
    }

    // Handle different actions
    switch (body.action) {
      case 'check_balance':
        return new Response(JSON.stringify({ 
          balance: currentBalance,
          canPark: currentBalance >= 2
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'parking_used':
        // Deduct 2 credits for parking
        if (currentBalance < 2) {
          return new Response(JSON.stringify({ 
            error: 'Insufficient credits',
            balance: currentBalance,
            required: 2
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const newBalance = currentBalance - 2;
        
        // Update balance
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({ balance: newBalance })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating credits:', updateError);
          return new Response(JSON.stringify({ error: 'Failed to update credits' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Record transaction
        await supabase.from('credit_transactions').insert({
          user_id: user.id,
          amount: -2,
          type: 'parking_used',
          description: 'Parken beendet',
          related_spot_id: body.spotId
        });

        console.log('Deducted 2 credits, new balance:', newBalance);
        
        return new Response(JSON.stringify({ 
          success: true,
          balance: newBalance,
          deducted: 2
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'complete_handshake':
        if (!body.dealId) {
          return new Response(JSON.stringify({ error: 'Deal ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get the deal
        const { data: deal, error: dealError } = await supabase
          .from('handshake_deals')
          .select('*')
          .eq('id', body.dealId)
          .single();

        if (dealError || !deal) {
          console.error('Deal not found:', dealError);
          return new Response(JSON.stringify({ error: 'Deal not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check if deal is ready for completion (both confirmed)
        if (deal.status !== 'receiver_confirmed' && deal.status !== 'giver_confirmed') {
          return new Response(JSON.stringify({ error: 'Deal not ready for completion' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Determine who is confirming
        const isGiver = user.id === deal.giver_id;
        const isReceiver = user.id === deal.receiver_id;

        if (!isGiver && !isReceiver) {
          return new Response(JSON.stringify({ error: 'Not a participant in this deal' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check if this confirmation completes the deal
        let newStatus = deal.status;
        if (isGiver && deal.status === 'receiver_confirmed') {
          newStatus = 'completed';
        } else if (isReceiver && deal.status === 'giver_confirmed') {
          newStatus = 'completed';
        } else if (isGiver && deal.status === 'accepted') {
          newStatus = 'giver_confirmed';
        } else if (isReceiver && deal.status === 'accepted') {
          newStatus = 'receiver_confirmed';
        }

        // Update deal status
        await supabase
          .from('handshake_deals')
          .update({ status: newStatus })
          .eq('id', body.dealId);

        // If completed, distribute credits
        if (newStatus === 'completed') {
          console.log('Completing handshake deal, distributing credits');
          
          // Give giver +20 credits
          const { data: giverCredits } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', deal.giver_id)
            .single();
          
          await supabase
            .from('user_credits')
            .update({ balance: (giverCredits?.balance ?? 0) + 20 })
            .eq('user_id', deal.giver_id);

          await supabase.from('credit_transactions').insert({
            user_id: deal.giver_id,
            amount: 20,
            type: 'handshake_giver',
            description: 'Handshake - Parkplatz übergeben',
            related_spot_id: deal.spot_id,
            related_user_id: deal.receiver_id
          });

          // Give receiver +10 credits
          const { data: receiverCredits } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', deal.receiver_id)
            .single();

          await supabase
            .from('user_credits')
            .update({ balance: (receiverCredits?.balance ?? 0) + 10 })
            .eq('user_id', deal.receiver_id);

          await supabase.from('credit_transactions').insert({
            user_id: deal.receiver_id,
            amount: 10,
            type: 'handshake_receiver',
            description: 'Handshake - Parkplatz erhalten',
            related_spot_id: deal.spot_id,
            related_user_id: deal.giver_id
          });

          // Delete the parking spot
          await supabase
            .from('parking_spots')
            .delete()
            .eq('id', deal.spot_id);

          console.log('Handshake completed successfully');
        }

        return new Response(JSON.stringify({ 
          success: true,
          status: newStatus,
          completed: newStatus === 'completed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error: unknown) {
    console.error('Error processing credits:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
