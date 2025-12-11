-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view parking spots" ON public.parking_spots;
DROP POLICY IF EXISTS "Authenticated users can create parking spots" ON public.parking_spots;
DROP POLICY IF EXISTS "Authenticated users can update parking spots" ON public.parking_spots;
DROP POLICY IF EXISTS "Authenticated users can delete parking spots" ON public.parking_spots;

-- Create PERMISSIVE policies (default type)
CREATE POLICY "Anyone can view parking spots" 
ON public.parking_spots 
FOR SELECT 
USING (true);

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

CREATE POLICY "Authenticated users can delete parking spots" 
ON public.parking_spots 
FOR DELETE 
TO authenticated
USING (true);