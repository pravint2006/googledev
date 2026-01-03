
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Settings,
  LayoutDashboard,
  Tractor,
  PlusCircle,
  Menu,
  Loader2,
  UserCircle,
  Cpu,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import { AppLogo } from './app-logo';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/farms', label: 'Farms', icon: Tractor },
  { href: '/hardware', label: 'Hardware', icon: Cpu },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();
  const auth = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoggedIn = !!user;

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <AppLogo />
        {isLoggedIn && (
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname === link.href
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex flex-1 items-center justify-end gap-4">
          {/* Mobile Menu */}
          {isLoggedIn && (
             <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className='mb-6'>
                  <AppLogo />
                </div>
                <nav className="grid gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
                        pathname === link.href
                          ? 'bg-muted text-primary'
                          : 'text-muted-foreground hover:text-primary'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}
                   <Link
                      href="/farms/new"
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
                        pathname === "/farms/new"
                          ? 'bg-muted text-primary'
                          : 'text-muted-foreground hover:text-primary'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Farm
                    </Link>
                </nav>
              </SheetContent>
            </Sheet>
          )}

          {/* User Menu */}
          {loading ? (
             <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                  <Avatar className="size-9">
                    {user ? (
                      <>
                        <AvatarImage
                          src={user.photoURL ?? ''}
                          alt="User Avatar"
                        />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback><UserCircle /></AvatarFallback>
                    )}
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56">
                <DropdownMenuLabel className='font-normal'>
                   <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || ''}
                      </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
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
          ) : (
            <Button asChild variant='ghost'>
              <Link href="/login">Log In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
