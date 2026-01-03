
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

  // Use a ref to store active timers to prevent re-renders from clearing them
  const activeTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
        const updates: Partial<Farm> = {};
        
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
              }

              if (newRemaining === 0) {
                 (updates[key] as any[])[deviceIndex].timer.isActive = false;
                 (updates[key] as any[])[deviceIndex].status = type === 'valve' ? 'closed' : 'off';
              }
            }
          }
          return null;
        };

        farm.gateValves.forEach(v => updateDevice(v, 'valve'));
        farm.motors.forEach(m => updateDevice(m, 'motor'));

        if (Object.keys(updates).length > 0) {
          const farmRef = doc(firestore, 'users', user.uid, 'farms', farm.id);
          updateDoc(farmRef, updates).catch(serverError => {
            // No need to show error here, as the UI will just stop updating
            console.error("Error during timer sync:", serverError);
          });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [farms, firestore, user]);

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
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: newFarmRef.path,
          operation: 'create',
          requestResourceData: newFarmData,
        });
        errorEmitter.emit('permission-error', permissionError);
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
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const getFarmById = (id: string): WithId<Farm> | undefined => {
    return farms?.find((farm) => farm.id === id);
  };

  const setDeviceTimer = (farmId: string, deviceId: string, deviceType: DeviceType, durationMinutes: number) => {
    if (!user || !firestore) return;

    const farm = farms?.find((f) => f.id === farmId);
    if (!farm) return;
    
    setIsSubmitting(true);
    
    const key = deviceType === 'valve' ? 'gateValves' : 'motors';
    const deviceList = farm[key];
    const deviceIndex = deviceList.findIndex(d => d.id === deviceId);
    
    if (deviceIndex === -1) {
      setIsSubmitting(false);
      return;
    }

    const updatedList = [...deviceList];
    const device = updatedList[deviceIndex];
    
    device.status = deviceType === 'valve' ? 'open' : 'on';
    device.timer = {
      isActive: true,
      durationMinutes,
      endTime: Date.now() + durationMinutes * 60 * 1000,
      remainingSeconds: durationMinutes * 60,
    };
    
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
      })
      .finally(() => {
        setIsSubmitting(false);
      });
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
    
    if (targetValve.timer?.isActive) {
      toast({
        variant: 'destructive',
        title: 'Action Prevented',
        description: 'Cannot toggle a device while a timer is active.',
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
          timer: { ...valve.timer, isActive: false } as any, // Deactivate timer on manual toggle
        };
      }
      return valve;
    });

    const farmRef = doc(firestore, 'users', user.uid, 'farms', farmId);
    const updatedData = { gateValves: updatedValves };

    updateDoc(farmRef, updatedData)
      .catch(serverError => {
         const permissionError = new FirestorePermissionError({
          path: farmRef.path,
          operation: 'update',
          requestResourceData: updatedData
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
          setIsSubmitting(false);
      });
  };

  const toggleMotorStatus = (farmId: string, motorId: string) => {
    if (!user || !firestore) return;

    const farm = farms?.find((f) => f.id === farmId);
    if (!farm) return;
    
    const targetMotor = farm.motors.find(m => m.id === motorId);
    if (!targetMotor) return;

    if (targetMotor.timer?.isActive) {
      toast({
        variant: 'destructive',
        title: 'Action Prevented',
        description: 'Cannot toggle a device while a timer is active.',
      });
      return;
    }

    setIsSubmitting(true);
    
    const updatedMotors = farm.motors.map((motor) => {
      if (motor.id === motorId) {
        return { 
            ...motor, 
            status: motor.status === 'on' ? 'off' : 'on',
            timer: { ...motor.timer, isActive: false } as any, // Deactivate timer on manual toggle
        };
      }
      return motor;
    });

    const farmRef = doc(firestore, 'users', user.uid, 'farms', farmId);
    const updatedData = { motors: updatedMotors };
    
    updateDoc(farmRef, updatedData)
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: farmRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
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
    setDeviceTimer,
  };
}
