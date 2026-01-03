
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
import { type GateValve, type Farm, type Motor } from '@/lib/data';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';
import { GeoPoint } from 'firebase/firestore';
import MapPicker from './map-picker';

const formSchema = z.object({
  farmName: z.string().min(3, 'Farm name must be at least 3 characters.'),
  valveCount: z.coerce.number().min(0, 'Valve count cannot be negative.').max(20, 'Maximum 20 valves allowed.'),
  motorCount: z.coerce.number().min(0, 'Motor count cannot be negative.').max(10, 'Maximum 10 motors allowed.'),
});

type FormData = z.infer<typeof formSchema>;

export default function FarmForm() {
  const [step, setStep] = useState(1);
  const [devices, setDevices] = useState<{ type: 'valve' | 'motor', name: string, position: { lat: number, lng: number } }[]>([]);
  const router = useRouter();
  const { addFarm, isSubmitting: isStoreSubmitting } = useFarmStore();
  const { toast } = useToast();
  const [farmLocation, setFarmLocation] = useState<GeoPoint | null>(null);

  const { control, handleSubmit, watch, getValues, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      farmName: '',
      valveCount: 1,
      motorCount: 0,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  const onFirstStepSubmit = () => {
    setDevices([]); 
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };
  
  const handleFinalSubmit = async (finalDevices: { type: 'valve' | 'motor', name: string, position: { lat: number, lng: number } }[]) => {
    const totalDevices = watchedValues.valveCount + watchedValues.motorCount;
     if (finalDevices.length < totalDevices) {
        toast({
            variant: "destructive",
            title: "Placement Incomplete",
            description: `Please place all ${totalDevices} devices on the map.`,
        });
        return;
    }
    
    const gateValves: GateValve[] = finalDevices
      .filter(d => d.type === 'valve')
      .map((valve, index) => ({
        ...valve,
        id: `valve-${Date.now()}-${index}`,
        status: 'closed' as const,
      }));
      
    const motors: Motor[] = finalDevices
      .filter(d => d.type === 'motor')
      .map((motor, index) => ({
        ...motor,
        id: `motor-${Date.now()}-${index}`,
        status: 'off' as const,
      }));

    if (finalDevices.length === 0) {
      toast({
        variant: "destructive",
        title: "No Devices Placed",
        description: "Please place at least one valve or motor on the map.",
      });
      return;
    }
    
    const avgLat = finalDevices.reduce((sum, v) => sum + v.position.lat, 0) / finalDevices.length;
    const avgLng = finalDevices.reduce((sum, v) => sum + v.position.lng, 0) / finalDevices.length;
    const centerLocation = new GeoPoint(avgLat, avgLng);
    setFarmLocation(centerLocation);

    const newFarmData: Omit<Farm, 'id'> = {
        name: watchedValues.farmName,
        location: centerLocation,
        gateValves,
        motors,
    };
    
    await addFarm(newFarmData);
    
    toast({
        title: "Farm Saved!",
        description: "Your new farm has been created successfully."
    });

    router.push('/farms');
  };

  const progressValue = (step / 2) * 100;
  
  return (
    <Card>
      <CardHeader>
        <Progress value={progressValue} className="mb-4 h-2" />
        <CardTitle className="font-headline">Step {step}: {step === 1 ? 'Farm Details' : 'Place Devices'}</CardTitle>
        <CardDescription>
            {step === 1 
                ? 'Provide a name and the number of devices for your new farm.' 
                : 'Click on the map to place your gate valves and motors.'}
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
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <Label htmlFor="valveCount">Number of Gate Valves</Label>
                                  <Controller
                                      name="valveCount"
                                      control={control}
                                      render={({ field }) => <Input {...field} type="number" min="0" max="20" />}
                                  />
                                  {errors.valveCount && <p className="text-sm font-medium text-destructive mt-1">{errors.valveCount.message}</p>}
                              </div>
                               <div>
                                  <Label htmlFor="motorCount">Number of Motors</Label>
                                  <Controller
                                      name="motorCount"
                                      control={control}
                                      render={({ field }) => <Input {...field} type="number" min="0" max="10" />}
                                  />
                                  {errors.motorCount && <p className="text-sm font-medium text-destructive mt-1">{errors.motorCount.message}</p>}
                              </div>
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
                            <div className="w-full h-96 md:h-[60vh]">
                                <MapPicker 
                                  devices={devices} 
                                  onFinalSubmit={handleFinalSubmit} 
                                  isSubmitting={isStoreSubmitting}
                                  totalValves={getValues('valveCount')}
                                  totalMotors={getValues('motorCount')}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" onClick={handleBack} disabled={isStoreSubmitting}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </CardFooter>
                    </>
                )}
            </motion.div>
      </AnimatePresence>
    </Card>
  );
}

    