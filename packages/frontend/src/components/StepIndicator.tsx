import { Check } from 'lucide-react';
import { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const STEPS = [
  { label: '역할 선택', step: AppStep.ROLE_SELECTION },
  { label: '업로드', step: AppStep.UPLOAD },
  { label: '검토/수정', step: AppStep.EXTRACTION },
  { label: '유효성 검증', step: AppStep.VALIDATION },
  { label: 'AI 조언', step: AppStep.ADVISORY },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between relative mb-8">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10" />
      {STEPS.map((s, idx) => {
        const isCompleted = currentStep > s.step;
        const isCurrent = currentStep === s.step;
        return (
          <div key={s.step} className="flex flex-col items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300
              ${isCompleted ? 'bg-blue-600 border-blue-600 text-white'
                : isCurrent ? 'bg-white border-blue-600 text-blue-600'
                : 'bg-white border-slate-300 text-slate-300'}
            `}>
              {isCompleted ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
            </div>
            <span className={`text-xs mt-2 font-medium transition-colors duration-300
              ${isCurrent ? 'text-blue-600' : 'text-slate-400'}
            `}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
