
import { GeoPoint } from 'firebase/firestore';

export type DeviceTimer = {
  isActive: boolean;
  durationMinutes: number;
  remainingSeconds: number;
  endTime: number; // Stored as a UTC timestamp
};

export type GateValve = {
  id: string;
  name: string;
  status: 'open' | 'closed';
  position: { lat: number; lng: number };
  timer?: DeviceTimer;
};

export type Motor = {
  id: string;
  name: string;
  status: 'on' | 'off';
  position: { lat: number; lng: number };
  timer?: DeviceTimer;
};

export type Farm = {
  id: string;
  name: string;
  gateValves: GateValve[];
  motors: Motor[];
  ownerId: string;
  location: GeoPoint;
};

    