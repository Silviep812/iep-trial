import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart2, TrendingUp, Download, AlertCircle, Loader2,
    Database, Activity, CheckCircle, Lock, Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

// ── CM Tables ──────────────────────────────────────────────────────────────
interface CMChangeRequest { id: string; priority_tag: string | null; created_at: string; description: string | null; }
interface CMAuditEvent { id: string; type: string; created_at: string; }

// ── Unified View Types ─────────────────────────────────────────────────────
interface UnifiedTask {
    id: string | null; name: string | null; status: string | null;
    locked: boolean | null; source: string | null;
    start_date: string | null; end_date: string | null; event_id: string | null;
}
interface UnifiedResource {
    id: string | null; name: string | null; role: string | null;
    source: string | null; availability: any; location_id: string | null;
}
interface UnifiedAuditEvent {
    id: string | null; type: string | null; source: string | null;
    description: string | null; created_at: string | null; event_id: string | null;
}

const priorityColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700", optional: "bg-blue-100 text-blue-700",
    deferred: "bg-gray-100 text-gray-600", high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700", low: "bg-sky-100 text-sky-700",
};
const sourceColors: Record<string, string> = {
    cm: "bg-teal-100 text-teal-700", legacy: "bg-purple-100 text-purple-700",
    lovable: "bg-indigo-100 text-indigo-700",
};

