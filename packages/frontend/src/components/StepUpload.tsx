import { Upload, ShieldCheck, Clock } from 'lucide-react';

interface StepUploadProps {
  onUpload: (file: File) => void;
}

export function StepUpload({ onUpload }: StepUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onUpload(event.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">세금계산서 파일 업로드</h2>
        <p className="text-slate-500">
          PDF 또는 이미지(JPG, PNG) 파일을 업로드해주세요.
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <label
          htmlFor="file-upload"
          className="group flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <p className="mb-2 text-sm text-slate-600 font-medium">
              <span className="text-blue-600 font-bold">클릭하여 업로드</span> 또는 파일을 드래그
            </p>
            <p className="text-xs text-slate-400">지원 형식: JPG, PNG, PDF (최대 5MB)</p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
        </label>

        <div className="mt-6 flex justify-center">
          <div className="flex items-center space-x-6 text-xs text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <div className="flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              <span>중요 정보 마스킹 처리</span>
            </div>
            <div className="w-px h-3 bg-slate-300" />
            <div className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              <span>처리 후 즉시 삭제</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
