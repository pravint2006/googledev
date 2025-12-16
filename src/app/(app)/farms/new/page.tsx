import FarmForm from "@/components/farm-form";
import { Tractor } from "lucide-react";

export default function NewFarmPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Tractor className="h-8 w-8" />
            Add a New Farm
        </h1>
        <p className="text-muted-foreground">
          Follow the steps to configure your new farm and its gate valves.
        </p>
      </div>
      <FarmForm />
    </div>
  );
}
