import React, { useRef, useEffect, useCallback } from 'react';
import SignaturePadLib from 'signature_pad';
import Button from '@/components/ui/Button';
import { RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  /** Called with base64 PNG data URL when confirmed */
  onSign: (signature: string) => void;
  /** Called when pad is cleared */
  onClear?: () => void;
  label?: string;
  error?: string;
  width?: number;
  height?: number;
  penColor?: string;
}

/**
 * Digital signature capture pad using the signature_pad library.
 * Captures a base64-encoded PNG on confirm.
 */
export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSign,
  onClear,
  label = 'Sign here',
  error,
  width = 500,
  height = 200,
  penColor = '#818cf8',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = React.useState(true);

  const initPad = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scale canvas for device pixel ratio (retina support)
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);

    const pad = new SignaturePadLib(canvas, {
      penColor,
      backgroundColor: 'rgba(30, 41, 59, 0)',
      minWidth: 1,
      maxWidth: 2.5,
    });
    pad.addEventListener('endStroke', () => {
      setIsEmpty(pad.isEmpty());
    });
    sigPadRef.current = pad;
  }, [penColor]);

  useEffect(() => {
    initPad();
    return () => {
      sigPadRef.current?.off();
    };
  }, [initPad]);

  function handleClear() {
    sigPadRef.current?.clear();
    setIsEmpty(true);
    onClear?.();
  }

  function handleConfirm() {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return;
    const dataUrl = sigPadRef.current.toDataURL('image/png');
    onSign(dataUrl);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <label className="input-label">{label}</label>
      )}
      <div
        style={{
          border: `2px solid ${error ? 'var(--color-danger)' : 'var(--surface-border)'}`,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--surface-input)',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height,
            display: 'block',
            touchAction: 'none',
            cursor: 'crosshair',
          }}
        />
        {isEmpty && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              gap: 6,
            }}
          >
            <span style={{ opacity: 0.5 }}>✍ Sign in this area</span>
          </div>
        )}
      </div>
      {error && <p className="input-error-msg">{error}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          leftIcon={<RotateCcw size={14} />}
          type="button"
        >
          Clear
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          disabled={isEmpty}
          leftIcon={<Check size={14} />}
          type="button"
        >
          Confirm Signature
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
