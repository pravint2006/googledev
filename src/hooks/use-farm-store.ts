
'use client';

import { useEffect, useState, useRef } from 'react';
import { type Farm, type Motor, type GateValve } from '@/lib/data';
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

type DeviceType = 'valve' | 'motor';

export function useFarmStore() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This collection reference is now memoized and depends on the user's UID.
  // It will be null until the user is authenticated.
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
      // The permission error is now handled globally, so we only toast for other errors.
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

  useEffect(() => {
    // This effect manages the countdown timers on the client side.
    const interval = setInterval(() => {
      if (!farms || !user || !firestore) return;
      farms.forEach(farm => {
        const updates: { [key: string]: any } = {};
        
        const updateDevice = (device: GateValve | Motor, type: DeviceType) => {
          if (device.timer?.isActive) {
            const now = Date.now();
            const newRemaining = Math.max(0, Math.floor((device.timer.endTime - now) / 1000));
            
            if (newRemaining !== device.timer.remainingSeconds) {
              const key = type === 'valve' ? 'gateValves' : 'motors';
              if (!updates[key]) updates[key] = [...(farm as any)[key]];
              
              const deviceIndex = (updates[key] as any[]).findIndex(d => d.id === device.id);
              if(deviceIndex > -1) {
                (updates[key] as any[])[deviceIndex].timer.remainingSeconds = newRemaining;

                if (newRemaining === 0) {
                   (updates[key] as any[])[deviceIndex].timer.isActive = false;
                   (updates[key] as any[])[deviceIndex].status = type === 'valve' ? 'closed' : 'off';
                }
              }
            }
          }
        };

        farm.gateValves.forEach(v => updateDevice(v, 'valve'));
        farm.motors.forEach(m => updateDevice(m, 'motor'));

        if (Object.keys(updates).length > 0) {
          const farmRef = doc(firestore, 'users', user.uid, 'farms', farm.id);
          updateDoc(farmRef, updates).catch(serverError => {
            // Error handling for timer updates can be silent as UI will just desync.
            console.error("Error during timer sync:", serverError);
          });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [farms, firestore, user]);

  const addFarm = async (farmData: Omit<Farm, 'id'>) => {
    if (!user || !firestore || !farmsCollection) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to add a farm.',
      });
      throw new Error('User not authenticated or collection not ready');
    }

    setIsSubmitting(true);
    const newFarmRef = doc(farmsCollection);
    const newFarmData = {
        ...farmData,
        id: newFarmRef.id,
        ownerId: user.uid, // Ensure ownerId is set
    };
    
    try {
      await setDoc(newFarmRef, newFarmData);
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({
        path: newFarmRef.path,
        operation: 'create',
        requestResourceData: newFarmData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError; // Re-throw to be caught by caller if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFarm = (farmId: string) => {
    if (!user || !firestore) return;
    
    const farmToDelete = farms?.find((f) => f.id === farmId);
    if (!farmToDelete) return;

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
      });
  };

  const getFarmById = (id: string): WithId<Farm> | undefined => {
    return farms?.find((farm) => farm.id === id);
  };

  const setDeviceTimer = (farmId: string, deviceId: string, deviceType: DeviceType, durationMinutes: number) => {
    if (!user || !firestore) return;

    const farm = farms?.find((f) => f.id === farmId);
    if (!farm) return;
    
    const key = deviceType === 'valve' ? 'gateValves' : 'motors';
    const deviceList = farm[key];
    const deviceIndex = deviceList.findIndex(d => d.id === deviceId);
    
    if (deviceIndex === -1) return;

    const updatedList = [...deviceList];
    const device = { ...updatedList[deviceIndex] }; // Create a new object for the specific device
    
    device.status = deviceType === 'valve' ? 'open' : 'on';
    device.timer = {
      isActive: true,
      durationMinutes,
      endTime: Date.now() + durationMinutes * 60 * 1000,
      remainingSeconds: durationMinutes * 60,
    };
    updatedList[deviceIndex] = device;
    
    const updatedData = { [key]: updatedList };
    const farmRef = doc(firestore, 'users', user.uid, 'farms', farmId);

    updateDoc(farmRef, updatedData)
      .then(() => {
        toast({
          title: 'Timer Set!',
          description: `Timer set for ${device.name} for ${durationMinutes} minutes.`,
        });
      })
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: farmRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const _toggleDeviceStatus = (farmId: string, deviceId: string, deviceType: 'valve' | 'motor') => {
    if (!user || !firestore || !farms) return;

    const farm = farms.find((f) => f.id === farmId);
    if (!farm) return;
    
    const isValve = deviceType === 'valve';
    const key = isValve ? 'gateValves' : 'motors';
    const deviceList = farm[key];
    const deviceIndex = deviceList.findIndex(d => d.id === deviceId);

    if (deviceIndex === -1) return;
    
    const device = deviceList[deviceIndex];

    // Prevent toggling if a timer is active
    if (device.timer?.isActive) {
      toast({ variant: 'destructive', title: 'Action Prevented', description: 'Cannot toggle a device while a timer is active.' });
      return;
    }

    // Special rule for valves: cannot close the last open one
    if (isValve) {
      const openValvesCount = (farm.gateValves as GateValve[]).filter(v => v.status === 'open').length;
      if (openValvesCount <= 1 && device.status === 'open') {
        toast({ variant: 'destructive', title: 'Action Prevented', description: 'You cannot close the last open valve on the farm.' });
        return;
      }
    }
    
    const newStatus = device.status === (isValve ? 'open' : 'on') 
      ? (isValve ? 'closed' : 'off') 
      : (isValve ? 'open' : 'on');

    const updatedList = [...deviceList];
    updatedList[deviceIndex] = {
      ...device,
      status: newStatus,
      timer: { ...device.timer, isActive: false } as any, // Deactivate timer on manual toggle
    };

    const updatedData = { [key]: updatedList };
    const farmRef = doc(firestore, 'users', user.uid, 'farms', farmId);

    updateDoc(farmRef, updatedData)
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: farmRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const toggleValveStatus = (farmId: string, valveId: string) => {
    _toggleDeviceStatus(farmId, valveId, 'valve');
  };

  const toggleMotorStatus = (farmId: string, motorId: string) => {
    _toggleDeviceStatus(farmId, motorId, 'motor');
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
    setDeviceTimer,
  };
}
