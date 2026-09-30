import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSearch, CheckCircle2, XCircle, AlertTriangle, Download, Package, RefreshCw, Printer } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const REQUIRED_DOCS = ['CA0393','CA0316','CA0395','CA0401','CA0398','CA0355','LR0353'];
const scoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
const scoreBg = (s: number) => s >= 80 ? 'rgba(16,185,129,0.1)' : s >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

async function fetchAuditPackages() {
  const { data } = await apiClient.get('/audit/packages');
  return data.data;
}

export const AuditCentre: React.FC = () => {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: packages = [], isLoading, refetch } = useQuery({
    queryKey: ['audit', 'packages'],
    queryFn: fetchAuditPackages,
  });

  const pkgs = packages as any[];
  const readyCount = pkgs.filter(p => p.audit_readiness >= 80).length;
  const pendingCount = pkgs.filter(p => p.audit_readiness < 80).length;

  async function generatePackage(pkg: any) {
    setGenerating(pkg.placement_id);
    try {
      // 1. Mark as generated in backend (audit log)
      await apiClient.post(`/audit/generate/${pkg.placement_id}`);

      // 2. Generate PDF
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text('ASQA Audit Package', 14, 22);

      doc.setFontSize(12);
      doc.text(`Student: ${pkg.student_name}`, 14, 32);
      doc.text(`Placement Reference: ${pkg.placement_ref}`, 14, 40);
      doc.text(`Host Facility: ${pkg.host_name}`, 14, 48);
      doc.text(`Audit Readiness Score: ${pkg.audit_readiness}%`, 14, 56);
      doc.text(`Hours Completed: ${pkg.hours_completed || 0} / ${pkg.hours_required || 120}`, 14, 64);
      doc.text(`Date Generated: ${new Date().toLocaleDateString('en-AU')}`, 14, 72);

      doc.setFontSize(16);
      doc.text('Evidence Checklist Index', 14, 90);

      const tableData = (pkg.document_checklist || []).map((item: any) => [
        item.code,
        item.label,
        item.present ? 'Present' : 'Missing',
      ]);

      (doc as any).autoTable({
        startY: 96,
        head: [['Form Code', 'Description', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        didParseCell: function (data: any) {
          if (data.section === 'body' && data.column.index === 2) {
            data.cell.styles.textColor = data.cell.raw === 'Present' ? [16, 185, 129] : [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      doc.save(`Audit_Package_${pkg.placement_ref}_${pkg.student_name.replace(/\\s+/g, '_')}.pdf`);
      toast.success('Audit package downloaded successfully!');
      refetch();
    } catch {
      toast.error('Failed to generate audit package');
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Centre</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
            One-click ASQA audit packages — generate, review, and download
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => refetch()}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Audit Ready', value: readyCount, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
          { label: 'Needs Attention', value: pendingCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
          { label: 'Total Placements', value: pkgs.length, color: 'var(--color-primary-400)', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '1.25rem', borderRadius: 12, background: s.bg, border: `1px solid ${s.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Required documents key */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Required Documents Per Package
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {REQUIRED_DOCS.map(code => (
            <span key={code} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-300)', fontFamily: 'monospace' }}>
              {code}
            </span>
          ))}
          <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(148,163,184,0.08)', border: '1px solid var(--surface-border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            + Evidence Index
          </span>
        </div>
      </div>

      {/* Package list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading audit data…</div>
      ) : pkgs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <FileSearch size={48} style={{ margin: '0 auto 1rem', opacity: 0.25, color: 'var(--text-muted)' }} />
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No active placements</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Create and activate placements to generate audit packages.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/placements')}>
            View Placements
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pkgs.map((pkg: any) => {
            const isExpanded = expandedId === pkg.placement_id;
            const isGenerating = generating === pkg.placement_id;
            const readiness = pkg.audit_readiness || 0;

            return (
              <div key={pkg.placement_id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Placement header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--surface-border)' : 'none' }}
                  onClick={() => setExpandedId(isExpanded ? null : pkg.placement_id)}
                >
                  {/* Readiness gauge */}
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: scoreBg(readiness), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${scoreColor(readiness)}44` }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: scoreColor(readiness) }}>{readiness}%</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{pkg.student_name}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-primary-400)' }}>{pkg.placement_ref}</span>
                      {readiness >= 80 ? (
                        <span style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>AUDIT READY</span>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700 }}>IN PROGRESS</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {pkg.host_name} · {pkg.hours_completed || 0}/{pkg.hours_required || 120}h completed
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={e => { e.stopPropagation(); navigate(`/placements/${pkg.placement_id}/report`); }}
                    >
                      <Printer size={14} /> Preview Report
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={isGenerating}
                      onClick={e => { e.stopPropagation(); generatePackage(pkg); }}
                    >
                      {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Package size={14} />}
                      {isGenerating ? 'Generating…' : 'Generate Package'}
                    </button>
                  </div>
                </div>

                {/* Expanded document checklist */}
                {isExpanded && (
                  <div style={{ padding: '1rem 1.25rem', background: 'var(--surface-bg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.625rem' }}>
                    {(pkg.document_checklist || []).map((item: any) => (
                      <div key={item.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem', borderRadius: 8, background: item.present ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${item.present ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                        {item.present ? <CheckCircle2 size={14} color="#10b981" /> : <XCircle size={14} color="#ef4444" />}
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: item.present ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>{item.code}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{item.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditCentre;
