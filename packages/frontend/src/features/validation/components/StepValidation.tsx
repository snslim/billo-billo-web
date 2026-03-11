import { useEffect, useState } from 'react';
import type {
  InvoiceData,
  UserRole,
  ValidationReport,
  ValidationResult,
  UserChecklistAnswers,
  ChecklistAnswer,
  ChecklistKey,
} from '../../../types';
import { createDefaultAnswers } from '../../../types';
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
  isDemo: boolean;
  suggestedAnswers?: Partial<UserChecklistAnswers>;
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

export const StepValidation = ({ data, role, isDemo, suggestedAnswers, onProceed }: Props) => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserChecklistAnswers>(() => ({
    ...createDefaultAnswers(role),
    ...suggestedAnswers,
  }));

  useEffect(() => {
    let isMounted = true;
    const runValidation = async () => {
      const result = await validateInvoiceAsync(data, role, { isDemo });
      if (isMounted) setReport(result);
    };
    runValidation();
    return () => {
      isMounted = false;
    };
  }, [data, role, isDemo]);

  const setAnswer = (key: ChecklistKey, value: ChecklistAnswer) => {
    setUserAnswers((prev) => ({ ...prev, [key]: value }));
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

  // 사용자 체크리스트 카드 컴포넌트 — 예/아니오 버튼 방식 (3-state)
  const ChecklistCard = ({
    title,
    description,
    answer,
    onAnswer,
    legalHint,
    subText,
    highlight,
  }: {
    title: string;
    description: string;
    answer: ChecklistAnswer;
    onAnswer: (value: ChecklistAnswer) => void;
    legalHint?: string;
    subText?: string;
    highlight?: { message: string };
  }) => {
    // 카드 테두리 색상: 하이라이트 > 응답 완료 > 미응답 기본
    const borderClass = highlight
      ? 'border-amber-400 bg-amber-50/30'
      : answer === 'unanswered'
        ? 'border-slate-200'
        : 'border-blue-300 bg-blue-50/20';

    return (
      <div className={`p-4 rounded-xl border-2 transition-all ${borderClass}`}>
        {highlight && (
          <div className="flex items-center text-xs text-amber-700 bg-amber-100 px-2.5 py-1.5 rounded-lg mb-3 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            {highlight.message}
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-800">{title}</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
          </div>
          {/* 예/아니오 버튼 */}
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onAnswer(answer === 'yes' ? 'unanswered' : 'yes')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all
                ${answer === 'yes' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            >
              예
            </button>
            <button
              type="button"
              onClick={() => onAnswer(answer === 'no' ? 'unanswered' : 'no')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all
                ${answer === 'no' ? 'bg-slate-600 text-white border-slate-600 shadow-sm' : 'bg-white text-slate-400 border-slate-300 hover:bg-slate-50'}`}
            >
              아니오
            </button>
          </div>
        </div>
        {subText && (
          <p className="text-[11px] text-slate-400 mt-2.5 bg-slate-50 p-1.5 rounded border border-slate-100">
            ※ {subText}
          </p>
        )}
        {legalHint && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-[10px] text-slate-400">
            <BadgeInfo className="w-3 h-3 mr-1.5 text-slate-400" />
            <span>{legalHint}</span>
          </div>
        )}
      </div>
    );
  };

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
    <div className="w-full max-w-2xl mx-auto animate-fade-in pb-10">
      {/* 페이지 헤더 */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center justify-center">
          <ClipboardCheck className="w-6 h-6 mr-2 text-blue-600" />
          체크리스트
        </h2>
        <p className="text-xs text-slate-400 mt-2">
          세금계산서의 주요 항목을 확인하고, 아래 질문에 응답해주세요.
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
            응답 내용을 바탕으로 AI가 맞춤 조언을 제공합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {checklistItems.map((item) => {
            const record = userAnswers as unknown as Record<string, ChecklistAnswer>;
            // 영세율 세금계산서일 때 isZeroRate 항목 강조
            const highlight =
              item.key === 'isZeroRate' && data.docType === 'zero_rate'
                ? {
                    message:
                      '이 세금계산서는 영세율로 발급되었습니다. 영세율 첨부서류를 확인하세요.',
                  }
                : undefined;
            return (
              <ChecklistCard
                key={item.key}
                title={item.title}
                description={item.description}
                answer={record[item.key] ?? 'unanswered'}
                onAnswer={(value) => setAnswer(item.key as ChecklistKey, value)}
                legalHint={item.legalHint}
                subText={item.subText}
                highlight={highlight}
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
          <span>AI 세무 조언 받기</span>
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