export default function CMAnalytics() {
    const { toast } = useToast();

    // CM table data
    const [changeRequests, setChangeRequests] = useState<CMChangeRequest[]>([]);
    const [auditEvents, setAuditEvents] = useState<CMAuditEvent[]>([]);
    const [taskCount, setTaskCount] = useState(0);
    const [resourceCount, setResourceCount] = useState(0);
    const [locationCount, setLocationCount] = useState(0);

    // Unified view data
    const [unifiedTasks, setUnifiedTasks] = useState<UnifiedTask[]>([]);
    const [unifiedResources, setUnifiedResources] = useState<UnifiedResource[]>([]);
    const [unifiedAudit, setUnifiedAudit] = useState<UnifiedAuditEvent[]>([]);
    const [unifiedLoading, setUnifiedLoading] = useState(false);
    const [unifiedErrors, setUnifiedErrors] = useState<Record<string, string>>({});

    const [loading, setLoading] = useState(true);

    // ── Fetch CM tables ────────────────────────────────────────────────────────
    const fetchCMData = async () => {
        setLoading(true);
        try {
            const [crResult, auditResult, tasksCount, resourcesCount, locationsCount] = await Promise.all([
                supabase.from("cm_change_requests").select("id, priority_tag, created_at, description").order("created_at", { ascending: false }),
                supabase.from("cm_audit_events").select("id, type, created_at").order("created_at", { ascending: false }).limit(100),
                supabase.from("cm_tasks").select("id", { count: "exact", head: true }),
                supabase.from("cm_resources").select("id", { count: "exact", head: true }),
                supabase.from("cm_locations").select("id", { count: "exact", head: true }),
            ]);
            setChangeRequests(crResult.data || []);
            setAuditEvents(auditResult.data || []);
            setTaskCount(tasksCount.count ?? 0);
            setResourceCount(resourcesCount.count ?? 0);
            setLocationCount(locationsCount.count ?? 0);
        } catch (err) {
            console.error("CM analytics fetch error:", err);
            toast({ title: "Error loading CM analytics", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch Unified Views ────────────────────────────────────────────────────
    const fetchUnifiedViews = async () => {
        setUnifiedLoading(true);
        setUnifiedErrors({});
        const errors: Record<string, string> = {};

        const [tasksRes, resourcesRes, auditRes] = await Promise.all([
            supabase.from("unified_tasks").select("id, name, status, locked, source, start_date, end_date, event_id").limit(50),
            supabase.from("unified_resources").select("id, name, role, source, availability, location_id").limit(50),
            supabase.from("unified_audit_events").select("id, type, source, description, created_at, event_id").order("created_at", { ascending: false }).limit(50),
        ]);

        if (tasksRes.error) errors["unified_tasks"] = tasksRes.error.message;
        if (resourcesRes.error) errors["unified_resources"] = resourcesRes.error.message;
        if (auditRes.error) errors["unified_audit_events"] = auditRes.error.message;

        setUnifiedTasks(tasksRes.data || []);
        setUnifiedResources(resourcesRes.data || []);
        setUnifiedAudit(auditRes.data || []);
        setUnifiedErrors(errors);
        setUnifiedLoading(false);
    };

    useEffect(() => { fetchCMData(); fetchUnifiedViews(); }, []);

    // ── CM computed stats ──────────────────────────────────────────────────────
    const total = changeRequests.length;
    const byPriority = Object.entries(
        changeRequests.reduce((acc: Record<string, number>, cr) => {
            const p = cr.priority_tag || "untagged"; acc[p] = (acc[p] || 0) + 1; return acc;
        }, {})
    ).map(([priority, count]) => ({ priority, count })).sort((a, b) => b.count - a.count);

    const byAuditType = Object.entries(
        auditEvents.reduce((acc: Record<string, number>, ae) => {
            acc[ae.type] = (acc[ae.type] || 0) + 1; return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]);

    const monthlyCounts = (() => {
        const months: Record<string, number> = {};
        changeRequests.forEach((cr) => {
            const key = format(parseISO(cr.created_at), "MMM yy");
            months[key] = (months[key] || 0) + 1;
        });
        return Object.entries(months).slice(-8);
    })();
    const maxMonthly = Math.max(...monthlyCounts.map(([, c]) => c), 1);

    // ── Unified View stats ─────────────────────────────────────────────────────
    const tasksBySource = Object.entries(unifiedTasks.reduce((a: any, t) => { a[t.source || "unknown"] = (a[t.source || "unknown"] || 0) + 1; return a; }, {}));
    const resourcesBySource = Object.entries(unifiedResources.reduce((a: any, r) => { a[r.source || "unknown"] = (a[r.source || "unknown"] || 0) + 1; return a; }, {}));
    const auditBySource = Object.entries(unifiedAudit.reduce((a: any, e) => { a[e.source || "unknown"] = (a[e.source || "unknown"] || 0) + 1; return a; }, {}));

    const handleExport = () => {
        const csv = ["ID,Priority Tag,Description,Created At", ...changeRequests.map((cr) =>
            [cr.id, cr.priority_tag ?? "—", (cr.description ?? "").replace(/,/g, " "), cr.created_at].join(",")
        )].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "cm_analytics.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    const UnifiedErrorCard = ({ viewName, error }: { viewName: string; error: string }) => (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
            <span className="font-semibold">{viewName}</span>: {error}
            {error.includes("recursion") && (
                <div className="mt-1 text-orange-700">🔁 Run the RLS fix SQL in Supabase (see DB Verification page).</div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">CM Analytics</h1>
                    <p className="text-muted-foreground mt-1">Live insights from CM tables + unified Supabase views.</p>
                </div>
                <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Export CM Report
                </Button>
            </div>

            <Tabs defaultValue="cm" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cm" className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4" /> CM Insights
                    </TabsTrigger>
                    <TabsTrigger value="unified" className="flex items-center gap-2" onClick={fetchUnifiedViews}>
                        <Layers className="h-4 w-4" /> Unified Views
                    </TabsTrigger>
                </TabsList>

                {/* ── CM Insights Tab ── */}
                <TabsContent value="cm" className="space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <>
                            {/* KPIs */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { label: "Change Requests", value: total },
                                    { label: "Audit Events", value: auditEvents.length },
                                    { label: "Tasks", value: taskCount },
                                    { label: "Resources", value: resourceCount },
                                    { label: "Locations", value: locationCount },
                                ].map((kpi) => (
                                    <Card key={kpi.label}>
                                        <CardContent className="pt-5 text-center">
                                            <div className="text-3xl font-bold">{kpi.value}</div>
                                            <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* By Priority */}
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" /> Requests by Priority</CardTitle></CardHeader>
                                    <CardContent className="space-y-3">
                                        {byPriority.length === 0 ? <p className="text-sm text-muted-foreground">No change requests yet.</p> :
                                            byPriority.map(({ priority, count }) => (
                                                <div key={priority} className="flex items-center justify-between py-2 border-b last:border-0">
                                                    <Badge variant="outline" className={priorityColors[priority.toLowerCase()] || "bg-gray-100 text-gray-700"}>{priority}</Badge>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-28 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                                                        </div>
                                                        <span className="text-sm font-bold w-6 text-right">{count}</span>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </CardContent>
                                </Card>

                                {/* Audit Events by Type */}
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-orange-500" /> Audit Events by Type</CardTitle></CardHeader>
                                    <CardContent className="space-y-3">
                                        {byAuditType.length === 0 ? <p className="text-sm text-muted-foreground">No audit events yet.</p> :
                                            byAuditType.map(([type, count]) => (
                                                <div key={type} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
                                                    <div className="font-medium text-sm">{type}</div>
                                                    <Badge variant="outline">{count}</Badge>
                                                </div>
                                            ))
                                        }
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Monthly trend */}
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary" /> Monthly Change Request Volume</CardTitle></CardHeader>
                                <CardContent>
                                    {monthlyCounts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>
                                    ) : (
                                        <div className="flex items-end gap-3 h-36">
                                            {monthlyCounts.map(([month, count]) => (
                                                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                                                    <div className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-all" style={{ height: `${(count / maxMonthly) * 100}%` }} title={`${count} requests`} />
                                                    <span className="text-xs text-muted-foreground">{month}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* ── Unified Views Tab ── */}
                <TabsContent value="unified" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2"><Database className="h-5 w-5 text-teal-600" /> Unified Supabase Views</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">Cross-source views merging CM and Lovable data.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchUnifiedViews} disabled={unifiedLoading} className="flex items-center gap-2">
                            <Activity className={`h-4 w-4 ${unifiedLoading ? "animate-spin" : ""}`} />
                            {unifiedLoading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>

                    {Object.keys(unifiedErrors).length > 0 && (
                        <div className="space-y-2">
                            {Object.entries(unifiedErrors).map(([view, err]) => <UnifiedErrorCard key={view} viewName={view} error={err} />)}
                        </div>
                    )}

                    {unifiedLoading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <div className="space-y-6">
                            {/* unified_tasks */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-teal-500" /> unified_tasks
                                        <span className="ml-auto text-sm font-normal text-muted-foreground">{unifiedTasks.length} rows</span>
                                    </CardTitle>
                                    {tasksBySource.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mt-1">
                                            {tasksBySource.map(([src, count]) => (
                                                <Badge key={src} variant="outline" className={sourceColors[src] || "bg-gray-100 text-gray-600"}>
                                                    {src}: {count as number}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {unifiedErrors["unified_tasks"] ? null : unifiedTasks.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No rows in unified_tasks yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {unifiedTasks.slice(0, 8).map((t, i) => (
                                                <div key={t.id ?? i} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/10 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {t.locked && <Lock className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                                                        <span className="font-medium">{t.name || "Untitled"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {t.source && <Badge variant="outline" className={`text-xs ${sourceColors[t.source] || "bg-gray-100 text-gray-600"}`}>{t.source}</Badge>}
                                                        {t.status && <Badge variant="outline" className="text-xs">{t.status}</Badge>}
                                                    </div>
                                                </div>
                                            ))}
                                            {unifiedTasks.length > 8 && <p className="text-xs text-muted-foreground">…and {unifiedTasks.length - 8} more rows</p>}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* unified_resources */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-indigo-500" /> unified_resources
                                        <span className="ml-auto text-sm font-normal text-muted-foreground">{unifiedResources.length} rows</span>
                                    </CardTitle>
                                    {resourcesBySource.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mt-1">
                                            {resourcesBySource.map(([src, count]) => (
                                                <Badge key={src} variant="outline" className={sourceColors[src] || "bg-gray-100 text-gray-600"}>
                                                    {src}: {count as number}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {unifiedErrors["unified_resources"] ? null : unifiedResources.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No rows in unified_resources yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {unifiedResources.slice(0, 8).map((r, i) => (
                                                <div key={r.id ?? i} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/10 text-sm">
                                                    <span className="font-medium">{r.name || "Unnamed"}</span>
                                                    <div className="flex items-center gap-2">
                                                        {r.role && <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded bg-background">{r.role}</span>}
                                                        {r.source && <Badge variant="outline" className={`text-xs ${sourceColors[r.source] || "bg-gray-100 text-gray-600"}`}>{r.source}</Badge>}
                                                    </div>
                                                </div>
                                            ))}
                                            {unifiedResources.length > 8 && <p className="text-xs text-muted-foreground">…and {unifiedResources.length - 8} more rows</p>}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* unified_audit_events */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart2 className="h-5 w-5 text-purple-500" /> unified_audit_events
                                        <span className="ml-auto text-sm font-normal text-muted-foreground">{unifiedAudit.length} rows</span>
                                    </CardTitle>
                                    {auditBySource.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mt-1">
                                            {auditBySource.map(([src, count]) => (
                                                <Badge key={src} variant="outline" className={sourceColors[src] || "bg-gray-100 text-gray-600"}>
                                                    {src}: {count as number}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {unifiedErrors["unified_audit_events"] ? null : unifiedAudit.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No rows in unified_audit_events yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {unifiedAudit.slice(0, 8).map((e, i) => (
                                                <div key={e.id ?? i} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/10 text-sm">
                                                    <div>
                                                        <span className="font-medium">{e.type || "—"}</span>
                                                        {e.description && <span className="text-xs text-muted-foreground ml-2">{e.description.substring(0, 60)}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {e.source && <Badge variant="outline" className={`text-xs ${sourceColors[e.source] || "bg-gray-100 text-gray-600"}`}>{e.source}</Badge>}
                                                        {e.created_at && <span className="text-xs text-muted-foreground">{format(parseISO(e.created_at), "MMM dd")}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                            {unifiedAudit.length > 8 && <p className="text-xs text-muted-foreground">…and {unifiedAudit.length - 8} more rows</p>}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
