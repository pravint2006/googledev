
import { GeoPoint } from 'firebase/firestore';

export type GateValve = {
  id: string;
  name: string;
  status: 'open' | 'closed';
  position: { lat: number; lng: number };
};

export type Motor = {
  id: string;
  name: string;
  status: 'on' | 'off';
  position: { lat: number; lng: number };
};

export type Farm = {
  id: string;
  name: string;
  gateValves: GateValve[];
  motors: Motor[];
  ownerId: string;
  location: GeoPoint;
};

    