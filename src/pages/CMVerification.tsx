import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, PlayCircle, RefreshCw, Shield } from "lucide-react";

interface TestResult {
    name: string;
    query: string;
    status: "idle" | "running" | "pass" | "fail";
    rowCount?: number;
    data?: any[];
    error?: string;
    duration?: number;
}

const INITIAL_TESTS: TestResult[] = [
    {
        name: "cm_audit_events — read first 5 rows",
        query: "select * from cm_audit_events limit 5",
        status: "idle",
    },
    {
        name: "cm_tasks — locked tasks",
        query: "select * from cm_tasks where locked = true",
        status: "idle",
    },
    {
        name: "cm_tasks — all tasks (basic access)",
        query: "select * from cm_tasks limit 10",
        status: "idle",
    },
    {
        name: "cm_change_requests — all records",
        query: "select * from cm_change_requests limit 10",
        status: "idle",
    },
    {
        name: "cm_resources — all resources",
        query: "select * from cm_resources limit 10",
        status: "idle",
    },
    {
        name: "cm_locations — all locations",
        query: "select * from cm_locations limit 10",
        status: "idle",
    },
    {
        name: "cm_event_members — members (role check)",
        query: "select * from cm_event_members limit 10",
        status: "idle",
    },
    {
        name: "cm_change_logs — audit log entries",
        query: "select * from cm_change_logs limit 5",
        status: "idle",
    },
];

// Map query description to Supabase client call
async function runQuery(query: string): Promise<{ data: any[]; error: any }> {
    if (query.includes("cm_audit_events")) {
        const res = await supabase.from("cm_audit_events").select("*").limit(5);
        return { data: res.data || [], error: res.error };
    }
    if (query.includes("cm_tasks") && query.includes("locked")) {
        const res = await supabase.from("cm_tasks").select("*").eq("locked", true);
        return { data: res.data || [], error: res.error };
    }
    if (query.includes("cm_tasks")) {
        const res = await supabase.from("cm_tasks").select("*").limit(10);
        return { data: res.data || [], error: res.error };
    }
    if (query.includes("cm_change_requests")) {
        const res = await supabase.from("cm_change_requests").select("*").limit(10);
        return { data: res.data || [], error: res.error };
    }
    if (query.includes("cm_resources")) {
        const res = await supabase.from("cm_resources").select("*").limit(10);
        return { data: res.data || [], error: res.error };
    }
    if (query.includes("cm_locations")) {
        const res = await supabase.from("cm_locations").select("*").limit(10);
        return { data: res.data || [], error: res.error };
    }
    if (query.includes("cm_event_members")) {
        const res = await supabase.from("cm_event_members").select("*").limit(10);
        return { data: res.data || [], error: res.error };
    }
    if (query.includes("cm_change_logs")) {
        const res = await supabase.from("cm_change_logs").select("*").limit(5);
        return { data: res.data || [], error: res.error };
    }
    return { data: [], error: { message: "Unknown query" } };
}

