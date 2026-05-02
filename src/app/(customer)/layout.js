import BottomNav from '@/components/BottomNav';

export default function CustomerLayout({ children }) {
  return (
    <div className="bg-background text-text font-body-md antialiased min-h-screen pb-24 xl:pb-0">
      {children}
      <BottomNav />
    </div>
  );
}