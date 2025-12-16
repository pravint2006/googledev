import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function AppLogo({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2 text-lg font-bold", className)}>
      <div className="bg-primary p-2 rounded-lg">
        <Leaf className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="font-headline hidden sm:inline-block">AgriGate Manager</span>
    </Link>
  );
}
