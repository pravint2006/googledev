
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
    setIsSubmitting(true);
    
    try {
      await addFarm({
        name: watchedValues.farmName,
        gateValves: valves,
        mapImageUrl: mapImage?.imageUrl || '',
        mapImageHint: mapImage?.imageHint || 'satellite farm',
      });
      
      toast({
          title: "Farm Saved!",
          description: "Your new farm has been created successfully."
      });

      router.push('/farms');
    } catch(e) {
      // Error toast is already handled by the hook
      setIsSubmitting(false);
    }
  };

  const progressValue = (step / 2) * 100;
  
  const isSaveDisabled = isSubmitting;

  return (
    <Card>
      <CardHeader>
        <Progress value={progressValue} className="mb-4 h-2" />
        <CardTitle className="font-headline">Step {step}: {step === 1 ? 'Farm Details' : 'Confirm Farm'}</CardTitle>
        <CardDescription>
            {step === 1 
                ? 'Provide a name and the number of valves for your new farm.' 
                : `A map will be shown here once API issues are resolved. Press Save to continue.`}
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
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                                {mapImage && (
                                <Image
                                    src={mapImage.imageUrl}
                                    alt={mapImage.description}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={mapImage.imageHint}
                                />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                                <p className="text-foreground text-center p-4 bg-background/80 rounded-lg">Interactive map is temporarily disabled.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button onClick={handleFinalSubmit} disabled={isSaveDisabled}>
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
