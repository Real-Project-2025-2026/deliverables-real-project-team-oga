-- Create credit transaction type enum
CREATE TYPE public.credit_transaction_type AS ENUM (
  'parking_used',
  'handshake_giver',
  'handshake_receiver',
  'purchase',
  'welcome_bonus',
  'membership_bonus'
);

-- Create handshake deal status enum
CREATE TYPE public.handshake_status AS ENUM (
  'open',
  'accepted',
  'giver_confirmed',
  'receiver_confirmed',
  'completed',
  'cancelled'
);

-- Create user_credits table
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type public.credit_transaction_type NOT NULL,
  description TEXT,
  related_spot_id TEXT,
  related_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create handshake_deals table
CREATE TABLE public.handshake_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spot_id TEXT NOT NULL,
  giver_id UUID NOT NULL,
  receiver_id UUID,
  status public.handshake_status NOT NULL DEFAULT 'open',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create credit_packages table (for purchases)
CREATE TABLE public.credit_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create memberships table (blueprint for later)
CREATE TABLE public.memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  credits_included INTEGER NOT NULL DEFAULT 0,
  monthly_bonus_credits INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_memberships table
CREATE TABLE public.user_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  membership_id UUID NOT NULL REFERENCES public.memberships(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handshake_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits via service role"
ON public.user_credits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update credits"
ON public.user_credits FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.credit_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for handshake_deals
CREATE POLICY "Users can view open deals or their own deals"
ON public.handshake_deals FOR SELECT
USING (status = 'open' OR auth.uid() = giver_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can create deals"
ON public.handshake_deals FOR INSERT
WITH CHECK (auth.uid() = giver_id);

CREATE POLICY "Participants can update their deals"
ON public.handshake_deals FOR UPDATE
USING (auth.uid() = giver_id OR auth.uid() = receiver_id);

-- RLS Policies for credit_packages (public read)
CREATE POLICY "Anyone can view active credit packages"
ON public.credit_packages FOR SELECT
USING (is_active = true);

-- RLS Policies for memberships (public read)
CREATE POLICY "Anyone can view active memberships"
ON public.memberships FOR SELECT
USING (is_active = true);

-- RLS Policies for user_memberships
CREATE POLICY "Users can view their own memberships"
ON public.user_memberships FOR SELECT
USING (auth.uid() = user_id);

-- Update handle_new_user function to also create user_credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, split_part(new.email, '@', 1));
  
  -- Create user credits with welcome bonus
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (new.id, 20);
  
  -- Record welcome bonus transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (new.id, 20, 'welcome_bonus', 'Willkommens-Credits');
  
  RETURN new;
END;
$$;

-- Create trigger for updating updated_at on user_credits
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at on handshake_deals
CREATE TRIGGER update_handshake_deals_updated_at
BEFORE UPDATE ON public.handshake_deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default credit package (100 credits = 10€)
INSERT INTO public.credit_packages (name, credits, price_cents)
VALUES ('100 Credits', 100, 1000);

-- Insert membership blueprints (inactive)
INSERT INTO public.memberships (name, price_cents, credits_included, monthly_bonus_credits, features, is_active)
VALUES 
  ('Basic', 499, 50, 10, '{"priority_spots": false, "no_ads": true}'::jsonb, false),
  ('Premium', 999, 150, 30, '{"priority_spots": true, "no_ads": true, "early_access": true}'::jsonb, false),
  ('VIP', 1999, 400, 100, '{"priority_spots": true, "no_ads": true, "early_access": true, "support_priority": true}'::jsonb, false);

-- Enable realtime for handshake_deals
ALTER PUBLICATION supabase_realtime ADD TABLE public.handshake_deals;