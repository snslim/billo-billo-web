const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) throw new Error(`${key} 환경 변수가 설정되지 않았습니다`);
  return value;
};

export const config = {
  api: {
    baseUrl: getEnvVar('VITE_API_URL'),
    timeout: 10000,
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },
} as const;
