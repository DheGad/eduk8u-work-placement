import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from './landing/HeroSection';
import PartnerLogoWall from './landing/PartnerLogoWall';
import LiveDemoCenter from './landing/LiveDemoCenter';
import WorkflowVisualization from './landing/WorkflowVisualization';
import BeforeAfterComparison from './landing/BeforeAfterComparison';
import EcosystemShowcase from './landing/EcosystemShowcase';
import AnalyticsShowcase from './landing/AnalyticsShowcase';
import ComplianceShowcase from './landing/ComplianceShowcase';
import TestimonialCarousel from './landing/TestimonialCarousel';
import EnterpriseCTA from './landing/EnterpriseCTA';
import EnterpriseTrust from './landing/EnterpriseTrust';
import ROISection from './landing/ROISection';
import { ArrowRight, ShieldCheck, BarChart3, Users, BookOpen } from 'lucide-react';

// Section IDs for anchor-link scrolling
const SECTIONS = {
  platform:   'section-platform',
  compliance: 'section-compliance',
  pricing:    'section-pricing',
  about:      'section-about',
};

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const offset = 72; // nav height
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">

      {/* ── Fixed Navigation ───────────────────────────────── */}
      <nav className="fixed w-full z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex justify-between h-16 items-center">

            {/* Brand — text only, no logo icon */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1 group"
            >
              <span className="text-xl font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                EDUK8U
              </span>
              <span className="hidden sm:inline text-xs text-indigo-400 font-semibold ml-2 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                Intelligence Platform
              </span>
            </button>

            {/* Nav Links — scroll to sections */}
            <div className="hidden md:flex items-center gap-1 mr-6">
              <NavLink label="Platform"   onClick={() => scrollToId(SECTIONS.platform)} />
              <NavLink label="Compliance" onClick={() => scrollToId(SECTIONS.compliance)} />
              <NavLink label="Pricing"    onClick={() => scrollToId(SECTIONS.pricing)} />
              <NavLink label="About"      onClick={() => scrollToId(SECTIONS.about)} />
            </div>

            {/* Auth Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="text-slate-300 hover:text-white font-bold text-sm transition-colors px-3 py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/50 flex items-center gap-2"
              >
                Start Free Pilot <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Hero (full viewport) ───────────────────────────── */}
      <HeroSection />

      {/* ── Platform Section ──────────────────────────────── */}
      <div id={SECTIONS.platform}>
        <PartnerLogoWall />
        <LiveDemoCenter />
        <WorkflowVisualization />
        <BeforeAfterComparison />
        <EcosystemShowcase />
      </div>

      {/* ── Compliance Section ────────────────────────────── */}
      <div id={SECTIONS.compliance}>
        <ComplianceShowcase />
        <AnalyticsShowcase />
        <ROISection />
      </div>

      {/* ── Pricing Section ───────────────────────────────── */}
      <div id={SECTIONS.pricing}>
        <PricingSection navigate={navigate} />
      </div>

      <EnterpriseTrust />
      <TestimonialCarousel />

      {/* ── About Section ─────────────────────────────────── */}
      <div id={SECTIONS.about}>
        <AboutSection />
      </div>

      <EnterpriseCTA />

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-white/10 py-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10">

            {/* Brand */}
            <div className="max-w-xs">
              <div className="text-2xl font-black text-white tracking-tight mb-3">EDUK8U</div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The Intelligence Operating System for Work Placements. Built exclusively for Australian Registered Training Organisations.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm">
              <div>
                <div className="text-white font-bold mb-3">Platform</div>
                {['Admin Dashboard', 'Student Portal', 'Trainer Portal', 'Supervisor App', 'Host Manager'].map(l => (
                  <FooterLink key={l} label={l} onClick={() => scrollToId(SECTIONS.platform)} />
                ))}
              </div>
              <div>
                <div className="text-white font-bold mb-3">Compliance</div>
                {['ASQA Audit Pack', 'Risk Engine', 'Evidence Vault', 'Heatmaps', 'Monitoring Visits'].map(l => (
                  <FooterLink key={l} label={l} onClick={() => scrollToId(SECTIONS.compliance)} />
                ))}
              </div>
              <div>
                <div className="text-white font-bold mb-3">Account</div>
                <FooterLink label="Sign In" onClick={() => navigate('/login')} />
                <FooterLink label="Start Free Pilot" onClick={() => navigate('/register')} />
                <FooterLink label="Pricing" onClick={() => scrollToId(SECTIONS.pricing)} />
                <FooterLink label="About EDUK8U" onClick={() => scrollToId(SECTIONS.about)} />
              </div>
            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} EDUK8U Intelligence Platform. All rights reserved.</span>
            <span>Built for Australian RTOs · ASQA Aligned · Multi-Tenant · SOC2 Ready</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-sm transition-colors rounded-lg hover:bg-white/5"
    >
      {label}
    </button>
  );
}

function FooterLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block text-slate-400 hover:text-white transition-colors mb-2 text-left"
    >
      {label}
    </button>
  );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

function PricingSection({ navigate }: { navigate: (path: string) => void }) {
  const plans = [
    {
      name: 'Starter',
      price: '$299',
      period: '/month',
      desc: 'Perfect for smaller RTOs with up to 50 active students.',
      features: [
        'Up to 50 active placements',
        'Student & Supervisor portals',
        'Digital hour logging',
        'Basic compliance reports',
        'Email support',
      ],
      cta: 'Start Free Trial',
      highlight: false,
    },
    {
      name: 'Professional',
      price: '$699',
      period: '/month',
      desc: 'For growing RTOs managing multi-campus placements at scale.',
      features: [
        'Unlimited placements',
        'All 5 portal roles',
        'ASQA one-click audit pack',
        'Compliance Intelligence Engine',
        'Campus heatmaps & risk scores',
        'Priority support + onboarding',
      ],
      cta: 'Start Free Pilot',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      desc: 'For large RTOs, multi-tenant networks, and TAFE integrations.',
      features: [
        'Everything in Professional',
        'Multi-tenant management',
        'Custom integrations (SIS, LMS)',
        'Dedicated customer success',
        'SLA guarantee',
        'On-premise option',
      ],
      cta: 'Contact Sales',
      highlight: false,
    },
  ];

  return (
    <div className="py-24 bg-slate-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] font-extrabold text-slate-900 mb-4 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            No per-student fees. No surprise charges. One flat rate for your entire institution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col relative ${
                plan.highlight
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-900/30 scale-105'
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <div className={`text-sm font-bold uppercase tracking-widest mb-2 ${plan.highlight ? 'text-indigo-200' : 'text-indigo-600'}`}>
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm font-medium mb-1 ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {plan.desc}
                </p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-indigo-300' : 'text-indigo-600'}`} />
                    <span className={plan.highlight ? 'text-indigo-50' : 'text-slate-700'}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/register')}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  plan.highlight
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {plan.cta} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          All plans include a 30-day free pilot. No credit card required. Australian data sovereignty guaranteed.
        </p>
      </div>
    </div>
  );
}

// ─── About Section ─────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <div className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-6 uppercase tracking-widest">
              <BookOpen className="w-3.5 h-3.5" /> Our Mission
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
              Built by educators,<br />
              <span className="text-indigo-600">for educators.</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              EDUK8U was founded by a team of former RTO administrators who spent years battling spreadsheets, lost logbooks, and last-minute ASQA audit panics. We knew there had to be a better way.
            </p>
            <p className="text-slate-600 leading-relaxed mb-8">
              Today, EDUK8U serves as the compliance backbone for over 24 RTOs across Australia — giving college directors, trainers, students, supervisors, and host facilities a single, seamless platform to manage the full work placement lifecycle from first contact to final audit pack.
            </p>

            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: Users, value: '3,800+', label: 'Students Managed' },
                { icon: ShieldCheck, value: '99.2%', label: 'Audit Pass Rate' },
                { icon: BarChart3, value: '24 RTOs', label: 'Active Colleges' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <s.icon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                  <div className="text-2xl font-black text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'ASQA Standards', desc: 'Every feature maps directly to an ASQA compliance requirement.', color: 'indigo' },
              { title: 'Data Sovereignty', desc: 'All data stored in Australian AWS regions. Full GDPR & Privacy Act compliance.', color: 'emerald' },
              { title: 'Zero Lock-In', desc: 'Export your data at any time, in any format. You own everything.', color: 'sky' },
              { title: '24/7 Support', desc: 'Australian-based support team with an average response time of under 2 hours.', color: 'violet' },
            ].map((c) => (
              <div key={c.title} className={`bg-${c.color}-50 border border-${c.color}-100 rounded-2xl p-6`}>
                <h4 className={`font-bold text-${c.color}-900 mb-2`}>{c.title}</h4>
                <p className={`text-${c.color}-700 text-sm leading-relaxed`}>{c.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
