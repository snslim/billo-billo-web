export const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('ko-KR');
};

export const parseCurrency = (value: string): number => {
  return parseInt(value.replace(/,/g, ''), 10) || 0;
};

export const formatDateToKorean = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${year}년 ${month}월 ${day}일`;
};

export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
