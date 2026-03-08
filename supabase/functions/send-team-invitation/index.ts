import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TeamInvitationRequest {
  email: string;
  role: string;
  inviterName: string;
  inviterEmail: string;
  eventId?: string | null;
  teamId?: string;
  isCoordinator?: boolean;
  isViewer?: boolean;
  collaboratorTypes?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Team invitation function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth guard: only authenticated users can send invitations
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const { data: { user: caller }, error: callerErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (callerErr || !caller) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const {
      email,
      role,
      inviterName,
      inviterEmail,
      eventId,
      teamId,
      isCoordinator,
      isViewer,
      collaboratorTypes,
    }: TeamInvitationRequest = await req.json();

    console.log("Sending team invitation to:", email);
    console.log("Role:", role);
    console.log("Inviter:", inviterName);

    // First, check if user already exists by email
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();

    if (checkError) {
      console.error("Error checking existing users:", checkError);
      throw checkError;
    }

    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      // User already exists, add them directly to the team
      console.log("User already exists, adding to team directly:", existingUser.id);

      // Store the role in user_roles table (scoped to event)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: existingUser.id,
          role: role,
          event_id: eventId || null,
          permission_level: isCoordinator ? 'coordinator' : isViewer ? 'viewer' : 'admin',
        }, {
          onConflict: 'user_id,role,event_id'
        });

      if (roleError) {
        console.error("Error storing role in database:", roleError);
      } else {
        console.log("Role stored in database for existing user:", existingUser.id);
      }

      // Save collaborator section assignments
      if (collaboratorTypes && collaboratorTypes.length > 0 && eventId) {
        const { error: collabErr } = await supabase
          .from('collaborator_configurations')
          .upsert({
            user_id: existingUser.id,
            event_id: eventId,
            collaborator_types: collaboratorTypes,
          }, { onConflict: 'user_id,event_id' });
        if (collabErr) console.error("Error saving collaborator types:", collabErr);
      }

      // Create team_assignments record if teamId provided
      if (teamId) {
        const { error: teamError } = await supabase
          .from('team_assignments')
          .upsert({
            user_id: existingUser.id,
            team_id: teamId,
            team_admin: false,
            is_coordinator: isCoordinator || false,
            is_viewer: isViewer || false,
          }, {
            onConflict: 'user_id,team_id'
          });

        if (teamError) {
          console.error("Error creating team assignment:", teamError);
        } else {
          console.log("Team assignment created for existing user:", existingUser.id);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `User ${email} added to team successfully`,
          isExistingUser: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // User doesn't exist, send invitation
    const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        role: role,
        inviter_name: inviterName,
        inviter_email: inviterEmail
      },
      redirectTo: `${Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'http://localhost:5173'}/dashboard`
    });

    if (inviteError) {
      throw inviteError;
    }

    // Store the role in user_roles table (scoped to event)
    if (data.user && data.user.id) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: data.user.id,
          role: role,
          event_id: eventId || null,
          permission_level: isCoordinator ? 'coordinator' : isViewer ? 'viewer' : 'admin',
        }, {
          onConflict: 'user_id,role,event_id'
        });

      if (roleError) {
        console.error("Error storing role in database:", roleError);
      } else {
        console.log("Role stored in database for user:", data.user.id);
      }

      // Save collaborator section assignments for new invited user
      if (collaboratorTypes && collaboratorTypes.length > 0 && eventId) {
        const { error: collabErr } = await supabase
          .from('collaborator_configurations')
          .upsert({
            user_id: data.user.id,
            event_id: eventId,
            collaborator_types: collaboratorTypes,
          }, { onConflict: 'user_id,event_id' });
        if (collabErr) console.error("Error saving collaborator types:", collabErr);
      }

      // Create team_assignments record with attributes if teamId provided
      if (teamId) {
        const { error: teamError } = await supabase
          .from('team_assignments')
          .insert({
            user_id: data.user.id,
            team_id: teamId,
            team_admin: false,
            is_coordinator: isCoordinator || false,
            is_viewer: isViewer || false,
          });

        if (teamError) {
          console.error("Error creating team assignment:", teamError);
        } else {
          console.log("Team assignment created for user:", data.user.id);
        }
      }
    }

    console.log("Invitation sent successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Team invitation sent successfully to ${email}`,
        isExistingUser: false,
        data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);