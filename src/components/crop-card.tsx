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
  let crop = getCropByName(cropName);

  // If crop not found, try fuzzy matching (check if the crop name is a substring or partial match)
  if (!crop) {
    const lowerCropName = cropName.toLowerCase().trim();
    const matchedCrop = [
      { name: 'Wheat', keywords: ['wheat', 'rabi'] },
      { name: 'Rice', keywords: ['rice', 'paddy'] },
      { name: 'Cotton', keywords: ['cotton'] },
      { name: 'Sugarcane', keywords: ['sugarcane', 'sugar cane', 'sugar'] },
      { name: 'Corn (Maize)', keywords: ['corn', 'maize'] },
      { name: 'Chickpea (Gram)', keywords: ['chickpea', 'gram', 'chick pea'] },
      { name: 'Mustard', keywords: ['mustard'] },
      { name: 'Potato', keywords: ['potato'] },
      { name: 'Onion', keywords: ['onion'] },
      { name: 'Tomato', keywords: ['tomato'] },
      { name: 'Lentil', keywords: ['lentil', 'daal', 'dal'] },
      { name: 'Soybean', keywords: ['soybean', 'soya'] },
    ].find(item => item.keywords.some(keyword => lowerCropName.includes(keyword) || keyword.includes(lowerCropName)));

    if (matchedCrop) {
      crop = getCropByName(matchedCrop.name);
    }
  }

  // Create fallback crop object if still not found
  const displayCrop: CropData = crop || {
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

  return (
    <Card
      className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group h-full flex flex-col hover:scale-105"
      onClick={() => onSelect(displayCrop)}
    >
      <div className="relative h-40 w-full bg-gray-200 overflow-hidden flex-shrink-0">
        <Image
          src={displayCrop.image}
          alt={displayCrop.name}
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
          {displayCrop.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {displayCrop.description}
        </p>

        <div className="space-y-2 text-xs mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              Water:
            </span>
            <Badge variant="outline" className="capitalize text-xs">
              {displayCrop.waterRequirement}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Plant:
            </span>
            <Badge variant="outline" className="text-xs">
              {displayCrop.plantingPeriod}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
