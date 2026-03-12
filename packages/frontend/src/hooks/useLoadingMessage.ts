import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  '세금계산서 데이터를 분석하고 있습니다…',
  '부가가치세법 관련 조항을 검색하고 있습니다…',
  '거래 유형에 맞는 검토 항목을 확인하고 있습니다…',
  'AI가 맞춤 세무 조언을 작성하고 있습니다…',
];

const INTERVAL_MS = 4000;

export function useLoadingMessage(isLoading: boolean): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isLoading]);

  return LOADING_MESSAGES[index];
}
