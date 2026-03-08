import type { ReceiverChecklistAnswers, SupplierChecklistAnswers } from '../types';

type ChecklistCategory = 'issuance' | 'situational' | 'reporting';

export interface ChecklistItemMeta<K extends string> {
  key: K;
  title: string;
  description: string;
  subText?: string;
  legalHint?: string;
  category: ChecklistCategory;
}

// 공급자 체크리스트 — 발급 품질 → 상황별 확인 → 신고 준비 순서
export const SUPPLIER_CHECKLIST: ChecklistItemMeta<keyof SupplierChecklistAnswers>[] = [
  {
    key: 'requiredFieldsCorrect',
    title: '필요적 기재사항 정확 기재',
    description:
      '공급자/공급받는자 등록번호, 상호, 작성일자, 공급가액, 세액이 정확하게 기재되어 있나요?',
    legalHint: '기재사항 착오 시 수정세금계산서 발급 대상 (§32④)',
    category: 'issuance',
  },
  {
    key: 'issuedOnTime',
    title: '공급시기에 맞게 발급',
    description: '재화·용역의 공급시기가 속하는 달의 다음 달 10일까지 발급하셨나요?',
    legalHint: '지연발급 시 공급가액의 1% 가산세 (§60②)',
    category: 'issuance',
  },
  {
    key: 'isZeroRate',
    title: '영세율 적용 대상 거래',
    description: '수출 또는 외화획득 용역 등 영세율이 적용되는 거래인가요?',
    subText: '영세율 세금계산서는 세액이 0원이며, 별도의 영세율 첨부서류가 필요합니다.',
    legalHint: '영세율 적용 요건 (§24)',
    category: 'situational',
  },
  {
    key: 'needsCorrection',
    title: '수정세금계산서 발급 필요',
    description: '기재사항 착오, 공급가액 변동, 환입 등으로 수정이 필요한 거래인가요?',
    subText: '수정 사유에 따라 발급 방법과 기한이 다릅니다.',
    legalHint: '수정세금계산서 발급 사유 (§32④)',
    category: 'situational',
  },
  {
    key: 'transmittedOnTime',
    title: '전자발급 후 국세청 전송 완료',
    description:
      '발급일의 다음 날까지 국세청에 전송하셨나요? (법인은 의무, 개인은 직전연도 공급가액 1억 이상 시 의무)',
    legalHint: '미전송 시 가산세 0.5%~1% 부과 (시행령 §68)',
    category: 'reporting',
  },
  {
    key: 'summaryTableReady',
    title: '매출처별 세금계산서 합계표 준비',
    description: '부가가치세 신고 시 제출할 매출처별 합계표를 작성하셨나요?',
    legalHint: '미제출/부실기재 시 가산세 부과 (§54)',
    category: 'reporting',
  },
];

// 매입자 체크리스트
export const RECEIVER_CHECKLIST: ChecklistItemMeta<keyof ReceiverChecklistAnswers>[] = [
  {
    key: 'purposeForBusiness',
    title: '과세 사업을 위한 지출',
    description: '귀사의 과세 사업을 위해 사용하였거나 사용할 재화 또는 용역인가요?',
    subText: '사업과 직접 관련이 없거나 면세 사업과 관련된 매입세액인 경우 체크하지 마세요.',
    category: 'situational',
  },
  {
    key: 'preRegistration',
    title: '사업자 등록 신청 전 매입',
    description: '사업자 등록을 신청하기 전에 발생한 거래인가요?',
    legalHint: '원칙 불공제, 단 등록 신청일부터 역산 20일 이내 공제 가능 (시행령 §75)',
    category: 'situational',
  },
  {
    key: 'specificNonDeductible',
    title: '특정 불공제 항목 해당 여부',
    description: '기업업무추진비(접대비), 토지 관련, 또는 비영업용 소형승용차 관련 지출인가요?',
    legalHint: '해당 시 매입세액 불공제 (§39①)',
    category: 'situational',
  },
];
