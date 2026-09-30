import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Zap,
  ShieldCheck,
  BarChart3,
  Clock,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '@/api/endpoints/auth';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import type { UserRole } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember_me: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: <ShieldCheck size={18} />, text: 'ASQA Audit Ready — always' },
  { icon: <BarChart3 size={18} />, text: '360° Compliance Dashboard' },
  { icon: <Clock size={18} />, text: 'Automated 120-hour tracking' },
  { icon: <CheckCircle size={18} />, text: 'Digital tripartite signatures' },
];

function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case 'student':       return '/portal/student';
    case 'supervisor':    return '/portal/supervisor';
    case 'host_manager':  return '/portal/host';
    case 'trainer':
    case 'college_admin':
    case 'super_admin':
    default:              return '/dashboard';
  }
}

/**
 * Login page — split layout with animated branding panel and form panel.
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember_me: false },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const { user, tokens } = await login({
        email: values.email,
        password: values.password,
      });
      setTokens(tokens.access_token, tokens.refresh_token);
      setUser(user);
      toast.success(`Welcome back, ${user.first_name}!`);
      
      // Explicit Role-Based Redirection
      if (user.role === 'super_admin' || user.role === 'college_admin') {
        navigate('/dashboard', { replace: true });
      } else if (user.role === 'trainer') {
        navigate('/portal/trainer', { replace: true });
      } else if (user.role === 'supervisor') {
        navigate('/portal/supervisor', { replace: true });
      } else if (user.role === 'host_manager') {
        navigate('/portal/host', { replace: true });
      } else if (user.role === 'student') {
        // We will later add logic here to go to /onboarding if not completed
        navigate('/portal/student', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Invalid email or password. Please try again.';
      setError('root', { message: msg });
      toast.error(msg);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--surface-bg)',
        animation: 'fadeIn 0.4s ease',
      }}
    >
      {/* ---- LEFT PANEL: Branding ---- */}
      <div
        style={{
          flex: '0 0 45%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem 4rem',
          background: 'linear-gradient(145deg, #0d1220 0%, #0f172a 30%, #131e35 60%, #0a0f1e 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-120px',
            right: '-80px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Grid overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', animation: 'slideInLeft 0.6s ease' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '3rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Zap size={24} color="white" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  letterSpacing: '-0.04em',
                  color: 'white',
                  lineHeight: 1,
                }}
              >
                EDUK8U
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em',
            }}
          >
            <span style={{ color: 'white' }}>Work Placement</span>
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-200))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Intelligence Platform
            </span>
          </h1>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '1rem',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
              maxWidth: 400,
            }}
          >
            The enterprise-grade solution for Australian RTOs to manage, monitor,
            and maintain audit-ready work placements at scale.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: 'var(--color-primary-300)',
                  animation: `fadeIn ${0.4 + i * 0.1}s ease`,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* ASQA badge */}
          <div
            style={{
              marginTop: '2.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.5rem 1rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <div
              style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }}
            />
            <span style={{ fontSize: '0.8125rem', color: '#34d399', fontWeight: 500 }}>
              Designed for ASQA-registered RTOs · Australian Standard
            </span>
          </div>
        </div>
      </div>

      {/* ---- RIGHT PANEL: Login Form ---- */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            animation: 'slideInRight 0.5s ease',
          }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: 6,
              }}
            >
              Welcome back
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Sign in to your EDUK8U account
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {/* Root error */}
            {errors.root && (
              <div
                className="alert alert-danger"
                role="alert"
                style={{ animation: 'fadeIn 0.3s ease' }}
              >
                <span style={{ fontSize: '0.875rem' }}>{errors.root.message}</span>
              </div>
            )}

            {/* Email */}
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email address
              </label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="input-error-msg" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" className="input-label">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '0.8125rem', color: 'var(--color-primary-400)' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <span className="input-icon" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 2,
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="input-error-msg" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              <input
                type="checkbox"
                style={{ accentColor: 'var(--color-primary-500)', width: 15, height: 15 }}
                {...register('remember_me')}
              />
              Keep me signed in for 30 days
            </label>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              style={{ width: '100%', marginTop: 4 }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in to EDUK8U'}
            </Button>
          </form>

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
            }}
          >
            <p>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--color-primary-400)' }}>
                Request Access
              </Link>
            </p>
            <p>
              Having trouble?{' '}
              <a
                href="mailto:support@eduk8u.com.au"
                style={{ color: 'var(--color-primary-400)' }}
              >
                Contact IT Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
