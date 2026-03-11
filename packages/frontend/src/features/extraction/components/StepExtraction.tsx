import { useState, useEffect } from 'react';
import type { InvoiceData, DocType, OcrResult, FieldConfidence, ConfidenceLevel } from '../../../types';
import { config } from '../../../config';
import {
  AlertCircle,
  ArrowRight,
  FileText,
  Info,
  PenLine,
  RefreshCw,
  ScanText,
  Ban,
  BookOpenCheck,
} from 'lucide-react';
import { formatCurrency, parseCurrency, cn } from '../../../utils/formatting';
import toast from 'react-hot-toast';

interface Props {
  file: File | null;
  initialData: InvoiceData | null;
  isDemo: boolean;
  onConfirm: (data: InvoiceData) => void;
  onCancel: () => void;
}

interface InvoiceInputProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: 'text' | 'number' | 'date' | 'currency';
  placeholder?: string;
  required?: boolean;
  confidence?: ConfidenceLevel;
}

const isLowConfidence = (c?: ConfidenceLevel) => c === 'low' || c === 'missing';

const InvoiceInput = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  confidence,
}: InvoiceInputProps) => {
  const displayValue = type === 'currency' ? formatCurrency(value) : value;
  const showWarning = isLowConfidence(confidence);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (type === 'currency') val = val.replace(/[^0-9]/g, '');
    onChange(val);
  };

  return (
    <div className="group">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center">
        {label} {required && <span className="text-red-500">*</span>}
        {showWarning && (
          <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
            확인 필요
          </span>
        )}
      </label>
      <input
        type={type === 'currency' ? 'text' : type}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full p-2.5 bg-white text-slate-900 border rounded-md text-sm transition-all outline-none',
          showWarning ? 'border-amber-400 ring-1 ring-amber-200' : 'border-slate-300',
          'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          (type === 'currency' || label.includes('사업자') || label.includes('등록번호')) &&
            'font-mono',
          type === 'currency' && 'text-right'
        )}
      />
    </div>
  );
};

const SkeletonForm = ({ onManualInput }: { onManualInput: () => void }) => (
  <div className="space-y-6">
    <div className="animate-pulse space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-5 h-5 bg-slate-200 rounded-full"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-14 bg-slate-200 rounded"></div>
        <div className="h-14 bg-slate-200 rounded"></div>
      </div>
      <div className="h-14 bg-slate-200 rounded mt-4"></div>
      <div className="h-14 bg-slate-200 rounded mt-4"></div>
    </div>

    <div className="flex flex-col items-center justify-center pt-8 border-t border-slate-100 mt-8">
      <p className="text-xs text-slate-400 mb-3">분석이 지연되고 있나요?</p>
      <button
        onClick={onManualInput}
        className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <PenLine className="w-3.5 h-3.5 mr-2" />
        직접 입력하기
      </button>
    </div>
  </div>
);

