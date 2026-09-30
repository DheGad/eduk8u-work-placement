import React from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import clsx from 'clsx';

interface FileUploadProps {
  /** Called when files are accepted */
  onFilesAccepted: (files: File[]) => void;
  /** Accepted mime types */
  accept?: Accept;
  /** Max file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Label shown above dropzone */
  label?: string;
  /** Current error message */
  error?: string;
  /** Hint text in dropzone */
  hint?: string;
  disabled?: boolean;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return <Image size={20} />;
  if (mime === 'application/pdf' || mime.includes('document')) return <FileText size={20} />;
  return <File size={20} />;
}

/**
 * Drag-and-drop file upload with preview and validation.
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesAccepted,
  accept,
  maxSize = 10 * 1024 * 1024,
  multiple = false,
  label,
  error,
  hint,
  disabled = false,
  className,
}) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [fileErrors, setFileErrors] = React.useState<string[]>([]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: (accepted, rejected) => {
      setFileErrors(
        rejected.flatMap((r) =>
          r.errors.map((e) =>
            e.code === 'file-too-large'
              ? `${r.file.name}: File too large (max ${formatBytes(maxSize)})`
              : `${r.file.name}: ${e.message}`,
          ),
        ),
      );
      if (accepted.length) {
        const newFiles = multiple ? [...files, ...accepted] : accepted;
        setFiles(newFiles);
        onFilesAccepted(newFiles);
      }
    },
    accept,
    maxSize,
    multiple,
    disabled,
  });

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesAccepted(updated);
  }

  return (
    <div className={clsx('input-group', className)}>
      {label && <label className="input-label">{label}</label>}

      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${
            isDragReject || error
              ? 'var(--color-danger)'
              : isDragActive
              ? 'var(--color-primary-500)'
              : 'var(--surface-border)'
          }`,
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragActive
            ? 'rgba(99, 102, 241, 0.06)'
            : 'var(--surface-input)',
          transition: 'all var(--transition-base)',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input {...getInputProps()} />
        <Upload
          size={32}
          style={{
            color: isDragActive ? 'var(--color-primary-400)' : 'var(--text-muted)',
            margin: '0 auto 8px',
          }}
        />
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
          {isDragActive
            ? 'Drop files here...'
            : 'Drag & drop files, or click to browse'}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {hint ?? `Max file size: ${formatBytes(maxSize)}`}
        </p>
      </div>

      {(error || fileErrors.length > 0) && (
        <div>
          {error && <p className="input-error-msg">{error}</p>}
          {fileErrors.map((e, i) => (
            <p key={i} className="input-error-msg">{e}</p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {files.map((file, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0.5rem 0.75rem',
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ color: 'var(--color-primary-400)', flexShrink: 0 }}>
                {getFileIcon(file.type)}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: '0.8125rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                {formatBytes(file.size)}
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  padding: 2,
                }}
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
