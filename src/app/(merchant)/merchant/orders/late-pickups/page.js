import { redirect } from 'next/navigation';

export default function MerchantOrdersLatePickupsAliasPage() {
  redirect('/merchant/orders?view=late-pickups');
}
