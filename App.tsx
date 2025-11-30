
import React, { useEffect, useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { buildH5P, validateTemplate } from './services/h5pBuilder';
import { BookOpen, AlertTriangle, Download, Loader2, Check, FileWarning } from 'lucide-react';

const App: React.FC = () => {
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  // 1. Load Template on Mount
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        // Use relative path for Electron compatibility
        const response = await fetch('./template.h5p');
        if (!response.ok) {
          throw new Error(`Failed to load template.h5p (Status: ${response.status}). Please ensure template.h5p exists in the public/root folder.`);
        }
        const buffer = await response.arrayBuffer();
        
        // Validate the template immediately
        const valError = await validateTemplate(buffer);
        if (valError) {
           setError(valError);
           setValidationMsg(valError);
           return; // Stop here, do not set buffer
        }

        setTemplateBuffer(buffer);
      } catch (err: any) {
        setError(err.message || "Unknown error loading template");
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
  }, []);

  const handleProcess = async () => {
    if (!selectedFile || !templateBuffer) return;

    setIsProcessing(true);
    setError(null);
    setIsSuccess(false);

    try {
      await buildH5P(selectedFile, templateBuffer);
      setIsSuccess(true);
      setTimeout(() => {
         setIsSuccess(false);
         setSelectedFile(null); 
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-brand-500 p-3 rounded-2xl shadow-lg shadow-brand-500/20">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            H5P Interactive Book Builder
          </h1>
          <p className="text-lg text-slate-600">
            Turn your Markdown documentation into interactive HTML5 content.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          
          {/* Status Bar: Template Loading */}
          <div className={`p-4 border-b border-slate-100 flex items-center justify-center text-sm ${
             (error || validationMsg) ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'
          }`}>
            {loadingTemplate ? (
              <span className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading System Template...
              </span>
            ) : (error || validationMsg) ? (
              <span className="flex items-center font-bold">
                <FileWarning className="w-5 h-5 mr-2" /> 
                TEMPLATE ERROR: {validationMsg || error}
              </span>
            ) : (
              <span className="flex items-center text-brand-600 font-medium">
                <Check className="w-4 h-4 mr-2" /> Valid Interactive Book Template Loaded
              </span>
            )}
          </div>

          <div className="p-8 sm:p-12">
            {/* Step 1: Upload */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3">1</span>
                Upload Markdown File
              </h2>
              <FileUpload 
                onFileSelect={setSelectedFile} 
                disabled={!templateBuffer || isProcessing} 
              />
            </div>

            {/* Step 2: Action */}
            <div className="border-t border-slate-100 pt-8 flex flex-col items-center">
              {error && !validationMsg && templateBuffer && (
                 <div className="mb-4 text-red-600 bg-red-50 px-4 py-2 rounded-lg flex items-center w-full justify-center text-center">
                    <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
                 </div>
              )}

              {validationMsg && (
                 <div className="mb-6 text-red-800 bg-red-100 px-6 py-4 rounded-xl flex flex-col items-center text-center w-full border border-red-200">
                    <AlertTriangle className="w-8 h-8 mb-2" /> 
                    <p className="font-bold">The 'template.h5p' file is invalid.</p>
                    <p className="text-sm mt-1 opacity-80">Please replace it with a valid H5P Interactive Book file from Lumi/H5P.org.</p>
                 </div>
              )}

              <button
                onClick={handleProcess}
                disabled={!selectedFile || !templateBuffer || isProcessing}
                className={`
                  relative w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all
                  flex items-center justify-center space-x-3
                  ${!selectedFile || !templateBuffer || isProcessing
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98]'
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    <span>Generate & Save .h5p</span>
                  </>
                )}
              </button>

              {isSuccess && (
                <p className="mt-4 text-brand-600 font-medium animate-bounce flex items-center">
                  <Check className="w-5 h-5 mr-1" />
                  File generated successfully!
                </p>
              )}
            </div>
          </div>
          
          <div className="bg-slate-50 px-8 py-4 text-xs text-slate-400 text-center border-t border-slate-100">
            Ensure your markdown uses <code># Chapter Title</code> for sections.
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
