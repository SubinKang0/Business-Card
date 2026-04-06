"use client";

import { CardData, TemplateType } from "@/types";
import { TEMPLATE_CONFIG } from "@/lib/constants";

export default function CardForm({
  data,
  activeTab,
  onChange,
}: {
  data: CardData;
  activeTab: TemplateType;
  onChange: (data: CardData) => void;
}) {
  const domain = TEMPLATE_CONFIG[activeTab].emailDomain;

  const handleChange = (field: keyof CardData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="flex flex-col gap-5">
      <Field label="이름">
        <input
          type="text"
          value={data.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="이름을 입력해주세요"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </Field>
      <Field label="직책">
        <input
          type="text"
          value={data.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="직책을 입력해주세요"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </Field>
      <Field label="전화번호">
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="010 0000 0000"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </Field>
      <Field label="이메일">
        <div className="flex items-center gap-0">
          <input
            type="text"
            value={data.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="email"
            className="w-full rounded-l-lg border border-r-0 border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
          <span className="whitespace-nowrap rounded-r-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            {domain}
          </span>
        </div>
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
