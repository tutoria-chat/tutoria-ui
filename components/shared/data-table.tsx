'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TableColumn } from '@/lib/types';

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  sorting?: {
    column: string | null;
    direction: 'asc' | 'desc' | null;
    onSortChange: (column: string) => void;
  };
  search?: {
    value: string;
    placeholder?: string;
    onSearchChange: (value: string) => void;
  };
  actions?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  search,
  actions,
  emptyMessage = 'No data available',
  className,
  onRowClick,
}: DataTableProps<T>) {
  const t = useTranslations('common');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const renderCell = (item: T, column: TableColumn<T>, index: number) => {
    if (column.render) {
      return column.render(item[column.key as keyof T], item);
    }
    
    const value = item[column.key as keyof T];
    
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }
    
    return String(value);
  };

  const renderSortIcon = (columnKey: string) => {
    if (!sorting || sorting.column !== columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    
    return sorting.direction === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const getPaginationRange = () => {
    if (!pagination) return [];
    
    const { page, total, limit } = pagination;
    const totalPages = Math.ceil(total / limit);
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with search and actions */}
      {(search || actions) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {search && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={search.placeholder || "Search..."}
                  value={search.value}
                  onChange={(e) => search.onSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={String(column.key)}
                  className={cn(
                    column.width && `w-[${column.width}]`,
                    column.sortable && "cursor-pointer select-none hover:bg-muted/50"
                  )}
                  onClick={() => {
                    if (column.sortable && sorting) {
                      sorting.onSortChange(String(column.key));
                    }
                  }}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && renderSortIcon(String(column.key))}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">{t('loading')}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow
                  key={index}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    hoveredRow === index && "bg-muted/50"
                  )}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={(e) => {
                    // Only trigger row click if not clicking on action buttons
                    const target = e.target as HTMLElement;
                    if (!target.closest('button') && !target.closest('a') && onRowClick) {
                      onRowClick(item, index);
                    }
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {renderCell(item, column, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('pagination.rowsPerPage')}</span>
            <Select
              value={String(pagination.limit)}
              onValueChange={(value) => pagination.onLimitChange(Number(value))}
            >
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('pagination.showing', {
                from: (pagination.page - 1) * pagination.limit + 1,
                to: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total
              })}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPaginationRange().map((pageNum, index) => (
                <React.Fragment key={index}>
                  {pageNum === '...' ? (
                    <span className="px-2">...</span>
                  ) : (
                    <Button
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => pagination.onPageChange(Number(pageNum))}
                    >
                      {pageNum}
                    </Button>
                  )}
                </React.Fragment>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(Math.ceil(pagination.total / pagination.limit))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}