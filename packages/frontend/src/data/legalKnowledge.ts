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
  {
    id: 'vat-32-4-error',
    source: '부가가치세법 제32조 제4항 (수정세금계산서 — 착오기재)',
    content:
      '세금계산서의 필요적 기재사항이 착오로 사실과 다르게 기재된 경우, 공급자는 수정세금계산서를 발급하여야 한다. 수정세금계산서는 당초 세금계산서의 내용대로 음(-)의 세금계산서를 발급하고, 수정된 내용으로 정(+)의 세금계산서를 새로 발급하는 방식이다.',
    tags: ['수정세금계산서', '착오기재', '기재사항오류', '음의세금계산서'],
    applicableRoles: ['supplier'],
    roleWeight: 0.25,
    category: 'issuance',
  },
  {
    id: 'vat-32-4-price-change',
    source: '부가가치세법 제32조 제4항 (수정세금계산서 — 공급가액 변동)',
    content:
      '재화 또는 용역을 공급한 후에 그 공급가액에 추가 또는 차감되는 금액이 발생한 경우, 공급자는 그 변동 사유가 발생한 날을 작성일자로 하여 증감분에 대한 수정세금계산서를 발급하여야 한다.',
    tags: ['수정세금계산서', '공급가액변동', '추가', '차감', '증감'],
    applicableRoles: ['supplier'],
    roleWeight: 0.2,
    category: 'issuance',
  },
  {
    id: 'vat-32-4-return',
    source: '부가가치세법 제32조 제4항 (수정세금계산서 — 환입)',
    content:
      '공급한 재화가 환입(반품)된 경우, 공급자는 환입된 날을 작성일자로 하여 음(-)의 수정세금계산서를 발급하여야 한다. 계약의 해제에 의한 경우에도 동일하게 적용된다.',
    tags: ['수정세금계산서', '환입', '반품', '계약해제'],
    applicableRoles: ['supplier'],
    roleWeight: 0.2,
    category: 'issuance',
  },
  {
    id: 'vat-32-2',
    source: '부가가치세법 제32조의2 (전자세금계산서의 발급)',
    content:
      '법인사업자와 직전연도 공급가액 합계액이 1억원 이상인 개인사업자는 전자세금계산서를 의무적으로 발급하여야 한다. 전자세금계산서를 발급한 때에는 발급일의 다음 날까지 국세청장에게 전송하여야 한다.',
    tags: ['전자세금계산서', '의무발급', '법인사업자', '개인사업자', '국세청전송'],
    applicableRoles: ['supplier'],
    roleWeight: 0.2,
    category: 'issuance',
  },
  {
    id: 'vat-24',
    source: '부가가치세법 제24조 (영세율)',
    content:
      '수출하는 재화, 국외에서 제공하는 용역, 외화를 획득하는 용역 등에 대하여는 영(0)의 세율을 적용한다. 영세율 적용을 받으려면 수출신고필증, 외화입금증명서 등 영세율 첨부서류를 제출하여야 한다.',
    tags: ['영세율', '수출', '외화획득', '영세율첨부서류', '0세율'],
    applicableRoles: ['supplier'],
    roleWeight: 0.2,
    category: 'general',
  },
  {
    id: 'vat-40',
    source: '부가가치세법 제40조 (겸업사업자의 안분계산)',
    content:
      '과세사업과 면세사업을 겸영하는 사업자는 공통매입세액을 과세공급가액 비율로 안분하여 과세사업 분에 대해서만 매입세액을 공제한다. 안분 비율은 직전 과세기간의 과세·면세 공급가액 비율에 따른다.',
    tags: ['겸업', '안분계산', '공통매입세액', '면세사업', '과세사업'],
    applicableRoles: ['receiver'],
    roleWeight: 0.15,
    category: 'deduction',
  },
  {
    id: 'vat-45',
    source: '부가가치세법 제45조 (대손세액 공제)',
    content:
      '공급받는 자의 파산, 강제집행, 사망 등으로 대손이 확정된 경우, 공급한 사업자는 대손세액을 매출세액에서 공제할 수 있다. 대손이 확정된 날이 속하는 과세기간의 확정신고 시 공제한다.',
    tags: ['대손세액', '파산', '강제집행', '대손확정', '매출세액공제'],
    applicableRoles: ['supplier'],
    roleWeight: 0.15,
    category: 'general',
  },
  {
    id: 'vat-36',
    source: '부가가치세법 제36조 (세금계산서 보관의무)',
    content:
      '사업자는 발급하였거나 발급받은 세금계산서를 5년간 보관하여야 한다. 전자세금계산서의 경우 국세청에 전송 완료한 때에는 보관 의무가 면제된다.',
    tags: ['보관의무', '5년', '전자세금계산서', '보관면제'],
    applicableRoles: ['supplier', 'receiver'],
    roleWeight: 0.1,
    category: 'general',
  },
  {
    id: 'decree-68',
    source: '부가가치세법 시행령 제68조 (전자세금계산서 전송기한)',
    content:
      '전자세금계산서를 발급한 사업자는 발급일의 다음 날까지 국세청장에게 전송하여야 한다. 전송 기한을 경과하여 전송하거나 미전송한 경우 가산세가 부과된다. 지연전송 시 공급가액의 0.3%, 미전송 시 공급가액의 0.5%의 가산세가 부과된다.',
    tags: ['전송기한', '지연전송', '미전송', '가산세', '0.3%', '0.5%', '다음날'],
    applicableRoles: ['supplier'],
    roleWeight: 0.2,
    category: 'penalty',
  },
  {
    id: 'basic-47-3',
    source: '국세기본법 제47조의3 (가산세의 한도)',
    content:
      '각 의무 위반에 따른 가산세의 합계액이 해당 의무 위반에 대한 국세의 일정 비율을 초과하는 경우에는 그 초과하는 부분은 부과하지 아니한다. 다만, 부정행위로 인한 가산세는 한도를 적용하지 아니한다.',
    tags: ['가산세한도', '의무위반', '부정행위', '국세기본법'],
    applicableRoles: ['supplier', 'receiver'],
    roleWeight: 0.1,
    category: 'penalty',
  },
  {
    id: 'vat-60-late-issuance',
    source: '부가가치세법 제60조 제2항 (지연발급 가산세)',
    content:
      '세금계산서를 발급시기가 지난 후 공급시기가 속하는 과세기간에 대한 확정신고기한까지 발급하는 경우 공급가액의 1%를 가산세로 부과한다. 확정신고기한 경과 후에는 미발급으로 본다.',
    tags: ['지연발급', '가산세', '1%', '확정신고기한', '과세기간'],
    applicableRoles: ['supplier'],
    roleWeight: 0.25,
    category: 'penalty',
  },
  {
    id: 'vat-60-no-issuance',
    source: '부가가치세법 제60조 제2항 (미발급 가산세)',
    content:
      '세금계산서를 발급하지 아니한 경우 공급가액의 2%를 가산세로 부과한다. 또한 세금계산서를 발급받는 자에 대해서도 매입세액을 공제하지 아니한다.',
    tags: ['미발급', '가산세', '2%', '매입세액불공제'],
    applicableRoles: ['supplier'],
    roleWeight: 0.25,
    category: 'penalty',
  },
  {
    id: 'vat-60-late-receipt',
    source: '부가가치세법 제60조 제7항 (지연수취 가산세)',
    content:
      '공급받는 자가 세금계산서를 발급시기 이후에 수취한 경우로서 공급시기가 속하는 과세기간의 확정신고기한까지 수취하면 매입세액을 공제받되, 공급가액의 0.5%를 가산세로 부과한다.',
    tags: ['지연수취', '가산세', '0.5%', '확정신고기한', '매입세액공제'],
    applicableRoles: ['receiver'],
    roleWeight: 0.2,
    category: 'penalty',
  },
  {
    id: 'vat-39-entertainment',
    source: '부가가치세법 제39조 제1항 제4호 (접대비 관련 매입세액 불공제)',
    content:
      '기업업무추진비(접대비) 및 이와 유사한 비용의 지출에 관련된 매입세액은 매출세액에서 공제하지 아니한다. 사업 관련성이 있더라도 접대비로 분류되는 한 불공제 대상이다.',
    tags: ['접대비', '기업업무추진비', '불공제', '매입세액'],
    applicableRoles: ['receiver'],
    roleWeight: 0.25,
    category: 'deduction',
  },
  {
    id: 'vat-39-vehicle',
    source: '부가가치세법 제39조 제1항 제5호 (비영업용 소형승용차 관련 불공제)',
    content:
      '비영업용 소형승용자동차의 구입과 임차 및 유지에 관한 매입세액은 매출세액에서 공제하지 아니한다. 다만, 운수업, 자동차판매업 등 영업용으로 사용하는 경우에는 공제 가능하다.',
    tags: ['비영업용승용차', '소형승용차', '불공제', '운수업', '자동차판매업'],
    applicableRoles: ['receiver'],
    roleWeight: 0.2,
    category: 'deduction',
  },
  {
    id: 'vat-39-land',
    source: '부가가치세법 제39조 제1항 제6호 (토지 관련 매입세액 불공제)',
    content:
      '토지의 자본적 지출에 관련된 매입세액은 매출세액에서 공제하지 아니한다. 토지의 조성 등을 위한 자본적 지출과 관련된 매입세액이 해당하며, 건물 신축·증축 관련 매입세액은 공제 가능하다.',
    tags: ['토지', '자본적지출', '불공제', '건물신축', '매입세액'],
    applicableRoles: ['receiver'],
    roleWeight: 0.15,
    category: 'deduction',
  },
] satisfies LegalReference[];

