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
};

export const initialFarms: Farm[] = [
  {
    id: 'farm-1',
    name: 'North Field',
    mapImageUrl: 'https://picsum.photos/seed/farm1/1000/600',
    mapImageHint: 'satellite farm',
    gateValves: [
      { id: 'valve-1-1', name: 'Main Canal Valve', status: 'open', position: { lat: 36.7783, lng: -119.4179 } },
      { id: 'valve-1-2', name: 'West Sector Valve', status: 'closed', position: { lat: 36.7800, lng: -119.4200 } },
      { id: 'valve-1-3', name: 'East Sector Valve', status: 'closed', position: { lat: 36.7750, lng: -119.4150 } },
    ],
  },
  {
    id: 'farm-2',
    name: 'Sunny Meadows',
    mapImageUrl: 'https://picsum.photos/seed/farm2/1000/600',
    mapImageHint: 'satellite farm',
    gateValves: [
      { id: 'valve-2-1', name: 'River Pump Intake', status: 'open', position: { lat: 34.0522, lng: -118.2437 } },
      { id: 'valve-2-2', name: 'Reservoir Outlet', status: 'closed', position: { lat: 34.0550, lng: -118.2400 } },
    ],
  },
];
