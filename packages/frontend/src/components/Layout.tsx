import { Monitor } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      {/* 모바일 차단 화면 */}
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 md:hidden">
        <div className="text-center max-w-xs">
          <div className="inline-flex items-center justify-center p-4 bg-slate-100 rounded-full mb-4">
            <Monitor className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">PC에서 이용해주세요</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            세금계산서 검증 서비스는 정확한 문서 확인을 위해 PC 환경에 최적화되어 있습니다.
          </p>
        </div>
      </div>

      {/* PC 레이아웃 */}
      <div className="min-h-screen bg-slate-50 flex-col hidden md:flex">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-slate-900">Billo-Billo</h1>
            <p className="text-sm text-slate-500">세금계산서 검증 서비스</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 grow">{children}</main>

        <footer className="border-t border-slate-200 bg-white mt-auto">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <p className="text-xs text-slate-400 text-center">
              본 서비스는 AI 기반 참고용 정보를 제공하며, 전문 세무사의 조언을 대체하지 않습니다.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
