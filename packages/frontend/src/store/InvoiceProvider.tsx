import { createContext, useContext, useReducer } from 'react';
import type { AppState, AppAction } from './invoiceReducer';
import { invoiceReducer, initialState } from './invoiceReducer';

interface InvoiceContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const InvoiceContext = createContext<InvoiceContextValue | null>(null);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(invoiceReducer, initialState);

  return <InvoiceContext.Provider value={{ state, dispatch }}>{children}</InvoiceContext.Provider>;
}

export function useInvoice(): InvoiceContextValue {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice는 InvoiceProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}
