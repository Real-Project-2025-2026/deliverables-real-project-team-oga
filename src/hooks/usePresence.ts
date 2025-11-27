import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePresence = () => {
  const [activeUsers, setActiveUsers] = useState(1); // Start with 1 (self)

  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: crypto.randomUUID(),
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setActiveUsers(count);
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        setActiveUsers(Object.keys(state).length);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        setActiveUsers(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return activeUsers;
};