export default function CMVerification() {
    const [tests, setTests] = useState<TestResult[]>(INITIAL_TESTS);
    const [running, setRunning] = useState(false);

    const runAllTests = async () => {
        setRunning(true);
        // Mark all as running
        setTests((prev) => prev.map((t) => ({ ...t, status: "running", error: undefined, data: undefined, rowCount: undefined })));

        const results: TestResult[] = [];
        for (const test of INITIAL_TESTS) {
            const start = Date.now();
            try {
                const { data, error } = await runQuery(test.query);
                const duration = Date.now() - start;
                if (error) {
                    results.push({ ...test, status: "fail", error: `${error.message} (code: ${error.code ?? "N/A"})`, duration });
                } else {
                    results.push({ ...test, status: "pass", data, rowCount: data.length, duration });
                }
            } catch (err: any) {
                results.push({ ...test, status: "fail", error: err?.message || "Unknown error", duration: Date.now() - start });
            }
            // Update incrementally
            setTests((prev) =>
                prev.map((t) => (t.name === test.name ? results[results.length - 1] : t))
            );
        }
        setRunning(false);
    };

    const runSingle = async (name: string) => {
        setTests((prev) => prev.map((t) => t.name === name ? { ...t, status: "running", error: undefined, data: undefined } : t));
        const test = INITIAL_TESTS.find((t) => t.name === name)!;
        const start = Date.now();
        try {
            const { data, error } = await runQuery(test.query);
            const duration = Date.now() - start;
            setTests((prev) => prev.map((t) =>
                t.name === name
                    ? error
                        ? { ...t, status: "fail", error: `${error.message} (code: ${error.code ?? "N/A"})`, duration }
                        : { ...t, status: "pass", data, rowCount: data.length, duration }
                    : t
            ));
        } catch (err: any) {
            setTests((prev) => prev.map((t) =>
                t.name === name ? { ...t, status: "fail", error: err?.message || "Unknown error", duration: Date.now() - start } : t
            ));
        }
    };

    const passCount = tests.filter((t) => t.status === "pass").length;
    const failCount = tests.filter((t) => t.status === "fail").length;
    const idleCount = tests.filter((t) => t.status === "idle" || t.status === "running").length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="h-8 w-8 text-teal-600" /> Supabase Verification
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Confirm cm_ schema access, RLS policies, and data availability under the current user session.
                    </p>
                </div>
                <Button onClick={runAllTests} disabled={running} className="flex items-center gap-2">
                    <PlayCircle className={`h-4 w-4 ${running ? "animate-pulse" : ""}`} />
                    {running ? "Running Tests..." : "Run All Tests"}
                </Button>
            </div>

            {/* Summary */}
            {!idleCount || passCount + failCount > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                    <Card className="border-green-200 bg-green-50/40">
                        <CardContent className="pt-5 text-center">
                            <div className="text-3xl font-bold text-green-700">{passCount}</div>
                            <div className="text-xs text-green-600 mt-1 font-medium">Passed</div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50/40">
                        <CardContent className="pt-5 text-center">
                            <div className="text-3xl font-bold text-red-600">{failCount}</div>
                            <div className="text-xs text-red-500 mt-1 font-medium">Failed</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5 text-center">
                            <div className="text-3xl font-bold text-muted-foreground">{tests.length}</div>
                            <div className="text-xs text-muted-foreground mt-1">Total</div>
                        </CardContent>
                    </Card>
                </div>
            ) : null}

            {/* Test cards */}
            <div className="space-y-3">
                {tests.map((test) => (
                    <Card
                        key={test.name}
                        className={`transition-colors ${test.status === "pass" ? "border-green-200 bg-green-50/20" :
                                test.status === "fail" ? "border-red-200 bg-red-50/20" : ""
                            }`}
                    >
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="mt-0.5 shrink-0">
                                        {test.status === "pass" && <CheckCircle className="h-5 w-5 text-green-500" />}
                                        {test.status === "fail" && <XCircle className="h-5 w-5 text-red-500" />}
                                        {test.status === "running" && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                                        {test.status === "idle" && <div className="h-5 w-5 rounded-full border-2 border-muted" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{test.name}</div>
                                        <code className="text-xs text-muted-foreground block mt-0.5 bg-muted/40 px-2 py-0.5 rounded">
                                            {test.query}
                                        </code>

                                        {test.status === "pass" && (
                                            <div className="mt-2 flex items-center gap-3">
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                                    {test.rowCount} row{test.rowCount !== 1 ? "s" : ""} returned
                                                </Badge>
                                                {test.duration && (
                                                    <span className="text-xs text-muted-foreground">{test.duration}ms</span>
                                                )}
                                            </div>
                                        )}

                                        {test.status === "pass" && test.data && test.data.length > 0 && (
                                            <div className="mt-2 overflow-x-auto">
                                                <table className="text-xs border rounded w-full">
                                                    <thead className="bg-muted/50">
                                                        <tr>
                                                            {Object.keys(test.data[0]).map((col) => (
                                                                <th key={col} className="border px-2 py-1 text-left font-medium">{col}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {test.data.slice(0, 3).map((row, i) => (
                                                            <tr key={i} className="even:bg-muted/20">
                                                                {Object.values(row).map((val: any, j) => (
                                                                    <td key={j} className="border px-2 py-1 max-w-[150px] truncate">
                                                                        {val === null ? <span className="text-muted-foreground italic">null</span>
                                                                            : typeof val === "object" ? JSON.stringify(val).substring(0, 40)
                                                                                : String(val).substring(0, 40)}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {test.data.length > 3 && (
                                                    <p className="text-xs text-muted-foreground mt-1">…and {test.data.length - 3} more rows</p>
                                                )}
                                            </div>
                                        )}

                                        {test.status === "pass" && test.rowCount === 0 && (
                                            <div className="mt-1 text-xs text-muted-foreground italic">
                                                ✅ Access OK — table is empty (no rows in database yet)
                                            </div>
                                        )}

                                        {test.status === "fail" && (
                                            <div className="mt-2 space-y-1">
                                                <div className="text-xs font-mono text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded">
                                                    {test.error}
                                                </div>
                                                {test.error?.includes("infinite recursion") && (
                                                    <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded">
                                                        🔁 <strong>RLS Recursion:</strong> Run the policy fix SQL in Supabase SQL Editor (provided in Change Management → Timeline Planner page).
                                                    </div>
                                                )}
                                                {test.error?.includes("permission denied") && (
                                                    <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                                                        🔒 <strong>RLS Blocked:</strong> Add <code>CREATE POLICY ... FOR SELECT TO authenticated USING (true)</code> in Supabase for this table.
                                                    </div>
                                                )}
                                                {test.error?.includes("does not exist") && (
                                                    <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded">
                                                        ❓ <strong>Table missing:</strong> This table does not exist in the current Supabase project. Run the CM schema migration SQL.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 shrink-0"
                                    onClick={() => runSingle(test.name)}
                                    disabled={test.status === "running" || running}
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${test.status === "running" ? "animate-spin" : ""}`} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* RLS Fix Reference */}
            <Card className="border-orange-200 bg-orange-50/20">
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-orange-500" /> Quick RLS Fix SQL — paste in Supabase SQL Editor
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs font-mono bg-muted/60 p-3 rounded overflow-x-auto whitespace-pre-wrap">{`-- Drop recursive policies and add simple ones
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies
    WHERE tablename IN ('cm_tasks','cm_event_members','cm_resources',
      'cm_locations','cm_change_requests','cm_audit_events','cm_change_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Add simple authenticated read policies
CREATE POLICY "cm_tasks_read"            ON public.cm_tasks            FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_event_members_read"    ON public.cm_event_members    FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_resources_read"        ON public.cm_resources        FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_locations_read"        ON public.cm_locations        FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_change_requests_read"  ON public.cm_change_requests  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_audit_events_read"     ON public.cm_audit_events     FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_change_logs_read"      ON public.cm_change_logs      FOR SELECT TO authenticated USING (true);`}
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}
