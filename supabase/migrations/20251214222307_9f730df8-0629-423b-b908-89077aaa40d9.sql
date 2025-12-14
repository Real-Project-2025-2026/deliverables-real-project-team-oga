-- Drop and recreate the SELECT policy to allow anonymous users to see open deals
DROP POLICY IF EXISTS "Users can view open deals or their own deals" ON public.handshake_deals;

CREATE POLICY "Anyone can view open deals"
ON public.handshake_deals FOR SELECT
USING (
  status = 'open' 
  OR (auth.uid() IS NOT NULL AND (auth.uid() = giver_id OR auth.uid() = receiver_id))
);