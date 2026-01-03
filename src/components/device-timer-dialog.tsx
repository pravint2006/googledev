
'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface DeviceTimerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (duration: number) => void;
  deviceName: string;
}

export default function DeviceTimerDialog({
  isOpen,
  onClose,
  onConfirm,
  deviceName,
}: DeviceTimerDialogProps) {
  const [duration, setDuration] = useState(10); // Default to 10 minutes

  const handleConfirm = () => {
    onConfirm(duration);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Set Timer for "{deviceName}"</AlertDialogTitle>
          <AlertDialogDescription>
            The device will automatically turn on and then turn off after the specified duration.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="duration">Duration (in minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10)))}
            min="1"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Set Timer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
