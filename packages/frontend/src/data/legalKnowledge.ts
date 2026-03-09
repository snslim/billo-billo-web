import { config } from '../config';

export type LawCategory = 'issuance' | 'deduction' | 'penalty' | 'reporting' | 'general';

export interface LegalReference {
  id: string;
  source: string;
  content: string;
  tags: string[];
  applicableRoles: ('supplier' | 'receiver')[];
  roleWeight: number;
  category: LawCategory;
  embedding?: number[];
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const TAX_LAW_KNOWLEDGE_BASE = [
  {
    id: 'vat-32',
    source: '부가가치세법 제32조 (세금계산서의 필요적 기재사항)',
    content:
      '세금계산서에는 다음 각 호의 사항을 적어야 하며, 이를 누락하거나 사실과 다르게 적으면 정당한 세금계산서로 보지 아니한다. 1. 공급하는 사업자의 등록번호와 성명 또는 명칭 2. 공급받는 자의 등록번호 3. 공급가액과 부가가치세액 4. 작성연월일',
    tags: ['필요적기재사항', '등록번호', '공급가액', '세액', '작성연월일'],
    applicableRoles: ['supplier'],
    roleWeight: 0.25,
    category: 'issuance',
  },
  {
    id: 'vat-34',
    source: '부가가치세법 제34조 (세금계산서 발급시기)',
    content:
      '세금계산서는 재화 또는 용역의 공급시기가 속하는 달의 다음 달 10일(그 날이 공휴일 또는 토요일인 경우에는 바로 다음 영업일)까지 발급할 수 있다. 이 기한을 넘기면 지연발급 가산세 대상이 된다.',
    tags: ['발급시기', '지연발급', '다음달10일', '공급시기'],
    applicableRoles: ['supplier'],
    roleWeight: 0.25,
    category: 'issuance',
  },
  {
    id: 'vat-38',
    source: '부가가치세법 제38조 (공제하는 매입세액)',
    content:
      '사업자가 자기의 사업을 위하여 사용하였거나 사용할 목적으로 공급받은 재화 또는 용역에 대한 부가가치세액은 매출세액에서 공제한다. 사업과 관련성이 입증되어야 한다.',
    tags: ['매입세액공제', '사업관련성', '매출세액'],
    applicableRoles: ['receiver'],
    roleWeight: 0.25,
    category: 'deduction',
  },
  {
    id: 'vat-39',
    source: '부가가치세법 제39조 (공제받지 못하는 매입세액)',
    content:
      '세금계산서 미수취, 필요적 기재사항 누락, 사업과 직접 관련 없는 지출, 비영업용 소형승용차 구입 및 임차, 접대비 관련 매입세액은 매출세액에서 공제하지 아니한다.',
    tags: ['불공제', '접대비', '비영업용승용차', '사업무관'],
    applicableRoles: ['receiver'],
    roleWeight: 0.25,
    category: 'deduction',
  },
  {
    id: 'vat-39-registration-exception',
    source: '부가가치세법 시행령 제75조 (등록 신청 전 매입세액 예외)',
    content:
      '사업자 등록을 신청하기 전의 매입세액은 공제하지 아니한다. 다만, 공급시기가 속하는 과세기간이 끝난 후 20일 이내에 등록을 신청한 경우, 등록신청일부터 공급시기가 속하는 과세기간 기산일(1월 1일 또는 7월 1일)까지 역산하여 매입세액을 공제할 수 있다.',
    tags: ['사전등록', '매입세액', '과세기간', '20일이내'],
    applicableRoles: ['receiver'],
    roleWeight: 0.25,
    category: 'deduction',
  },
  {
    id: 'vat-54',
    source: '부가가치세법 제54조 (세금계산서합계표의 제출)',
    content:
      '사업자는 과세기간의 종료 후 25일 이내에 세금계산서 합계표를 제출하여야 한다. 매입처별 세금계산서 합계표를 제출하지 아니하거나 부실하게 적은 경우에는 매입세액을 공제받을 수 없다.',
    tags: ['합계표', '제출', '25일이내', '부실기재'],
    applicableRoles: ['supplier', 'receiver'],
    roleWeight: 0.2,
    category: 'reporting',
  },
  {
    id: 'vat-60',
    source: '부가가치세법 제60조 (가산세)',
    content:
      '1. 세금계산서를 발급시기가 지난 후 재화 또는 용역의 공급시기가 속하는 과세기간에 대한 확정신고 기한까지 발급하는 경우: 공급가액의 1%.\n2. 세금계산서를 발급하지 아니한 경우: 공급가액의 2% 가산세가 부과된다.',
    tags: ['가산세', '지연발급', '미발급', '1%', '2%'],
    applicableRoles: ['supplier'],
    roleWeight: 0.25,
    category: 'penalty',
  },
  {
    id: 'vat-60-receiver',
    source: '부가가치세법 제60조 제7항 (매입자 가산세)',
    content:
      '공급받는 자가 세금계산서를 발급시기 이후에 수취한 경우로서 공급시기가 속하는 과세기간의 확정신고기한까지 수취하면 공급가액의 0.5% 가산세가 부과된다. 또한 매입처별 세금계산서 합계표의 기재사항이 사실과 다르게 적힌 경우 공급가액의 0.5% 가산세가 부과된다.',
    tags: ['가산세', '지연수취', '합계표', '0.5%'],
    applicableRoles: ['receiver'],
    roleWeight: 0.25,
    category: 'penalty',
  },
  {
    id: 'closed-biz',
    source: '부가가치세법 기본통칙 5-0-3 (폐업자 거래)',
    content:
      '사업자가 폐업한 후 폐업일이 속하는 과세기간의 다음 과세기간 개시일 이후에 발급한 세금계산서는 정당한 세금계산서로 볼 수 없으며, 해당 매입세액은 공제받을 수 없다.',
    tags: ['폐업', '매입세액', '불공제'],
    applicableRoles: ['receiver'],
    roleWeight: 0.15,
    category: 'general',
  },
] satisfies LegalReference[];

export const retrieveRelevantLawsByVector = async (
  query: string,
  role: 'supplier' | 'receiver' | null
): Promise<LegalReference[]> => {
  try {
    const allTexts = [query, ...TAX_LAW_KNOWLEDGE_BASE.map((l) => `${l.source}: ${l.content}`)];

    const response = await fetch(`${config.api.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: allTexts }),
    });

    if (!response.ok) throw new Error('Embedding API Failed');

    const { embeddings } = await response.json();

    const queryVector = embeddings[0];
    const docVectors = embeddings.slice(1);

    const scoredLaws = TAX_LAW_KNOWLEDGE_BASE.map((law, index) => {
      const score = cosineSimilarity(queryVector, docVectors[index]);
      let weightedScore = score;

      if (role === 'receiver') {
        if (
          law.id.includes('38') ||
          law.id.includes('39') ||
          law.id.includes('54') ||
          law.id === 'vat-60-receiver'
        ) {
          weightedScore += 0.25;
        }
      }
      if (role === 'supplier') {
        if (law.id.includes('32') || law.id === 'vat-60') {
          weightedScore += 0.25;
        }
      }

      return { law, score: weightedScore };
    });

    return scoredLaws
      .sort((a, b) => b.score - a.score)
      .map((item) => item.law)
      .slice(0, 3);
  } catch (e) {
    console.error('Vector Search Failed, falling back to basic filter', e);
    return TAX_LAW_KNOWLEDGE_BASE.slice(0, 3);
  }
};
