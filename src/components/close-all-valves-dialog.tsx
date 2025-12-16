'use client';

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

interface CloseAllValvesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  farmName: string;
}

export default function CloseAllValvesDialog({
  isOpen,
  onClose,
  onConfirm,
  farmName,
}: CloseAllValvesDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will close all gate valves for the farm{' '}
            <span className="font-semibold text-foreground">"{farmName}"</span>. This action can be undone manually by opening each valve.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Close All Valves</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
