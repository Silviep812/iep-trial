import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Download, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CMResource {
    id: string;
    name: string | null;
    role: string | null;
    location_id: string | null;
    event_id: string | null;
    availability: any;
}

interface CMLocation {
    id: string;
    name: string | null;
    address: string | null;
}

export default function CMResourceAllocation() {
    const { toast } = useToast();
    const [resources, setResources] = useState<CMResource[]>([]);
    const [locations, setLocations] = useState<CMLocation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resResult, locResult] = await Promise.all([
                supabase
                    .from("cm_resources")
                    .select("id, name, role, location_id, event_id, availability")
                    .order("name", { ascending: true }),
                supabase
                    .from("cm_locations")
                    .select("id, name, address"),
            ]);

            if (resResult.error) throw resResult.error;
            if (locResult.error) throw locResult.error;

            setResources(resResult.data || []);
            setLocations(locResult.data || []);
        } catch (err) {
            console.error("Error fetching cm_resources / cm_locations:", err);
            toast({ title: "Error loading resources", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const getLocation = (locationId: string | null): string => {
        if (!locationId) return "—";
        const loc = locations.find((l) => l.id === locationId);
        return loc ? `${loc.name ?? ""}${loc.address ? ` · ${loc.address}` : ""}` : locationId.substring(0, 8) + "…";
    };

    const isAvailable = (availability: any): boolean | null => {
        if (availability === null || availability === undefined) return null;
        if (typeof availability === "boolean") return availability;
        if (typeof availability === "object") {
            return availability.available === true || availability.status === "available";
        }
        return null;
    };

    const handleExport = () => {
        const csv = [
            ["Name", "Role", "Location", "Event ID", "Availability"].join(","),
            ...resources.map((r) => [
                r.name ?? "—",
                r.role ?? "—",
                getLocation(r.location_id),
                r.event_id ? r.event_id.substring(0, 8) + "…" : "—",
                isAvailable(r.availability) === true ? "Available" : isAvailable(r.availability) === false ? "Unavailable" : "Unknown",
            ].join(",")),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cm_resources_export.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const available = resources.filter((r) => isAvailable(r.availability) === true).length;
    const unavailable = resources.filter((r) => isAvailable(r.availability) === false).length;
    const unknown = resources.length - available - unavailable;

    const roleGroups = resources.reduce((acc: Record<string, number>, r) => {
        const role = r.role || "Unassigned";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Resource Allocation</h1>
                    <p className="text-muted-foreground mt-1">
                        Live data from <code className="text-xs bg-muted px-1 rounded">cm_resources</code> and{" "}
                        <code className="text-xs bg-muted px-1 rounded">cm_locations</code> — assign by role and location.
                    </p>
                </div>
                <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Export Table
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Resources", value: resources.length, icon: <Users className="h-5 w-5 text-primary" /> },
                    { label: "Available", value: available, icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
                    { label: "Unavailable", value: unavailable, icon: <XCircle className="h-5 w-5 text-red-400" /> },
                    { label: "Total Locations", value: locations.length, icon: <MapPin className="h-5 w-5 text-blue-400" /> },
                ].map((kpi) => (
                    <Card key={kpi.label}>
                        <CardContent className="pt-5 flex items-center gap-3">
                            {kpi.icon}
                            <div>
                                <div className="text-2xl font-bold">{kpi.value}</div>
                                <div className="text-xs text-muted-foreground">{kpi.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Role breakdown */}
            {Object.keys(roleGroups).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(roleGroups).map(([role, count]) => (
                        <div key={role} className="flex items-center gap-1.5 text-xs border rounded-full px-3 py-1 bg-muted/30">
                            <span className="font-medium">{role}</span>
                            <span className="text-muted-foreground">({count})</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Resource List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" /> Resources — Live from Supabase
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No resources found in <code>cm_resources</code>. Add records in Supabase to see them here.
                        </div>
                    ) : (
                        resources.map((r) => {
                            const avail = isAvailable(r.availability);
                            return (
                                <div
                                    key={r.id}
                                    className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 p-4 rounded-lg border bg-background hover:bg-muted/20 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Users className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{r.name || "Unnamed Resource"}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <MapPin className="h-3 w-3" />
                                                {getLocation(r.location_id)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 ml-auto">
                                        {r.role && (
                                            <div className="text-xs border px-2 py-1 rounded bg-muted/30 text-muted-foreground">
                                                {r.role}
                                            </div>
                                        )}
                                        <Badge
                                            variant="outline"
                                            className={
                                                avail === true
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : avail === false
                                                        ? "bg-red-50 text-red-700 border-red-200"
                                                        : "bg-gray-50 text-gray-500 border-gray-200"
                                            }
                                        >
                                            {avail === true ? "Available" : avail === false ? "Unavailable" : "Unknown"}
                                        </Badge>
                                        <Button size="sm" variant="ghost" className="h-8 text-xs">Assign</Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
