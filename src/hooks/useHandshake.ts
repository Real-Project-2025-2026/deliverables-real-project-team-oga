import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type HandshakeStatus = 'open' | 'pending_approval' | 'accepted' | 'giver_confirmed' | 'receiver_confirmed' | 'completed' | 'cancelled';

export interface HandshakeDeal {
  id: string;
  spot_id: string;
  giver_id: string;
  receiver_id: string | null;
  status: HandshakeStatus;
  latitude: number;
  longitude: number;
  departure_time: string | null;
  created_at: string;
}

export const useHandshake = (user: User | null) => {
  const { toast } = useToast();
  const [activeDeals, setActiveDeals] = useState<HandshakeDeal[]>([]);
  const [myDeal, setMyDeal] = useState<HandshakeDeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeals = async () => {
    console.log('Fetching handshake deals...');
    try {
      const { data, error } = await supabase
        .from('handshake_deals')
        .select('*')
        .in('status', ['open', 'pending_approval', 'accepted', 'giver_confirmed', 'receiver_confirmed']);

      if (error) {
        console.error('Error fetching deals:', error);
        return;
      }

      console.log('Fetched deals:', data?.length, data);
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

  // Create handshake offer with departure time
  const createHandshakeOffer = async (
    spotId: string,
    latitude: number,
    longitude: number,
    departureTime: Date
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
          departure_time: departureTime.toISOString(),
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

  // Receiver requests the deal (pending_approval)
  const requestDeal = async (dealId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('handshake_deals')
        .update({
          receiver_id: user.id,
          status: 'pending_approval'
        })
        .eq('id', dealId)
        .eq('status', 'open');

      if (error) {
        console.error('Error requesting deal:', error);
        toast({
          title: 'Fehler',
          description: 'Deal konnte nicht angefragt werden.',
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Anfrage gesendet',
        description: 'Warte auf Bestätigung des Gebers.'
      });

      fetchDeals();
      return true;
    } catch (error) {
      console.error('Error requesting deal:', error);
      return false;
    }
  };

  // Giver accepts the receiver's request
  const acceptRequest = async (dealId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Verify user is the giver
      const { data: deal } = await supabase
        .from('handshake_deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (!deal || deal.giver_id !== user.id) {
        toast({
          title: 'Fehler',
          description: 'Du bist nicht der Geber dieses Deals.',
          variant: 'destructive'
        });
        return false;
      }

      const { error } = await supabase
        .from('handshake_deals')
        .update({ status: 'accepted' })
        .eq('id', dealId)
        .eq('status', 'pending_approval');

      if (error) {
        console.error('Error accepting request:', error);
        toast({
          title: 'Fehler',
          description: 'Anfrage konnte nicht akzeptiert werden.',
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Anfrage akzeptiert',
        description: 'Der Deal ist bestätigt. Bei Abfahrt wird der Platz übergeben.'
      });

      fetchDeals();
      return true;
    } catch (error) {
      console.error('Error accepting request:', error);
      return false;
    }
  };

  // Giver declines the receiver's request
  const declineRequest = async (dealId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('handshake_deals')
        .update({ 
          receiver_id: null,
          status: 'open' 
        })
        .eq('id', dealId)
        .eq('status', 'pending_approval');

      if (error) {
        console.error('Error declining request:', error);
        return false;
      }

      toast({
        title: 'Anfrage abgelehnt',
        description: 'Der Deal ist wieder offen für andere.'
      });

      fetchDeals();
      return true;
    } catch (error) {
      console.error('Error declining request:', error);
      return false;
    }
  };

  // Complete the deal (called by edge function or manually when departure time reached)
  // Returns deal completion data including spotId for parking session transfer
  const completeDeal = async (dealId: string): Promise<{ success: boolean; spotId?: string; receiverId?: string; giverId?: string }> => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase.functions.invoke('process-credits', {
        body: { action: 'complete_handshake', dealId }
      });

      if (error || data?.error) {
        console.error('Error completing deal:', error || data?.error);
        toast({
          title: 'Fehler',
          description: 'Deal konnte nicht abgeschlossen werden.',
          variant: 'destructive'
        });
        return { success: false };
      }

      toast({
        title: 'Handshake abgeschlossen! 🎉',
        description: 'Credits wurden verteilt.'
      });
      
      setMyDeal(null);
      fetchDeals();
      return { 
        success: true, 
        spotId: data.spotId, 
        receiverId: data.receiverId,
        giverId: data.giverId
      };
    } catch (error) {
      console.error('Error completing deal:', error);
      return { success: false };
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
    // Show all open deals, but filter out user's own deals if logged in
    return activeDeals.filter(d => d.status === 'open' && (!user || d.giver_id !== user.id));
  };

  // Also return all open deals without filtering for the map
  const getAllOpenDeals = () => {
    return activeDeals.filter(d => d.status === 'open');
  };

  return {
    activeDeals,
    myDeal,
    isLoading,
    createHandshakeOffer,
    requestDeal,
    acceptRequest,
    declineRequest,
    completeDeal,
    cancelDeal,
    getOpenDeals,
    getAllOpenDeals,
    refreshDeals: fetchDeals
  };
};
