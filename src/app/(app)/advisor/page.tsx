import React, { Suspense } from 'react';
import ClientAdvisor from '@/components/advisor-client';

export default function AdvisorPage() {
  return (
    <Suspense fallback={<div /> }>
      <ClientAdvisor />
    </Suspense>
  );
}
