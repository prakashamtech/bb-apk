"use client";

import { useEffect } from 'react';
import { initializeSessionHeaderInterceptor } from '../src/lib/session-header-interceptor';

export default function SessionInterceptorInit() {
  useEffect(() => {
    // Initialize session header interceptor on mount
    initializeSessionHeaderInterceptor();
  }, []);

  return null;
}
