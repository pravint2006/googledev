
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Settings,
  MoreVertical,
} from 'lucide-react';
import {
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    // Simulate logout
    router.push('/login');
  };

  // A simple way to get a title from the path
  const getTitle = () => {
    if (pathname.startsWith('/farms/new')) return 'New Farm';
    if (pathname.startsWith('/farms/')) return 'Farm Details';
    if (pathname.startsWith('/farms')) return 'Farms';
    if (pathname === '/dashboard') return 'Dashboard';
    return 'AgriGate Manager';
  };


  return (
    <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden"/>
            <h1 className="text-2xl font-bold font-headline tracking-tight">{getTitle()}</h1>
        </div>
        
        <div className="flex items-center gap-4">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                    <Avatar className="size-9">
                        <AvatarImage
                        src="https://picsum.photos/seed/user/40/40"
                        alt="User Avatar"
                        data-ai-hint="user avatar"
                        />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                     <div className='hidden md:flex flex-col items-start'>
                        <span className="font-semibold text-sm truncate">John Doe</span>
                        <span className="text-xs text-muted-foreground truncate">
                            john.doe@agrifuture.com
                        </span>
                     </div>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className='w-56'>
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
    </header>
  );
}
