import React from 'react';
import { ShieldCheck, Database, Lock, Server, Users, FileCheck } from 'lucide-react';

export default function EnterpriseTrust() {
  const trustFeatures = [
    {
      icon: <Lock className="w-6 h-6 text-indigo-600" />,
      title: "Bank-Grade Security",
      description: "End-to-end encryption, regular penetration testing, and robust CORS/CSRF protection."
    },
    {
      icon: <Server className="w-6 h-6 text-indigo-600" />,
      title: "Multi-Tenant Architecture",
      description: "Data isolation by design. Your student records are physically separated from other colleges."
    },
    {
      icon: <Database className="w-6 h-6 text-indigo-600" />,
      title: "PostgreSQL Reliability",
      description: "Built on battle-tested relational database infrastructure ensuring zero data loss and ACID compliance."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
      title: "Comprehensive Audit Logs",
      description: "Every action, signature, and approval is immutably logged with IP and timestamp data."
    },
    {
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      title: "Strict RBAC",
      description: "Role-Based Access Control ensures users only see what they are explicitly permitted to see."
    },
    {
      icon: <FileCheck className="w-6 h-6 text-indigo-600" />,
      title: "100% ASQA Alignment",
      description: "Built specifically to satisfy the Australian Skills Quality Authority evidentiary requirements."
    }
  ];

  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] font-extrabold text-slate-900 mb-6 tracking-tight">
            Enterprise-Grade <span className="text-indigo-600">Trust & Security</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            We handle sensitive student data and compliance records. Our infrastructure is built to exceed the most stringent IT security requirements of major Australian institutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trustFeatures.map((feature, idx) => (
            <div key={idx} className="p-8 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
