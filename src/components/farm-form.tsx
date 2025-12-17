
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFarmStore } from '@/hooks/use-farm-store';
import { type GateValve, type Farm } from '@/lib/data';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';
import { GeoPoint } from 'firebase/firestore';
import MapPicker from './map-picker';

const formSchema = z.object({
  farmName: z.string().min(3, 'Farm name must be at least 3 characters.'),
  valveCount: z.coerce.number().min(1, 'You must have at least 1 valve.').max(20, 'Maximum 20 valves allowed.'),
});

type FormData = z.infer<typeof formSchema>;

export default function FarmForm() {
  const [step, setStep] = useState(1);
  const [valves, setValves] = useState<GateValve[]>([]);
  const router = useRouter();
  const { addFarm, isSubmitting: isStoreSubmitting } = useFarmStore();
  const { toast } = useToast();
  const [farmLocation, setFarmLocation] = useState<GeoPoint | null>(null);

  const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      farmName: '',
      valveCount: 1,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  const onFirstStepSubmit = () => {
    // Create dummy valves since map is disabled
    const newValves = Array.from({ length: watchedValues.valveCount }, (_, i) => ({
      id: `valve-${i + 1}`,
      name: `Valve ${i + 1}`,
      status: 'closed' as const,
      position: { lat: 0, lng: 0 },
    }));
    setValves(newValves);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleFinalSubmit = async () => {
    if (!farmLocation) {
        toast({
            variant: "destructive",
            title: "Location not set",
            description: "Please click on the map to set your farm's location.",
        });
        return;
    }

    const newFarmData: Omit<Farm, 'id'> = {
        name: watchedValues.farmName,
        location: farmLocation,
        gateValves: valves,
    };
    
    await addFarm(newFarmData);
    
    toast({
        title: "Farm Saved!",
        description: "Your new farm has been created successfully."
    });

    router.push('/farms');
  };

  const progressValue = (step / 2) * 100;
  
  const isSaveDisabled = isStoreSubmitting || !farmLocation;

  return (
    <Card>
      <CardHeader>
        <Progress value={progressValue} className="mb-4 h-2" />
        <CardTitle className="font-headline">Step {step}: {step === 1 ? 'Farm Details' : 'Set Location'}</CardTitle>
        <CardDescription>
            {step === 1 
                ? 'Provide a name and the number of valves for your new farm.' 
                : "Click on the map to pinpoint your farm's location."}
        </CardDescription>
      </CardHeader>
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
            >
                {step === 1 && (
                    <form onSubmit={handleSubmit(onFirstStepSubmit)}>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="farmName">Farm Name</Label>
                                <Controller
                                    name="farmName"
                                    control={control}
                                    render={({ field }) => <Input {...field} placeholder="e.g., Green Valley" />}
                                />
                                {errors.farmName && <p className="text-sm font-medium text-destructive mt-1">{errors.farmName.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="valveCount">Number of Gate Valves</Label>
                                <Controller
                                    name="valveCount"
                                    control={control}
                                    render={({ field }) => <Input {...field} type="number" min="1" max="20" />}
                                />
                                {errors.valveCount && <p className="text-sm font-medium text-destructive mt-1">{errors.valveCount.message}</p>}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button type="submit" disabled={!isValid}>Next</Button>
                        </CardFooter>
                    </form>
                )}

                {step === 2 && (
                    <>
                        <CardContent>
                             <p className='text-sm text-muted-foreground mb-4'>Step 2: Please place the pin on the map below.</p>
                            <div className="w-full h-96">
                                <MapPicker onLocationSelect={(geoPoint) => setFarmLocation(geoPoint)} />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" onClick={handleBack} disabled={isStoreSubmitting}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button onClick={handleFinalSubmit} disabled={isSaveDisabled}>
                                {isStoreSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isStoreSubmitting ? 'Saving...' : 'Save Farm'}
                            </Button>
                        </CardFooter>
                    </>
                )}
            </motion.div>
      </AnimatePresence>
    </Card>
  );
}
