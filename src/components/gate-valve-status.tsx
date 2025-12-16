'use client';

import { type GateValve } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Power, PowerOff } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface GateValveStatusProps {
  valve: GateValve;
  onToggle: () => void;
}

export default function GateValveStatus({ valve, onToggle }: GateValveStatusProps) {
  const isChecked = valve.status === 'open';

  return (
    <Card className={cn(
        "transition-colors", 
        isChecked ? 'bg-primary/10 border-primary/40' : 'bg-muted/50'
    )}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
              "p-2 rounded-full transition-colors", 
              isChecked ? 'bg-primary/20' : 'bg-muted'
          )}>
            {isChecked 
              ? <Power className="h-5 w-5 text-primary animate-pulse" />
              : <PowerOff className="h-5 w-5 text-muted-foreground" />
            }
          </div>
          <div>
            <p className="font-medium">{valve.name}</p>
            <p className={cn(
                "text-sm font-semibold transition-colors", 
                isChecked ? 'text-primary' : 'text-muted-foreground'
            )}>
              {valve.status.charAt(0).toUpperCase() + valve.status.slice(1)}
            </p>
          </div>
        </div>
        <Switch
          checked={isChecked}
          onCheckedChange={onToggle}
          aria-label={`Toggle valve ${valve.name}`}
        />
      </CardContent>
    </Card>
  );
}
