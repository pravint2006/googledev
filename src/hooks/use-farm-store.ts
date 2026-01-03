
'use client';

import { useEffect, useState } from 'react';
import { type Farm, type Motor } from '@/lib/data';
import { useToast } from './use-toast';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import {
  collection,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
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
      // The useCollection hook now throws a contextual error, so this toast is redundant.
      // We can leave it as a fallback for non-permission related read errors.
      if (!(farmsError instanceof FirestorePermissionError)) {
          toast({
            variant: 'destructive',
            title: 'Error fetching farms',
            description:
              farmsError.message || 'Could not load farm data from the database.',
          });
      }
    }
  }, [farmsError, toast]);

  const addFarm = (farmData: Omit<Farm, 'id'>) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to add a farm.',
      });
      return Promise.reject(new Error('User not authenticated'));
    }
    if (!farmsCollection) return Promise.reject(new Error('Farms collection not available'));

    setIsSubmitting(true);
    const newFarmRef = doc(farmsCollection);
    const newFarmData = {
        ...farmData,
        id: newFarmRef.id,
        ownerId: user.uid,
    };
    
    return setDoc(newFarmRef, newFarmData)
      .then(() => {
        toast({
            title: "Farm Saved!",
            description: "Your new farm has been created successfully."
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: newFarmRef.path,
          operation: 'create',
          requestResourceData: newFarmData,
        });
        errorEmitter.emit('permission-error', permissionError);
        // We can still show a generic toast as a fallback UI
        toast({
            variant: "destructive",
            title: "Error Saving Farm",
            description: "You don't have permission to save this farm.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const deleteFarm = (farmId: string) => {
    if (!user || !firestore) return;
    
    setIsSubmitting(true);
    const farmToDelete = farms?.find((f) => f.id === farmId);
    if (!farmToDelete) {
        setIsSubmitting(false);
        return;
    }

    const docRef = doc(firestore, 'users', user.uid, 'farms', farmId);
    
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Farm Deleted',
          description: `Successfully deleted "${farmToDelete.name}".`,
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: "destructive",
            title: "Error Deleting Farm",
            description: "You don't have permission to delete this farm.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const getFarmById = (id: string): WithId<Farm> | undefined => {
    return farms?.find((farm) => farm.id === id);
  };

  const toggleValveStatus = (farmId: string, valveId: string) => {
    if (!user || !firestore) return;

    const farm = farms?.find((f) => f.id === farmId);
    if (!farm) return;

    const openValvesCount = farm.gateValves.filter(v => v.status === 'open').length;
    const targetValve = farm.gateValves.find(v => v.id === valveId);

    if (!targetValve) return;

    if (openValvesCount <= 1 && targetValve.status === 'open') {
      toast({
        variant: 'destructive',
        title: 'Action Prevented',
        description: 'You cannot close the last open valve on the farm.',
      });
      return;
    }

    setIsSubmitting(true);
    
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
    const updatedData = { gateValves: updatedValves };

    updateDoc(farmRef, updatedData)
      .then(() => {
        if (toggledValveName) {
          toast({
            title: `Valve status changed`,
            description: `Valve "${toggledValveName}" status updated.`,
          });
        }
      })
      .catch(serverError => {
         const permissionError = new FirestorePermissionError({
          path: farmRef.path,
          operation: 'update',
          requestResourceData: updatedData
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: "destructive",
            title: "Error Updating Valve",
            description: "You do not have permission to update this valve.",
        });
      })
      .finally(() => {
          setIsSubmitting(false);
      });
  };

  const toggleMotorStatus = (farmId: string, motorId: string) => {
    if (!user || !firestore) return;

    const farm = farms?.find((f) => f.id === farmId);
    if (!farm) return;

    setIsSubmitting(true);
    let toggledMotorName = '';
    const updatedMotors = farm.motors.map((motor) => {
      if (motor.id === motorId) {
        toggledMotorName = motor.name;
        return { ...motor, status: motor.status === 'on' ? 'off' : 'on' };
      }
      return motor;
    });

    const farmRef = doc(firestore, 'users', user.uid, 'farms', farmId);
    const updatedData = { motors: updatedMotors };
    
    updateDoc(farmRef, updatedData)
      .then(() => {
        if (toggledMotorName) {
          toast({
            title: 'Motor status changed',
            description: `Motor "${toggledMotorName}" has been turned ${updatedMotors.find(m => m.id === motorId)?.status}.`,
          });
        }
      })
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: farmRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Error Updating Motor',
          description: "You do not have permission to update this motor.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
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
    toggleMotorStatus,
  };
}
