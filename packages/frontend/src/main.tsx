import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import { ErrorFallback } from './components/ErrorFallback';
import { InvoiceProvider } from './store/InvoiceProvider';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <InvoiceProvider>
        <App />
      </InvoiceProvider>
      <Toaster position="top-center" />
    </ErrorBoundary>
  </StrictMode>
);
