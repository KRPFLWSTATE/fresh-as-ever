export const CLOSED_COMPLAINT_STATUSES = ['resolved', 'closed', 'dismissed'];

export function isOpenComplaintStatus(status) {
  const s = String(status ?? '').trim().toLowerCase();
  return s.length > 0 && !CLOSED_COMPLAINT_STATUSES.includes(s);
}
