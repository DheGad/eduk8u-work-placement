import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export default function DataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/import/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      toast.success(`Import complete: ${res.data.successCount} added`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setIsUploading(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="page-content max-w-4xl mx-auto">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-500" />
            Bulk Data Import
          </h1>
          <p className="text-slate-500 mt-1">Upload CSV files to securely bulk provision students, supervisors, or host facilities.</p>
        </div>
      </div>

      <div className="card p-8 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Import Students</h2>
        <div className="bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
          <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Select CSV File</h3>
          <p className="text-xs text-slate-500 mb-4">Must include: email, first_name, last_name, student_number</p>
          
          <input 
            type="file" 
            accept=".csv"
            ref={fileInputRef}
            className="hidden" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary px-6"
          >
            {file ? file.name : 'Browse Files'}
          </button>
        </div>

        {file && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="btn btn-primary"
            >
              {isUploading ? 'Uploading & Processing...' : 'Upload & Import Data'}
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="card p-6 border-l-4 border-l-indigo-500">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Import Results</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-center justify-between border border-emerald-100">
              <span className="font-medium">Successfully Imported</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{result.successCount}</span>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center justify-between border border-red-100">
              <span className="font-medium">Failed Rows</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{result.errorCount}</span>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          
          {result.errors && result.errors.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Error Logs</h4>
              <ul className="text-sm text-red-600 bg-red-50/50 p-4 rounded-lg border border-red-100 space-y-1">
                {result.errors.slice(0, 10).map((err: string, i: number) => (
                  <li key={i}>• {err}</li>
                ))}
                {result.errors.length > 10 && (
                  <li className="font-medium text-slate-600 mt-2">...and {result.errors.length - 10} more errors.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
