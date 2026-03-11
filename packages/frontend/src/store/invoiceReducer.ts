import { AppStep } from '../types';
import type { UserRole, InvoiceData, ValidationReport, UserChecklistAnswers } from '../types';
import type { DemoScenario } from '../features/upload/data/demoScenarios';

export interface AppState {
  currentStep: AppStep;
  role: UserRole;
  file: File | null;
  invoiceData: InvoiceData | null;
  validationReport: ValidationReport | null;
  userAnswers: UserChecklistAnswers | null;
  isDemo: boolean;
  demoScenario: DemoScenario | null;
}

export type AppAction =
  | { type: 'SELECT_ROLE'; role: 'supplier' | 'receiver' }
  | { type: 'UPLOAD_FILE'; file: File }
  | { type: 'CANCEL_UPLOAD' }
  | { type: 'CONFIRM_EXTRACTION'; data: InvoiceData }
  | { type: 'CANCEL_EXTRACTION' }
  | { type: 'PROCEED_TO_ADVISORY'; report: ValidationReport; answers: UserChecklistAnswers }
  | { type: 'RESET' }
  | { type: 'GO_BACK' }
  | { type: 'SELECT_DEMO'; scenario: DemoScenario };

const PREV_STEP: Record<AppStep, AppStep> = {
  [AppStep.ROLE_SELECTION]: AppStep.ROLE_SELECTION,
  [AppStep.UPLOAD]: AppStep.ROLE_SELECTION,
  [AppStep.EXTRACTION]: AppStep.UPLOAD,
  [AppStep.VALIDATION]: AppStep.EXTRACTION,
  [AppStep.ADVISORY]: AppStep.VALIDATION,
};

export const initialState: AppState = {
  currentStep: AppStep.ROLE_SELECTION,
  role: null,
  file: null,
  invoiceData: null,
  validationReport: null,
  userAnswers: null,
  isDemo: false,
  demoScenario: null,
};

export function invoiceReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_ROLE':
      return { ...state, role: action.role, currentStep: AppStep.UPLOAD };
    case 'UPLOAD_FILE':
      return { ...state, file: action.file, currentStep: AppStep.EXTRACTION };
    case 'CANCEL_UPLOAD':
      return { ...state, file: null };
    case 'CONFIRM_EXTRACTION':
      return { ...state, invoiceData: action.data, currentStep: AppStep.VALIDATION };
    case 'CANCEL_EXTRACTION':
      return { ...state, file: null, invoiceData: null, currentStep: AppStep.UPLOAD };
    case 'PROCEED_TO_ADVISORY':
      return {
        ...state,
        validationReport: action.report,
        userAnswers: action.answers,
        currentStep: AppStep.ADVISORY,
      };
    case 'SELECT_DEMO':
      return {
        ...state,
        isDemo: true,
        demoScenario: action.scenario,
        invoiceData: action.scenario.invoiceData,
        currentStep: AppStep.EXTRACTION,
      };
    case 'RESET':
      return initialState;
    case 'GO_BACK':
      return { ...state, currentStep: PREV_STEP[state.currentStep] };
    default:
      return state;
  }
}
