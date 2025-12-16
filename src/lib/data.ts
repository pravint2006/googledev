export type GateValve = {
  id: string;
  name: string;
  status: 'open' | 'closed';
  position: { x: number; y: number };
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
      { id: 'valve-1-1', name: 'Main Canal Valve', status: 'open', position: { x: 25, y: 30 } },
      { id: 'valve-1-2', name: 'West Sector Valve', status: 'closed', position: { x: 50, y: 60 } },
      { id: 'valve-1-3', name: 'East Sector Valve', status: 'closed', position: { x: 80, y: 45 } },
    ],
  },
  {
    id: 'farm-2',
    name: 'Sunny Meadows',
    mapImageUrl: 'https://picsum.photos/seed/farm2/1000/600',
    mapImageHint: 'satellite farm',
    gateValves: [
      { id: 'valve-2-1', name: 'River Pump Intake', status: 'open', position: { x: 15, y: 70 } },
      { id: 'valve-2-2', name: 'Reservoir Outlet', status: 'closed', position: { x: 65, y: 20 } },
    ],
  },
];
