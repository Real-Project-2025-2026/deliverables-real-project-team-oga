-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can create parking spots" ON public.parking_spots;
DROP POLICY IF EXISTS "Anyone can update parking spots" ON public.parking_spots;

-- Create new policies that require authentication
CREATE POLICY "Authenticated users can create parking spots" 
ON public.parking_spots 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update parking spots" 
ON public.parking_spots 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Add explicit DELETE policy for authenticated users
CREATE POLICY "Authenticated users can delete parking spots" 
ON public.parking_spots 
FOR DELETE 
TO authenticated
USING (true);