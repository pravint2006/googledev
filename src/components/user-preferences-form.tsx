'use client';

import { useState } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function UserPreferencesForm() {
  const { updateUserProfile, isLoading: isProfileLoading } = useUserProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    waterIrrigation: '',
    waterLevel: '',
    soilType: '',
    landOwned: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields are filled
    if (
      !formData.waterIrrigation ||
      !formData.waterLevel ||
      !formData.soilType ||
      !formData.landOwned
    ) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all fields.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserProfile({
        waterIrrigation: formData.waterIrrigation as 'drip' | 'flood' | 'sprinkler' | 'manual',
        waterLevel: formData.waterLevel as 'low' | 'medium' | 'high',
        soilType: formData.soilType as 'clay' | 'sandy' | 'loamy' | 'chalky',
        landOwned: parseFloat(formData.landOwned),
        isProfileComplete: true,
      });

      toast({
        title: 'Profile Updated',
        description: 'Your preferences have been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not save your preferences. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        <CardDescription>
          Help us provide better crop recommendations by sharing your farming details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Water Irrigation */}
          <div className="space-y-2">
            <Label htmlFor="waterIrrigation" className="text-base font-medium">
              Water Irrigation Type
            </Label>
            <Select
              value={formData.waterIrrigation}
              onValueChange={(value) =>
                setFormData({ ...formData, waterIrrigation: value })
              }
            >
              <SelectTrigger id="waterIrrigation">
                <SelectValue placeholder="Select irrigation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drip">Drip Irrigation</SelectItem>
                <SelectItem value="flood">Flood Irrigation</SelectItem>
                <SelectItem value="sprinkler">Sprinkler Irrigation</SelectItem>
                <SelectItem value="manual">Manual Watering</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Water Level */}
          <div className="space-y-2">
            <Label htmlFor="waterLevel" className="text-base font-medium">
              Water Availability Level
            </Label>
            <Select
              value={formData.waterLevel}
              onValueChange={(value) =>
                setFormData({ ...formData, waterLevel: value })
              }
            >
              <SelectTrigger id="waterLevel">
                <SelectValue placeholder="Select water level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Scarce water resources)</SelectItem>
                <SelectItem value="medium">Medium (Adequate water supply)</SelectItem>
                <SelectItem value="high">High (Abundant water)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Soil Type */}
          <div className="space-y-2">
            <Label htmlFor="soilType" className="text-base font-medium">
              Soil Type
            </Label>
            <Select
              value={formData.soilType}
              onValueChange={(value) =>
                setFormData({ ...formData, soilType: value })
              }
            >
              <SelectTrigger id="soilType">
                <SelectValue placeholder="Select soil type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clay">Clay Soil</SelectItem>
                <SelectItem value="sandy">Sandy Soil</SelectItem>
                <SelectItem value="loamy">Loamy Soil</SelectItem>
                <SelectItem value="chalky">Chalky Soil</SelectItem>
                <SelectItem value="silt">Silt Soil</SelectItem>
                <SelectItem value="peaty">Peaty Soil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Land Owned */}
          <div className="space-y-2">
            <Label htmlFor="landOwned" className="text-base font-medium">
              Land Owned (in acres)
            </Label>
            <Input
              id="landOwned"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g., 10.5"
              value={formData.landOwned}
              onChange={(e) =>
                setFormData({ ...formData, landOwned: e.target.value })
              }
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting || isProfileLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
