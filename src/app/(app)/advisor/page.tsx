'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AICropAdvisorChat } from '@/components/ai-crop-advisor-chat';
import { CropData, getCropByName } from '@/lib/crops-database';

export default function AdvisorPage() {
  const searchParams = useSearchParams();
  const cropNameParam = searchParams.get('crop');
  const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null);

  useEffect(() => {
    if (cropNameParam) {
      const crop = getCropByName(cropNameParam);
      if (crop) {
        setSelectedCrop(crop);
      }
    }
  }, [cropNameParam]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          AI Crop Advisor
        </h1>
        <p className="text-muted-foreground">
          Get expert advice on crop planning and farming practices
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AICropAdvisorChat 
            selectedCrop={selectedCrop} 
            onCropSelected={() => setSelectedCrop(null)} 
          />
        </div>
        
        {selectedCrop && (
          <div className="lg:col-span-4">
            <div className="bg-card border rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Selected Crop</h2>
              <div className="space-y-4">
                <div className="relative h-48 w-full bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={selectedCrop.image} 
                    alt={selectedCrop.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">{selectedCrop.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{selectedCrop.description}</p>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-1">Water Requirement</p>
                    <p className="font-semibold capitalize">{selectedCrop.waterRequirement}</p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-1">Planting Period</p>
                    <p className="font-semibold">{selectedCrop.plantingPeriod}</p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-1">Season</p>
                    <p className="font-semibold">{selectedCrop.season}</p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-1">Soil Types</p>
                    <p className="font-semibold">{selectedCrop.soilType.join(', ') || 'Various'}</p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-1">Irrigation Methods</p>
                    <p className="font-semibold">{selectedCrop.irrigationType.join(', ') || 'Various'}</p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-1">Yield per Acre</p>
                    <p className="font-semibold text-green-600">{selectedCrop.yieldPerAcre}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
