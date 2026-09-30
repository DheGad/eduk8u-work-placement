import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ArrowLeft, FileText, MapPin, BookOpen, Users, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ComplianceReports: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'campus' | 'course' | 'host' | 'supervisor'>('campus');

  // Queries
  const { data: campusData = [] } = useQuery({ queryKey: ['reports', 'campus-risk'], queryFn: async () => (await apiClient.get('/reports/campus-risk')).data.data });
  const { data: courseData = [] } = useQuery({ queryKey: ['reports', 'course-risk'], queryFn: async () => (await apiClient.get('/reports/course-risk')).data.data });
  const { data: hostData = [] } = useQuery({ queryKey: ['reports', 'host-performance'], queryFn: async () => (await apiClient.get('/reports/host-performance')).data.data });
  const { data: supData = [] } = useQuery({ queryKey: ['reports', 'supervisor-performance'], queryFn: async () => (await apiClient.get('/reports/supervisor-performance')).data.data });

  return (
    <div className="page-content">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate('/compliance')}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Reports</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Detailed risk and performance breakdown.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: 0 }}>
        {[
          { id: 'campus', label: 'Campus Risk', icon: MapPin },
          { id: 'course', label: 'Course Risk', icon: BookOpen },
          { id: 'host', label: 'Host Performance', icon: Users },
          { id: 'supervisor', label: 'Supervisor Performance', icon: UserCheck }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '0.625rem 1rem', background: 'none', border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--color-primary-500)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--color-primary-400)' : 'var(--text-muted)',
              fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', fontSize: '0.875rem',
              transition: 'all 0.15s', marginBottom: -1, display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              {activeTab === 'campus' && <tr><th>Campus (State)</th><th>Total Placements</th><th>At Risk</th><th>Risk %</th></tr>}
              {activeTab === 'course' && <tr><th>Course Code</th><th>Total Placements</th><th>At Risk</th><th>Risk %</th></tr>}
              {activeTab === 'host' && <tr><th>Host Facility</th><th>Student Capacity</th><th>Active Placements</th><th>Avg Compliance</th></tr>}
              {activeTab === 'supervisor' && <tr><th>Supervisor Name</th><th>Facility</th><th>Status</th><th>Active Students</th></tr>}
            </thead>
            <tbody>
              {activeTab === 'campus' && campusData.map((d: any, i: number) => (
                <tr key={i}>
                  <td><strong>{d.campus}</strong></td><td>{d.total_placements}</td>
                  <td style={{ color: d.at_risk > 0 ? '#ef4444' : 'inherit' }}>{d.at_risk}</td>
                  <td>{d.total_placements > 0 ? Math.round((d.at_risk / d.total_placements) * 100) : 0}%</td>
                </tr>
              ))}
              {activeTab === 'course' && courseData.map((d: any, i: number) => (
                <tr key={i}>
                  <td><strong>{d.course}</strong></td><td>{d.total_placements}</td>
                  <td style={{ color: d.at_risk > 0 ? '#ef4444' : 'inherit' }}>{d.at_risk}</td>
                  <td>{d.total_placements > 0 ? Math.round((d.at_risk / d.total_placements) * 100) : 0}%</td>
                </tr>
              ))}
              {activeTab === 'host' && hostData.map((d: any, i: number) => (
                <tr key={i}>
                  <td><strong>{d.host}</strong></td><td>{d.student_capacity}</td><td>{d.active_placements}</td>
                  <td>
                    <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, background: d.avg_compliance >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: d.avg_compliance >= 80 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {Math.round(d.avg_compliance)}%
                    </div>
                  </td>
                </tr>
              ))}
              {activeTab === 'supervisor' && supData.map((d: any, i: number) => (
                <tr key={i}>
                  <td><strong>{d.supervisor_name}</strong></td><td>{d.facility_name}</td>
                  <td><span className="badge badge-success">{d.qualification_status}</span></td>
                  <td>{d.active_students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplianceReports;
