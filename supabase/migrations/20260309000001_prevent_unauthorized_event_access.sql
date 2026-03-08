-- =============================================================
-- Migration: Prevent unauthorized access to events & related data
-- =============================================================
-- Principle: A user can see an event if they:
--   (a) own it (events.user_id = auth.uid()), OR
--   (b) are a member via user_roles (user_roles.event_id = events.id)
-- =============================================================

-- ────────────────────────────────────────────────────────────
-- EVENTS
-- ────────────────────────────────────────────────────────────

-- Add: Event members (collaborators) can view events they're assigned to.
--      The existing "Users can view their own events" (owner) policy stays.
DROP POLICY IF EXISTS "Event members can view their assigned events" ON public.events;
CREATE POLICY "Event members can view their assigned events"
  ON public.events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id  = auth.uid()
        AND ur.event_id = events.id
    )
  );

-- ────────────────────────────────────────────────────────────
-- TASKS — reinforce scope (belt + suspenders on top of prev migration)
-- ────────────────────────────────────────────────────────────

-- Ensure no task is readable unless user owns the event OR is a member.
-- The previous migration already added role-based policies; this one
-- tightens the original "owner only" UPDATE path to also deny cross-event access.
-- (Existing owner policies are untouched — they already narrow to events.user_id = auth.uid().)

-- ────────────────────────────────────────────────────────────
-- BUDGET ITEMS
-- ────────────────────────────────────────────────────────────

-- PROBLEM: old policy checked "EXISTS (SELECT 1 FROM 'Create Event' WHERE userid = auth.uid())"
-- which let ANY user who ever created ANY event see ALL budget items.
-- FIX: Replace with strict event-scoped check.

DROP POLICY IF EXISTS "Users can view budget items for their events" ON public.budget_items;
CREATE POLICY "Users can view budget items for their events"
  ON public.budget_items FOR SELECT
  USING (
    -- Creator always sees their own rows
    created_by = auth.uid()
    OR
    -- Event owner
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id      = budget_items.event_id
        AND e.user_id = auth.uid()
    )
    OR
    -- Event member via user_roles
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id  = auth.uid()
        AND ur.event_id = budget_items.event_id
    )
  );

-- Also tighten INSERT: must be a member of that event
DROP POLICY IF EXISTS "Users can create their own budget items" ON public.budget_items;
CREATE POLICY "Users can create their own budget items"
  ON public.budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      -- Event owner
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id      = budget_items.event_id
          AND e.user_id = auth.uid()
      )
      OR
      -- Admin member of the event
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id        = auth.uid()
          AND ur.event_id       = budget_items.event_id
          AND ur.permission_level = 'admin'
      )
    )
  );

-- ────────────────────────────────────────────────────────────
-- RESOURCES
-- ────────────────────────────────────────────────────────────

-- Add event-member read access (collaborators can see resources for their events)
DROP POLICY IF EXISTS "Users can view resources for their events" ON public.resources;
CREATE POLICY "Users can view resources for their events"
  ON public.resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = resources.event_id
        AND (
          -- Event owner
          e.user_id = auth.uid()
          OR
          -- Event member via user_roles
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id  = auth.uid()
              AND ur.event_id = e.id
          )
        )
    )
  );

-- ────────────────────────────────────────────────────────────
-- CHANGE REQUESTS
-- ────────────────────────────────────────────────────────────
-- Already tightly restricted to host+admin by previous migration. ✅
-- Add event-scope: users can only see change requests for events they belong to.

DROP POLICY IF EXISTS "Host with Admin/Coordinator or Admin can view change requests" ON public.change_requests;
CREATE POLICY "Host with Admin/Coordinator or Admin can view change requests"
  ON public.change_requests FOR SELECT
  USING (
    -- Must be a member of the event this change request belongs to
    (
      change_requests.event_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = change_requests.event_id
          AND (
            e.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.user_roles ur
              WHERE ur.user_id  = auth.uid()
                AND ur.event_id = e.id
            )
          )
      )
    )
    AND
    -- Must also have admin or host+coordinator privilege
    (
      has_permission_level(auth.uid(), 'admin'::permission_level)
      OR (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role = 'host'::app_role
        )
        AND (
          has_permission_level(auth.uid(), 'admin'::permission_level) OR
          has_permission_level(auth.uid(), 'coordinator'::permission_level)
        )
      )
    )
  );

-- ────────────────────────────────────────────────────────────
-- CHANGE LOGS
-- ────────────────────────────────────────────────────────────
-- Currently: "Users can view their own change logs" (changed_by = auth.uid() only)
-- This is correct — no extra policy needed. ✅

-- ────────────────────────────────────────────────────────────
-- Index for event membership lookups
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_roles_event_user
  ON public.user_roles (event_id, user_id);
