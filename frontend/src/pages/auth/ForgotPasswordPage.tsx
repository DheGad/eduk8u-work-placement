import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Zap, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPassword } from '@/api/endpoints/auth';
import Button from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

/**
 * Forgot password page — sends a reset link to the provided email.
 */
const ForgotPasswordPage: React.FC = () => {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await forgotPassword(values.email);
    setSent(true);
    toast.success('Reset link sent! Check your email.');
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
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={20} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: '1.125rem', letterSpacing: '-0.03em' }}>
            EDUK8U
          </span>
        </div>

        {!sent ? (
          <>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 6 }}>
              Reset your password
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9375rem' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div className="input-group">
                <label htmlFor="email" className="input-label">Email address</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Mail size={16} /></span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="you@example.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="input-error-msg">{errors.email.message}</p>}
              </div>

              <Button type="submit" variant="primary" size="lg" loading={isSubmitting} style={{ width: '100%' }}>
                Send reset link
              </Button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <Mail size={28} color="var(--color-success)" />
            </div>
            <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Check your email</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              We've sent a password reset link to{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{getValues('email')}</strong>.
              The link expires in 1 hour.
            </p>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
