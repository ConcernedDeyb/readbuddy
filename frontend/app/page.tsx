'use client';

import { useEffect } from 'react';
import UnifiedAuthLanding from '@/components/auth';
import { initializeRealisticSystemData } from '@/utils/seedData';

export default function Home() {
  useEffect(() => {
    initializeRealisticSystemData();
  }, []);

  return <UnifiedAuthLanding />;
}

