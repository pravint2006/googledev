import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChevronRight, Droplets, AlertCircle, CheckCircle2 } from 'lucide-react';
import { type Farm } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function FarmCard({ farm }: { farm: Farm }) {
  const openValves = farm.gateValves.filter(v => v.status === 'open').length;
  const totalValves = farm.gateValves.length;
  const allValvesClosed = totalValves > 0 && openValves === 0;
  const statusColor = allValvesClosed ? 'text-red-600' : 'text-green-600';
  const bgColor = allValvesClosed ? 'bg-red-50' : 'bg-green-50';

  return (
    <Link href={`/farms/${farm.id}`} className="group">
      <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-md hover:border-green-200 overflow-hidden border-l-4 border-l-green-500">
        {/* Card Header */}
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="font-bold text-lg text-gray-900 truncate">
                {farm.name}
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1">
                A quick look at {farm.name}
              </CardDescription>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 transition-transform group-hover:translate-x-1 mt-0.5" />
          </div>
        </CardHeader>

        {/* Divider */}
        <div className="px-4 h-px bg-gray-100" />

        {/* Status Row */}
        <CardContent className="pt-4 px-4 pb-4">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg transition-colors",
            bgColor
          )}>
            {allValvesClosed ? (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                Gate Valves
              </p>
              <p className={cn(
                "text-xs mt-0.5",
                allValvesClosed 
                  ? "text-red-600 font-semibold" 
                  : "text-gray-600"
              )}>
                {allValvesClosed ? (
                  "All valves are closed"
                ) : (
                  `${openValves} of ${totalValves} open`
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
