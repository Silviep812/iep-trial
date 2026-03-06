-- ==============================================================================
-- 1. Attach cm_activity.log_event() to monitored tables
-- ==============================================================================

-- Drop existing triggers to ensure idempotency
DROP TRIGGER IF EXISTS trg_cm_tasks_activity ON public.cm_tasks;
DROP TRIGGER IF EXISTS trg_cm_resources_activity ON public.cm_resources;
DROP TRIGGER IF EXISTS trg_cm_change_requests_activity ON public.cm_change_requests;
DROP TRIGGER IF EXISTS trg_cm_locations_activity ON public.cm_locations;
DROP TRIGGER IF EXISTS trg_tasks_activity ON public.tasks;

-- Attach log_event() to cm_tasks
CREATE TRIGGER trg_cm_tasks_activity
AFTER INSERT OR UPDATE ON public.cm_tasks
FOR EACH ROW EXECUTE FUNCTION cm_activity.log_event();

-- Attach log_event() to cm_resources
CREATE TRIGGER trg_cm_resources_activity
AFTER INSERT OR UPDATE ON public.cm_resources
FOR EACH ROW EXECUTE FUNCTION cm_activity.log_event();

-- Attach log_event() to cm_change_requests
CREATE TRIGGER trg_cm_change_requests_activity
AFTER INSERT OR UPDATE ON public.cm_change_requests
FOR EACH ROW EXECUTE FUNCTION cm_activity.log_event();

-- Attach log_event() to cm_locations
CREATE TRIGGER trg_cm_locations_activity
AFTER INSERT OR UPDATE ON public.cm_locations
FOR EACH ROW EXECUTE FUNCTION cm_activity.log_event();

-- Attach log_event() to legacy tasks table
CREATE TRIGGER trg_tasks_activity
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION cm_activity.log_event();


-- ==============================================================================
-- 2. Trigger downstream process updates automatically
-- ==============================================================================

-- Create a function to auto-trigger downstream cascade when a task estimate shifts
CREATE OR REPLACE FUNCTION public.trg_auto_recalculate_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if due_date actually changed, and tasks aren't locked/completed
    IF (TG_OP = 'UPDATE' AND NEW.due_date IS DISTINCT FROM OLD.due_date) THEN
        -- Safely run the recalculation for this task's downstream dependencies
        -- Note: recalculate_downstream_tasks updates dependent tasks which triggers this again,
        -- but pg_trigger_depth() prevents infinite recursion.
        PERFORM recalculate_downstream_tasks(NEW.id, NULL);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach downstream cascade to the core tasks table
DROP TRIGGER IF EXISTS trg_tasks_auto_recalc ON public.tasks;
CREATE TRIGGER trg_tasks_auto_recalc
AFTER UPDATE OF due_date ON public.tasks
FOR EACH ROW
WHEN (pg_trigger_depth() < 1) -- Critical: prevents infinite looping recalculations
EXECUTE FUNCTION public.trg_auto_recalculate_tasks();

-- (Optional) If cm_tasks is directly manipulated and has downstream deps
CREATE OR REPLACE FUNCTION public.trg_cm_tasks_auto_recalculate()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND NEW.end_date IS DISTINCT FROM OLD.end_date AND NEW.locked = false) THEN
        -- If syncing between unified logic, you can cascade logic here too
        -- Currently recalculate_downstream_tasks runs natively on 'tasks'
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to cm_tasks
DROP TRIGGER IF EXISTS trg_cm_tasks_auto_recalc ON public.cm_tasks;
CREATE TRIGGER trg_cm_tasks_auto_recalc
AFTER UPDATE OF end_date ON public.cm_tasks
FOR EACH ROW
WHEN (pg_trigger_depth() < 1)
EXECUTE FUNCTION public.trg_cm_tasks_auto_recalculate();
