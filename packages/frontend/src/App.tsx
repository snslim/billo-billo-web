import { Layout } from './components/Layout';
import { StepIndicator } from './components/StepIndicator';
import { StepRole } from './components/StepRole';
import { StepUpload } from './components/StepUpload';
import { StepExtraction } from './components/StepExtraction';
import { StepValidation } from './components/StepValidation';
import { StepAdvisory } from './components/StepAdvisory';
import { AppStep } from './types';
import { useInvoice } from './store/InvoiceProvider';

function App() {
  const { state, dispatch } = useInvoice();
  const { currentStep, role, file, invoiceData, validationReport, userAnswers } = state;

  const renderStep = () => {
    switch (currentStep) {
      case AppStep.ROLE_SELECTION:
        return <StepRole onSelect={(r) => r && dispatch({ type: 'SELECT_ROLE', role: r })} />;
      case AppStep.UPLOAD:
        return (
          <StepUpload
            file={file}
            onUpload={(f) => dispatch({ type: 'UPLOAD_FILE', file: f })}
            onCancel={() => dispatch({ type: 'CANCEL_UPLOAD' })}
          />
        );
      case AppStep.EXTRACTION:
        return (
          <StepExtraction
            file={file}
            initialData={invoiceData}
            onConfirm={(data) => dispatch({ type: 'CONFIRM_EXTRACTION', data })}
            onCancel={() => dispatch({ type: 'CANCEL_EXTRACTION' })}
          />
        );
      case AppStep.VALIDATION:
        return invoiceData ? (
          <StepValidation
            data={invoiceData}
            role={role}
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
      {renderStep()}
    </Layout>
  );
}

export default App;
