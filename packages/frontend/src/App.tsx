import { useState } from 'react';
import { Layout } from './components/Layout';
import { StepIndicator } from './components/StepIndicator';
import { StepRole } from './components/StepRole';
import { StepUpload } from './components/StepUpload';
import { AppStep } from './types';
import type { UserRole } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.ROLE_SELECTION);
  const [role, setRole] = useState<UserRole>(null);
  const [file, setFile] = useState<File | null>(null);

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
        return <div className="text-center text-slate-500">데이터 추출 중...</div>;
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
