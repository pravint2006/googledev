'use client';

import FarmForm from '@/components/farm-form';

export default function NewFarmPage() {
  return (
    <div className="max-w-4xl mx-auto">
       <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Add a New Farm</h1>
        <p className="text-muted-foreground">
          Follow the steps to configure your new farm and its gate valves.
        </p>
      </div>
      <FarmForm />
    </div>
  );
}
