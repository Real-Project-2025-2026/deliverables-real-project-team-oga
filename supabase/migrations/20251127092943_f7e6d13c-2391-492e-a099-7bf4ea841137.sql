-- Create parking_spots table
CREATE TABLE public.parking_spots (
  id TEXT PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  available BOOLEAN NOT NULL DEFAULT true,
  available_since TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.parking_spots ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read parking spots (public data)
CREATE POLICY "Anyone can view parking spots" 
ON public.parking_spots 
FOR SELECT 
USING (true);

-- Allow anyone to insert new parking spots
CREATE POLICY "Anyone can create parking spots" 
ON public.parking_spots 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update parking spots
CREATE POLICY "Anyone can update parking spots" 
ON public.parking_spots 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_parking_spots_updated_at
BEFORE UPDATE ON public.parking_spots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for parking_spots table
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_spots;