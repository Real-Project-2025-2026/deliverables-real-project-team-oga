-- Add departure_time column to handshake_deals
ALTER TABLE public.handshake_deals 
ADD COLUMN departure_time TIMESTAMP WITH TIME ZONE;

-- Add new status value for pending giver approval
ALTER TYPE handshake_status ADD VALUE IF NOT EXISTS 'pending_approval' AFTER 'open';