const callOCRApi = async (file: File, signal?: AbortSignal): Promise<OcrResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${config.api.baseUrl}/api/ocr`, {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!response.ok) {
    throw new Error('OCR 처리 실패');
  }

  return response.json();
};

export const StepExtraction = ({ file, initialData, isDemo, onConfirm, onCancel }: Props) => {
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [extractionFailed, setExtractionFailed] = useState<boolean>(false);
  const [fieldConfidence, setFieldConfidence] = useState<FieldConfidence | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [data, setData] = useState<InvoiceData>({
    docType: 'general',
    isTaxInvoice: false,
    supplierRegNo: '',
    supplierName: '',
    receiverRegNo: '',
    date: '',
    supplyAmount: 0,
    taxAmount: 0,
  });

  const switchToManualEntry = () => {
    toast.dismiss();
    setData({
      docType: 'general',
      isTaxInvoice: true,
      supplierRegNo: '',
      supplierName: '',
      receiverRegNo: '',
      date: new Date().toISOString().split('T')[0],
      supplyAmount: 0,
      taxAmount: 0,
    });
    setExtractionFailed(false);
    setLoading(false);
  };

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    if (!file) return;

    const abortController = new AbortController();
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setLoading(true);
    setExtractionFailed(false);

    const toastId = toast.loading('AI 문서 분석 중...');

    callOCRApi(file, abortController.signal)
      .then((ocrResult) => {
        if (abortController.signal.aborted) return;
        setData(ocrResult.data);
        setFieldConfidence(ocrResult.confidence);
        const result = ocrResult.data;
        if (result.docType !== 'general') {
          toast.error('지원하지 않는 문서 유형입니다.', { id: toastId });
        } else {
          toast.success('데이터 추출 완료', { id: toastId });
        }
        setExtractionFailed(false);
        setLoading(false);
      })
      .catch((err) => {
        if (abortController.signal.aborted) return;
        console.error(err);
        setExtractionFailed(true);
        setErrorMessage('문서 인식에 실패했습니다. 다시 시도해주세요.');
        toast.error('자동 분석 실패', { id: toastId });
        setLoading(false);
      });

    return () => {
      abortController.abort();
      toast.dismiss(toastId);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, initialData]);

  const handleUpdate = (field: keyof InvoiceData, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  if (!loading && data.docType !== 'general' && !extractionFailed) {
    type UnsupportedDocType = Exclude<DocType, 'general'>;
    const docInfo: Record<UnsupportedDocType, { title: string; lawRef: string }> = {
      zero_rate: {
        title: '영세율 세금계산서',
        lawRef:
          '부가가치세법 제21조~제24조에 따른 영세율 적용 거래는 수출 등 특수한 경우에 해당하며, 별도의 영세율 첨부서류 제출이 필요합니다.',
      },
      duty_free: {
        title: '계산서 (면세)',
        lawRef:
          '부가가치세법 제26조에 따른 면세 거래는 세금계산서가 아닌 계산서를 발급하며, 매입세액 공제가 적용되지 않습니다.',
      },
      unknown: {
        title: '알 수 없는 문서',
        lawRef: '문서 유형을 인식할 수 없습니다. 세금계산서 양식이 맞는지 확인해주세요.',
      },
    };
    const info = docInfo[data.docType as UnsupportedDocType];

    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16 px-4 animate-fade-in">
        <div className="inline-flex items-center justify-center p-4 bg-amber-50 rounded-full mb-6 ring-4 ring-amber-50">
          <Ban className="w-10 h-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          '{info.title}'는 지원하지 않습니다.
        </h3>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-lg mx-auto mb-8 text-left">
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            저희 서비스는 <strong>일반 과세자 간의 세금계산서(10% 세율)</strong> 분석 및 검증에
            최적화되어 있습니다.
            <br />
            <br />
            현재 업로드하신 문서는 법적 검토 기준과 가산세 규정이 일반 세금계산서와 다르기 때문에,
            AI가 잘못된 조언을 제공할 위험이 있어 처리를 제한하고 있습니다.
          </p>
          <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-start">
            <BookOpenCheck className="w-4 h-4 text-blue-600 mt-0.5 mr-2 shrink-0" />
            <span className="text-xs text-slate-500">{info.lawRef}</span>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          다른 파일 업로드하기
        </button>
      </div>
    );
  }

  if (extractionFailed) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16 px-4">
        <div className="inline-flex items-center justify-center p-4 bg-red-50 rounded-full mb-6 ring-4 ring-red-50">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">문서 인식 실패</h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">{errorMessage}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border rounded-lg hover:bg-slate-50 text-sm"
          >
            재시도
          </button>
          <button
            onClick={switchToManualEntry}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm flex items-center"
          >
            <PenLine className="w-4 h-4 mr-2" /> 직접 입력
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isDemo ? '' : 'lg:flex-row'} gap-6 h-full animate-fade-in`}>
      {!isDemo && (
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="flex items-center mb-3">
            <FileText className="w-4 h-4 mr-2 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">원본 이미지</h3>
          </div>
          <div className="grow bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative min-h-[400px] flex items-center justify-center group">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[600px] object-contain shadow-sm transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="text-sm text-slate-400">이미지 미리보기 없음</div>
            )}
          </div>
        </div>
      )}

      <div className={`w-full ${isDemo ? 'max-w-2xl mx-auto' : 'lg:w-1/2'} flex flex-col`}>
        {loading ? (
          <SkeletonForm onManualInput={switchToManualEntry} />
        ) : (
          <>
            {isDemo && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  샘플 데이터로 체험 중입니다. 데이터를 수정하면 AI 조언이 달라집니다.
                </p>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <ScanText className="w-5 h-5 mr-2 text-blue-600" />
                {isDemo ? '데모 데이터 확인' : 'OCR 데이터 확인'}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InvoiceInput
                  label="공급자 등록번호"
                  value={data.supplierRegNo}
                  onChange={(val) => handleUpdate('supplierRegNo', val)}
                  required
                  confidence={fieldConfidence?.supplierRegNo}
                />
                <InvoiceInput
                  label="공급자 상호"
                  value={data.supplierName}
                  onChange={(val) => handleUpdate('supplierName', val)}
                  required
                  confidence={fieldConfidence?.supplierName}
                />
              </div>
              <div className="border-t border-slate-100"></div>
              <InvoiceInput
                label="공급받는자 등록번호"
                value={data.receiverRegNo}
                onChange={(val) => handleUpdate('receiverRegNo', val)}
                required
                confidence={fieldConfidence?.receiverRegNo}
              />
              <div className="border-t border-slate-100"></div>
              <InvoiceInput
                label="작성연월일"
                type="date"
                value={data.date}
                onChange={(val) => handleUpdate('date', val)}
                required
                confidence={fieldConfidence?.date}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InvoiceInput
                  label="공급가액"
                  type="currency"
                  value={data.supplyAmount}
                  onChange={(val) => handleUpdate('supplyAmount', parseCurrency(val))}
                  required
                  confidence={fieldConfidence?.supplyAmount}
                />
                <InvoiceInput
                  label="세액"
                  type="currency"
                  value={data.taxAmount}
                  onChange={(val) => handleUpdate('taxAmount', parseCurrency(val))}
                  required
                  confidence={fieldConfidence?.taxAmount}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                재업로드
              </button>
              <button
                onClick={() => onConfirm(data)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md flex items-center"
              >
                <span>검토 완료</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
