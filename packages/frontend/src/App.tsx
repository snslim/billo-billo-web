import { Layout } from './components/Layout';
import { StepIndicator } from './components/StepIndicator';
import { StepRole } from './features/role-selection';
import { StepUpload } from './features/upload';
import { StepExtraction } from './features/extraction';
import { StepValidation } from './features/validation';
import { StepAdvisory } from './features/advisory';
import { AppStep } from './types';
import { useInvoice } from './store/InvoiceProvider';
import type { DemoScenario } from './features/upload';

function App() {
  const { state, dispatch } = useInvoice();
  const {
    currentStep,
    role,
    file,
    invoiceData,
    validationReport,
    userAnswers,
    isDemo,
    demoScenario,
  } = state;

  const renderStep = () => {
    switch (currentStep) {
      case AppStep.ROLE_SELECTION:
        return <StepRole onSelect={(r) => dispatch({ type: 'SELECT_ROLE', role: r })} />;
      case AppStep.UPLOAD:
        return (
          <StepUpload
            file={file}
            role={role}
            onUpload={(f) => dispatch({ type: 'UPLOAD_FILE', file: f })}
            onCancel={() => dispatch({ type: 'CANCEL_UPLOAD' })}
            onDemoSelect={(scenario: DemoScenario) => dispatch({ type: 'SELECT_DEMO', scenario })}
          />
        );
      case AppStep.EXTRACTION:
        return (
          <StepExtraction
            file={file}
            initialData={invoiceData}
            isDemo={isDemo}
            onConfirm={(data) => dispatch({ type: 'CONFIRM_EXTRACTION', data })}
            onCancel={() => dispatch({ type: 'CANCEL_EXTRACTION' })}
          />
        );
      case AppStep.VALIDATION:
        return invoiceData ? (
          <StepValidation
            data={invoiceData}
            role={role}
            isDemo={isDemo}
            suggestedAnswers={demoScenario?.suggestedAnswers}
            onProceed={(report, answers) =>
              dispatch({ type: 'PROCEED_TO_ADVISORY', report, answers })
            }
          />
        ) : null;
      case AppStep.ADVISORY:
        return invoiceData && validationReport && userAnswers ? (
          <StepAdvisory
            data={invoiceData}
            role={role}
            validationReport={validationReport}
            userAnswers={userAnswers}
            onReset={() => dispatch({ type: 'RESET' })}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <StepIndicator currentStep={currentStep} />
      {isDemo && currentStep > AppStep.UPLOAD && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <span className="font-semibold bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px]">
            DEMO
          </span>
          <span>
            샘플 데이터로 체험 중 — {demoScenario?.name}
            {demoScenario?.taxIssue && ` (${demoScenario.taxIssue})`}
          </span>
        </div>
      )}
      {currentStep > AppStep.ROLE_SELECTION && currentStep < AppStep.ADVISORY && (
        <button
          onClick={() => dispatch({ type: 'GO_BACK' })}
          className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← 이전 단계
        </button>
      )}
      {renderStep()}
    </Layout>
  );
}

export default App;
