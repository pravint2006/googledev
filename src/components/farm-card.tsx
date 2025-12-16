import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Droplets } from 'lucide-react';
import { type Farm } from '@/lib/data';

export default function FarmCard({ farm }: { farm: Farm }) {
  const openValves = farm.gateValves.filter(v => v.status === 'open').length;

  return (
    <Link href={`/farms/${farm.id}`} className="group">
      <Card className="h-full flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:border-primary/50">
        <CardHeader>
          <CardTitle className="font-headline flex items-center justify-between">
            {farm.name}
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </CardTitle>
          <CardDescription>A quick look at {farm.name}.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex items-center space-x-4 rounded-md border p-4">
            <Droplets className="h-8 w-8 text-primary" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                Gate Valves
              </p>
              <p className="text-sm text-muted-foreground">
                {openValves} of {farm.gateValves.length} valves are currently open.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Click to view details and manage valves.</p>
        </CardFooter>
      </Card>
    </Link>
  );
}
