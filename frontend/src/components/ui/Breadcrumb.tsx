import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Show home icon as first item */
  showHome?: boolean;
}

/**
 * Navigation breadcrumb with accessible ARIA label.
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showHome = true,
}) => {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          listStyle: 'none',
          padding: 0,
          margin: 0,
          flexWrap: 'wrap',
        }}
      >
        {showHome && (
          <li style={{ display: 'flex', alignItems: 'center' }}>
            <Link
              to="/"
              style={{
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                transition: 'color var(--transition-fast)',
              }}
              aria-label="Home"
            >
              <Home size={14} />
            </Link>
          </li>
        )}
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronRight
                size={12}
                style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                aria-hidden="true"
              />
              {isLast || !item.href ? (
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: isLast ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: isLast ? 500 : 400,
                  }}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
