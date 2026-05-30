import { refundPayHerePayment } from '@/lib/payhere/refundPayment';

function isPaidCardOrder(order) {
  const pm = String(order.payment_method ?? '').toLowerCase();
  const ps = String(order.payment_status ?? '').toLowerCase();
  return ps === 'paid' && pm !== 'cash';
}

/**
 * Issue refund for an order (PayHere when card + payment_id present).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} adminSb service-role client
 * @param {{ orderId: string, complaintId?: string, reason: string, actorRole: 'admin' | 'merchant', actorUserId: string }} input
 */
export async function refundOrder(adminSb, input) {
  const { orderId, complaintId, reason, actorRole, actorUserId } = input;

  const { data: order, error: orderErr } = await adminSb
    .from('orders')
    .select(
      'id, customer_id, outlet_id, total, payment_method, payment_status, order_status, payhere_payment_id, group_id',
    )
    .eq('id', orderId)
    .maybeSingle();

  if (orderErr) return { error: orderErr.message };
  if (!order) return { error: 'Order not found' };

  if (order.group_id) {
    const { data: group, error: groupErr } = await adminSb
      .from('reservation_groups')
      .select('id, total, payment_method, payment_status, order_status, payhere_payment_id')
      .eq('id', order.group_id)
      .maybeSingle();
    if (groupErr) return { error: groupErr.message };
    if (!group) return { error: 'Group reservation not found' };

    const payStatus = String(group.payment_status ?? '').toLowerCase();
    if (payStatus === 'refunded') {
      return { ok: true, alreadyRefunded: true };
    }

    if (isPaidCardOrder(group)) {
      const paymentId = group.payhere_payment_id;
      if (paymentId) {
        const ph = await refundPayHerePayment({
          paymentId: String(paymentId),
          description: reason || 'Customer refund',
        });
        if (ph.error) return { error: ph.error };
      } else if (!process.env.TESTING_ENV) {
        return {
          error:
            'Card refund unavailable — PayHere payment id missing. Contact support or retry after webhook sync.',
        };
      }
    }

    const cancelledBy = actorRole === 'admin' ? 'admin' : 'merchant';
    const { error: groupUpErr } = await adminSb
      .from('reservation_groups')
      .update({
        order_status: 'cancelled',
        payment_status: 'refunded',
      })
      .eq('id', group.id);

    if (groupUpErr) return { error: groupUpErr.message };

    const { error: childErr } = await adminSb
      .from('orders')
      .update({
        order_status: 'cancelled',
        payment_status: 'refunded',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason?.trim() || `${cancelledBy} refund via complaint`,
        cancelled_by: cancelledBy,
      })
      .eq('group_id', group.id);

    if (childErr) return { error: childErr.message };

    if (complaintId) {
      const { error: cErr } = await adminSb
        .from('complaints')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: actorUserId,
          resolution: reason?.trim() || 'Refunded and cancelled',
        })
        .eq('id', complaintId);
      if (cErr) return { error: `Group refunded but complaint update failed: ${cErr.message}` };
    }

    return { ok: true };
  }

  const payStatus = String(order.payment_status ?? '').toLowerCase();
  if (payStatus === 'refunded') {
    return { ok: true, alreadyRefunded: true };
  }

  if (isPaidCardOrder(order)) {
    const paymentId = order.payhere_payment_id;
    if (paymentId) {
      const ph = await refundPayHerePayment({
        paymentId: String(paymentId),
        description: reason || 'Customer refund',
      });
      if (ph.error) {
        return { error: ph.error };
      }
    } else if (process.env.TESTING_ENV) {
      // CI / sandbox without stored payment_id
    } else {
      return {
        error:
          'Card refund unavailable — PayHere payment id missing. Contact support or retry after webhook sync.',
      };
    }
  }

  const cancelledBy = actorRole === 'admin' ? 'admin' : 'merchant';
  const { error: upErr } = await adminSb
    .from('orders')
    .update({
      order_status: 'cancelled',
      payment_status: 'refunded',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason?.trim() || `${cancelledBy} refund via complaint`,
      cancelled_by: cancelledBy,
    })
    .eq('id', orderId);

  if (upErr) return { error: upErr.message };

  if (complaintId) {
    const { error: cErr } = await adminSb
      .from('complaints')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: actorUserId,
        resolution: reason?.trim() || 'Refunded and cancelled',
      })
      .eq('id', complaintId);
    if (cErr) return { error: `Order refunded but complaint update failed: ${cErr.message}` };
  }

  return { ok: true };
}
