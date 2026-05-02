import MerchantSidebar from '@/components/MerchantSidebar';

export default function MerchantLayout({ children }) {
  return (
    <div className="bg-background text-text antialiased flex min-h-screen">
      <MerchantSidebar />
      <div className="flex-1 flex flex-col md:ml-60 min-h-screen pb-24 md:pb-0">
        {children}
      </div>
    </div>
  );
}
