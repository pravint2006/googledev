import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-lg font-bold text-primary-foreground", className)}>
      <div className="bg-primary-foreground/10 p-2 rounded-lg">
        <Leaf className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="font-headline">AgriGate Manager</span>
    </div>
  );
}
