import { useState } from 'react';
import { Layout } from './components/Layout';
import { StepIndicator } from './components/StepIndicator';
import { StepRole } from './components/StepRole';
import { AppStep } from './types';
import type { UserRole } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.ROLE_SELECTION);
  const [role, setRole] = useState<UserRole>(null);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setCurrentStep(AppStep.UPLOAD);
  };

  const renderStep = () => {
    switch (currentStep) {
      case AppStep.ROLE_SELECTION:
        return <StepRole onSelect={handleRoleSelect} />;
      case AppStep.UPLOAD:
        return <div className="text-center text-slate-500">업로드 화면 (PR3에서 구현)</div>;
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
