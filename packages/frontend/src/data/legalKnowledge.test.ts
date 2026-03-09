import { describe, it, expect } from 'vitest';
import { TAX_LAW_KNOWLEDGE_BASE, cosineSimilarity, keywordSearch } from './legalKnowledge';
import type { LawCategory } from './legalKnowledge';

const VALID_CATEGORIES: LawCategory[] = [
  'issuance',
  'deduction',
  'penalty',
  'reporting',
  'general',
];

describe('TAX_LAW_KNOWLEDGE_BASE 데이터 무결성', () => {
  it('모든 법규정 id가 고유하다', () => {
    const ids = TAX_LAW_KNOWLEDGE_BASE.map((law) => law.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 법규정에 applicableRoles가 비어있지 않다', () => {
    for (const law of TAX_LAW_KNOWLEDGE_BASE) {
      expect(law.applicableRoles.length, `${law.id}의 applicableRoles가 비어있음`).toBeGreaterThan(
        0
      );
    }
  });

  it('모든 법규정에 tags가 비어있지 않다', () => {
    for (const law of TAX_LAW_KNOWLEDGE_BASE) {
      expect(law.tags.length, `${law.id}의 tags가 비어있음`).toBeGreaterThan(0);
    }
  });

  it('category 값이 허용된 값 중 하나다', () => {
    for (const law of TAX_LAW_KNOWLEDGE_BASE) {
      expect(VALID_CATEGORIES, `${law.id}의 category '${law.category}'가 유효하지 않음`).toContain(
        law.category
      );
    }
  });

  it('roleWeight가 0~1 범위다', () => {
    for (const law of TAX_LAW_KNOWLEDGE_BASE) {
      expect(law.roleWeight, `${law.id}의 roleWeight`).toBeGreaterThanOrEqual(0);
      expect(law.roleWeight, `${law.id}의 roleWeight`).toBeLessThanOrEqual(1);
    }
  });

  it('supplier 전용 법규정에 supplier가 포함되어 있다', () => {
    const supplierOnlyIds = [
      'vat-32',
      'vat-34',
      'vat-32-4-error',
      'vat-32-4-price-change',
      'vat-32-4-return',
      'vat-32-2',
      'vat-60',
      'vat-60-late-issuance',
      'vat-60-no-issuance',
      'decree-68',
    ];
    for (const id of supplierOnlyIds) {
      const law = TAX_LAW_KNOWLEDGE_BASE.find((l) => l.id === id);
      expect(law, `${id}를 찾을 수 없음`).toBeDefined();
      expect(law!.applicableRoles).toContain('supplier');
    }
  });

  it('법규정이 25개 이상이다', () => {
    expect(TAX_LAW_KNOWLEDGE_BASE.length).toBeGreaterThanOrEqual(25);
  });
});

describe('cosineSimilarity', () => {
  it('동일한 벡터의 유사도는 1이다', () => {
    const vec = [1, 2, 3];
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1);
  });

  it('직교 벡터의 유사도는 0이다', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('반대 벡터의 유사도는 -1이다', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });
});

describe('keywordSearch', () => {
  it('접대비 검색 시 vat-39-entertainment가 상위에 포함된다', () => {
    const results = keywordSearch('접대비 매입세액 불공제');
    const sorted = [...results].sort((a, b) => b.score - a.score);
    const topIds = sorted.slice(0, 5).map((r) => r.law.id);
    expect(topIds).toContain('vat-39-entertainment');
  });

  it('지연발급 검색 시 vat-60-late-issuance가 상위에 포함된다', () => {
    const results = keywordSearch('지연발급 가산세');
    const sorted = [...results].sort((a, b) => b.score - a.score);
    const topIds = sorted.slice(0, 5).map((r) => r.law.id);
    expect(topIds).toContain('vat-60-late-issuance');
  });

  it('수정세금계산서 검색 시 vat-32-4 관련 항목이 포함된다', () => {
    const results = keywordSearch('수정세금계산서 착오기재');
    const sorted = [...results].sort((a, b) => b.score - a.score);
    const topIds = sorted.slice(0, 5).map((r) => r.law.id);
    expect(topIds).toContain('vat-32-4-error');
  });

  it('빈 쿼리는 모든 법규정에 0점을 반환한다', () => {
    const results = keywordSearch('');
    expect(results.every((r) => r.score === 0)).toBe(true);
  });

  it('사업자등록 전 매입 검색 시 시행령 75조가 포함된다', () => {
    const results = keywordSearch('사업자등록 매입세액 공제');
    const sorted = [...results].sort((a, b) => b.score - a.score);
    const topIds = sorted.slice(0, 5).map((r) => r.law.id);
    expect(topIds).toContain('vat-39-registration-exception');
  });
});
