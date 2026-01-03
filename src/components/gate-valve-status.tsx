
'use client';

import { type GateValve } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Power, PowerOff, Clock, Timer } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';

interface GateValveStatusProps {
  valve: GateValve;
  onToggle: () => void;
  onSetTimer: () => void;
  disabled?: boolean;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function GateValveStatus({ valve, onToggle, onSetTimer, disabled = false }: GateValveStatusProps) {
  const isChecked = valve.status === 'open';
  const isTimerActive = valve.timer?.isActive ?? false;

  const switchComponent = (
     <Switch
        checked={isChecked}
        onCheckedChange={onToggle}
        aria-label={`Toggle valve ${valve.name}`}
        disabled={disabled || isTimerActive}
      />
  );

  return (
    <Card className={cn(
        "transition-colors", 
        isTimerActive ? 'bg-accent/20 border-accent/50' : isChecked ? 'bg-primary/10 border-primary/40' : 'bg-muted/50',
        disabled && !isTimerActive && 'bg-muted/30 border-dashed'
    )}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
              "p-2 rounded-full transition-colors", 
              isTimerActive ? 'bg-accent/20' : isChecked ? 'bg-primary/20' : 'bg-muted'
          )}>
            {isChecked 
              ? <Power className={cn("h-5 w-5", isTimerActive ? "text-accent" : "text-primary")} />
              : <PowerOff className="h-5 w-5 text-muted-foreground" />
            }
          </div>
          <div>
            <p className={cn("font-medium", disabled && 'text-muted-foreground')}>{valve.name}</p>
            <p className={cn(
                "text-sm font-semibold transition-colors flex items-center gap-1.5", 
                isTimerActive ? 'text-accent' : isChecked ? 'text-primary' : 'text-muted-foreground'
            )}>
              {isTimerActive && <Clock className="h-3 w-3" />}
              {isTimerActive ? `Running (${formatTime(valve.timer?.remainingSeconds ?? 0)})` : valve.status.charAt(0).toUpperCase() + valve.status.slice(1)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button
            variant="ghost"
            size="icon"
            onClick={onSetTimer}
            disabled={isChecked || disabled}
            aria-label="Set timer"
            className="h-8 w-8"
          >
            <Timer className="h-4 w-4" />
          </Button>
          {disabled && !isTimerActive ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{switchComponent}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cannot close the last open valve.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            switchComponent
          )}
        </div>
      </CardContent>
    </Card>
  );
}
