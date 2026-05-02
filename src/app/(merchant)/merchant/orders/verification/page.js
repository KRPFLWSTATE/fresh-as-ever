import { redirect } from 'next/navigation';

export default function MerchantOrdersVerificationAliasPage() {
  redirect('/merchant/orders?view=verification');
}
