import { useEffect, useState } from 'react';
import type {
  InvoiceData,
  UserRole,
  ValidationReport,
  ValidationResult,
  UserChecklistAnswers,
} from '../types';
import { validateInvoiceAsync } from '../services/validationService';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  FileQuestion,
  BadgeInfo,
  Sparkles,
} from 'lucide-react';

interface Props {
  data: InvoiceData;
  role: UserRole;
  onProceed: (report: ValidationReport, userAnswers: UserChecklistAnswers) => void;
}

export const StepValidation = ({ data, role, onProceed }: Props) => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserChecklistAnswers>({
    transmittedOnTime: 'unanswered',
    purposeForBusiness: 'unanswered',
    preRegistration: 'unanswered',
    specificNonDeductible: 'unanswered',
  });

  useEffect(() => {
    let isMounted = true;
    const runValidation = async () => {
      const result = await validateInvoiceAsync(data, role);
      if (isMounted) setReport(result);
    };
    runValidation();
    return () => {
      isMounted = false;
    };
  }, [data, role]);

  const toggleAnswer = (key: keyof UserChecklistAnswers) => {
    setUserAnswers((prev) => ({
      ...prev,
      [key]: prev[key] === 'yes' ? 'no' : 'yes',
    }));
  };

  const ValidationItem = ({
    label,
    result,
  }: {
    label: string;
    result: ValidationResult | undefined;
  }) => {
    if (!result || typeof result.type !== 'string' || typeof result.message !== 'string')
      return null;

    let Icon = CheckCircle2;
    let colorClass = 'text-emerald-600';
    let bgClass = 'bg-emerald-50';
    let borderClass = 'border-emerald-100';

    if (result.type === 'error') {
      Icon = XCircle;
      colorClass = 'text-red-600';
      bgClass = 'bg-red-50';
      borderClass = 'border-red-100';
    } else if (result.type === 'warning') {
      Icon = AlertTriangle;
      colorClass = 'text-amber-600';
      bgClass = 'bg-amber-50';
      borderClass = 'border-amber-100';
    } else if (result.type === 'loading') {
      Icon = Loader2;
      colorClass = 'text-blue-600';
      bgClass = 'bg-blue-50';
      borderClass = 'border-blue-100';
    }

    return (
      <div
        className={`flex items-start p-3 bg-white border ${borderClass} rounded-lg shadow-sm mb-2`}
      >
        <div className={`p-1 rounded-full ${bgClass} mr-3 shrink-0 mt-0.5`}>
          <Icon
            className={`w-4 h-4 ${colorClass} ${result.type === 'loading' ? 'animate-spin' : ''}`}
          />
        </div>
        <div className="grow">
          <h4 className="font-semibold text-slate-800 text-sm flex justify-between items-center">
            {label}
            {result.type === 'error' && (
              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded ml-2">
                주의
              </span>
            )}
          </h4>
          <p
            className={`text-xs mt-1 ${result.type === 'error' ? 'text-red-700 font-medium' : 'text-slate-600'}`}
          >
            {result.message}
          </p>
          {result.details && (
            <p className="text-[11px] text-slate-400 mt-1 pl-2 border-l-2 border-slate-200">
              {result.details}
            </p>
          )}
        </div>
      </div>
    );
  };

  const ChecklistCard = ({
    title,
    description,
    checked,
    onChange,
    legalHint,
    subText,
  }: {
    title: string;
    description: string;
    checked: boolean;
    onChange: () => void;
    legalHint?: string;
    subText?: string;
  }) => (
    <div
      onClick={onChange}
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md
        ${checked ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
        >
          {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </div>
        <div>
          <h4 className={`text-sm font-bold ${checked ? 'text-blue-800' : 'text-slate-700'}`}>
            {title}
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
          {subText && (
            <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-1.5 rounded border border-slate-100">
              ※ {subText}
            </p>
          )}
        </div>
      </div>
      {legalHint && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-[10px] text-slate-400">
          <BadgeInfo className="w-3 h-3 mr-1.5 text-slate-400" />
          <span>{legalHint}</span>
        </div>
      )}
    </div>
  );

  const ChecklistSection = () => (
    <div className="mt-8 pt-6 border-t border-slate-200 animate-fade-in">
      <div className="flex flex-col mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <FileQuestion className="w-4 h-4 mr-2 text-blue-600" />
            추가 확인 사항
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            선택 사항
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2 flex items-center bg-blue-50/50 p-2 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 mr-2 text-blue-500" />
          아래 항목 중 해당되는 부분이 있다면 체크해주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {role === 'supplier' ? (
          <ChecklistCard
            title="전송 기한 내 국세청 전송 완료"
            description="발급일 기준 다음달 10일까지 국세청에 전송하셨나요?"
            checked={userAnswers.transmittedOnTime === 'yes'}
            onChange={() => toggleAnswer('transmittedOnTime')}
            legalHint="미전송 시 가산세(0.5%~1%) 부과 대상"
          />
        ) : (
          <>
            <ChecklistCard
              title="과세 사업을 위한 지출"
              description="귀사의 과세 사업을 위해 사용하였거나 사용할 재화 또는 용역인가요?"
              checked={userAnswers.purposeForBusiness === 'yes'}
              onChange={() => toggleAnswer('purposeForBusiness')}
              subText="사업과 직접 관련이 없거나 면세 사업과 관련된 매입세액인 경우 체크하지 마세요."
            />
            <ChecklistCard
              title="사업자 등록 신청 전 매입"
              description="사업자 등록을 신청하기 전에 발생한 거래인가요?"
              checked={userAnswers.preRegistration === 'yes'}
              onChange={() => toggleAnswer('preRegistration')}
            />
            <ChecklistCard
              title="특정 불공제 항목"
              description="기업업무추진비(접대비), 토지 관련, 또는 비영업용 소형승용차 관련 지출인가요?"
              checked={userAnswers.specificNonDeductible === 'yes'}
              onChange={() => toggleAnswer('specificNonDeductible')}
            />
          </>
        )}
      </div>
    </div>
  );

  if (!report) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-20 animate-pulse">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
        <h3 className="text-sm font-medium text-slate-600">
          국세청 데이터 조회 및 유효성 분석 중...
        </h3>
      </div>
    );
  }

  const items =
    role === 'supplier'
      ? [
          { label: '공급자 번호 유효성', result: report.supplierRegNoValid },
          { label: '공급받는자 번호 유효성', result: report.receiverRegNoValid },
          { label: '공급받는자 상태(휴폐업)', result: report.receiverStatus },
          { label: '세액 계산', result: report.taxCalculation },
          { label: '작성연월일 검토', result: report.dateValidity },
        ]
      : [
          { label: '공급자 번호 유효성', result: report.supplierRegNoValid },
          { label: '공급자 상태(휴폐업)', result: report.supplierStatus },
          { label: '공급받는자 번호 유효성', result: report.receiverRegNoValid },
          { label: '세액 계산', result: report.taxCalculation },
          { label: '작성연월일 검토', result: report.dateValidity },
        ];

  const hasCriticalErrors = Object.values(report).some(
    (r) => r && typeof r === 'object' && 'type' in r && r.type === 'error'
  );

  return (
    <div className="w-full max-w-xl mx-auto animate-fade-in pb-10">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 mr-2 text-blue-600" />
          유효성 검증 결과
        </h2>
        <p className="text-xs text-slate-400 mt-2">
          OCR을 통해 추출한 데이터 및 국세청 조회 결과를 바탕으로 진단합니다.
        </p>
      </div>

      <div className="space-y-1">
        {items.map((item, index) => (
          <ValidationItem key={index} label={item.label} result={item.result} />
        ))}
      </div>

      <ChecklistSection />

      <div className="flex justify-center mt-8">
        <button
          onClick={() => onProceed(report, userAnswers)}
          className={`w-full font-semibold py-4 px-4 rounded-xl flex items-center justify-center transition-all shadow-md text-sm group
            ${
              hasCriticalErrors
                ? 'bg-white border-2 border-red-100 text-red-600 hover:border-red-200 hover:bg-red-50'
                : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg hover:scale-[1.01]'
            }`}
        >
          <span>
            {hasCriticalErrors
              ? '위험 요소가 있습니다. AI 조언 보기'
              : '검증 완료, AI 세무 비서 연결'}
          </span>
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
