import { Building2, ShoppingBag } from 'lucide-react';
import type { UserRole } from '../types';

interface StepRoleProps {
  onSelect: (role: UserRole) => void;
}

export function StepRole({ onSelect }: StepRoleProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">
        어떤 입장에서 검토하시나요?
      </h2>
      <p className="text-slate-500 mb-8 text-center">
        정확한 세무 조언을 위해 공급자인지 공급받는자인지 선택해주세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => onSelect('supplier')}
          className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">공급자 (매출)</h3>
          <p className="text-sm text-slate-500 text-center">
            세금계산서를 발급하고<br />매출세액을 신고하는 사업자
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelect('receiver')}
          className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
            <ShoppingBag className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">공급받는자 (매입)</h3>
          <p className="text-sm text-slate-500 text-center">
            세금계산서를 수취하고<br />매입세액 공제를 받는 사업자
          </p>
        </button>
      </div>
    </div>
  );
}
