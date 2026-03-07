interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Billo-Billo</h1>
          <p className="text-sm text-gray-500">세금계산서 검증 서비스</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
