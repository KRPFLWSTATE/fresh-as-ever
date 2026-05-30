-- Shelf publish push notifications (7.8): prefs column, device tokens, async queue + trigger.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL
  DEFAULT '{"push": true, "email": true, "sms": false}'::jsonb;

COMMENT ON COLUMN public.profiles.notification_prefs IS
  'Customer alert preferences: push, email, sms (booleans).';

CREATE TABLE IF NOT EXISTS public.push_device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS push_device_tokens_user_id_idx
  ON public.push_device_tokens (user_id);

ALTER TABLE public.push_device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push tokens" ON public.push_device_tokens;
CREATE POLICY "Users manage own push tokens"
  ON public.push_device_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.shelf_publish_notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_id uuid NOT NULL REFERENCES public.clearance_shelves (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error text
);

CREATE INDEX IF NOT EXISTS shelf_publish_notification_queue_pending_idx
  ON public.shelf_publish_notification_queue (created_at)
  WHERE processed_at IS NULL;

ALTER TABLE public.shelf_publish_notification_queue ENABLE ROW LEVEL SECURITY;

-- Only service role / SECURITY DEFINER paths touch the queue.
DROP POLICY IF EXISTS "No direct client access to shelf publish queue"
  ON public.shelf_publish_notification_queue;
CREATE POLICY "No direct client access to shelf publish queue"
  ON public.shelf_publish_notification_queue
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.queue_shelf_publish_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published'
    AND (
      TG_OP = 'INSERT'
      OR COALESCE(OLD.status, '') IS DISTINCT FROM 'published'
    )
  THEN
    INSERT INTO public.shelf_publish_notification_queue (shelf_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_queue_shelf_publish_notification ON public.clearance_shelves;
CREATE TRIGGER trg_queue_shelf_publish_notification
  AFTER INSERT OR UPDATE OF status ON public.clearance_shelves
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_shelf_publish_notification();

COMMENT ON TABLE public.push_device_tokens IS
  'Expo push tokens per signed-in customer device.';
COMMENT ON TABLE public.shelf_publish_notification_queue IS
  'Outbound jobs when a clearance shelf is first published; processed by notify-shelf-published Edge Function.';
