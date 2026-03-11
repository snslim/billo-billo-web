import { useEffect, useState } from 'react';
import type {
  InvoiceData,
  UserRole,
  ValidationReport,
  AIAdvisoryResponse,
  UserChecklistAnswers,
} from '../types';
import { getTaxAdvice } from '../services/geminiService';
import {
  Bot,
  RefreshCw,
  BookOpen,
  Scale,
  CheckSquare,
  AlertTriangle,
  Info,
  ShieldCheck,
  FilePlus2,
} from 'lucide-react';
import type { LegalReference } from '../data/legalKnowledge';
import toast from 'react-hot-toast';

interface Props {
  data: InvoiceData;
  role: UserRole;
  validationReport: ValidationReport;
  userAnswers: UserChecklistAnswers;
  onReset: () => void;
}

export const StepAdvisory = ({ data, role, validationReport, userAnswers, onReset }: Props) => {
  const [advisory, setAdvisory] = useState<AIAdvisoryResponse | null>(null);
  const [references, setReferences] = useState<LegalReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchAdvice = async () => {
      setLoading(true);
      const issues = Object.values(validationReport)
        .filter((r) => r && typeof r === 'object' && 'type' in r && r.type !== 'success')
        .map((r) => (r && typeof r === 'object' && 'message' in r ? String(r.message) : ''));

      try {
        const result = await getTaxAdvice(data, role, issues, userAnswers);
        if (isMounted) {
          setAdvisory(result.advisory);
          setReferences(result.references);
          setIsMock(result.isMock);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdvice();

    return () => {
      isMounted = false;
    };
  }, [data, role, validationReport, userAnswers, retryCount]);

  const handleRegenerateAdvice = () => {
    toast.success('AI가 조언을 다시 작성합니다.');
    setRetryCount((prev) => prev + 1);
  };

  const roleTitle =
    role === 'supplier' ? '매출자(공급자) 신고 가이드' : '매입자(수취인) 공제 체크리스트';

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-auto min-h-[600px] animate-fade-in pb-12">
      <div className="grow md:w-2/3 flex flex-col">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="w-6 h-6 mr-3 text-blue-400" />
              <div>
                <h3 className="font-bold text-lg">{roleTitle}</h3>
                <p className="text-xs text-slate-400">AI 세무 비서의 분석 결과</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 border-b border-blue-100 px-5 py-2 flex items-center justify-between">
            <div className="flex items-center text-xs text-blue-700">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              <span className="font-medium">Data Privacy:</span>
              <span className="ml-1 text-blue-600/80">개인정보 마스킹 처리됨</span>
            </div>
            {!loading && (
              <button
                onClick={handleRegenerateAdvice}
                className="flex items-center text-xs text-slate-500 hover:text-blue-600 transition-colors"
                title="AI 답변이 마음에 안 드시나요? 다시 생성합니다."
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                조언 다시 받기
              </button>
            )}
          </div>

          <div className="grow p-6 overflow-y-auto bg-white">
            {loading ? (
              <div className="space-y-6 animate-pulse p-2">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-8"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-slate-200 rounded shrink-0"></div>
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : advisory ? (
              <div className="space-y-8 animate-fade-in">
                <p className="text-xs text-slate-400 leading-relaxed">
                  이 분석은 AI가 부가가치세법 규정을 참고하여 추론한 것입니다. 정확한 판단은
                  세무사와 상담하세요.
                </p>
                {isMock && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">
                      AI 서버 연결에 실패하여 샘플 응답을 표시하고 있습니다. &apos;조언 다시
                      받기&apos;를 클릭하여 재시도할 수 있습니다.
                    </p>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                  <h4 className="text-sm font-bold text-blue-900 mb-1 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    분석 요약
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed">{advisory.summary}</p>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center">
                    {role === 'receiver' ? (
                      <CheckSquare className="w-5 h-5 mr-2 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
                    )}
                    {role === 'receiver' ? '공제 요건 확인' : '신고 주의사항'}
                  </h4>
                  <div className="space-y-3">
                    {(role === 'receiver' ? advisory.checklists : advisory.warnings).map(
                      (item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start p-4 rounded-lg border ${role === 'receiver' ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-100'}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full mr-3 mt-2 shrink-0 ${role === 'receiver' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          ></div>
                          <span
                            className={`text-sm ${role === 'receiver' ? 'text-slate-700' : 'text-amber-900'}`}
                          >
                            {item}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 animate-fade-in">
                <div className="inline-flex items-center justify-center p-3 bg-red-50 rounded-full mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  AI 조언을 생성하지 못했습니다
                </h4>
                <p className="text-xs text-slate-500 mb-6">일시적 오류입니다. 다시 시도해주세요.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleRegenerateAdvice}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    다시 시도
                  </button>
                  <button
                    onClick={onReset}
                    className="flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    처음부터 다시 시작
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <span className="text-xs text-slate-400">Powered by Gemini</span>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-200/50"
            >
              <FilePlus2 className="w-4 h-4 mr-2" /> 새로운 문서 검토하기
            </button>
          </div>
        </div>
      </div>

      <div className="md:w-1/3 flex flex-col h-full">
        <div className="bg-white border border-slate-200 rounded-xl shadow-md flex flex-col h-full overflow-hidden">
          <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center">
              <Scale className="w-5 h-5 text-slate-500 mr-2" />
              <h3 className="font-bold text-slate-700">관련 법적 근거</h3>
            </div>
          </div>
          <div className="grow overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {references.length > 0 ? (
              references.map((ref) => (
                <div
                  key={ref.id}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-2 text-blue-800">
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">{ref.source}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed break-keep">{ref.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">인용된 법령이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
