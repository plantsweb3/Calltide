"use client";

import { useCallback } from "react";
import Button from "@/components/ui/button";

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  taxRate: number;
  onTaxRateChange: (rate: number) => void;
  readOnly?: boolean;
}

export function calculateSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0);
}

export function calculateTaxAmount(subtotal: number, taxRate: number): number {
  return Math.round((subtotal * taxRate) / 100 * 100) / 100;
}

export function calculateTotal(subtotal: number, taxAmount: number): number {
  return Math.round((subtotal + taxAmount) * 100) / 100;
}

export default function LineItemsEditor({
  items,
  onChange,
  taxRate,
  onTaxRateChange,
  readOnly = false,
}: LineItemsEditorProps) {
  const updateItem = useCallback(
    (index: number, field: keyof LineItem, value: string | number) => {
      const updated = [...items];
      const item = { ...updated[index] };

      if (field === "description") {
        item.description = value as string;
      } else if (field === "quantity") {
        item.quantity = Math.max(0, Number(value) || 0);
        item.total = Math.round(item.quantity * item.unit_price * 100) / 100;
      } else if (field === "unit_price") {
        item.unit_price = Math.max(0, Number(value) || 0);
        item.total = Math.round(item.quantity * item.unit_price * 100) / 100;
      }

      updated[index] = item;
      onChange(updated);
    },
    [items, onChange]
  );

  const addItem = useCallback(() => {
    onChange([...items, { description: "", quantity: 1, unit_price: 0, total: 0 }]);
  }, [items, onChange]);

  const removeItem = useCallback(
    (index: number) => {
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange]
  );

  const subtotal = calculateSubtotal(items);
  const taxAmount = calculateTaxAmount(subtotal, taxRate);
  const total = calculateTotal(subtotal, taxAmount);

  const inputStyle = {
    background: "var(--db-hover)",
    border: "1px solid var(--db-border)",
    color: "var(--db-text)",
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-wider px-1"
        style={{ color: "var(--db-text-muted)" }}
      >
        <div className="col-span-5">Description</div>
        <div className="col-span-2 text-right">Qty</div>
        <div className="col-span-2 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Total</div>
        {!readOnly && <div className="col-span-1" />}
      </div>

      {/* Line item rows */}
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5">
            <input
              type="text"
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              placeholder="Service or item..."
              readOnly={readOnly}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              style={inputStyle}
            />
          </div>
          <div className="col-span-2">
            <input
              type="number"
              min="0"
              step="1"
              value={item.quantity || ""}
              onChange={(e) => updateItem(index, "quantity", e.target.value)}
              readOnly={readOnly}
              className="w-full rounded-lg px-3 py-2 text-sm text-right outline-none transition-colors tabular-nums"
              style={inputStyle}
            />
          </div>
          <div className="col-span-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.unit_price || ""}
              onChange={(e) => updateItem(index, "unit_price", e.target.value)}
              readOnly={readOnly}
              placeholder="0.00"
              className="w-full rounded-lg px-3 py-2 text-sm text-right outline-none transition-colors tabular-nums"
              style={inputStyle}
            />
          </div>
          <div className="col-span-2">
            <span
              className="block w-full rounded-lg px-3 py-2 text-sm text-right font-medium tabular-nums"
              style={{ color: "var(--db-text)" }}
            >
              ${item.total.toFixed(2)}
            </span>
          </div>
          {!readOnly && (
            <div className="col-span-1 flex justify-center">
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded-md p-1 transition-colors hover:bg-[var(--db-hover)]"
                style={{ color: "var(--db-text-muted)" }}
                title="Remove item"
                aria-label={`Remove line item ${index + 1}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add item button */}
      {!readOnly && (
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-[var(--db-hover)]"
          style={{ color: "var(--db-accent)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add line item
        </button>
      )}

      {/* Totals section */}
      <div
        className="border-t pt-3 mt-4 space-y-2"
        style={{ borderColor: "var(--db-border)" }}
      >
        {/* Subtotal */}
        <div className="flex items-center justify-between px-1">
          <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            Subtotal
          </span>
          <span className="text-sm font-medium tabular-nums" style={{ color: "var(--db-text)" }}>
            ${subtotal.toFixed(2)}
          </span>
        </div>

        {/* Tax rate */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              Tax
            </span>
            {!readOnly ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate || ""}
                  onChange={(e) => onTaxRateChange(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="w-16 rounded-md px-2 py-1 text-xs text-right outline-none tabular-nums"
                  style={inputStyle}
                  placeholder="0"
                />
                <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>%</span>
              </div>
            ) : (
              <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                ({taxRate}%)
              </span>
            )}
          </div>
          <span className="text-sm font-medium tabular-nums" style={{ color: "var(--db-text)" }}>
            ${taxAmount.toFixed(2)}
          </span>
        </div>

        {/* Grand total */}
        <div
          className="flex items-center justify-between px-1 pt-2 border-t"
          style={{ borderColor: "var(--db-border)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
            Total
          </span>
          <span className="text-lg font-bold tabular-nums" style={{ color: "var(--db-text)" }}>
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