const embeddingCache = new Map<string, number[]>();

async function fetchEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${config.api.baseUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  });
  if (!response.ok) throw new Error('Embedding API Failed');
  const { embeddings } = await response.json();
  return embeddings;
}

async function ensureLawEmbeddings(): Promise<void> {
  if (embeddingCache.size === TAX_LAW_KNOWLEDGE_BASE.length) return;

  const texts = TAX_LAW_KNOWLEDGE_BASE.map((l) => `${l.source}: ${l.content}`);
  const embeddings = await fetchEmbeddings(texts);

  TAX_LAW_KNOWLEDGE_BASE.forEach((law, i) => {
    embeddingCache.set(law.id, embeddings[i]);
  });
}

export function getEmbeddingCacheSize(): number {
  return embeddingCache.size;
}

function vectorSearch(
  queryVector: number[],
  role: 'supplier' | 'receiver' | null
): { law: LegalReference; score: number }[] {
  return TAX_LAW_KNOWLEDGE_BASE.map((law) => {
    const docVector = embeddingCache.get(law.id);
    if (!docVector) return { law, score: 0 };

    const similarity = cosineSimilarity(queryVector, docVector);
    const roleBonus = role && law.applicableRoles.some((r) => r === role) ? law.roleWeight : 0;

    return { law, score: similarity + roleBonus };
  });
}

