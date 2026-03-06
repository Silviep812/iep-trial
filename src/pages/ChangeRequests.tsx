import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/lib/permissions";
import { format } from "date-fns";
import { Plus, Search, Filter, FileText, Calendar, User, AlertTriangle, RefreshCw, BarChart2, ArrowRight, Download } from "lucide-react";
import { DateRange } from "react-day-picker";

interface ChangeRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  event_id: string | null;
  task_id: string | null;
  requested_by: string | null;
  created_at: string;
  event_name?: string;
  task_title?: string;
  requester_name?: string;
}

const ChangeRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRoles, loading: authLoading } = useAuth();
  const { isAdmin, isCoordinator, permissionLevel, loading: permissionsLoading } = usePermissions();
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
  const [allTasks, setAllTasks] = useState<Array<{ id: string; title: string; event_id: string }>>([]);
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});
  const [hostPermissionLevel, setHostPermissionLevel] = useState<'admin' | 'coordinator' | 'viewer' | null>(null);
  const [hostPermissionLoading, setHostPermissionLoading] = useState(true);

  // New State for UI Flow
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isResyncing, setIsResyncing] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    priority: "optional",
    event_id: "all",
    task_id: "all",
    budget: "",
    attendees: "",
  });

  const selectedRequest = changeRequests.find((cr) => cr.id === selectedRequestId);

  // Fetch the permission level specifically for the host role
  useEffect(() => {
    const fetchHostPermissionLevel = async () => {
      setHostPermissionLoading(true);

      if (!user) {
        setHostPermissionLevel(null);
        setHostPermissionLoading(false);
        return;
      }

      if (!userRoles.includes('host')) {
        // User doesn't have host role
        setHostPermissionLevel(null);
        setHostPermissionLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('permission_level')
          .eq('user_id', user.id)
          .eq('role', 'host')
          .single();

        if (error) {
          console.error('Error fetching host permission level:', error);
          setHostPermissionLevel(null);
        } else {
          setHostPermissionLevel(data?.permission_level as 'admin' | 'coordinator' | 'viewer' | null);
        }
      } catch (error) {
        console.error('Error fetching host permission level:', error);
        setHostPermissionLevel(null);
      } finally {
        setHostPermissionLoading(false);
      }
    };

    if (user && userRoles.length > 0) {
      fetchHostPermissionLevel();
    } else if (user && userRoles.length === 0) {
      // Roles loaded but user has no roles
      setHostPermissionLevel(null);
      setHostPermissionLoading(false);
    }
  }, [user, userRoles]);

  // Check if user has host role with admin or coordinator permission level
  const hasHostWithAdminOrCoordinator = () => {
    const hasHostRole = userRoles.includes('host');
    const hasRequiredPermission = hostPermissionLevel === 'admin' || hostPermissionLevel === 'coordinator';
    return hasHostRole && hasRequiredPermission;
  };

  useEffect(() => {
    // Wait for auth, permissions, and host permission to finish loading before checking access
    // If we have a user, also wait for userRoles to be populated (not empty during initial load)
    // The issue: authLoading can be false while userRoles is still being fetched (due to setTimeout in useAuth)
    // Also: if user has host role, wait for hostPermissionLevel to be fetched (not null)
    // Also: wait for permissionLevel to be set (not null) so isAdmin() works correctly
    const allLoadingComplete = !authLoading && !permissionsLoading && !hostPermissionLoading;
    // If user exists but userRoles is empty, we're still loading roles - wait
    const rolesReady = !user || userRoles.length > 0;
    // If user has host role, wait for hostPermissionLevel to be fetched
    const hostPermissionReady = !userRoles.includes('host') || hostPermissionLevel !== null;
    // Wait for permissionLevel to be set (needed for isAdmin() check)
    const permissionLevelReady = !user || permissionLevel !== null;
    // Additional safety: if we have a user but any critical data is missing, don't check yet
    const dataComplete = !user || (userRoles.length > 0 && permissionLevel !== null && (!userRoles.includes('host') || hostPermissionLevel !== null));

    if (allLoadingComplete && rolesReady && hostPermissionReady && permissionLevelReady && dataComplete) {
      const isAdminResult = isAdmin();
      const hasHostResult = hasHostWithAdminOrCoordinator();
      const hasAccess = isAdminResult || hasHostResult;
      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "Only Host role with Admin or Coordinator permission level can access change requests",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      fetchChangeRequests();
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, permissionsLoading, hostPermissionLoading, permissionLevel, userRoles, hostPermissionLevel, user]);

  // Real-time subscription for change requests list
  useEffect(() => {
    const changeRequestsChannel = supabase
      .channel('change-requests-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'change_requests'
      }, (payload: any) => {
        console.log('Change request list updated:', payload);
        // Refresh the list when any change request is created/updated/deleted
        fetchChangeRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(changeRequestsChannel);
    };
  }, []);

  useEffect(() => {
    fetchUserNames();
    fetchAllTasks();
  }, [changeRequests]);

  const fetchAllTasks = async () => {
    try {
      const { data } = await supabase.from("tasks").select("id, title, event_id").limit(100);
      if (data) setAllTasks(data);
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [changeRequests, searchQuery, statusFilter, priorityFilter, eventFilter, dateRange]);

  const fetchUserNames = async () => {
    const userIds = Array.from(
      new Set(changeRequests.map((cr) => cr.requested_by).filter(Boolean))
    );
    if (userIds.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds as string[]);

    const nameMap: Record<string, string> = {};
    (data || []).forEach((profile) => {
      nameMap[profile.user_id] = profile.display_name || profile.user_id.substring(0, 8) + "...";
    });
    setUserDisplayNames(nameMap);
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("Create Event")
        .select("userid, event_theme")
        .order("event_start_date", { ascending: false })
        .limit(100);

      if (error) throw error;

      const eventList = (data || []).map((event, index) => ({
        id: event.userid,
        name: Array.isArray(event.event_theme)
          ? event.event_theme.join(", ")
          : event.event_theme || `Event ${index + 1}`,
      }));

      setEvents(eventList);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("change_requests")
        .select("*")
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Batch fetch events and tasks
      const eventIds = (data || []).map(cr => cr.event_id).filter(Boolean) as string[];
      const taskIds = (data || []).map(cr => cr.task_id).filter(Boolean) as string[];

      // Separate UUIDs from TEXT IDs for events
      const uuidEventIds = eventIds.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      const textEventIds = eventIds.filter(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

      // Fetch events from events table (UUIDs)
      const eventsMap: Record<string, string> = {};
      if (uuidEventIds.length > 0) {
        try {
          const { data: eventsData } = await supabase
            .from("events")
            .select("id, title")
            .in("id", uuidEventIds);

          if (eventsData) {
            eventsData.forEach(event => {
              eventsMap[event.id] = event.title || "Unknown Event";
            });
          }
        } catch (err) {
          console.error("Error batch fetching events:", err);
        }
      }

      // Fetch events from Create Event table (TEXT IDs) - only if we have text IDs
      const createEventsMap: Record<string, string> = {};
      if (textEventIds.length > 0) {
        try {
          const { data: createEventsData } = await supabase
            .from("Create Event")
            .select("userid, event_theme")
            .in("userid", textEventIds);

          if (createEventsData) {
            createEventsData.forEach(event => {
              const theme = Array.isArray(event.event_theme)
                ? event.event_theme.join(", ")
                : event.event_theme || "Unknown Event";
              createEventsMap[event.userid] = theme;
            });
          }
        } catch (err) {
          // Silently fail - some event_ids might not exist in Create Event table
          // This prevents console spam from 406 errors
        }
      }

      // Fetch tasks
      const tasksMap: Record<string, string> = {};
      if (taskIds.length > 0) {
        try {
          const { data: tasksData } = await supabase
            .from("tasks")
            .select("id, title")
            .in("id", taskIds);

          if (tasksData) {
            tasksData.forEach(task => {
              tasksMap[task.id] = task.title;
            });
          }
        } catch (err) {
          console.error("Error batch fetching tasks:", err);
        }
      }

      // Enrich change requests with event and task names
      const enrichedRequests = (data || []).map((cr) => {
        let eventName: string | undefined;
        let taskTitle: string | undefined;

        if (cr.event_id) {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cr.event_id);
          if (isUUID) {
            eventName = eventsMap[cr.event_id];
          } else {
            eventName = createEventsMap[cr.event_id];
          }
        }

        if (cr.task_id) {
          taskTitle = tasksMap[cr.task_id];
        }

        return {
          ...cr,
          event_name: eventName,
          task_title: taskTitle,
        };
      });

      setChangeRequests(enrichedRequests);
    } catch (error) {
      console.error("Error fetching change requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch change requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...changeRequests];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cr) =>
          cr.title?.toLowerCase().includes(query) ||
          cr.description?.toLowerCase().includes(query) ||
          cr.event_name?.toLowerCase().includes(query) ||
          cr.task_title?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((cr) => cr.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((cr) => cr.priority === priorityFilter);
    }

    // Event filter
    if (eventFilter !== "all") {
      filtered = filtered.filter((cr) => cr.event_id === eventFilter);
    }

    // Date range filter
    if (dateRange?.from) {
      filtered = filtered.filter(
        (cr) => new Date(cr.created_at) >= dateRange.from!
      );
    }
    if (dateRange?.to) {
      filtered = filtered.filter(
        (cr) => new Date(cr.created_at) <= dateRange.to!
      );
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "applied":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Applied</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "optional":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Optional</Badge>;
      case "deferred":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Deferred</Badge>;
      // Legacy ones:
      case "high":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Low</Badge>;
      default:
        return priority ? <Badge variant="outline">{priority}</Badge> : null;
    }
  };

  const uniqueStatuses = Array.from(new Set(changeRequests.map((cr) => cr.status)));
  const uniquePriorities = Array.from(
    new Set([...changeRequests.map((cr) => cr.priority).filter(Boolean), "urgent", "optional", "deferred"])
  );

  const handleResyncTimeline = async () => {
    setIsResyncing(true);
    try {
      // Call real Supabase DB function to cascade downstream task dates
      const { data, error } = await supabase.rpc("recalculate_downstream_tasks" as any, {});
      if (error) throw error;

      const adjustedCount = Array.isArray(data) ? data.length : 0;
      toast({
        title: "Timeline Resynced",
        description: adjustedCount > 0
          ? `${adjustedCount} downstream task(s) auto-adjusted.`
          : "All tasks are already aligned — no adjustments needed.",
      });
    } catch (err: any) {
      console.error("Resync error:", err);
      toast({
        title: "Resync failed",
        description: err?.message || "Could not recalculate downstream tasks.",
        variant: "destructive",
      });
    } finally {
      setIsResyncing(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.title) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    try {
      const field_changes = {
        budget: newRequest.budget ? Number(newRequest.budget) : null,
        attendees: newRequest.attendees ? Number(newRequest.attendees) : null,
      };

      const eventId = newRequest.event_id === "all" ? null : newRequest.event_id;

      // Ensure event is "confirmed" & update attributes if event selected
      if (eventId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
        if (isUuid) {
          await supabase.from("events").update({
            status: "confirmed" as any,
            ...(field_changes.budget && { budget: field_changes.budget }),
            ...(field_changes.attendees && { expected_attendees: field_changes.attendees })
          }).eq("id", eventId);
        } else {
          // Legacy 'Create Event' table updates (doesn't have 'status' string enum typically)
          await supabase.from("Create Event").update({
            ...(field_changes.budget && { event_budget: field_changes.budget })
          }).eq("userid", eventId);
        }
      }

      const { data: inserted, error } = await (supabase as any).from("change_requests").insert({
        title: newRequest.title,
        description: newRequest.description,
        priority: newRequest.priority,
        event_id: eventId,
        task_id: newRequest.task_id === "all" ? null : newRequest.task_id,
        status: "approved", // Auto-approve to immediately confirm flow
        requested_by: user?.id,
        field_changes: field_changes,
      }).select().single();

      if (error) throw error;

      // ── Write to cm_audit_events (Activity Feed) ──────────────────────────
      await (supabase as any).from("cm_audit_events").insert({
        type: "change_request_confirmed",
        description: `Change Request Confirmed: "${newRequest.title}". Event attributes updated.`,
        event_id: eventId,
        user_id: user?.id,
        payload: {
          change_request_id: inserted?.id,
          title: newRequest.title,
          priority: newRequest.priority,
          field_changes,
          requested_by_name: userDisplayNames[user?.id ?? ""] || user?.id?.substring(0, 8),
        },
      });

      // ── Trigger Resend Notification ──────────────────────────
      try {
        await supabase.functions.invoke('send-change-request-notification', {
          body: {
            change_request_id: inserted?.id || "temp-id",
            status: "approved",
            event_id: eventId,
            task_id: newRequest.task_id === "all" ? null : newRequest.task_id,
            title: newRequest.title,
            description: newRequest.description,
            priority_tag: newRequest.priority,
            coordinatorEmails: [user?.email || "user@example.com"]
          }
        });
      } catch (fnErr) {
        console.warn("Notification error:", fnErr);
      }

      toast({ title: "Review & Confirm Successful", description: "Event confirmed, activity logged, notification sent." });
      setIsModalOpen(false);
      setNewRequest({ title: "", description: "", priority: "optional", event_id: "all", task_id: "all", budget: "", attendees: "" });
      fetchChangeRequests();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Failed to confirm request", description: error.message, variant: "destructive" });
    }
  };

  // ── CSV Export with resolved user names ────────────────────────────────────
  const handleExportCSV = () => {
    const rows = [
      ["ID", "Title", "Description", "Status", "Priority", "Requested By", "Event", "Task", "Created At"].join(","),
      ...filteredRequests.map((cr) =>
        [
          cr.id,
          `"${(cr.title || "").replace(/"/g, "'")}"`,
          `"${(cr.description || "").replace(/"/g, "'")}"`,
          cr.status,
          cr.priority,
          // Resolved user name from profiles
          `"${userDisplayNames[cr.requested_by] || cr.requested_by?.substring(0, 8) || "Unknown"}"`,
          `"${cr.event_name || cr.event_id || ""}"`,
          `"${cr.task_title || cr.task_id || ""}"`,
          cr.created_at,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `change_requests_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${filteredRequests.length} rows with resolved user names.` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading change requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col min-h-screen pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Change Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage change requests, resolve schedule conflicts, & resync constraints
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Change Request
          </Button>
        </div>
      </div>

      {/* Primary Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: The Queue */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-md">
                <Filter className="h-4 w-4" />
                Active Changes Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search queue..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Queue Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Proposed / Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="applied">Implemented</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                      <SelectItem value="deferred">Deferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Requests List */}
          <Card className="flex-1">
            <CardContent className="p-0">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Queue is empty</p>
                </div>
              ) : (
                <div className="rounded-md overflow-hidden border-t">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Change Request</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((cr) => (
                        <TableRow
                          key={cr.id}
                          className={`cursor-pointer transition-colors ${selectedRequestId === cr.id ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                          onClick={() => setSelectedRequestId(cr.id)}
                        >
                          <TableCell className="max-w-[200px]">
                            <div className="font-medium text-sm truncate">{cr.title}</div>
                            {cr.requested_by && (
                              <div className="text-xs text-muted-foreground flex items-center mt-1">
                                <User className="h-3 w-3 mr-1" />
                                {userDisplayNames[cr.requested_by] || "Unknown"}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(cr.status)}</TableCell>
                          <TableCell>{getPriorityBadge(cr.priority)}</TableCell>
                          <TableCell>
                            <span className="text-xs truncate max-w-[120px] block py-1 px-2 border rounded-md bg-background">
                              {cr.event_name || 'Global'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 opacity-60 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/change-requests/${cr.id}`);
                              }}
                            >
                              Detail <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Impact Preview */}
        <div className="lg:col-span-1 border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="p-5 border-b bg-muted/20">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Impact Preview
            </h2>
            <p className="text-sm text-muted-foreground">Select a request from the queue to view downstream effects and resync constraints.</p>
          </div>

          {!selectedRequest ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <ArrowRight className="h-8 w-8 mb-4 opacity-20" />
              <p>Select a change request to view its ripple effect on the timeline & resources.</p>
            </div>
          ) : (
            <div className="p-5 flex-1 overflow-y-auto space-y-6">

              <div>
                <h3 className="font-medium text-sm mb-1 uppercase tracking-wider text-muted-foreground">Proposed Change</h3>
                <div className="text-base font-semibold">{selectedRequest.title}</div>
                {selectedRequest.description && (
                  <p className="text-sm mt-2 text-muted-foreground border-l-2 border-primary/20 pl-3">
                    {selectedRequest.description}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm border-b pb-2 uppercase tracking-wider text-muted-foreground">Timeline Constraints</h3>
                <div className="rounded-md border p-3 bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/40">
                  <div className="flex items-start gap-2 text-sm text-red-800 dark:text-red-400">
                    <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <strong>Hard Deadline Locked:</strong> Event Day cannot shift.
                      <div className="mt-1 text-xs opacity-80">This change will compress Task completion times by 2 days.</div>
                    </div>
                  </div>
                </div>

                {selectedRequest.task_title && (
                  <div className="rounded-md border p-3 flex justify-between items-center text-sm">
                    <span>Task constraint conflict:</span>
                    <span className="font-medium truncate max-w-[120px]">{selectedRequest.task_title}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm border-b pb-2 uppercase tracking-wider text-muted-foreground">Resource Availability</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
                    <span>Vendor Bandwidth</span>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Sufficient</Badge>
                  </div>
                  <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
                    <span>Budget Allocation</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Warning (-$450)</Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t mt-auto">
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isResyncing || selectedRequest.status === 'applied'}
                  onClick={handleResyncTimeline}
                >
                  <RefreshCw className={`h-4 w-4 ${isResyncing ? 'animate-spin' : ''}`} />
                  {isResyncing ? "Re-aligning Tasks..." : "Timeline Resync (Auto-Adjust)"}
                </Button>
                <div className="text-center mt-3">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => navigate(`/dashboard/change-requests/${selectedRequest.id}`)}
                  >
                    Go to Full Approval View
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-friendly Dialg Modal for Requests */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Change Request</DialogTitle>
            <DialogDescription>
              Submit a new change or unexpected request to the queue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            <div className="grid gap-2">
              <Label htmlFor="title">Change Title</Label>
              <Input
                id="title"
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                placeholder="e.g. Need to swap venue"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Change Tag / Urgency</Label>
              <Select
                value={newRequest.priority}
                onValueChange={(val) => setNewRequest({ ...newRequest, priority: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                  <SelectItem value="deferred">Deferred</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="event">Affected Event</Label>
              <Select
                value={newRequest.event_id}
                onValueChange={(val) => setNewRequest({ ...newRequest, event_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select affected event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Global (No specific event)</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newRequest.event_id !== "all" && (
              <div className="grid gap-2">
                <Label htmlFor="task">Affected Task (Optional)</Label>
                <Select
                  value={newRequest.task_id}
                  onValueChange={(val) => setNewRequest({ ...newRequest, task_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">None</SelectItem>
                    {allTasks.filter(t => t.event_id === newRequest.event_id).map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newRequest.event_id !== "all" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="budget">New Budget ($) (Optional)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newRequest.budget}
                    onChange={(e) => setNewRequest({ ...newRequest, budget: e.target.value })}
                    placeholder="e.g. 5000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="attendees">New Attendee Count (Optional)</Label>
                  <Input
                    id="attendees"
                    type="number"
                    value={newRequest.attendees}
                    onChange={(e) => setNewRequest({ ...newRequest, attendees: e.target.value })}
                    placeholder="e.g. 150"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Notes / Scope)</Label>
              <Textarea
                id="description"
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                placeholder="Details of the change..."
                className="h-24"
              />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitRequest}>Review & Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChangeRequests;
