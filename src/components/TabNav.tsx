"use client";

import { TemplateType } from "@/types";
import { TEMPLATE_CONFIG } from "@/lib/constants";

const tabs: TemplateType[] = ["demodev", "jocoding"];

export default function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TemplateType;
  onTabChange: (tab: TemplateType) => void;
}) {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        const color = TEMPLATE_CONFIG[tab].color;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="px-6 py-3 text-sm font-semibold transition-colors cursor-pointer"
            style={{
              color: isActive ? color : "#9ca3af",
              borderBottom: isActive ? `3px solid ${color}` : "3px solid transparent",
            }}
          >
            {TEMPLATE_CONFIG[tab].label}
          </button>
        );
      })}
    </div>
  );
}
