
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Tractor,
  PlusCircle,
  LogOut,
  Settings,
  MoreVertical,
} from 'lucide-react';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/app-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();

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
        <div className="flex items-center gap-3 p-2">
          <Avatar className="size-8">
            <AvatarImage
              src="https://picsum.photos/seed/user/40/40"
              alt="User Avatar"
              data-ai-hint="user avatar"
            />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div
            className={cn(
              'flex flex-col overflow-hidden text-sm transition-all',
              state === 'collapsed' ? 'w-0' : 'w-full'
            )}
          >
            <span className="font-semibold truncate">John Doe</span>
            <span className="text-sidebar-foreground/70 truncate">
              john.doe@agrifuture.com
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">User Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className='w-56'>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </>
  );
}
