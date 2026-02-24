import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import React from 'react'
import { AppProvider } from './app/providers/index.tsx'
import { App } from './app/index.tsx'
import { initApiConfig } from './app/init.ts'

initApiConfig();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <React.StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </React.StrictMode>
  </StrictMode>,
)
