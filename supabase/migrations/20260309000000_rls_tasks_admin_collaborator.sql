-- =============================================================
-- Migration: RLS Policies for tasks table
-- Requirement: Admin/Owner = full read/write on all event tasks
--              Collaborator = read/write ONLY on tasks assigned to them
-- =============================================================
-- Role model:
--   user_roles.permission_level = 'admin'       → Admin / Owner (full access)
--   user_roles.permission_level = 'coordinator' → Collaborator  (assigned tasks only)
--   user_roles.permission_level = 'viewer'      → Read-only (not handled here)
--
-- The tasks table has:
--   event_id   FK → events
--   assigned_to  UUID  (the collaborator who is assigned)
--   created_by   UUID  (the creator)
-- =============================================================

-- ────────────────────────────────────────────────────────────
-- SELECT
-- ────────────────────────────────────────────────────────────

-- Admin / Owner: view ALL tasks in events they administrate
DROP POLICY IF EXISTS "Admins can view all tasks for their events" ON public.tasks;
CREATE POLICY "Admins can view all tasks for their events"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id    = auth.uid()
        AND ur.event_id   = tasks.event_id
        AND ur.permission_level = 'admin'
    )
  );

-- Collaborator: view ONLY tasks assigned to them for their events
DROP POLICY IF EXISTS "Collaborators can view their assigned tasks" ON public.tasks;
CREATE POLICY "Collaborators can view their assigned tasks"
  ON public.tasks FOR SELECT
  USING (
    tasks.assigned_to = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id    = auth.uid()
        AND ur.event_id   = tasks.event_id
        AND ur.permission_level IN ('coordinator', 'viewer')
    )
  );

-- ────────────────────────────────────────────────────────────
-- INSERT
-- ────────────────────────────────────────────────────────────

-- Admin / Owner: create tasks for their events
DROP POLICY IF EXISTS "Admins can create tasks for their events" ON public.tasks;
CREATE POLICY "Admins can create tasks for their events"
  ON public.tasks FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id    = auth.uid()
        AND ur.event_id   = tasks.event_id
        AND ur.permission_level = 'admin'
    )
  );

-- Collaborator (coordinator): can create tasks for their events
-- (They'll naturally be assigned to these tasks via the app)
DROP POLICY IF EXISTS "Coordinators can create tasks for their events" ON public.tasks;
CREATE POLICY "Coordinators can create tasks for their events"
  ON public.tasks FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id    = auth.uid()
        AND ur.event_id   = tasks.event_id
        AND ur.permission_level = 'coordinator'
    )
  );

-- ────────────────────────────────────────────────────────────
-- UPDATE
-- ────────────────────────────────────────────────────────────

-- Admin / Owner: update ANY task in their events
DROP POLICY IF EXISTS "Admins can update all tasks for their events" ON public.tasks;
CREATE POLICY "Admins can update all tasks for their events"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id    = auth.uid()
        AND ur.event_id   = tasks.event_id
        AND ur.permission_level = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id    = auth.uid()
        AND ur.event_id   = tasks.event_id
        AND ur.permission_level = 'admin'
    )
  );

-- Collaborator (coordinator): update ONLY tasks assigned to them
DROP POLICY IF EXISTS "Collaborators can update their assigned tasks" ON public.tasks;
CREATE POLICY "Collaborators can update their assigned tasks"
  ON public.tasks FOR UPDATE
  USING (
    tasks.assigned_to = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id    = auth.uid()
        AND ur.event_id   = tasks.event_id
        AND ur.permission_level = 'coordinator'
    )
  )
  WITH CHECK (
    tasks.assigned_to = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id    = auth.uid()
        AND ur.event_id   = tasks.event_id
        AND ur.permission_level = 'coordinator'
    )
  );

-- ────────────────────────────────────────────────────────────
-- DELETE
-- ────────────────────────────────────────────────────────────

-- Admin / Owner only: delete tasks in their events
-- Collaborators are explicitly NOT granted delete
DROP POLICY IF EXISTS "Admins can delete tasks for their events" ON public.tasks;
CREATE POLICY "Admins can delete tasks for their events"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id    = auth.uid()
        AND ur.event_id   = tasks.event_id
        AND ur.permission_level = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- Index: speed up RLS lookups on user_roles per event
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_roles_uid_event_perm
  ON public.user_roles (user_id, event_id, permission_level);
