import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
import { 
  ChevronUp, ChevronDown, ChevronsUpDown, Search, Download, 
  Settings2, Filter, FileX
} from 'lucide-react';
import clsx from 'clsx';
import { EmptyState } from './EmptyState';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  onRowClick?: (row: TData) => void;
  exportName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  onRowClick,
  exportName = 'export',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const exportCsv = () => {
    const rows = table.getFilteredRowModel().rows;
    const headers = table.getAllLeafColumns().map(c => c.columnDef.header as string).filter(h => h);
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.getVisibleCells().map(cell => {
        const val = cell.getValue();
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportName}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
            className="w-full h-9 pl-9 pr-4 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white placeholder-[#71717A] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-[#333333] bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white text-[13px] font-medium transition-colors">
            <Filter className="w-4 h-4 mr-2 text-[#A1A1AA]" />
            Filters
          </button>
          <button className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-[#333333] bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white text-[13px] font-medium transition-colors">
            <Settings2 className="w-4 h-4 mr-2 text-[#A1A1AA]" />
            View
          </button>
          <button onClick={exportCsv} className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-[#333333] bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white text-[13px] font-medium transition-colors">
            <Download className="w-4 h-4 mr-2 text-[#A1A1AA]" />
            Export
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-[#222222] bg-[#0A0A0A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-[#222222] bg-[#0F0F0F]">
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      className={clsx(
                        "py-3 px-4 text-[12px] font-medium text-[#A1A1AA] select-none",
                        header.column.getCanSort() && "cursor-pointer hover:text-white transition-colors"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder ? null : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-[#555555]">
                            {{
                              asc: <ChevronUp className="w-3.5 h-3.5" />,
                              desc: <ChevronDown className="w-3.5 h-3.5" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 bg-[#1A1A1A] rounded animate-pulse" style={{ width: `${Math.random() * 40 + 40}%` }}></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <tr 
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={clsx(
                      "group transition-colors",
                      onRowClick ? "cursor-pointer hover:bg-[#111111]" : ""
                    )}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-3 px-4 text-[13px] text-white">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-8">
                    <EmptyState 
                      icon={FileX}
                      title="No results found"
                      description="Try adjusting your search or filters to find what you're looking for."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION */}
        {data.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#222222] bg-[#0A0A0A]">
            <div className="text-[13px] text-[#71717A]">
              Showing <strong className="text-white">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</strong> to <strong className="text-white">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</strong> of <strong className="text-white">{table.getFilteredRowModel().rows.length}</strong> results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
