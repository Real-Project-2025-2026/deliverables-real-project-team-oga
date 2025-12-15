import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Credits {
  balance: number;
  canPark: boolean;
}

interface CreditChange {
  amount: number;
  type: 'gain' | 'loss';
}

type CreditChangeCallback = (change: CreditChange) => void;

export const useCredits = (user: User | null, onCreditChange?: CreditChangeCallback) => {
  const [credits, setCredits] = useState<Credits>({ balance: 0, canPark: false });
  const [isLoading, setIsLoading] = useState(true);
  const previousBalanceRef = useRef<number | null>(null);

  const fetchCredits = async () => {
    if (!user) {
      setCredits({ balance: 0, canPark: false });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching credits:', error);
        return;
      }

      const balance = data?.balance ?? 20; // Default to 20 for new users
      previousBalanceRef.current = balance;
      setCredits({
        balance,
        canPark: balance >= 2
      });
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBalanceChange = useCallback((newBalance: number) => {
    const previousBalance = previousBalanceRef.current;
    
    if (previousBalance !== null && previousBalance !== newBalance) {
      const difference = newBalance - previousBalance;
      if (onCreditChange) {
        onCreditChange({
          amount: Math.abs(difference),
          type: difference > 0 ? 'gain' : 'loss'
        });
      }
    }
    
    previousBalanceRef.current = newBalance;
    setCredits({
      balance: newBalance,
      canPark: newBalance >= 2
    });
  }, [onCreditChange]);

  useEffect(() => {
    fetchCredits();

    if (!user) return;

    // Subscribe to credit changes
    const channel = supabase
      .channel('user-credits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Credits updated:', payload);
          if (payload.new) {
            const newBalance = (payload.new as any).balance;
            handleBalanceChange(newBalance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleBalanceChange]);

  const deductCredits = async (spotId?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('process-credits', {
        body: { action: 'parking_used', spotId }
      });

      if (error || data?.error) {
        console.error('Error deducting credits:', error || data?.error);
        return false;
      }

      handleBalanceChange(data.balance);
      return true;
    } catch (error) {
      console.error('Error deducting credits:', error);
      return false;
    }
  };

  const refreshCredits = () => {
    fetchCredits();
  };

  return {
    credits,
    isLoading,
    deductCredits,
    refreshCredits
  };
};
