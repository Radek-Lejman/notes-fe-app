import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import React from 'react';
import { AppProvider } from '@app/providers/index.tsx';
import { initApiConfig } from '@app/init.ts';
import { AppRoutes } from '@app/routes/AppRoutes.tsx';

initApiConfig();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <React.StrictMode>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </React.StrictMode>
  </StrictMode>,
);
