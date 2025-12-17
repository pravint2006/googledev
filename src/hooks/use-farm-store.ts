'use client';

import { useEffect, useState } from 'react';
import { type Farm, type GateValve } from '@/lib/data';
import { useToast } from './use-toast';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { type WithId } from '@/firebase/firestore/use-collection';

export function useFarmStore() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const farmsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'farms');
  }, [user, firestore]);

  const {
    data: farms,
    isLoading: farmsLoading,
    error: farmsError,
  } = useCollection<Farm>(farmsCollection);

  useEffect(() => {
    if (farmsError) {
      toast({
        variant: 'destructive',
        title: 'Error fetching farms',
        description:
          farmsError.message || 'Could not load farm data from the database.',
      });
    }
  }, [farmsError, toast]);

  const addFarm = async (farmData: Omit<Farm, 'id'>) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to add a farm.',
      });
      return;
    }
    if (!farmsCollection) return;
    
    setIsSubmitting(true);
    try {
     const docRef = await addDoc(farmsCollection, {
        ...farmData,
        ownerId: user.uid,
     });
     // Set the ID on the newly created document
     await updateDoc(docRef, { id: docRef.id });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error Saving Farm",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const deleteFarm = async (farmId: string) => {
    if (!user || !firestore) return;
    
    setIsSubmitting(true);
    try {
        const farmToDelete = farms?.find((f) => f.id === farmId);
        if (farmToDelete) {
          const docRef = doc(firestore, 'users', user.uid, 'farms', farmId);
          await deleteDoc(docRef);
          toast({
            title: 'Farm Deleted',
            description: `Successfully deleted "${farmToDelete.name}".`,
          });
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error Deleting Farm",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const getFarmById = (id: string): WithId<Farm> | undefined => {
    return farms?.find((farm) => farm.id === id);
  };

  const toggleValveStatus = async (farmId: string, valveId: string) => {
    if (!user || !firestore) return;

    const farm = farms?.find((f) => f.id === farmId);
    if (!farm) return;

    const openValvesCount = farm.gateValves.filter(v => v.status === 'open').length;
    const targetValve = farm.gateValves.find(v => v.id === valveId);

    if (!targetValve) return;

    // Prevent closing the last open valve
    if (openValvesCount === 1 && targetValve.status === 'open') {
      toast({
        variant: 'destructive',
        title: 'Action Prevented',
        description: 'You cannot close the last open valve on the farm.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
        let toggledValveName = '';
        const updatedValves = farm.gateValves.map((valve) => {
          if (valve.id === valveId) {
            toggledValveName = valve.name;
            return {
              ...valve,
              status: valve.status === 'open' ? 'closed' : 'open',
            };
          }
          return valve;
        });

        const farmRef = doc(firestore, 'users', user.uid, 'farms', farmId);
        await updateDoc(farmRef, { gateValves: updatedValves });

        if (toggledValveName) {
          toast({
            title: `Valve status changed`,
            description: `Valve "${toggledValveName}" status updated.`,
          });
        }
    } catch(error) {
         toast({
            variant: "destructive",
            title: "Error Updating Valve",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isLoading = userLoading || farmsLoading;

  return {
    farms: farms || [],
    isLoading,
    isSubmitting, 
    addFarm,
    deleteFarm,
    getFarmById,
    toggleValveStatus,
  };
}
