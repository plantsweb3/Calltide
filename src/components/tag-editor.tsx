"use client";

import { useState, useRef } from "react";

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export default function TagEditor({ tags, onChange, maxTags = 10 }: TagEditorProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(value: string) {
    const tag = value.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= maxTags) return;
    onChange([...tags, tag]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-2 min-h-[38px] cursor-text"
      style={{
        background: "var(--db-hover)",
        border: "1px solid var(--db-border)",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
          style={{ background: "var(--db-accent-bg)", color: "var(--db-accent)" }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="ml-0.5 hover:opacity-70"
            style={{ color: "var(--db-accent)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </span>
      ))}
      {tags.length < maxTags && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input) addTag(input); }}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none"
          style={{ color: "var(--db-text)" }}
        />
      )}
    </div>
  );
}
