-- Drop the existing update policy
DROP POLICY IF EXISTS "Participants can update their deals" ON public.handshake_deals;

-- Create new policy that allows:
-- 1. Giver can always update their own deals
-- 2. Any authenticated user can update an 'open' deal (to request it)
-- 3. Receiver can update deals they're part of
CREATE POLICY "Users can update deals" 
ON public.handshake_deals 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = giver_id OR 
    auth.uid() = receiver_id OR 
    status = 'open'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = giver_id OR 
    auth.uid() = receiver_id OR
    (status = 'pending_approval' AND receiver_id = auth.uid())
  )
);