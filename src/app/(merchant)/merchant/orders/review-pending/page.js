import { redirect } from 'next/navigation';

export default function MerchantOrdersReviewPendingAliasPage() {
  redirect('/merchant/orders?view=review-pending');
}
