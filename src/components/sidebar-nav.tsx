
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Tractor,
  PlusCircle,
  LogOut,
  Settings,
} from 'lucide-react';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/app-logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Button } from './ui/button';

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Simulate logout
    router.push('/login');
  };

  return (
    <>
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              href="/dashboard"
              isActive={pathname === '/dashboard'}
              tooltip="Dashboard"
            >
              <LayoutDashboard />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              href="/farms"
              isActive={pathname.startsWith('/farms')}
              tooltip="Farms"
            >
              <Tractor />
              <span>Farms</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              href="/farms/new"
              isActive={pathname === '/farms/new'}
              tooltip="Add New Farm"
            >
              <PlusCircle />
              <span>Add Farm</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
                     <Settings className="h-5 w-5" />
                     <span className="text-sm">Settings</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className='w-56'>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </SidebarFooter>
    </>
  );
}
