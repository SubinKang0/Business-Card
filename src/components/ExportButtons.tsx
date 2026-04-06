"use client";

import { RefObject, useState } from "react";
import { exportToPng, exportToPdf } from "@/lib/export";
import { CardData, TemplateType } from "@/types";
import { TEMPLATE_CONFIG } from "@/lib/constants";

export default function ExportButtons({
  cardRef,
  activeTab,
  data,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  activeTab: TemplateType;
  data: CardData;
}) {
  const [loading, setLoading] = useState<"png" | "pdf" | null>(null);
  const label = TEMPLATE_CONFIG[activeTab].label;

  const handleExport = async (type: "png" | "pdf") => {
    if (!cardRef.current) return;
    setLoading(type);
    try {
      const filename = `명함_${label}`;
      if (type === "png") {
        await exportToPng(cardRef.current, filename);
      } else {
        await exportToPdf(filename, data, activeTab);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleExport("png")}
        disabled={loading !== null}
        className="flex-1 cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        {loading === "png" ? "생성 중..." : "PNG 다운로드"}
      </button>
      <button
        onClick={() => handleExport("pdf")}
        disabled={loading !== null}
        className="flex-1 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {loading === "pdf" ? "생성 중..." : "PDF 다운로드"}
      </button>
    </div>
  );
}
