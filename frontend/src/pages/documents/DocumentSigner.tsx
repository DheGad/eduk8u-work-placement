import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSignature, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

interface DocumentSignerProps {
  documentId: string;
  documentName: string;
  isSigned: boolean;
  requiredSignatures: number;
  currentSignatures: number;
  onSuccess?: () => void;
}

export default function DocumentSigner({ 
  documentId, 
  documentName, 
  isSigned, 
  requiredSignatures, 
  currentSignatures,
  onSuccess
}: DocumentSignerProps) {
  const [isSigning, setIsSigning] = useState(false);
  const qc = useQueryClient();

  const signDoc = useMutation({
    mutationFn: () => apiClient.post(`/documents/${documentId}/sign`, { signature_type: 'electronic' }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success(res.data.isFullySigned ? 'Document fully signed and locked!' : 'Signature applied successfully');
      if (onSuccess) onSuccess();
      setIsSigning(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to sign document');
      setIsSigning(false);
    }
  });

  if (isSigned) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 text-center">
        <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-emerald-900 mb-1">Document Locked</h3>
        <p className="text-emerald-700 text-sm">This document has received all required signatures and is cryptographically locked to prevent tampering.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileSignature className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Digital Signature Required</h3>
        </div>
        <div className="text-sm font-medium text-slate-500">
          Signatures: {currentSignatures} / {requiredSignatures || 1}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
          <FileText className="w-6 h-6 text-blue-500 mt-1" />
          <div>
            <h4 className="font-medium text-slate-900 mb-1">Signatory Declaration</h4>
            <p className="text-sm text-slate-600">
              By clicking "Sign Document" below, you legally sign the document "{documentName}". 
              Your IP address, timestamp, and user identity will be securely recorded in the audit trail.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSigning(true)}
          disabled={signDoc.isPending}
          className="w-full btn btn-primary py-3 text-base"
        >
          {signDoc.isPending ? 'Processing Signature...' : 'Apply Electronic Signature'}
        </button>
      </div>

      {isSigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 overflow-hidden">
            <h2 className="text-xl font-bold mb-4">Confirm Signature</h2>
            <p className="text-slate-600 mb-6">Are you sure you want to permanently apply your signature to this document?</p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsSigning(false)} 
                className="btn btn-secondary"
                disabled={signDoc.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={() => signDoc.mutate()} 
                className="btn btn-primary"
                disabled={signDoc.isPending}
              >
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
