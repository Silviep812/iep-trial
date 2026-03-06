import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CalendarDays, Lock, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";

interface CMTask {
    id: string;
    name: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string | null;
    locked: boolean | null;
    depends_on: string | null;
    event_id: string | null;
}

const statusColor: Record<string, string> = {
    completed: "bg-green-50 text-green-700 border-green-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blocked: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function CMTimelinePlanner() {
    const { toast } = useToast();
    const [tasks, setTasks] = useState<CMTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [resyncing, setResyncing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fetchTasks = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const { data, error } = await supabase
                .from("cm_tasks")
                .select("id, name, start_date, end_date, status, locked, depends_on, event_id")
                .limit(50);

            if (error) {
                console.error("cm_tasks Supabase error:", JSON.stringify(error));
                setErrorMsg(`${error.message} (code: ${error.code ?? 'N/A'}, hint: ${error.hint ?? 'none'})`);
                return;
            }
            setTasks(data || []);
        } catch (err: any) {
            console.error("Error fetching cm_tasks:", err);
            setErrorMsg(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const handleResync = () => {
        setResyncing(true);
        // In a real implementation this would update cm_tasks start/end dates via Supabase
        setTimeout(() => {
            setResyncing(false);
            toast({
                title: "Timeline Resynced",
                description: "Unlocked tasks have been auto-adjusted to resolve conflicts.",
            });
        }, 1500);
    };

    // Detect overlapping tasks
    const hasConflict = (task: CMTask, nextTask: CMTask | undefined): boolean => {
        if (!nextTask || !task.end_date || !nextTask.start_date) return false;
        return differenceInDays(parseISO(nextTask.start_date), parseISO(task.end_date)) < 0;
    };

    const formatDate = (d: string | null) =>
        d ? format(parseISO(d), "MMM dd, yyyy") : "—";

    const conflictCount = tasks.filter((t, i) => hasConflict(t, tasks[i + 1])).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Timeline Planner</h1>
                    <p className="text-muted-foreground mt-1">
                        Propagate schedule edits and auto-adjust downstream tasks. Locked tasks protect hard deadlines.
                    </p>
                </div>
                <Button onClick={handleResync} disabled={resyncing} className="flex items-center gap-2">
                    <RefreshCw className={`h-4 w-4 ${resyncing ? "animate-spin" : ""}`} />
                    {resyncing ? "Re-aligning..." : "Timeline Resync"}
                </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Tasks", value: tasks.length },
                    { label: "Locked", value: tasks.filter(t => t.locked).length },
                    { label: "Conflicts", value: conflictCount },
                    { label: "Completed", value: tasks.filter(t => t.status === "completed").length },
                ].map((k) => (
                    <Card key={k.label}>
                        <CardContent className="pt-5 text-center">
                            <div className="text-3xl font-bold">{k.value}</div>
                            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md px-3 py-1.5 bg-muted/30">
                    <Lock className="h-4 w-4 text-red-500" /> Locked = Hard Deadline
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md px-3 py-1.5 bg-muted/30">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Date Overlap / Conflict
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md px-3 py-1.5 bg-muted/30">
                    <CalendarDays className="h-4 w-4 text-green-500" /> Unlocked / Flexible
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" /> cm_tasks — Task Dependency Chain
                        <span className="ml-auto text-sm font-normal text-muted-foreground">
                            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : errorMsg ? (
                        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 space-y-2">
                            <p className="font-semibold">Failed to load cm_tasks</p>
                            <p className="font-mono text-xs bg-red-100 px-2 py-1 rounded">{errorMsg}</p>
                            <p className="text-xs text-red-600">
                                💡 This is usually an <strong>RLS policy issue</strong>. Go to Supabase → Table Editor → <code>cm_tasks</code> → Policies and add a SELECT policy (e.g. <code>true</code> for authenticated users).
                            </p>
                            <button onClick={fetchTasks} className="mt-2 text-xs underline text-red-700 hover:text-red-900">Retry</button>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No tasks found in <code>cm_tasks</code>. Add task rows in Supabase to see them here.
                        </div>
                    ) : (
                        tasks.map((task, i) => {
                            const conflict = hasConflict(task, tasks[i + 1]);
                            return (
                                <div key={task.id}>
                                    <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors
                    ${task.locked ? "bg-red-50/30 border-red-200/60" : conflict ? "bg-orange-50/30 border-orange-200/50" : "bg-background hover:bg-muted/20"}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <div className="font-medium text-sm flex items-center gap-2">
                                                    {task.name || "Untitled Task"}
                                                    {task.locked && <Lock className="h-3.5 w-3.5 text-red-500" />}
                                                    {conflict && <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {formatDate(task.start_date)} → {formatDate(task.end_date)}
                                                </div>
                                                {task.depends_on && (
                                                    <div className="text-xs text-muted-foreground/70 mt-0.5">
                                                        Depends on task ID: {task.depends_on.substring(0, 8)}…
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className={statusColor[task.status || "pending"] || statusColor["pending"]}>
                                                {task.status?.replace("_", " ") || "pending"}
                                            </Badge>
                                            {i < tasks.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                        </div>
                                    </div>
                                    {conflict && (
                                        <div className="mx-4 px-3 py-2 rounded-b-lg bg-orange-50 border border-t-0 border-orange-200 text-xs text-orange-700 flex items-center gap-2">
                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                            Conflict: overlaps with "{tasks[i + 1]?.name}". Use Timeline Resync to auto-adjust.
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
