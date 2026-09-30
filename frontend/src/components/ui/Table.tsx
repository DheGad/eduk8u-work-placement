import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import clsx from 'clsx';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  /** Message shown when data is empty */
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  /** Key field used for row keys */
  rowKey?: keyof T;
  onRowClick?: (row: T) => void;
  /** Current sort state */
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
}

const SKELETON_ROWS = 5;

/**
 * Sortable, accessible table with loading skeleton and empty state.
 */
export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found',
  emptyIcon,
  rowKey = 'id' as keyof T,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  className,
}: TableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  function getCellValue(row: T, key: string): unknown {
    return key.split('.').reduce((obj: unknown, k) => {
      if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k];
      return undefined;
    }, row);
  }

  function renderSortIcon(colKey: string) {
    if (sortBy !== colKey) return <ChevronsUpDown size={13} opacity={0.4} />;
    return sortOrder === 'asc' ? (
      <ChevronUp size={13} />
    ) : (
      <ChevronDown size={13} />
    );
  }

  if (loading) {
    return (
      <div className={clsx('table-container', className)} aria-busy="true">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_ROWS }).map((_, ri) => (
              <tr key={ri}>
                {columns.map((col) => (
                  <td key={String(col.key)}>
                    <div
                      className="skeleton"
                      style={{ height: 16, width: `${60 + Math.random() * 30}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={clsx('table-container', className)}>
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {emptyIcon && (
            <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>{emptyIcon}</span>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('table-container', className)}>
      <table className="table" role="grid">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{
                  width: col.width,
                  textAlign: col.align ?? 'left',
                  cursor: col.sortable ? 'pointer' : undefined,
                  userSelect: 'none',
                }}
                className={col.sortable ? 'sortable' : undefined}
                onClick={
                  col.sortable && onSort
                    ? () => onSort(String(col.key))
                    : undefined
                }
                aria-sort={
                  sortBy === String(col.key)
                    ? sortOrder === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {col.header}
                  {col.sortable && renderSortIcon(String(col.key))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr
              key={String(row[rowKey] ?? ri)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onMouseEnter={() => setHoveredRow(ri)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                cursor: onRowClick ? 'pointer' : undefined,
                background:
                  hoveredRow === ri && onRowClick
                    ? 'rgba(99, 102, 241, 0.06)'
                    : undefined,
              }}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onRowClick(row);
                    }
                  : undefined
              }
            >
              {columns.map((col) => {
                const rawValue = getCellValue(row, String(col.key));
                return (
                  <td key={String(col.key)} style={{ textAlign: col.align ?? 'left' }}>
                    {col.render ? col.render(rawValue, row, ri) : String(rawValue ?? '—')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =========================================
// PAGINATION
// =========================================

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

/**
 * Simple pagination controls for use with the Table component.
 */
export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}) => {
  const start = totalItems && pageSize ? (page - 1) * pageSize + 1 : null;
  const end = totalItems && pageSize ? Math.min(page * pageSize, totalItems) : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--surface-border)',
      }}
    >
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        {start && end && totalItems ? (
          <>
            Showing <strong>{start}</strong>–<strong>{end}</strong> of{' '}
            <strong>{totalItems}</strong>
          </>
        ) : (
          `Page ${page} of ${totalPages}`
        )}
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
          return (
            <button
              key={pageNum}
              className={clsx('btn btn-sm', page === pageNum ? 'btn-primary' : 'btn-ghost')}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Table;
