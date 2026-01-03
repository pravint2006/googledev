
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

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    // If parseInt results in NaN (e.g., empty input), default to 1, otherwise use the greater of 1 and the parsed value.
    setDuration(isNaN(value) ? 1 : Math.max(1, value));
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
            onChange={handleDurationChange}
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
