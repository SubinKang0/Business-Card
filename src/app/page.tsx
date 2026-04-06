"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TemplateType, CardData } from "@/types";
import TabNav from "@/components/TabNav";
import CardForm from "@/components/CardForm";
import JocodingCard from "@/components/JocodingCard";
import DemodevCard from "@/components/DemodevCard";
import ExportButtons from "@/components/ExportButtons";

const CARD_W = 544;
const CARD_H = 307;

export default function Home() {
  const [activeTab, setActiveTab] = useState<TemplateType>("demodev");
  const [cardData, setCardData] = useState<CardData>({
    name: "",
    title: "",
    phone: "",
    email: "",
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    setScale(containerW / CARD_W);
  }, []);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">명함 생성기</h1>

      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        {/* 폼 */}
        <div className="w-full lg:w-72 shrink-0">
          <CardForm
            data={cardData}
            activeTab={activeTab}
            onChange={setCardData}
          />
        </div>

        {/* 미리보기 + 다운로드 */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-lg shadow-lg"
            style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}
          >
            <div
              className="origin-top-left"
              style={{
                width: CARD_W,
                height: CARD_H,
                transform: `scale(${scale})`,
              }}
            >
              {activeTab === "jocoding" ? (
                <JocodingCard ref={cardRef} data={cardData} />
              ) : (
                <DemodevCard ref={cardRef} data={cardData} />
              )}
            </div>
          </div>
          <ExportButtons cardRef={cardRef} activeTab={activeTab} data={cardData} />
        </div>
      </div>
    </div>
  );
}
