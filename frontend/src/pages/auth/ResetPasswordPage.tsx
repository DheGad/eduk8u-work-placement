import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Zap, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPassword } from '@/api/endpoints/auth';
import Button from '@/components/ui/Button';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
];

/**
 * Reset password page — reads token from query string, submits new password.
 */
const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password', '');

  async function onSubmit(values: FormValues) {
    if (!token) {
      toast.error('Invalid or expired reset link. Please request a new one.');
      return;
    }
    await resetPassword({ token, password: values.password, password_confirmation: values.password_confirmation });
    toast.success('Password updated! Please sign in.');
    navigate('/login', { replace: true });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        animation: 'fadeIn 0.4s ease',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Zap size={20} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: '1.125rem', letterSpacing: '-0.03em' }}>EDUK8U</span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 6 }}>Choose a new password</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9375rem' }}>
          Make it strong and memorable.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Password */}
          <div className="input-group">
            <label htmlFor="password" className="input-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <span className="input-icon" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={16} />
              </span>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className={`input ${errors.password ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                {...register('password')}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password strength checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {PASSWORD_RULES.map((rule, i) => {
                const passed = rule.test(passwordValue);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: passed ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    <CheckCircle size={12} style={{ opacity: passed ? 1 : 0.3 }} />
                    {rule.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label htmlFor="confirm" className="input-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <span className="input-icon" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={16} />
              </span>
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                className={`input ${errors.password_confirmation ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                {...register('password_confirmation')}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password_confirmation && <p className="input-error-msg">{errors.password_confirmation.message}</p>}
          </div>

          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} style={{ width: '100%' }}>
            Update password
          </Button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
