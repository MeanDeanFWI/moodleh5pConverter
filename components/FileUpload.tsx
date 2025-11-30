import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndSetFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.md')) {
      setError("Please upload a .md (Markdown) file.");
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, [disabled, onFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' : 'cursor-pointer'}
          ${isDragging 
            ? 'border-brand-500 bg-brand-50 scale-[1.02] shadow-lg' 
            : selectedFile 
              ? 'border-brand-200 bg-brand-50/30' 
              : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
          }
        `}
      >
        <input
          type="file"
          accept=".md"
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {selectedFile ? (
            <div className="bg-brand-100 p-4 rounded-full">
              <CheckCircle className="w-8 h-8 text-brand-600" />
            </div>
          ) : (
            <div className={`p-4 rounded-full ${isDragging ? 'bg-brand-100' : 'bg-slate-100'}`}>
              <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-brand-600' : 'text-slate-400'}`} />
            </div>
          )}

          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-800">
              {selectedFile ? selectedFile.name : "Upload Markdown File"}
            </h3>
            <p className="text-sm text-slate-500">
              {selectedFile 
                ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                : "Drag and drop or click to browse"
              }
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center justify-center text-red-500 text-sm animate-pulse">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
    </div>
  );
};
