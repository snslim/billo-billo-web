import type { InvoiceData, UserRole, AIAdvisoryResponse, UserChecklistAnswers } from '../types';
import { isSupplierAnswers } from '../types';
import { retrieveRelevantLawsByVector } from '../data/legalKnowledge';
import type { LegalReference } from '../data/legalKnowledge';
import { anonymizeInvoiceData } from '../utils/formatting';
import { config } from '../config';
import toast from 'react-hot-toast';

const MOCK_ADVISORY_RESPONSE: AIAdvisoryResponse = {
  summary: '서버 연결 실패. 데모 데이터: 공급자는 발급 시기를, 매입자는 공제 요건을 확인하세요.',
  checklists: ['필요적 기재사항 누락 확인', '휴/폐업 상태 재조회', '실거래 일치 여부'],
  warnings: ['지연발급 가산세 주의', '폐업자 수취분 불공제'],
  deductionStatus: 'check_required',
};

const getRAGSystemPrompt = (
  role: UserRole,
  dataJson: string,
  issues: string,
  legalContext: string,
  userAnswers: UserChecklistAnswers
) => {
  const roleText = role === 'supplier' ? '매출자(공급자)' : '매입자(공급받는자)';

  let criticalInstructions = '';

  if (role === 'receiver' && !isSupplierAnswers(userAnswers)) {
    criticalInstructions +=
      "- [필수 명시] summary의 첫 문장으로 다음을 명시하세요: '본 조언은 세금계산서 수취분에 한하며, 신용카드매출전표 발행공제나 의제매입세액 공제 등은 별도 검토 대상이므로 제외됩니다.'\n";
    criticalInstructions +=
      "- [필수 경고] warnings 배열에 다음 내용을 반드시 포함하세요: '세금계산서 수취만으로는 공제받을 수 없습니다. 부가가치세 신고 시 반드시 <매입처별 세금계산서 합계표>를 제출해야 하며, 미제출/부실기재 시 매입세액 불공제 및 가산세가 부과됩니다.'\n";

    if (
      issues.includes('오류') ||
      issues.includes('불일치') ||
      issues.includes('실패') ||
      issues.includes('미등록')
    ) {
      criticalInstructions +=
        "- [치명적] 시스템 검증 결과(issues), 필요적 기재사항(공급자 등록번호/성명, 공급받는자 등록번호, 작성연월일, 공급가액, 세액) 중 오류가 발견되었습니다. deductionStatus를 'impossible'로 설정하고, 사유를 명확히 설명하세요.\n";
    }

    if (userAnswers.purposeForBusiness === 'no') {
      criticalInstructions +=
        "- 사용자가 '과세 사업을 위한 지출' 항목에 '아니오'를 선택했습니다. 사업과 직접 관련이 없거나 면세 사업 관련 지출이므로 매입세액 공제 'impossible'로 판단하세요.\n";
    }

    if (userAnswers.preRegistration === 'yes') {
      criticalInstructions +=
        "- [중요] 사용자가 '사업자 등록 전 매입'을 확인했습니다. 원칙적으로는 불공제(impossible)이나, '공급시기가 속하는 과세기간 종료 후 20일 이내에 등록 신청한 경우 역산하여 공제 가능'하다는 예외 규정(부가가치세법 시행령 제75조)을 checklists와 조언에 포함하여 사용자가 놓치지 않도록 하세요.\n";
    }

    if (userAnswers.specificNonDeductible === 'yes') {
      criticalInstructions +=
        "- 사용자가 '접대비/토지/소형차 관련'임을 확인했습니다. 매입세액 불공제 대상이므로 deductionStatus를 'impossible'로 설정하고 법적 근거를 제시하세요.\n";
    }

    criticalInstructions +=
      "- warnings 배열에 '지연 수취 가산세(0.5%)'와 '합계표 불성실 가산세'의 위험성을 반드시 경고하세요.\n";
  } else if (role === 'supplier' && isSupplierAnswers(userAnswers)) {
    if (userAnswers.transmittedOnTime === 'no') {
      criticalInstructions +=
        "- 사용자가 '국세청 전송 기한 경과'를 시인했습니다. 지연전송 가산세 또는 미전송 가산세에 대해 강력히 경고하세요.\n";
    }
  }

  return `
  당신은 대한민국 최고의 세무 전문가 AI입니다.
  사용자(${roleText})에게 제공된 세금계산서 정보, 시스템 검증 결과, 그리고 사용자가 응답한 체크리스트를 종합하여 조언을 제공합니다.

  [보안 지침]
  - 사업자번호/상호는 마스킹(***) 처리됨. 추측 금지.

  [법적 근거 데이터베이스 (RAG Context)]
  ${legalContext}

  [세금계산서 데이터]
  ${dataJson}

  [시스템 유효성 검사 결과 (Issues)]
  ${issues}

  [사용자 체크리스트 응답]
  ${JSON.stringify(userAnswers)}

  [특별 판단 지침 (최우선 반영)]
  ${criticalInstructions}

  [요청 사항]
  JSON 형식으로 응답하세요. (summary, checklists, warnings, deductionStatus)
  deductionStatus는 매입자일 경우 'possible', 'impossible', 'check_required' 중 하나.

  [제약 조건]
  - RAG Context에 있는 법률 조항(예: 제39조, 제54조 등)을 명시적으로 인용하여 신뢰도를 높이세요.
  - 매입자일 경우 '합계표 제출' 의무를 강조하지 않으면 답변이 불완전한 것으로 간주합니다.
`;
};

