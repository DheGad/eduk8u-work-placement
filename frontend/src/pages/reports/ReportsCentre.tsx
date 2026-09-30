import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileText, Users, Briefcase, ShieldCheck, Download, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  {
    id: 'executive',
    label: 'Executive Summary',
    description: 'Platform-wide stats for leadership review. Active placements, compliance averages, at-risk students.',
    icon: TrendingUp,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    id: 'compliance',
    label: 'Compliance Report',
    description: '8-point ASQA compliance matrix across all active placements with per-student breakdown.',
    icon: ShieldCheck,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
  },
  {
    id: 'placements',
    label: 'Placements Report',
    description: 'Full list of active, completed, and at-risk placements with hours, evidence, and status.',
    icon: Briefcase,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    id: 'students',
    label: 'Student Progress Report',
    description: 'Individual student progress, hours logged, evidence uploaded, and final signoff status.',
    icon: Users,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
  },
  {
    id: 'hours',
    label: 'Hours Tracking Report',
    description: 'Daily and weekly hours logged across all placements. Identifies students behind schedule.',
    icon: Clock,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
  },
];

async function fetchReport(type: string) {
  const { data } = await apiClient.get(`/reports/${type}`);
  return data.data;
}

const ExportCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const ReportsCentre: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('executive');
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report', selectedType],
    queryFn: () => fetchReport(selectedType),
  });

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const data = await fetchReport(selectedType);
      const rows = Array.isArray(data) ? data : (data?.rows || [data]);
      ExportCSV(rows, `eduk8u-${selectedType}-report`);
      toast.success('Report downloaded as CSV');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  }

  const selectedReport = REPORT_TYPES.find(r => r.id === selectedType);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports Centre</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
            Generate and export placement intelligence reports
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => refetch()}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleDownload} disabled={isDownloading || isLoading}>
            <Download size={16} /> {isDownloading ? 'Downloading…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        {/* Report type selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Report Type</h2>
          {REPORT_TYPES.map(type => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem',
                  border: `1px solid ${isSelected ? type.color + '40' : 'var(--surface-border)'}`,
                  borderRadius: 10, background: isSelected ? type.bg : 'var(--surface-card)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 8, background: type.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Icon size={17} color={type.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? type.color : 'var(--text-primary)' }}>{type.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{type.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Report content */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Report header */}
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-sidebar)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {selectedReport && (
              <>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: selectedReport.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <selectedReport.icon size={19} color={selectedReport.color} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedReport.label}</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Generated: {new Date().toLocaleDateString('en-AU', { dateStyle: 'full' })}</p>
                </div>
              </>
            )}
          </div>

          {/* Report data */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={32} style={{ margin: '0 auto 1rem', opacity: 0.4, animation: 'spin 1s linear infinite' }} />
              <p>Generating report…</p>
            </div>
          ) : !reportData ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No data available for this report.</p>
            </div>
          ) : selectedType === 'executive' ? (
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {Object.entries(reportData as Record<string, any>).map(([key, value]) => (
                <div key={key} style={{ padding: '1rem', borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-card)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{typeof value === 'number' && key.includes('score') ? `${Math.round(value)}%` : value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-container" style={{ padding: 0 }}>
              {Array.isArray(reportData) && reportData.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      {Object.keys(reportData[0]).map(col => (
                        <th key={col} style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{col.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row: any, i: number) => (
                      <tr key={i}>
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} style={{ fontSize: '0.8125rem' }}>{val === null || val === undefined ? '—' : String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No data to display.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsCentre;
