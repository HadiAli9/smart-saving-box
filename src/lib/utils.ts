import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencyCode?: string) {
  const currency = currencyCode || localStorage.getItem('currency') || 'IQD';
  
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  const currencySymbols: Record<string, string> = {
    'IQD': 'د.ع',
    'USD': '$',
    'EUR': '€',
    'SAR': 'ر.س',
    'AED': 'د.إ',
    'EGP': 'ج.م',
    'JOD': 'د.أ'
  };

  const symbol = currencySymbols[currency] || currency;
  return `${formattedNumber} ${symbol}`;
}

export function numberToArabicWords(number: number, currencyCode?: string): string {
  if (number === 0) return 'صفر';

  const units = ['', 'ألف', 'مليون', 'مليار', 'تريليون'];
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertLessThanOneThousand(n: number): string {
    if (n === 0) return '';
    let result = '';

    const h = Math.floor(n / 100);
    const remainder = n % 100;

    if (h > 0) {
      result += hundreds[h];
      if (remainder > 0) result += ' و ';
    }

    if (remainder > 0) {
      if (remainder < 10) {
        result += ones[remainder];
      } else if (remainder === 10) {
        result += 'عشرة';
      } else if (remainder === 11) {
        result += 'أحد عشر';
      } else if (remainder === 12) {
        result += 'اثنا عشر';
      } else if (remainder < 20) {
        result += ones[remainder % 10] + ' عشر';
      } else {
        const t = Math.floor(remainder / 10);
        const o = remainder % 10;
        if (o > 0) {
          result += ones[o] + ' و ' + tens[t];
        } else {
          result += tens[t];
        }
      }
    }
    return result;
  }

  let result = '';
  let i = 0;
  let n = number;

  while (n > 0) {
    const chunk = n % 1000;
    if (chunk > 0) {
      let chunkStr = convertLessThanOneThousand(chunk);
      if (i > 0) {
        if (chunk === 1) {
          chunkStr = units[i];
        } else if (chunk === 2) {
          chunkStr = units[i] === 'ألف' ? 'ألفان' : units[i] + 'ان';
        } else if (chunk >= 3 && chunk <= 10) {
          chunkStr += ' ' + (units[i] === 'ألف' ? 'آلاف' : units[i] + 'ات');
        } else {
          chunkStr += ' ' + units[i];
        }
      }
      result = chunkStr + (result ? ' و ' + result : '');
    }
    n = Math.floor(n / 1000);
    i++;
  }

  const currency = currencyCode || localStorage.getItem('currency') || 'IQD';
  let currencyName = 'دينار عراقي';
  switch (currency) {
    case 'USD': currencyName = 'دولار أمريكي'; break;
    case 'EUR': currencyName = 'يورو'; break;
    case 'SAR': currencyName = 'ريال سعودي'; break;
    case 'AED': currencyName = 'درهم إماراتي'; break;
    case 'EGP': currencyName = 'جنيه مصري'; break;
    case 'JOD': currencyName = 'دينار أردني'; break;
  }

  return result + ' ' + currencyName;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
