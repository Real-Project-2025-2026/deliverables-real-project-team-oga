import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HandshakeDeal {
  id: string;
  spot_id: string;
  giver_id: string;
  receiver_id: string | null;
  status: 'open' | 'accepted' | 'giver_confirmed' | 'receiver_confirmed' | 'completed' | 'cancelled';
  latitude: number;
  longitude: number;
  created_at: string;
}

export const useHandshake = (user: User | null) => {
  const { toast } = useToast();
  const [activeDeals, setActiveDeals] = useState<HandshakeDeal[]>([]);
  const [myDeal, setMyDeal] = useState<HandshakeDeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('handshake_deals')
        .select('*')
        .in('status', ['open', 'accepted', 'giver_confirmed', 'receiver_confirmed']);

      if (error) {
        console.error('Error fetching deals:', error);
        return;
      }

      setActiveDeals(data as HandshakeDeal[]);
      
      // Find user's active deal
      if (user) {
        const userDeal = data.find(
          (d: any) => d.giver_id === user.id || d.receiver_id === user.id
        );
        setMyDeal(userDeal as HandshakeDeal || null);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();

    // Subscribe to deal changes
    const channel = supabase
      .channel('handshake-deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handshake_deals'
        },
        (payload) => {
          console.log('Handshake deal update:', payload);
          fetchDeals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const createHandshakeOffer = async (
    spotId: string,
    latitude: number,
    longitude: number
  ): Promise<HandshakeDeal | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('handshake_deals')
        .insert({
          spot_id: spotId,
          giver_id: user.id,
          latitude,
          longitude,
          status: 'open'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating handshake offer:', error);
        toast({
          title: 'Fehler',
          description: 'Handshake-Angebot konnte nicht erstellt werden.',
          variant: 'destructive'
        });
        return null;
      }

      toast({
        title: 'Handshake angeboten',
        description: 'Warte auf einen Interessenten...'
      });

      setMyDeal(data as HandshakeDeal);
      return data as HandshakeDeal;
    } catch (error) {
      console.error('Error creating handshake offer:', error);
      return null;
    }
  };

  const acceptDeal = async (dealId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('handshake_deals')
        .update({
          receiver_id: user.id,
          status: 'accepted'
        })
        .eq('id', dealId)
        .eq('status', 'open');

      if (error) {
        console.error('Error accepting deal:', error);
        toast({
          title: 'Fehler',
          description: 'Deal konnte nicht angenommen werden.',
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Deal angenommen',
        description: 'Koordiniere jetzt die Übergabe mit dem Geber.'
      });

      fetchDeals();
      return true;
    } catch (error) {
      console.error('Error accepting deal:', error);
      return false;
    }
  };

  const confirmHandover = async (dealId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('process-credits', {
        body: { action: 'complete_handshake', dealId }
      });

      if (error || data?.error) {
        console.error('Error confirming handover:', error || data?.error);
        toast({
          title: 'Fehler',
          description: 'Bestätigung fehlgeschlagen.',
          variant: 'destructive'
        });
        return false;
      }

      if (data.completed) {
        toast({
          title: 'Handshake abgeschlossen! 🎉',
          description: 'Credits wurden verteilt.'
        });
        setMyDeal(null);
      } else {
        toast({
          title: 'Bestätigt',
          description: 'Warte auf Bestätigung des Partners.'
        });
      }

      fetchDeals();
      return true;
    } catch (error) {
      console.error('Error confirming handover:', error);
      return false;
    }
  };

  const cancelDeal = async (dealId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('handshake_deals')
        .update({ status: 'cancelled' })
        .eq('id', dealId);

      if (error) {
        console.error('Error cancelling deal:', error);
        return false;
      }

      toast({
        title: 'Deal abgebrochen',
        description: 'Der Handshake wurde abgebrochen.'
      });

      setMyDeal(null);
      fetchDeals();
      return true;
    } catch (error) {
      console.error('Error cancelling deal:', error);
      return false;
    }
  };

  const getOpenDeals = () => {
    return activeDeals.filter(d => d.status === 'open' && d.giver_id !== user?.id);
  };

  return {
    activeDeals,
    myDeal,
    isLoading,
    createHandshakeOffer,
    acceptDeal,
    confirmHandover,
    cancelDeal,
    getOpenDeals,
    refreshDeals: fetchDeals
  };
};
