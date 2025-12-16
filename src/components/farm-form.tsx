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
import { type GateValve } from '@/lib/data';
import MapPicker from './map-picker';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';

const formSchema = z.object({
  farmName: z.string().min(3, 'Farm name must be at least 3 characters.'),
  valveCount: z.coerce.number().min(1, 'You must have at least 1 valve.').max(20, 'Maximum 20 valves allowed.'),
});

type FormData = z.infer<typeof formSchema>;

export default function FarmForm() {
  const [step, setStep] = useState(1);
  const [valves, setValves] = useState<GateValve[]>([]);
  const router = useRouter();
  const { addFarm } = useFarmStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapImage = PlaceHolderImages.find(p => p.id === 'farm-map-new');

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      farmName: '',
      valveCount: 1,
    },
  });

  const watchedValues = watch();

  const onFirstStepSubmit = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleFinalSubmit = () => {
    if (valves.length !== watchedValues.valveCount) {
      toast({
        variant: 'destructive',
        title: 'Valve Placement Incomplete',
        description: `Please place all ${watchedValues.valveCount} valves on the map.`,
      });
      return;
    }
    
    setIsSubmitting(true);
    setTimeout(() => {
        addFarm({
          name: watchedValues.farmName,
          gateValves: valves,
          mapImageUrl: mapImage?.imageUrl || '',
          mapImageHint: mapImage?.imageHint || 'satellite farm',
        });
        toast({
            title: "Farm Created!",
            description: `Your new farm "${watchedValues.farmName}" is ready.`,
        });
        router.push('/farms');
    }, 1500)

  };

  const progressValue = (step / 2) * 100;

  return (
    <Card>
      <CardHeader>
        <Progress value={progressValue} className="mb-4 h-2" />
        <CardTitle className="font-headline">Step {step}: {step === 1 ? 'Farm Details' : 'Place Valves'}</CardTitle>
        <CardDescription>
            {step === 1 
                ? 'Provide a name and the number of valves for your new farm.' 
                : 'Click on the map to place your gate valves.'}
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
                            <Button type="submit">Next</Button>
                        </CardFooter>
                    </form>
                )}

                {step === 2 && mapImage && (
                    <>
                        <CardContent>
                            <MapPicker 
                                isEditable={true} 
                                valves={valves} 
                                setValves={setValves} 
                                valveCount={watchedValues.valveCount}
                                mapImageUrl={mapImage.imageUrl}
                                mapImageHint={mapImage.imageHint}
                            />
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button onClick={handleFinalSubmit} disabled={isSubmitting || valves.length !== watchedValues.valveCount}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isSubmitting ? 'Saving...' : 'Save Farm'}
                            </Button>
                        </CardFooter>
                    </>
                )}
            </motion.div>
      </AnimatePresence>
    </Card>
  );
}
