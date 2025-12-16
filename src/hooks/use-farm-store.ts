
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Farm, type GateValve } from '@/lib/data';
import { useToast } from './use-toast';
import { useUser } from '@/firebase';
import { GeoPoint } from 'firebase/firestore';

// In-memory data store for farms
let memoryFarms: Farm[] = [];

export function useFarmStore() {
  const { user } = useUser();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const currentUserId = user?.uid;

  useEffect(() => {
    // Simulate loading data for the current user
    if (currentUserId) {
      // On user change, filter the in-memory data.
      // This simulates multi-user support locally.
      setFarms(memoryFarms.filter(f => f.ownerId === currentUserId));
    } else {
      setFarms([]);
    }
    setIsLoading(false);
  }, [currentUserId]);

  const updateMemoryAndState = (newFarms: Farm[]) => {
    memoryFarms = newFarms;
    if (currentUserId) {
        setFarms(memoryFarms.filter(f => f.ownerId === currentUserId));
    }
  }

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
      
      const newFarm: Farm = {
        id: `farm-${Date.now()}`,
        ownerId: currentUserId,
        ...farmData,
        gateValves: farmData.gateValves.map(v => ({
            ...v,
            position: new GeoPoint((v.position as any).lat, (v.position as any).lng)
        }))
      };

      updateMemoryAndState([...memoryFarms, newFarm]);
    },
    [currentUserId, toast]
  );

  const deleteFarm = useCallback(
    async (farmId: string) => {
      const farmToDelete = memoryFarms.find((f) => f.id === farmId);
      if (farmToDelete) {
        updateMemoryAndState(memoryFarms.filter((f) => f.id !== farmId));
        toast({
            title: 'Farm Deleted',
            description: `Successfully deleted "${farmToDelete.name}".`,
        });
      }
    },
    [toast]
  );

  const getFarmById = useCallback(
    (id: string) => {
      return farms.find((farm) => farm.id === id);
    },
    [farms]
  );

  const toggleValveStatus = useCallback(
    async (farmId: string, valveId: string) => {
      const newFarms = memoryFarms.map(farm => {
        if (farm.id === farmId) {
          let toggledValveName = '';
          const updatedValves = farm.gateValves.map(valve => {
            if (valve.id === valveId) {
              toggledValveName = valve.name;
              return { ...valve, status: valve.status === 'open' ? 'closed' : 'open' } as GateValve;
            }
            return valve;
          });
          
          if(toggledValveName) {
            toast({
              title: `Valve status changed`,
              description: `Valve "${toggledValveName}" status updated.`,
            });
          }
          return { ...farm, gateValves: updatedValves };
        }
        return farm;
      });
      updateMemoryAndState(newFarms);
    },
    [toast]
  );

  return { farms, isLoading, addFarm, deleteFarm, getFarmById, toggleValveStatus };
}
