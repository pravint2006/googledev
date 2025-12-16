import SidebarNav from '@/components/sidebar-nav';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="md:hidden p-2 flex items-center bg-card border-b">
         <SidebarTrigger />
         <h1 className="text-lg font-semibold ml-2">AgriGate Manager</h1>
      </div>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon" className="hidden md:flex">
          <SidebarRail />
          <SidebarNav />
        </Sidebar>
        <Sidebar className="md:hidden">
            <SidebarNav />
        </Sidebar>
        <main className="flex-1 bg-background">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
