import Header from '@/components/header';
import SidebarNav from '@/components/sidebar-nav';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
} from '@/components/ui/sidebar';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarRail>
          <SidebarNav />
        </SidebarRail>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">
          <Header />
          <div className="mx-auto max-w-7xl mt-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
