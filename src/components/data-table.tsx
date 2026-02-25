"use client";

import { Fragment, useState } from "react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  bulkActions?: Array<{ label: string; onClick: (ids: string[]) => void }>;
  expandedContent?: (row: T) => React.ReactNode;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  pagination,
  sortBy,
  sortOrder,
  onSort,
  selectable = false,
  selectedIds,
  onSelectionChange,
  bulkActions,
  expandedContent,
}: DataTableProps<T>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allSelected =
    data.length > 0 && data.every((row) => selectedIds?.has(row.id));

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((row) => row.id)));
    }
  }

  function toggleRow(id: string) {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  const selected = selectedIds ? Array.from(selectedIds) : [];
  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div
      className="rounded-xl overflow-hidden transition-colors duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      {/* Bulk actions bar */}
      {selectable && selected.length > 0 && bulkActions && (
        <div
          className="flex items-center gap-3 px-4 py-2"
          style={{
            borderBottom: "1px solid var(--db-border)",
            background: "var(--db-hover)",
          }}
        >
          <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
            {selected.length} selected
          </span>
          {bulkActions.map((action) => (
            <button
              key={action.label}
              onClick={() => action.onClick(selected)}
              className="rounded-lg px-3 py-1 text-xs font-medium transition-colors"
              style={{
                background: "var(--db-border)",
                color: "var(--db-text)",
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--db-border)" }}>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded"
                    style={{ accentColor: "var(--db-accent)" }}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wider ${
                    col.sortable ? "cursor-pointer select-none" : ""
                  }`}
                  style={{ color: "var(--db-text-muted)" }}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-12 text-center"
                  style={{ color: "var(--db-text-muted)" }}
                >
                  No data
                </td>
              </tr>
            )}
            {data.map((row) => (
              <Fragment key={row.id}>
                <tr
                  className={`transition-colors ${
                    expandedContent ? "cursor-pointer" : ""
                  }`}
                  style={{
                    borderBottom: "1px solid var(--db-border-light)",
                    background:
                      expandedId === row.id ? "var(--db-hover)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (expandedId !== row.id)
                      e.currentTarget.style.background = "var(--db-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (expandedId !== row.id)
                      e.currentTarget.style.background = "transparent";
                  }}
                  onClick={() => {
                    if (!expandedContent) return;
                    setExpandedId(expandedId === row.id ? null : row.id);
                  }}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds?.has(row.id) ?? false}
                        onChange={() => toggleRow(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                        style={{ accentColor: "var(--db-accent)" }}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap px-4 py-3"
                      style={{ color: "var(--db-text)" }}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
                {expandedContent && expandedId === row.id && (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="px-6 py-4"
                      style={{ background: "var(--db-hover)" }}
                    >
                      {expandedContent(row)}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid var(--db-border)" }}
        >
          <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {pagination.total} total
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-30 transition-colors"
              style={{ color: "var(--db-text-muted)" }}
              onMouseEnter={(e) => {
                if (pagination.page > 1) e.currentTarget.style.background = "var(--db-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Prev
            </button>
            <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-30 transition-colors"
              style={{ color: "var(--db-text-muted)" }}
              onMouseEnter={(e) => {
                if (pagination.page < pagination.totalPages) e.currentTarget.style.background = "var(--db-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
