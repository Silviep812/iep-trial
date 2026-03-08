import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AccessStatus = 'loading' | 'allowed' | 'denied' | 'not_found';

/**
 * Checks whether the current user has access to a specific event.
 *
 * Access is granted if:
 *  - RLS lets the query return the event (i.e. user owns it or is a member via user_roles)
 *
 * Usage:
 *   const { status } = useEventAccess(eventId);
 *   if (status === 'denied') return <AccessDenied />;
 */
export function useEventAccess(eventId: string | null | undefined): {
    status: AccessStatus;
} {
    const { user } = useAuth();
    const [status, setStatus] = useState<AccessStatus>('loading');

    useEffect(() => {
        if (!eventId) {
            setStatus('loading');
            return;
        }

        if (!user) {
            setStatus('denied');
            return;
        }

        let cancelled = false;

        const check = async () => {
            setStatus('loading');
            try {
                // If the event exists AND RLS allows the user to see it, this returns a row.
                // If RLS blocks access, Supabase returns null (not an error).
                const { data, error } = await supabase
                    .from('events')
                    .select('id')
                    .eq('id', eventId)
                    .maybeSingle();

                if (cancelled) return;

                if (error) {
                    console.error('useEventAccess: error checking event', error);
                    setStatus('denied');
                    return;
                }

                if (!data) {
                    // Either the event doesn't exist or RLS blocked it.
                    setStatus('not_found');
                    return;
                }

                setStatus('allowed');
            } catch (err) {
                if (!cancelled) {
                    console.error('useEventAccess: unexpected error', err);
                    setStatus('denied');
                }
            }
        };

        check();
        return () => { cancelled = true; };
    }, [eventId, user]);

    return { status };
}
