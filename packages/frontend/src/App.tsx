import { useState } from 'react';
import { Layout } from './components/Layout';
import { StepIndicator } from './components/StepIndicator';
import { StepRole } from './components/StepRole';
import { StepUpload } from './components/StepUpload';
import { StepExtraction } from './components/StepExtraction';
import { StepValidation } from './components/StepValidation';
import { StepAdvisory } from './components/StepAdvisory';
import { AppStep } from './types';
import type { UserRole, InvoiceData, ValidationReport, UserChecklistAnswers } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.ROLE_SELECTION);
  const [role, setRole] = useState<UserRole>(null);
  const [file, setFile] = useState<File | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserChecklistAnswers>({});

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setCurrentStep(AppStep.UPLOAD);
  };

  const handleUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setCurrentStep(AppStep.EXTRACTION);
  };

  const handleUploadCancel = () => {
    setFile(null);
  };

  const handleExtractionConfirm = (data: InvoiceData) => {
    setInvoiceData(data);
    setCurrentStep(AppStep.VALIDATION);
  };

  const handleExtractionCancel = () => {
    setFile(null);
    setInvoiceData(null);
    setCurrentStep(AppStep.UPLOAD);
  };

  const handleValidationProceed = (report: ValidationReport, answers: UserChecklistAnswers) => {
    setValidationReport(report);
    setUserAnswers(answers);
    setCurrentStep(AppStep.ADVISORY);
  };

  const handleReset = () => {
    setCurrentStep(AppStep.ROLE_SELECTION);
    setRole(null);
    setFile(null);
    setInvoiceData(null);
    setValidationReport(null);
    setUserAnswers({});
  };

  const renderStep = () => {
    switch (currentStep) {
      case AppStep.ROLE_SELECTION:
        return <StepRole onSelect={handleRoleSelect} />;
      case AppStep.UPLOAD:
        return (
          <StepUpload
            file={file}
            onUpload={handleUpload}
            onCancel={handleUploadCancel}
          />
        );
      case AppStep.EXTRACTION:
        return (
          <StepExtraction
            file={file}
            initialData={invoiceData}
            onConfirm={handleExtractionConfirm}
            onCancel={handleExtractionCancel}
          />
        );
      case AppStep.VALIDATION:
        return invoiceData ? (
          <StepValidation
            data={invoiceData}
            role={role}
            onProceed={handleValidationProceed}
          />
        ) : null;
      case AppStep.ADVISORY:
        return invoiceData && validationReport ? (
          <StepAdvisory
            data={invoiceData}
            role={role}
            validationReport={validationReport}
            userAnswers={userAnswers}
            onReset={handleReset}
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
