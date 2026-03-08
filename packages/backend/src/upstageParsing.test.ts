import { describe, it, expect } from 'vitest';
import { parseUpstageResponse } from './upstageParsing.js';

describe('parseUpstageResponse', () => {
  describe('문서 유형 감지', () => {
    it('일반 세금계산서를 감지한다', () => {
      const response = { text: '전자세금계산서\n공급자\n공급받는자' };
      const { data } = parseUpstageResponse(response);
      expect(data.docType).toBe('general');
      expect(data.isTaxInvoice).toBe(true);
    });

    it('영세율 계산서를 감지한다', () => {
      const response = { text: '세금계산서\n영세율\n공급자' };
      const { data } = parseUpstageResponse(response);
      expect(data.docType).toBe('zero_rate');
      expect(data.isTaxInvoice).toBe(false);
    });

    it('면세 계산서를 감지한다', () => {
      const response = { text: '계산서\n면세\n공급자' };
      const { data } = parseUpstageResponse(response);
      expect(data.docType).toBe('duty_free');
      expect(data.isTaxInvoice).toBe(false);
    });

    it('인식되지 않은 문서는 unknown을 반환한다', () => {
      const response = { text: '영수증\n금액' };
      const { data } = parseUpstageResponse(response);
      expect(data.docType).toBe('unknown');
    });
  });

  describe('사업자등록번호 파싱', () => {
    it('표준 형식의 등록번호를 파싱한다', () => {
      const response = {
        text: '공급자 등록번호: 123-45-67890\n공급받는자 등록번호: 098-76-54321',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierRegNo).toBe('123-45-67890');
      expect(result.receiverRegNo).toBe('098-76-54321');
    });

    it('등록번호 키워드가 포함된 형식을 파싱한다', () => {
      const response = {
        text: '등록번호 1234567890\n등록번호 0987654321',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierRegNo).toBe('123-45-67890');
      expect(result.receiverRegNo).toBe('098-76-54321');
    });

    it('공백이 포함된 등록번호를 처리한다', () => {
      const response = {
        text: '등록번호 123 45 67890',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierRegNo).toBe('123-45-67890');
    });

    it('등록번호가 없으면 빈 문자열을 반환한다', () => {
      const response = { text: '계산서' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierRegNo).toBe('');
      expect(result.receiverRegNo).toBe('');
    });
  });

  describe('회사명 추출', () => {
    it('주식회사 접두사가 있는 회사명을 추출한다', () => {
      const response = {
        text: '주식회사 빌런즈\n공급자',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierName).toBe('주식회사빌런즈');
    });

    it('㈜ 접두사가 있는 회사명을 추출한다', () => {
      const response = {
        text: '㈜삼성전자\n공급받는자',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierName).toBe('㈜삼성전자');
    });

    it('여러 회사가 있을 때 첫 번째 회사를 추출한다', () => {
      const response = {
        text: '(주)LG전자\n㈜삼성전자',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierName).toBe('(주)LG전자');
    });

    it('사업 키워드를 사용하여 회사명을 추출한다', () => {
      const response = {
        text: '상호\n빌런즈세무\n무역산업',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierName).toBe('빌런즈세무');
    });

    it('성명 패턴에서 개인명을 추출한다', () => {
      const response = {
        text: '홍길동 성명\n공급자',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierName).toBe('홍길동');
    });

    it('일반 단어는 회사명에서 제외한다', () => {
      const response = {
        text: '상호\n공급자\n빌런즈세무',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierName).toBe('빌런즈세무');
      expect(result.supplierName).not.toBe('공급자');
    });

    it('회사명이 없으면 빈 문자열을 반환한다', () => {
      const response = { text: '금액: 100,000' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplierName).toBe('');
    });
  });

  describe('날짜 파싱', () => {
    it('YYYY년 MM월 DD일 형식을 파싱한다', () => {
      const response = { text: '작성일자 2024년 3월 15일' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.date).toBe('2024-03-15');
    });

    it('YYYY-MM-DD 형식을 파싱한다', () => {
      const response = { text: '2024-12-31 발행' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.date).toBe('2024-12-31');
    });

    it('YYYY MM DD 형식을 파싱한다', () => {
      const response = { text: '2024 5 7' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.date).toBe('2024-05-07');
    });

    it('한 자리 월과 일을 처리한다', () => {
      const response = { text: '2024년 1월 9일' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.date).toBe('2024-01-09');
    });

    it('특수 문자가 포함된 날짜를 처리한다', () => {
      const response = { text: '20○○ 12 25' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.date).toBe('2000-12-25');
    });

    it('I 문자를 1로 변환한다', () => {
      const response = { text: '2024 3 I' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.date).toBe('2024-03-01');
    });

    it('날짜가 없으면 빈 문자열을 반환한다', () => {
      const response = { text: '계산서' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.date).toBe('');
    });
  });

  describe('금액 계산', () => {
    it('3개 값(합계, 공급가액, 세액)으로부터 금액을 계산한다', () => {
      const response = {
        text: '합계금액: 11,000,000\n공급가액: 10,000,000\n세액: 1,000,000',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplyAmount).toBe(10000000);
      expect(result.taxAmount).toBe(1000000);
    });

    it('3개 금액이 일치하지 않으면 합계에서 계산한다', () => {
      const response = {
        text: '합계금액: 11,000,000\n공급가액: 8,000,000\n세액: 2,000,000',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplyAmount).toBe(10000000);
      expect(result.taxAmount).toBe(1000000);
    });

    it('2개 값(공급가액, 세액)으로부터 금액을 계산한다', () => {
      const response = {
        text: '공급가액: 5,000,000\n세액: 500,000',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplyAmount).toBe(5000000);
      expect(result.taxAmount).toBe(500000);
    });

    it('합계와 공급가액으로부터 금액을 계산한다', () => {
      const response = {
        text: '합계: 5,500,000\n공급가액: 5,000,000',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplyAmount).toBe(5000000);
      expect(result.taxAmount).toBe(500000);
    });

    it('2개 금액이 다른 관계일 때 처리한다', () => {
      const response = {
        text: '금액: 11,000,000\n금액: 8,000,000',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplyAmount).toBe(10000000);
      expect(result.taxAmount).toBe(1000000);
    });

    it('단일 합계 금액으로부터 계산한다', () => {
      const response = {
        text: '합계금액: 11,000,000원',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplyAmount).toBe(10000000);
      expect(result.taxAmount).toBe(1000000);
    });

    it('작은 금액(<1000)은 필터링한다', () => {
      const response = {
        text: '금액: 100\n세액: 500\n합계: 11,000,000',
      };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplyAmount).toBe(10000000);
      expect(result.taxAmount).toBe(1000000);
    });

    it('금액이 없으면 0을 반환한다', () => {
      const response = { text: '계산서' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.supplyAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
    });
  });

  describe('엣지 케이스', () => {
    it('빈 응답을 거부한다', () => {
      const response = {};
      expect(() => parseUpstageResponse(response)).toThrow(
        '유효하지 않은 Upstage OCR 응답 형식입니다'
      );
    });

    it('공백만 있는 응답을 처리한다', () => {
      const response = { text: '   \n\n  \t  ' };
      const { data: result } = parseUpstageResponse(response);
      expect(result.docType).toBe('unknown');
    });

    it('완전한 계산서 데이터를 처리한다', () => {
      const response = {
        text: `전자세금계산서
        공급자
        사업자등록번호: 123-45-67890
        상호: 주식회사 빌런즈

        공급받는자
        사업자등록번호: 098-76-54321
        상호: ㈜세무쟁이

        작성일자: 2024년 12월 15일

        공급가액: 10,000,000
        세액: 1,000,000
        합계금액: 11,000,000`,
      };
      const { data: result } = parseUpstageResponse(response);

      expect(result.docType).toBe('general');
      expect(result.isTaxInvoice).toBe(true);
      expect(result.supplierRegNo).toBe('123-45-67890');
      expect(result.receiverRegNo).toBe('098-76-54321');
      expect(result.supplierName).toBe('주식회사빌런즈');
      expect(result.date).toBe('2024-12-15');
      expect(result.supplyAmount).toBe(10000000);
      expect(result.taxAmount).toBe(1000000);
    });
  });
});