export const getTaxAdvice = async (
  data: InvoiceData,
  role: UserRole,
  validationIssues: string[],
  userAnswers: UserChecklistAnswers
): Promise<{ advisory: AIAdvisoryResponse; references: LegalReference[] }> => {
  const safeData = anonymizeInvoiceData(data);
  const issuesText = validationIssues.join(', ') || '특이사항 없음';

  const queryParts = [...validationIssues];

  if (role === 'receiver' && !isSupplierAnswers(userAnswers)) {
    if (userAnswers.purposeForBusiness === 'no')
      queryParts.push('사업 무관 지출 면세사업 관련 매입세액 불공제');
    if (userAnswers.preRegistration === 'yes')
      queryParts.push('사업자 등록 전 매입세액 공제 예외 20일 이내 역산');
    if (userAnswers.specificNonDeductible === 'yes')
      queryParts.push('접대비 비영업용 소형승용차 토지 관련 매입세액 불공제');
    queryParts.push('매입처별 세금계산서 합계표 미제출 가산세 부가가치세법 제54조');
    queryParts.push('필요적 기재사항 누락 불공제');
    queryParts.push('매입자 지연수취 가산세 제60조');
  }

  if (
    role === 'supplier' &&
    isSupplierAnswers(userAnswers) &&
    userAnswers.transmittedOnTime === 'no'
  ) {
    queryParts.push('세금계산서 전송 기한 경과 가산세');
  }

  const ragQuery = queryParts.join(' ') || '세금계산서 발급 및 수취 시 유의사항';

  let relevantLaws: LegalReference[] = [];
  try {
    relevantLaws = await retrieveRelevantLawsByVector(ragQuery, role);
  } catch (e) {
    console.warn('RAG Retrieval Failed:', e);
  }

  const legalContext = relevantLaws.map((law) => `- [${law.source}]: ${law.content}`).join('\n');

  const systemInstruction = getRAGSystemPrompt(
    role,
    JSON.stringify(safeData),
    issuesText,
    legalContext,
    userAnswers
  );

  try {
    const response = await fetch(`${config.api.baseUrl}/api/advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: '세무 조언 생성',
        systemInstruction: systemInstruction,
      }),
    });

    if (!response.ok) throw new Error('Backend API Call Failed');

    const result = await response.json();

    let advisory: AIAdvisoryResponse;
    try {
      const parsed = JSON.parse(result.text || '{}');
      advisory = {
        summary:
          typeof parsed.summary === 'string' ? parsed.summary : MOCK_ADVISORY_RESPONSE.summary,
        checklists: Array.isArray(parsed.checklists)
          ? parsed.checklists.filter((c: unknown) => typeof c === 'string')
          : MOCK_ADVISORY_RESPONSE.checklists,
        warnings: Array.isArray(parsed.warnings)
          ? parsed.warnings.filter((w: unknown) => typeof w === 'string')
          : MOCK_ADVISORY_RESPONSE.warnings,
        deductionStatus: ['possible', 'impossible', 'check_required'].includes(
          parsed.deductionStatus
        )
          ? parsed.deductionStatus
          : 'check_required',
      };
    } catch {
      console.error('JSON Parse Error, using mock response');
      advisory = MOCK_ADVISORY_RESPONSE;
    }

    return { advisory, references: relevantLaws };
  } catch (error) {
    console.error('Advisory Error:', error);
    toast.error('AI 서버 연결 실패');
    return { advisory: MOCK_ADVISORY_RESPONSE, references: relevantLaws };
  }
};
