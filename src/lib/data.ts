
import { GeoPoint } from 'firebase/firestore';

export type GateValve = {
  id: string;
  name: string;
  status: 'open' | 'closed';
  position: { lat: number; lng: number };
};

export type Farm = {
  id: string;
  name: string;
  gateValves: GateValve[];
  mapImageUrl: string;
  mapImageHint: string;
  ownerId: string;
  location: GeoPoint;
};
