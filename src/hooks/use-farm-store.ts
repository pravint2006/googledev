
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Farm, type GateValve } from '@/lib/data';
import { useToast } from './use-toast';
import { useUser } from '@/firebase';
import { GeoPoint } from 'firebase/firestore';

// Sample in-memory data
const sampleFarms: Farm[] = [
    {
        id: 'farm-1',
        name: 'My Sample Farm',
        ownerId: 'dev-user', // A generic ownerId for sample data
        gateValves: [
            { id: 'gv-1', name: 'Main Canal Valve', status: 'open', position: { lat: 11.13, lng: 78.66 } },
            { id: 'gv-2', name: 'West Field Valve', status: 'closed', position: { lat: 11.128, lng: 78.65 } },
            { id: 'gv-3', name: 'East Field Valve', status: 'closed', position: { lat: 11.129, lng: 78.67 } },
        ],
        mapImageUrl: '',
        mapImageHint: 'satellite farm'
    },
    {
        id: 'farm-2',
        name: 'Sunrise Agriculture',
        ownerId: 'dev-user',
        gateValves: [
            { id: 'gv-4', name: 'Reservoir Outlet', status: 'closed', position: { lat: 11.15, lng: 78.70 } },
        ],
        mapImageUrl: '',
        mapImageHint: 'satellite farm'
    }
];

// In-memory data store for farms, initialized with sample data
let memoryFarms: Farm[] = [...sampleFarms.map(f => ({
    ...f,
    gateValves: f.gateValves.map(gv => ({
        ...gv,
        position: new GeoPoint((gv.position as any).lat, (gv.position as any).lng)
    }))
}))];


export function useFarmStore() {
  const { user } = useUser();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const currentUserId = user?.uid;

  useEffect(() => {
    setIsLoading(true);
    // When a user logs in, we'll assign them the sample data for this session.
    // In a real app, you'd fetch this from a database.
    if (currentUserId) {
      const userFarms = memoryFarms.map(farm => ({ ...farm, ownerId: currentUserId }));
      setFarms(userFarms);
    } else {
      setFarms([]);
    }
    setIsLoading(false);
  }, [currentUserId]);

  const updateMemoryAndState = (newFarms: Farm[]) => {
    // This function now primarily updates the component's state, 
    // as the `memoryFarms` is just for initial data.
    if (currentUserId) {
        setFarms(newFarms.filter(f => f.ownerId === currentUserId));
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

      setFarms(prevFarms => [...prevFarms, newFarm]);

    },
    [currentUserId, toast]
  );

  const deleteFarm = useCallback(
    async (farmId: string) => {
       const farmToDelete = farms.find((f) => f.id === farmId);
       if(farmToDelete) {
         setFarms(prevFarms => prevFarms.filter(f => f.id !== farmId));
         toast({
             title: 'Farm Deleted',
             description: `Successfully deleted "${farmToDelete.name}".`,
         });
       }
    },
    [toast, farms]
  );

  const getFarmById = useCallback(
    (id: string) => {
      return farms.find((farm) => farm.id === id);
    },
    [farms]
  );

  const toggleValveStatus = useCallback(
    async (farmId: string, valveId: string) => {
      let toggledValveName = '';
      const newFarms = farms.map(farm => {
        if (farm.id === farmId) {
          const updatedValves = farm.gateValves.map(valve => {
            if (valve.id === valveId) {
              toggledValveName = valve.name;
              return { ...valve, status: valve.status === 'open' ? 'closed' : 'open' } as GateValve;
            }
            return valve;
          });
          return { ...farm, gateValves: updatedValves };
        }
        return farm;
      });

      if(toggledValveName) {
        toast({
          title: `Valve status changed`,
          description: `Valve "${toggledValveName}" status updated.`,
        });
      }
      
      setFarms(newFarms);
    },
    [toast, farms]
  );

  return { farms, isLoading, addFarm, deleteFarm, getFarmById, toggleValveStatus };
}
