"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IconThumbsUp, IconThumbsDown } from "@/components/icons";

interface Props {
  articleId: string;
  content: string;
  lang: "en" | "es";
}

function getSessionId() {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("help_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("help_sid", sid);
  }
  return sid;
}

export default function ArticleBody({ articleId, content, lang }: Props) {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const viewTracked = useRef(false);

  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;

    const viewed = sessionStorage.getItem(`help_viewed_${articleId}`);
    if (viewed) return;

    sessionStorage.setItem(`help_viewed_${articleId}`, "1");
    fetch("/api/help/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    }).catch(() => {});
  }, [articleId]);

  function handleFeedback(helpful: boolean) {
    setFeedback(helpful ? "yes" : "no");
    fetch("/api/help/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, helpful, sessionId: getSessionId() }),
    }).catch(() => {});
  }

  return (
    <>
      {/* Article content */}
      <div className="prose-help mt-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>

      {/* Feedback */}
      <div className="mt-10 rounded-xl border p-5 text-center" style={{ borderColor: "#E2E8F0", background: "white" }}>
        {feedback ? (
          <p className="text-sm font-medium" style={{ color: "#4ade80" }}>
            {lang === "es" ? "¡Gracias por tu comentario!" : "Thanks for your feedback!"}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium" style={{ color: "#1A1D24" }}>
              {lang === "es" ? "¿Te fue útil este artículo?" : "Was this article helpful?"}
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => handleFeedback(true)}
                className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-green-50"
                style={{ borderColor: "#E2E8F0", color: "#475569" }}
              >
                <IconThumbsUp size={16} /> {lang === "es" ? "Sí" : "Yes"}
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-red-50"
                style={{ borderColor: "#E2E8F0", color: "#475569" }}
              >
                <IconThumbsDown size={16} /> {lang === "es" ? "No" : "No"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
