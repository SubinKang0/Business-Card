import { forwardRef } from "react";
import { CardData } from "@/types";
import { FIXED_ADDRESS, TEMPLATE_CONFIG } from "@/lib/constants";

const DemodevCard = forwardRef<HTMLDivElement, { data: CardData }>(
  ({ data }, ref) => {
    const domain = TEMPLATE_CONFIG.demodev.emailDomain;

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
        <div style={{ position: "absolute", top: 26, left: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/demodev/logo.svg"
            alt="대모산개발단 로고"
            style={{ height: 18, width: "auto" }}
          />
        </div>

        {/* QR코드 */}
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 24,
            width: 88,
            height: 88,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/demodev/qr.svg"
            alt="QR Code"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {/* 이름 */}
        <div
          style={{
            position: "absolute",
            top: 92,
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
            top: 152,
            left: 34,
            fontSize: 21,
            fontWeight: 600,
            color: data.title ? "#18181b" : "#D4D4D8",
            letterSpacing: 0.525,
          }}
        >
          {data.title || "직책"}
        </div>

        {/* 연락처 - 2열 */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: 32,
            right: 28,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {/* 좌측: 전화, 메일 */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 9 }}
          >
            <ContactRow
              icon="/icons/demodev/icon-phone.svg"
              text={data.phone || "010 0000 0000"}
            />
            <ContactRow
              icon="/icons/demodev/icon-mail.svg"
              text={`${data.email || "email"}${domain}`}
            />
          </div>
          {/* 우측: 유튜브, 주소 */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 9 }}
          >
            <ContactRow
              icon="/icons/demodev/icon-youtube.svg"
              text="대모산개발단"
            />
            <ContactRow
              icon="/icons/demodev/icon-map.svg"
              text={FIXED_ADDRESS}
            />
          </div>
        </div>
      </div>
    );
  }
);

DemodevCard.displayName = "DemodevCard";

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

export default DemodevCard;
