import { redirect } from 'next/navigation';

export default function MerchantLiveMonitorAliasPage() {
  redirect('/merchant/orders?view=live-monitor');
}
