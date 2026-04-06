import { forwardRef } from "react";
import { CardData } from "@/types";
import { FIXED_ADDRESS, TEMPLATE_CONFIG } from "@/lib/constants";

const JocodingCard = forwardRef<HTMLDivElement, { data: CardData }>(
  ({ data }, ref) => {
    const domain = TEMPLATE_CONFIG.jocoding.emailDomain;

    return (
      <div
        ref={ref}
        style={{
          width: 544,
          height: 307,
          background: "#fff",
          borderRadius: 4,
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Pretendard', sans-serif",
        }}
      >
        {/* 로고 */}
        <div style={{ position: "absolute", top: 24, left: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/jocoding/logo.svg"
            alt="조코딩 로고"
            style={{ height: 18, width: "auto" }}
          />
        </div>

        {/* 심볼 그래픽 (우측) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/jocoding/symbol.svg"
          alt=""
          style={{
            position: "absolute",
            right: -10,
            top: -20,
            width: 240,
            height: "auto",
          }}
        />

        {/* 이름 */}
        <div
          style={{
            position: "absolute",
            top: 88,
            left: 32,
            fontSize: 42,
            fontWeight: 700,
            color: data.name ? "#18181b" : "#D4D4D8",
            letterSpacing: 1.05,
          }}
        >
          {data.name || "이름"}
        </div>

        {/* 직책 */}
        <div
          style={{
            position: "absolute",
            top: 148,
            left: 34,
            fontSize: 21,
            fontWeight: 600,
            color: data.title ? "#18181b" : "#D4D4D8",
            letterSpacing: 0.525,
          }}
        >
          {data.title || "직책"}
        </div>

        {/* 연락처 */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: 32,
            display: "flex",
            flexDirection: "column",
            gap: 9,
          }}
        >
          {/* 주소 */}
          <ContactRow
            icon="/icons/jocoding/icon-map.svg"
            text={FIXED_ADDRESS}
          />
          {/* 이메일 + 전화 */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ContactRow
              icon="/icons/jocoding/icon-mail.svg"
              text={`${data.email || "email"}${domain}`}
            />
            <ContactRow
              icon="/icons/jocoding/icon-phone.svg"
              text={data.phone || "010 0000 0000"}
            />
          </div>
        </div>
      </div>
    );
  }
);

JocodingCard.displayName = "JocodingCard";

function ContactRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: 13,
        fontWeight: 600,
        color: "#18181b",
        letterSpacing: 0.325,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        style={{ width: 14, height: 14, flexShrink: 0 }}
      />
      <span>{text}</span>
    </div>
  );
}

export default JocodingCard;
