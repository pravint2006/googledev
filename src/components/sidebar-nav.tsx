'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Tractor,
  PlusCircle,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/advisor', label: 'AI Advisor', icon: MessageSquare },
    { href: '/farms', label: 'Farms', icon: Tractor },
    { href: '/farms/new', label: 'Add Farm', icon: PlusCircle },
];


export default function SidebarNav() {
    const pathname = usePathname();

    return (
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map(link => (
                 <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "transition-colors hover:text-foreground/80",
                        pathname.startsWith(link.href) ? "text-foreground" : "text-foreground/60"
                    )}
                >
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}
