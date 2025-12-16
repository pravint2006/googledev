
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type Farm } from '@/lib/data';
import { useToast } from './use-toast';
import {
  addFarm as addFarmFs,
  deleteFarm as deleteFarmFs,
  getFarms,
  toggleValveStatus as toggleValveStatusFs,
} from '@/lib/firebase/firestore';
import { useUser } from '@/firebase';

export function useFarmStore() {
  const { user } = useUser();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const currentUserId = user?.uid;

  useEffect(() => {
    if (currentUserId) {
      const unsubscribe = getFarms(currentUserId, (newFarms) => {
        setFarms(newFarms);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setFarms([]);
      setIsLoading(false);
    }
  }, [currentUserId]);

  const addFarm = useCallback(
    async (farmData: Omit<Farm, 'id' | 'ownerId'>) => {
      if (!currentUserId) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to add a farm.',
        });
        return;
      }
      try {
        await addFarmFs(currentUserId, farmData);
        toast({
          title: 'Farm Created!',
          description: `Your new farm "${farmData.name}" is ready.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error Creating Farm',
          description:
            error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    },
    [currentUserId, toast]
  );

  const deleteFarm = useCallback(
    async (farmId: string) => {
      const farmToDelete = farms.find((f) => f.id === farmId);
      if (farmToDelete) {
        try {
          await deleteFarmFs(farmId);
          toast({
            title: 'Farm Deleted',
            description: `Successfully deleted "${farmToDelete.name}".`,
          });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error Deleting Farm',
            description:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred.',
          });
        }
      }
    },
    [farms, toast]
  );

  const getFarmById = useCallback(
    (id: string) => {
      return farms.find((farm) => farm.id === id);
    },
    [farms]
  );

  const toggleValveStatus = useCallback(
    async (farmId: string, valveId: string) => {
      const farm = farms.find((f) => f.id === farmId);
      const valve = farm?.gateValves.find((v) => v.id === valveId);
      if (farm && valve) {
        try {
          await toggleValveStatusFs(farmId, valveId);
          toast({
            title: `Valve ${
              valve.status === 'open' ? 'Closed' : 'Opened'
            }`,
            description: `Valve "${valve.name}" in farm "${
              farm.name
            }" is now ${
              valve.status === 'open' ? 'closed' : 'open'
            }.`,
          });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error updating valve',
            description:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred.',
          });
        }
      }
    },
    [farms, toast]
  );

  return { farms, isLoading, addFarm, deleteFarm, getFarmById, toggleValveStatus };
}
