import { createContext, useContext, useEffect, useReducer } from 'react';
import toast from 'react-hot-toast';
import type { AppState, AppAction } from './invoiceReducer';
import { invoiceReducer, initialState } from './invoiceReducer';
import { AppStep } from '../types';

const SESSION_KEY = 'billo-invoice-state';

interface InvoiceContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const InvoiceContext = createContext<InvoiceContextValue | null>(null);

function loadFromSession(): AppState {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return initialState;

    const parsed = JSON.parse(saved) as AppState;
    if (parsed.currentStep === AppStep.ROLE_SELECTION) return initialState;

    return { ...parsed, file: null };
  } catch {
    return initialState;
  }
}

function saveToSession(state: AppState): void {
  try {
    const serializable = { ...state, file: null };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(serializable));
  } catch {
    /* sessionStorage 용량 초과 시 무시 */
  }
}

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(invoiceReducer, initialState, () => {
    const restored = loadFromSession();
    if (restored.currentStep > AppStep.ROLE_SELECTION) {
      setTimeout(() => toast('이전 세션을 복원했습니다', { icon: '🔄' }), 300);
    }
    return restored;
  });

  useEffect(() => {
    saveToSession(state);
  }, [state]);

  return <InvoiceContext.Provider value={{ state, dispatch }}>{children}</InvoiceContext.Provider>;
}

export function useInvoice(): InvoiceContextValue {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice는 InvoiceProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}
