
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Cpu, Rss, Waypoints } from "lucide-react";

export default function HardwarePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Hardware Integration Guide
        </h1>
        <p className="text-muted-foreground mt-2">
          This page is intended to display hardware integration information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Cpu className="h-6 w-6 text-primary" />
            System Architecture
          </CardTitle>
          <CardDescription>
            This setup uses a cellular connection, making it ideal for remote farm locations without Wi-Fi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>This section will describe the system architecture.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Code className="h-6 w-6 text-primary" />
            ESP32 Sample Code
          </CardTitle>
          <CardDescription>
            This section will contain sample code for hardware devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p>Sample code for hardware will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
