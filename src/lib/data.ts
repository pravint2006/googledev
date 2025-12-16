import { GeoPoint } from 'firebase/firestore';

export type GateValve = {
  id: string;
  name: string;
  status: 'open' | 'closed';
  position: { lat: number; lng: number } | GeoPoint;
};

export type Farm = {
  id: string;
  name: string;
  gateValves: GateValve[];
  mapImageUrl: string;
  mapImageHint: string;
  ownerId: string;
};

export function isGeoPoint(
  position: { lat: number; lng: number } | GeoPoint
): position is GeoPoint {
  return (position as GeoPoint).latitude !== undefined;
}
