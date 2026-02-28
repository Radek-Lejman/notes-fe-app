import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export interface AsyncBoundaryProps {
  children: ReactNode;
  pendingFallback: ReactNode;
  rejectedFallback: (props: { error: Error; resetErrorBoundary: () => void }) => ReactNode;
  onReset?: () => void;
}

export const AsyncBoundary = ({ children, pendingFallback, rejectedFallback, onReset }: AsyncBoundaryProps) => {
 return (
    <ErrorBoundary
      onReset={onReset}
      fallbackRender={rejectedFallback}
      >
        <Suspense fallback={pendingFallback}>
          {children}
        </Suspense>
    </ErrorBoundary>
 );}