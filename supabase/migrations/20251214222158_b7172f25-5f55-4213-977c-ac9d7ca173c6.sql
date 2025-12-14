-- Enable realtime for user_credits table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;

-- Enable realtime for credit_transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;