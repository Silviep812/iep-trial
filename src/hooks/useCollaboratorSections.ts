import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/lib/permissions';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the list of section keys this user is allowed to access.
 * - Admins get null (no restriction — show everything)
 * - Coordinators/Viewers get a string[] of their assigned collaborator_types
 */
export function useCollaboratorSections(): {
    assignedSections: string[] | null; // null = unrestricted (admin)
    loading: boolean;
} {
    const { user } = useAuth();
    const { permissionLevel, loading: permLoading } = usePermissions();
    const [assignedSections, setAssignedSections] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (permLoading || !user) return;

        // Admins see everything — no section restriction
        if (permissionLevel === 'admin') {
            setAssignedSections(null);
            setLoading(false);
            return;
        }

        const fetchSections = async () => {
            try {
                // Look for a collaborator_configuration where this user is the assigned_user_id
                const { data, error } = await supabase
                    .from('collaborator_configurations')
                    .select('collaborator_types')
                    .eq('assigned_user_id', user.id);

                if (error) throw error;

                if (data && data.length > 0) {
                    // Flatten all assigned types across all configs, deduplicate
                    const allTypes = Array.from(
                        new Set(data.flatMap((row) => row.collaborator_types ?? []))
                    );
                    setAssignedSections(allTypes);
                } else {
                    // No config found — restrict to empty (they see only always-visible items)
                    setAssignedSections([]);
                }
            } catch (err) {
                console.error('useCollaboratorSections: error fetching sections', err);
                setAssignedSections([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSections();
    }, [user, permissionLevel, permLoading]);

    return { assignedSections, loading };
}
