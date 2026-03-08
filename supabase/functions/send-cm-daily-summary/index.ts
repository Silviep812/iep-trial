import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") || "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );

        const appUrl = Deno.env.get("APP_URL") || "https://your-app.com";
        const today = new Date().toISOString().split("T")[0];

        // ── 1. Fetch urgent / pending change requests ─────────────────────────────
        const { data: urgentCRs } = await supabase
            .from("cm_change_requests")
            .select("id, description, priority_tag, created_at, event_id")
            .eq("priority_tag", "urgent")
            .gte("created_at", `${today}T00:00:00Z`);

        // ── 2. Fetch tasks that were updated today ─────────────────────────────────
        const { data: updatedTasks } = await supabase
            .from("cm_tasks")
            .select("id, name, status, locked, end_date")
            .gte("end_date", today)
            .limit(10);

        // ── 3. Fetch recent audit events ──────────────────────────────────────────
        const { data: auditEvents } = await supabase
            .from("cm_audit_events")
            .select("id, type, description, created_at")
            .gte("created_at", `${today}T00:00:00Z`)
            .limit(20);

        // ── 4. Get coordinator emails via cm_event_members ────────────────────────
        const { data: members } = await supabase
            .from("cm_event_members")
            .select("user_id, role");

        const adminUserIds = (members || [])
            .filter((m) => m.role === "admin" || m.role === "coordinator")
            .map((m) => m.user_id);

        let recipientEmails: string[] = [];
        if (adminUserIds.length > 0) {
            // profiles table has no email column — email lives in auth.users
            const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
            recipientEmails = authUsers
                .filter((u: any) => adminUserIds.includes(u.id))
                .map((u: any) => u.email)
                .filter(Boolean) as string[];
        }

        // Fallback: use env var if no recipients found
        const fallbackEmail = Deno.env.get("SUMMARY_EMAIL");
        if (recipientEmails.length === 0 && fallbackEmail) {
            recipientEmails = [fallbackEmail];
        }

        if (recipientEmails.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: "No recipients configured." }),
                { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        // ── Build HTML summary ─────────────────────────────────────────────────────
        const urgentSection = (urgentCRs && urgentCRs.length > 0)
            ? `
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:8px;margin:16px 0;">
        <h3 style="color:#b91c1c;margin:0 0 10px 0;">🚨 Urgent Change Requests Today (${urgentCRs.length})</h3>
        <ul style="margin:0;padding-left:20px;color:#6b7280;">
          ${urgentCRs.map((cr) => `<li>${cr.description?.substring(0, 80) || "No description"} <a href="${appUrl}/dashboard/change-requests/${cr.id}" style="color:#4f46e5;">View →</a></li>`).join("")}
        </ul>
      </div>`
            : `<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px;border-radius:8px;margin:16px 0;color:#166534;">✅ No urgent change requests today.</div>`;

        const tasksSection = (updatedTasks && updatedTasks.length > 0)
            ? `
      <div style="margin:16px 0;">
        <h3 style="color:#1e293b;margin:0 0 10px 0;">📋 Upcoming / Active Tasks</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="background:#f1f5f9;"><th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Task</th><th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Status</th><th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Due</th><th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Locked</th></tr></thead>
          <tbody>
            ${updatedTasks.map((t, i) => `
              <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
                <td style="padding:8px;border:1px solid #e2e8f0;">${t.name || "Untitled"}</td>
                <td style="padding:8px;border:1px solid #e2e8f0;">${t.status || "—"}</td>
                <td style="padding:8px;border:1px solid #e2e8f0;">${t.end_date || "—"}</td>
                <td style="padding:8px;border:1px solid #e2e8f0;">${t.locked ? "🔒 Yes" : "No"}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`
            : "";

        const auditSection = (auditEvents && auditEvents.length > 0)
            ? `
      <div style="margin:16px 0;">
        <h3 style="color:#1e293b;margin:0 0 10px 0;">📝 Audit Events Today (${auditEvents.length})</h3>
        <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;">
          ${auditEvents.slice(0, 8).map((e) => `<li><strong>${e.type}</strong> — ${e.description?.substring(0, 80) || "No description"}</li>`).join("")}
          ${auditEvents.length > 8 ? `<li>…and ${auditEvents.length - 8} more</li>` : ""}
        </ul>
      </div>`
            : "";

        const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1e293b;">
      <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">📊 Daily CM Activity Summary</h1>
        <p style="color:#ccfbf1;margin:6px 0 0 0;font-size:14px;">${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
        ${urgentSection}
        ${tasksSection}
        ${auditSection}
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:13px;color:#94a3b8;">
          <p>This is an automated daily summary from your Change Management system.</p>
          <a href="${appUrl}/dashboard/cm-analytics" style="color:#0d9488;font-weight:bold;">Open CM Analytics →</a>
        </div>
      </div>
    </div>`;

        // ── Send to all recipients ─────────────────────────────────────────────────
        const results = await Promise.allSettled(
            recipientEmails.map((email) =>
                resend.emails.send({
                    from: "Change Management <onboarding@resend.dev>",
                    to: [email],
                    subject: `CM Daily Summary — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}${urgentCRs?.length ? ` 🚨 ${urgentCRs.length} Urgent` : ""}`,
                    html: htmlContent,
                })
            )
        );

        const successCount = results.filter((r) => r.status === "fulfilled").length;

        return new Response(
            JSON.stringify({ success: true, sent: successCount, total: recipientEmails.length, urgentCount: urgentCRs?.length ?? 0 }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );

    } catch (error: any) {
        console.error("Daily summary error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }
};

serve(handler);
