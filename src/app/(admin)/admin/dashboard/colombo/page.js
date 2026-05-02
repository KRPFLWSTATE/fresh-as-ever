import { redirect } from 'next/navigation';

export default function AdminDashboardColomboAliasPage() {
  redirect('/admin/dashboard?view=colombo');
}
