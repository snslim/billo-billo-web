import { useEffect, useState } from 'react';
import type {
  InvoiceData,
  UserRole,
  ValidationReport,
  ValidationResult,
  UserChecklistAnswers,
  ChecklistAnswer,
  ChecklistKey,
} from '../types';
import { createDefaultAnswers } from '../types';
import { validateInvoiceAsync } from '../services/validationService';
import { SUPPLIER_CHECKLIST, RECEIVER_CHECKLIST } from '../data/checklist';
import type { ChecklistItemMeta } from '../data/checklist';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
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

// 필요적 기재사항 존재 여부 확인 (값의 정확성은 판단하지 않음)
const checkRequiredFields = (data: InvoiceData): ValidationResult => {
  const checks: [string, string][] = [
    ['공급자 사업자등록번호', data.supplierRegNo],
    ['공급자 상호', data.supplierName],
    ['공급받는자 사업자등록번호', data.receiverRegNo],
    ['작성일자', data.date],
  ];
  const missing = checks.filter(([, value]) => !value).map(([label]) => label);

  if (missing.length === 0) {
    return { isValid: true, message: '필요적 기재사항 모두 기재됨', type: 'success' };
  }
  return {
    isValid: false,
    message: `다음 항목이 누락되었습니다: ${missing.join(', ')}`,
    type: 'warning',
  };
};

export const StepValidation = ({ data, role, onProceed }: Props) => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserChecklistAnswers>(createDefaultAnswers(role));

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

  const toggleAnswer = (key: ChecklistKey) => {
    setUserAnswers((prev) => {
      const record = prev as unknown as Record<string, ChecklistAnswer>;
      return { ...prev, [key]: record[key] === 'yes' ? 'no' : 'yes' };
    });
  };

  // 자동 확인 항목 표시용 컴포넌트
  const AutoCheckItem = ({ label, result }: { label: string; result: ValidationResult }) => {
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

  // 사용자 체크리스트 카드 컴포넌트
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

  if (!report) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-20 animate-pulse">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
        <h3 className="text-sm font-medium text-slate-600">국세청 데이터 조회 중...</h3>
      </div>
    );
  }

  // 자동 확인 항목 2개
  const counterpartyStatus = role === 'supplier' ? report.receiverStatus : report.supplierStatus;
  const requiredFieldsResult = checkRequiredFields(data);

  const hasAutoCheckIssue =
    counterpartyStatus.type === 'error' || requiredFieldsResult.type !== 'success';

  // 역할에 따른 체크리스트 데이터
  const checklistItems: ChecklistItemMeta<string>[] =
    role === 'supplier' ? SUPPLIER_CHECKLIST : RECEIVER_CHECKLIST;

  return (
    <div className="w-full max-w-xl mx-auto animate-fade-in pb-10">
      {/* 페이지 헤더 */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center justify-center">
          <ClipboardCheck className="w-6 h-6 mr-2 text-blue-600" />
          체크리스트
        </h2>
        <p className="text-xs text-slate-400 mt-2">
          세금계산서의 주요 항목을 확인하고, 해당되는 사항을 체크해주세요.
        </p>
      </div>

      {/* 자동 확인 섹션 */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          자동 확인
        </h3>
        <div className="space-y-1">
          <AutoCheckItem label="상대방 사업자 상태" result={counterpartyStatus} />
          <AutoCheckItem label="필요적 기재사항" result={requiredFieldsResult} />
        </div>
      </div>

      {/* 직접 확인 섹션 */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex flex-col mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <FileQuestion className="w-4 h-4 mr-2 text-blue-600" />
              직접 확인해주세요
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center bg-blue-50/50 p-2 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-blue-500" />
            해당되는 항목을 체크하면 AI가 맞춤 조언을 제공합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {checklistItems.map((item) => {
            const record = userAnswers as unknown as Record<string, ChecklistAnswer>;
            return (
              <ChecklistCard
                key={item.key}
                title={item.title}
                description={item.description}
                checked={record[item.key] === 'yes'}
                onChange={() => toggleAnswer(item.key as ChecklistKey)}
                legalHint={item.legalHint}
                subText={item.subText}
              />
            );
          })}
        </div>
      </div>

      {/* 다음 단계 버튼 */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => onProceed(report, userAnswers)}
          className={`w-full font-semibold py-4 px-4 rounded-xl flex items-center justify-center transition-all shadow-md text-sm group
            ${
              hasAutoCheckIssue
                ? 'bg-white border-2 border-amber-200 text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg hover:scale-[1.01]'
            }`}
        >
          <span>
            {hasAutoCheckIssue
              ? '확인 필요 항목이 있습니다. AI 조언 보기'
              : '체크 완료, AI 세무 비서 연결'}
          </span>
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
