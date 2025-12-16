'use client';

import { useState, useRef, MouseEvent } from 'react';
import Image from 'next/image';
import { MapPin, X } from 'lucide-react';
import { type GateValve } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface MapPickerProps {
  isEditable: boolean;
  valves: GateValve[];
  setValves?: (valves: GateValve[]) => void;
  valveCount?: number;
  mapImageUrl: string;
  mapImageHint: string;
}

export default function MapPicker({
  isEditable,
  valves,
  setValves,
  valveCount,
  mapImageUrl,
  mapImageHint,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!isEditable || !mapRef.current || !setValves || (valveCount !== undefined && valves.length >= valveCount)) {
      return;
    }

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newValve: GateValve = {
      id: `new-valve-${Date.now()}`,
      name: `Valve ${valves.length + 1}`,
      status: 'closed',
      position: { x, y },
    };
    setValves([...valves, newValve]);
  };

  const handleValveNameChange = (id: string, newName: string) => {
    if (!setValves) return;
    setValves(valves.map(v => v.id === id ? { ...v, name: newName } : v));
  };
  
  const removeValve = (id: string) => {
    if (!setValves) return;
    setValves(valves.filter(v => v.id !== id));
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted" ref={mapRef} onClick={handleMapClick}>
      <Image
        src={mapImageUrl}
        alt="Farm satellite view"
        fill
        className="object-cover"
        data-ai-hint={mapImageHint}
      />
      {valves.map(valve => (
        <ValveMarker 
            key={valve.id} 
            valve={valve} 
            isEditable={isEditable} 
            onNameChange={handleValveNameChange}
            onRemove={removeValve}
        />
      ))}
      {isEditable && (
        <div className="absolute top-2 left-2 bg-background/80 text-foreground px-3 py-1.5 rounded-lg text-sm font-medium shadow-md">
            Click on the map to place a valve. Placed: {valves.length} / {valveCount}
        </div>
      )}
    </div>
  );
}


function ValveMarker({ valve, isEditable, onNameChange, onRemove }: { valve: GateValve, isEditable: boolean, onNameChange: (id: string, name: string) => void, onRemove: (id: string) => void }) {
    const [name, setName] = useState(valve.name);
    
    const handleSave = () => {
        onNameChange(valve.id, name);
    };

    const content = (
        <div 
            className="absolute -translate-x-1/2 -translate-y-full" 
            style={{ left: `${valve.position.x}%`, top: `${valve.position.y}%` }}
        >
            <MapPin className={cn(
                "h-8 w-8 text-primary drop-shadow-lg", 
                isEditable ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default",
                valve.status === 'open' ? 'text-green-500 fill-green-500/30' : 'text-red-500 fill-red-500/30'
            )} />
        </div>
    );
    
    if (isEditable) {
        return (
            <Popover>
                <PopoverTrigger asChild>{content}</PopoverTrigger>
                <PopoverContent className="w-60">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Edit Valve</h4>
                            <p className="text-sm text-muted-foreground">
                                Set a name for this gate valve.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Input 
                                id="name" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-2 h-8"
                            />
                        </div>
                         <div className="flex justify-between">
                            <Button variant="destructive" size="sm" onClick={() => onRemove(valve.id)}>
                                <X className="h-4 w-4 mr-1" /> Remove
                            </Button>
                            <Button size="sm" onClick={handleSave}>Save</Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent>
                <p>{valve.name} - <span className={cn(valve.status === 'open' ? 'text-green-500' : 'text-red-500')}>{valve.status}</span></p>
            </TooltipContent>
        </Tooltip>
    );
}

