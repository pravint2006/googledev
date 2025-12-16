"use client";

import { useState, useEffect, useCallback } from 'react';
import { type Farm, type GateValve, initialFarms } from '@/lib/data';
import { useToast } from './use-toast';

export function useFarmStore() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedFarms = localStorage.getItem('agriGateFarms');
      if (storedFarms) {
        setFarms(JSON.parse(storedFarms));
      } else {
        setFarms(initialFarms);
      }
    } catch (error) {
      console.error("Failed to load farms from localStorage", error);
      setFarms(initialFarms);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('agriGateFarms', JSON.stringify(farms));
      } catch (error) {
        console.error("Failed to save farms to localStorage", error);
      }
    }
  }, [farms, isLoading]);

  const addFarm = useCallback((farmData: Omit<Farm, 'id'>) => {
    const newFarm: Farm = {
      ...farmData,
      id: `farm-${Date.now()}`,
    };
    setFarms(prevFarms => [...prevFarms, newFarm]);
    toast({
      title: "Farm Added",
      description: `Successfully added "${newFarm.name}".`,
    });
  }, [toast]);

  const getFarmById = useCallback((id: string) => {
    return farms.find(farm => farm.id === id);
  }, [farms]);

  const toggleValveStatus = useCallback((farmId: string, valveId: string) => {
    setFarms(prevFarms => {
      return prevFarms.map(farm => {
        if (farm.id === farmId) {
          const updatedValves = farm.gateValves.map(valve => {
            if (valve.id === valveId) {
              const newStatus = valve.status === 'open' ? 'closed' : 'open';
              toast({
                title: `Valve ${newStatus === 'open' ? 'Opened' : 'Closed'}`,
                description: `Valve "${valve.name}" in farm "${farm.name}" is now ${newStatus}.`,
              });
              return { ...valve, status: newStatus };
            }
            return valve;
          });
          return { ...farm, gateValves: updatedValves };
        }
        return farm;
      });
    });
  }, [toast]);

  return { farms, isLoading, addFarm, getFarmById, toggleValveStatus };
}
