import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Upload, Search, Filter, Eye, CheckCircle2, Clock, AlertTriangle, Folder, File } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

const FORM_CODES = ['CA0393','CA0316','CA0395','CA0401','CA0398','CA0355','LR0353','LS0013','Other'];

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  verified: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  approved: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertTriangle },
};

async function fetchDocuments(params: { search?: string; formCode?: string }) {
  const qp = new URLSearchParams();
  if (params.search) qp.set('search', params.search);
  if (params.formCode && params.formCode !== 'All') qp.set('form_code', params.formCode);
  const { data } = await apiClient.get(`/documents?${qp.toString()}`);
  return data.data;
}

export const DocumentVault: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [formCode, setFormCode] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', search, formCode],
    queryFn: () => fetchDocuments({ search, formCode }),
  });

  const docs = documents as any[];
  const byFormCode = FORM_CODES.reduce((acc: Record<string, number>, code) => {
    acc[code] = docs.filter(d => (d.form_code || 'Other') === code).length;
    return acc;
  }, {});

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Vault</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
            Enterprise document management — all placement documents in one place
          </p>
        </div>
      </div>

      {/* Form code summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {FORM_CODES.filter(c => c !== 'Other').map(code => (
          <button
            key={code}
            onClick={() => setFormCode(formCode === code ? 'All' : code)}
            style={{
              padding: '0.75rem', borderRadius: 10, border: `1px solid ${formCode === code ? 'rgba(99,102,241,0.4)' : 'var(--surface-border)'}`,
              background: formCode === code ? 'rgba(99,102,241,0.08)' : 'var(--surface-card)',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: formCode === code ? 'var(--color-primary-400)' : 'var(--text-primary)' }}>
              {byFormCode[code] || 0}
            </div>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{code}</div>
          </button>
        ))}
      </div>

      {/* Search and filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            placeholder="Search documents, students, form codes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 'auto' }} value={formCode} onChange={e => setFormCode(e.target.value)}>
          <option value="All">All Form Codes</option>
          {FORM_CODES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Document list */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading documents…</div>
        ) : docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Folder size={48} style={{ margin: '0 auto 1rem', opacity: 0.25, color: 'var(--text-muted)' }} />
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No documents found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Documents are uploaded via the placement workflow.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/placements')}>
              View Placements
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Form Code</th>
                  <th>Student / Placement</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc: any) => {
                  const status = doc.status || 'pending';
                  const cfg = statusConfig[status] || statusConfig.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={16} style={{ color: 'var(--color-primary-400)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{doc.document_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.mime_type || 'document'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-primary-400)', fontWeight: 600 }}>
                          {doc.form_code || '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{doc.student_name || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{doc.placement_ref || '—'}</div>
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{doc.uploaded_by_name || '—'}</td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(doc.created_at).toLocaleDateString('en-AU')}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: '0.75rem', fontWeight: 600 }}>
                          <StatusIcon size={11} /> {status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {doc.file_path && (
                            <a
                              href={`http://localhost:3000/uploads/${doc.file_path.split('/').pop()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Download"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="View Placement"
                            onClick={() => doc.placement_id && navigate(`/placements/${doc.placement_id}`)}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVault;
