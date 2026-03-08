import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEventAccess } from '@/hooks/useEventAccess';

interface EventAccessGuardProps {
    eventId: string | null | undefined;
    children: React.ReactNode;
}

/**
 * Wraps any event-specific content.
 * Shows a spinner while checking, an access-denied screen if blocked,
 * or renders children if access is allowed.
 *
 * Usage:
 *   <EventAccessGuard eventId={selectedEventId}>
 *     <MyEventPage />
 *   </EventAccessGuard>
 */
export function EventAccessGuard({ eventId, children }: EventAccessGuardProps) {
    const { status } = useEventAccess(eventId);
    const navigate = useNavigate();

    // If no eventId yet, just render children (let the page handle the "no event selected" state)
    if (!eventId) return <>{children}</>;

    if (status === 'loading') {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (status === 'denied' || status === 'not_found') {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4 max-w-sm mx-auto">
                    <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ShieldOff className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                        {status === 'not_found' ? 'Event Not Found' : 'Access Denied'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {status === 'not_found'
                            ? "This event doesn't exist or may have been removed."
                            : "You don't have permission to view this event. Contact the event admin if you think this is a mistake."}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
