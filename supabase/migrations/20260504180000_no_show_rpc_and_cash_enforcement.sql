-- Enforce: cash payment only after at least one completed (collected) pickup.
CREATE OR REPLACE FUNCTION public.orders_enforce_cash_pickup_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  n integer;
BEGIN
  IF NEW.payment_method IS DISTINCT FROM 'cash' THEN
    RETURN NEW;
  END IF;

  SELECT count(*)::int INTO n
  FROM public.orders o
  WHERE o.customer_id = NEW.customer_id
    AND o.order_status = 'collected';

  IF n >= 1 THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'cash_pickup_requires_history'
    USING MESSAGE = 'Complete your first pickup to unlock cash at pickup.',
          HINT = 'Use card payment or complete one collected order first.';
END;
$$;

DROP TRIGGER IF EXISTS orders_enforce_cash_pickup_bi ON public.orders;

CREATE TRIGGER orders_enforce_cash_pickup_bi
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_enforce_cash_pickup_history();


-- Merchant marks no-show: grace period + profile/notifications (SECURITY DEFINER for notification inserts).
CREATE OR REPLACE FUNCTION public.mark_order_no_show(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_outlet uuid;
  v_customer uuid;
  v_status text;
  v_pickup_end timestamptz;
  v_old_ns integer;
  v_new_ns integer;
  v_is_suspended boolean;
  v_name text;
  v_updated integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT o.outlet_id, o.customer_id, o.order_status, rb.pickup_end
  INTO v_outlet, v_customer, v_status, v_pickup_end
  FROM public.orders o
  JOIN public.rescue_bags rb ON rb.id = o.bag_id
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF NOT public.is_merchant_staff_for_outlet(v_outlet) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF lower(trim(v_status)) = 'no_show' THEN
    RETURN jsonb_build_object('ok', true, 'already_no_show', true);
  END IF;

  IF lower(trim(v_status)) NOT IN ('paid', 'ready_for_pickup', 'awaiting_pickup') THEN
    RAISE EXCEPTION 'invalid_order_status_for_no_show';
  END IF;

  IF v_pickup_end IS NULL THEN
    RAISE EXCEPTION 'missing_pickup_end';
  END IF;

  IF now() < (v_pickup_end + interval '30 minutes') THEN
    RAISE EXCEPTION 'pickup_grace_period_active'
      USING MESSAGE = 'Available 30 minutes after pickup window closes';
  END IF;

  UPDATE public.orders
  SET order_status = 'no_show', updated_at = now()
  WHERE id = p_order_id AND lower(trim(order_status)) <> 'no_show';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN jsonb_build_object('ok', true, 'already_no_show', true);
  END IF;

  SELECT COALESCE(no_show_count, 0)
  INTO v_old_ns
  FROM public.profiles
  WHERE id = v_customer
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'customer_profile_not_found';
  END IF;

  UPDATE public.profiles p
  SET
    no_show_count = COALESCE(p.no_show_count, 0) + 1,
    is_suspended = COALESCE(p.is_suspended, false)
      OR (COALESCE(p.no_show_count, 0) + 1 >= 5),
    updated_at = now()
  WHERE p.id = v_customer
  RETURNING p.no_show_count, p.is_suspended INTO v_new_ns, v_is_suspended;

  SELECT COALESCE(TRIM(full_name), 'Customer')
  INTO v_name
  FROM public.profiles
  WHERE id = v_customer;

  IF v_name IS NULL OR v_name = '' THEN
    v_name := 'Customer';
  END IF;

  IF v_old_ns < 3 AND v_new_ns >= 3 THEN
    INSERT INTO public.notifications (user_id, title, body, type, is_read, created_at)
    SELECT
      p.id,
      'No-show alert',
      format('Customer %s has reached 3 no-shows', v_name),
      'no_show_alert',
      false,
      now()
    FROM public.profiles p
    WHERE p.role = 'admin';
  END IF;

  IF v_old_ns < 5 AND v_new_ns >= 5 THEN
    INSERT INTO public.notifications (user_id, title, body, type, is_read, created_at)
    VALUES (
      v_customer,
      'Account suspended',
      'Your account has been temporarily suspended due to repeated missed pickups. Contact support to appeal.',
      'account_warning',
      false,
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'no_show_count', v_new_ns,
    'is_suspended', COALESCE(v_is_suspended, false)
  );
END;
$$;

COMMENT ON FUNCTION public.mark_order_no_show(uuid) IS
  'Merchant staff: marks order no_show after pickup_end + 30m; increments profile counters; notifies admins at 3 and customer at 5.';

REVOKE ALL ON FUNCTION public.mark_order_no_show(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_order_no_show(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.orders_enforce_cash_pickup_history() FROM PUBLIC;
