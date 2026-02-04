import { useEffect, useState } from 'react';
import { Upload, ShieldCheck, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface StepUploadProps {
  file: File | null;
  onUpload: (file: File) => void;
  onCancel: () => void;
}

export function StepUpload({ file, onUpload, onCancel }: StepUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error('5MB 이하 파일만 업로드 가능합니다');
        return;
      }
      onUpload(selectedFile);
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
        {file && previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="업로드된 세금계산서"
              className="w-full max-h-96 object-contain rounded-lg border border-slate-200"
            />
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <p className="mt-4 text-center text-sm text-slate-500">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        ) : (
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
        )}

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