function tokenize(text: string): string[] {
  return text
    .replace(/[§①②③④⑤⑥⑦()·,./]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

export function keywordSearch(query: string): { law: LegalReference; score: number }[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return TAX_LAW_KNOWLEDGE_BASE.map((law) => ({ law, score: 0 }));

  return TAX_LAW_KNOWLEDGE_BASE.map((law) => {
    const docText = `${law.source} ${law.content} ${law.tags.join(' ')}`;
    const docTokens = tokenize(docText);
    const hits = queryTokens.filter((qt) => docTokens.some((dt) => dt.includes(qt)));
    return { law, score: hits.length / queryTokens.length };
  });
}

function reciprocalRankFusion(
  rankedLists: { law: LegalReference; score: number }[][],
  k = 60
): { law: LegalReference; score: number }[] {
  const fusedScores = new Map<string, { law: LegalReference; score: number }>();

  for (const list of rankedLists) {
    const sorted = [...list].sort((a, b) => b.score - a.score);
    sorted.forEach((item, rank) => {
      const existing = fusedScores.get(item.law.id);
      const rrfScore = 1 / (k + rank + 1);
      fusedScores.set(item.law.id, {
        law: item.law,
        score: (existing?.score ?? 0) + rrfScore,
      });
    });
  }

  return [...fusedScores.values()].sort((a, b) => b.score - a.score);
}

export const retrieveRelevantLaws = async (
  query: string,
  role: 'supplier' | 'receiver' | null
): Promise<LegalReference[]> => {
  try {
    await ensureLawEmbeddings();

    const [queryVector] = await fetchEmbeddings([query]);
    const vectorResults = vectorSearch(queryVector, role);
    const keywordResults = keywordSearch(query);
    const fused = reciprocalRankFusion([vectorResults, keywordResults]);

    return fused.map((item) => item.law).slice(0, 3);
  } catch (e) {
    console.error('Hybrid Search Failed, falling back to keyword search', e);
    const keywordResults = keywordSearch(query);
    return keywordResults
      .sort((a, b) => b.score - a.score)
      .map((item) => item.law)
      .slice(0, 3);
  }
};
