import { redirect } from 'next/navigation';

export default function SoldOutStatePage() {
  redirect('/discover/sold-out');
}
