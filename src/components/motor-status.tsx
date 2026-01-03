
'use client';

import { type Motor } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Zap, ZapOff } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface MotorStatusProps {
  motor: Motor;
  onToggle: () => void;
  disabled?: boolean;
}

export default function MotorStatus({ motor, onToggle, disabled = false }: MotorStatusProps) {
  const isChecked = motor.status === 'on';

  return (
    <Card className={cn(
        "transition-colors", 
        isChecked ? 'bg-primary/10 border-primary/40' : 'bg-muted/50',
        disabled && 'bg-muted/30 border-dashed'
    )}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
              "p-2 rounded-full transition-colors", 
              isChecked ? 'bg-primary/20' : 'bg-muted'
          )}>
            {isChecked 
              ? <Zap className="h-5 w-5 text-primary" />
              : <ZapOff className="h-5 w-5 text-muted-foreground" />
            }
          </div>
          <div>
            <p className={cn("font-medium", disabled && 'text-muted-foreground')}>{motor.name}</p>
            <p className={cn(
                "text-sm font-semibold transition-colors", 
                isChecked ? 'text-primary' : 'text-muted-foreground'
            )}>
              {motor.status.charAt(0).toUpperCase() + motor.status.slice(1)}
            </p>
          </div>
        </div>
        <Switch
          checked={isChecked}
          onCheckedChange={onToggle}
          aria-label={`Toggle motor ${motor.name}`}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}

    