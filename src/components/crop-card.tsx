'use client';

import { CropData, getCropByName } from '@/lib/crops-database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Droplets, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CropCardProps {
  cropName: string;
  waterRequirement: string;
  plantingPeriod: string;
  onSelect: (crop: CropData) => void;
}

export function CropCard({
  cropName,
  waterRequirement,
  plantingPeriod,
  onSelect,
}: CropCardProps) {
  const crop = getCropByName(cropName);

  if (!crop) {
    // Fallback for crops not in database
    return (
      <Card
        className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group h-full flex flex-col"
        onClick={() => {
          // Create a minimal crop object
          const minimalCrop: CropData = {
            id: cropName.toLowerCase().replace(/\s+/g, '-'),
            name: cropName,
            image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop',
            description: `Learn more about planting ${cropName}`,
            waterRequirement: (waterRequirement.toLowerCase() as 'low' | 'medium' | 'high') || 'medium',
            plantingPeriod: plantingPeriod || 'N/A',
            season: 'Varies',
            soilType: [],
            irrigationType: [],
            yieldPerAcre: 'Varies',
          };
          onSelect(minimalCrop);
        }}
      >
        <div className="bg-gradient-to-br from-green-100 to-green-50 h-40 w-full flex items-center justify-center group-hover:from-green-200 group-hover:to-green-100 transition-colors">
          <div className="text-6xl">🌾</div>
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-lg mb-3 text-center line-clamp-2 text-gray-800">
            {cropName}
          </h3>
          <div className="flex flex-col gap-2 mt-auto">
            <Badge variant="outline" className="flex items-center gap-1 justify-center">
              <Droplets className="h-3 w-3" />
              {waterRequirement}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 justify-center">
              <Calendar className="h-3 w-3" />
              {plantingPeriod}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group h-full flex flex-col hover:scale-105"
      onClick={() => onSelect(crop)}
    >
      <div className="relative h-40 w-full bg-gray-200 overflow-hidden flex-shrink-0">
        <Image
          src={crop.image}
          alt={crop.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            // Fallback for failed images
            const element = e.target as HTMLImageElement;
            element.style.display = 'none';
          }}
        />
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900">
          {crop.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {crop.description}
        </p>

        <div className="space-y-2 text-xs mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              Water:
            </span>
            <Badge variant="outline" className="capitalize text-xs">
              {crop.waterRequirement}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Plant:
            </span>
            <Badge variant="outline" className="text-xs">
              {crop.plantingPeriod}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
