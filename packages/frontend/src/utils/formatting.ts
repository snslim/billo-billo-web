import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { InvoiceData } from '../types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('ko-KR');
};

export const parseCurrency = (value: string): number => {
  const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

export const anonymizeInvoiceData = (data: InvoiceData): InvoiceData => {
  return {
    ...data,
    supplierRegNo: data.supplierRegNo.substring(0, 3) + '-**-*****',
    receiverRegNo: data.receiverRegNo.substring(0, 3) + '-**-*****',
    supplierName:
      data.supplierName.length > 2
        ? data.supplierName[0] + '**' + data.supplierName.slice(-1)
        : '**',
  };
};
