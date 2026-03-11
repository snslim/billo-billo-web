interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
  );
}
