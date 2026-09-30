import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';

interface AuditReportData {
  generated_at: string;
  rto?: { name: string; rto_code: string; address: string };
  student?: Record<string, any>;
  placement?: Record<string, any>;
  hours?: Record<string, any>;
  compliance?: { score: number; checklist: Array<{ label: string; done: boolean; note?: string }> };
  evidence?: Array<{ name: string; status: string; date: string }>;
  journal_summary?: Array<{ date: string; activities: string }>;
}

export const AuditReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<AuditReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/reports/placement/${id}`)
      .then((res: any) => setReport(res.data?.data ?? null))
      .catch(() => setError('Failed to load report data.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }} className="no-print">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        {!loading && !error && report && (
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print / Export PDF
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading report...</div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <AlertCircle size={48} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      )}

      {!loading && !error && !report && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          {id ? 'No report data found for this placement.' : 'Select a placement to view its audit report.'}
        </div>
      )}

      {!loading && !error && report && (
        <div id="audit-report" style={{ background: '#fff', color: '#111', padding: '48px', maxWidth: 860, margin: '0 auto', borderRadius: '1rem', boxShadow: 'var(--shadow-xl)' }}>
          <div style={{ paddingBottom: '1.5rem', borderBottom: '3px solid #4f46e5', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>PLACEMENT AUDIT REPORT</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', marginBottom: '0.25rem' }}>{report.rto?.name ?? 'EDUK8U Placement Management'}</h1>
            <div style={{ fontSize: '0.875rem', color: '#555' }}>Generated: {report.generated_at}</div>
          </div>

          {report.student && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>Student Details</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                {Object.entries(report.student).map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ padding: '0.25rem 0', color: '#555', width: '45%' }}>{k.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '0.25rem 0', fontWeight: 500 }}>{String(v ?? '')}</td>
                  </tr>
                ))}
              </table>
            </div>
          )}

          {report.compliance && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>Compliance Checklist</h2>
              {report.compliance.checklist?.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0.875rem', background: item.done ? '#f0fdf4' : '#fef2f2', border: `1px solid ${item.done ? '#bbf7d0' : '#fecaca'}`, borderRadius: '0.375rem', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                  <span>{item.done ? '✅' : '❌'}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: item.done ? '#065f46' : '#7f1d1d' }}>{item.label}</div>
                    {!item.done && item.note && <div style={{ color: '#b91c1c', fontSize: '0.75rem' }}>{item.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.7rem', color: '#888', textAlign: 'center' }}>
            This document is generated by the EDUK8U Work Placement Intelligence Platform · Confidential
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #audit-report { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

export default AuditReport;
