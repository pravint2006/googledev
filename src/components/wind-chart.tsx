
'use client';

import { format, parseISO } from 'date-fns';
import { ArrowDown } from 'lucide-react';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { cn } from '@/lib/utils';

interface WindData {
  time: string;
  speed: number;
  direction: number;
}

interface WindChartProps {
  data: WindData[];
}

// Calculate a scaling factor for the arrow size based on wind speed
const getScale = (speed: number) => {
    if (speed < 5) return 0.8;
    if (speed < 15) return 1.0;
    if (speed < 25) return 1.2;
    return 1.4;
};

export function WindChart({ data }: WindChartProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex w-max space-x-6 px-4 py-2">
        {data.map((hour, index) => {
          // Show time label for every 3rd hour
          const showTime = index % 3 === 0;

          return (
            <div key={hour.time} className="flex flex-col items-center gap-3">
              <div className="text-xs text-slate-400 font-medium h-4">
                  {showTime ? `${hour.speed} km/h` : ''}
              </div>
              <div className="h-8 flex items-center">
                  <ArrowDown
                      className="text-slate-300 transition-transform duration-500"
                      style={{
                          transform: `rotate(${hour.direction}deg) scale(${getScale(hour.speed)})`,
                      }}
                      size={20}
                  />
              </div>
              <div className={cn("text-sm h-4", showTime ? "text-slate-200" : "text-transparent")}>
                  {showTime ? format(parseISO(hour.time), 'ha').toLowerCase() : '0am'}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="mt-2" />
    </ScrollArea>
  );
}
