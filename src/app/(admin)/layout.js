import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="bg-background text-text font-body-md antialiased min-h-screen pb-[80px] md:pb-0">
      <AdminSidebar />
      <div className="flex-1 md:ml-60">
        {children}
      </div>
    </div>
  );
}
