/**
 * 벡터 PDF 빌더
 *
 * - 텍스트 → opentype.js 윤곽선(아웃라인) + K100
 * - SVG 로고/아이콘/QR → PDF 벡터 경로 (원본 벡터 유지)
 * - 모든 색상 DeviceCMYK
 */

import opentype, { type Font } from "opentype.js";
import { parseSvgString, type ParsedSvg } from "./svg-to-pdf";
import { FIXED_ADDRESS, TEMPLATE_CONFIG } from "./constants";
import type { CardData, TemplateType } from "@/types";

// ─── constants ───

const MM_TO_PT = 72 / 25.4;
const CARD_W = 544;
const CARD_H = 307;
const K100 = "0 0 0 1"; // C0 M0 Y0 K100

const f = (n: number) => (Math.round(n * 1000) / 1000).toString();

// hex → CMYK 문자열
const HEX_TO_CMYK: Record<string, string> = {
  "#6d319d": "0.72 0.89 0 0",       // 조코딩 보라 C72 M89 Y0 K0
  "#fbb03b": "0.03 0.4 0.79 0",     // 조코딩 주황 C3 M40 Y79 K0
  "#3026b3": "0.9 0.87 0 0",        // 대모산 블루 C90 M87 Y0 K0
  "#18181b": K100,
  "#231815": K100,
  "#fff": "0 0 0 0",
  "#ffffff": "0 0 0 0",
  "#000": K100,
  "#000000": K100,
};

function hexToCmyk(hex: string): string {
  const key = hex.toLowerCase();
  if (HEX_TO_CMYK[key]) return HEX_TO_CMYK[key];
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return "0 0 0 1";
  const inv = 1 / (1 - k);
  return `${((1 - r - k) * inv).toFixed(3)} ${((1 - g - k) * inv).toFixed(3)} ${((1 - b - k) * inv).toFixed(3)} ${k.toFixed(3)}`;
}

// ─── font cache ───

let fontCache: { bold: Font; semibold: Font } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const base =
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/";
  const [boldBuf, semiboldBuf] = await Promise.all([
    fetch(base + "Pretendard-Bold.woff").then((r) => r.arrayBuffer()),
    fetch(base + "Pretendard-SemiBold.woff").then((r) => r.arrayBuffer()),
  ]);
  fontCache = {
    bold: opentype.parse(boldBuf),
    semibold: opentype.parse(semiboldBuf),
  };
  return fontCache;
}

// ─── SVG cache ───

const svgCache = new Map<string, ParsedSvg>();

async function fetchSvg(url: string): Promise<ParsedSvg> {
  if (svgCache.has(url)) return svgCache.get(url)!;
  const text = await fetch(url).then((r) => r.text());
  const parsed = parseSvgString(text);
  svgCache.set(url, parsed);
  return parsed;
}

// ─── text → PDF outlined paths ───

function textToPdfOps(
  font: Font,
  text: string,
  fontSize: number,
  letterSpacing: number
): string {
  const ops: string[] = [];
  let advanceX = 0;
  const scale = fontSize / font.unitsPerEm;
  let cx = 0, cy = 0;

  for (const char of text) {
    const glyph = font.charToGlyph(char);
    const path = glyph.getPath(advanceX, 0, fontSize);

    for (const cmd of path.commands) {
      switch (cmd.type) {
        case "M":
          cx = cmd.x; cy = cmd.y;
          ops.push(`${f(cmd.x)} ${f(cmd.y)} m`);
          break;
        case "L":
          cx = cmd.x; cy = cmd.y;
          ops.push(`${f(cmd.x)} ${f(cmd.y)} l`);
          break;
        case "C":
          cx = cmd.x; cy = cmd.y;
          ops.push(`${f(cmd.x1)} ${f(cmd.y1)} ${f(cmd.x2)} ${f(cmd.y2)} ${f(cmd.x)} ${f(cmd.y)} c`);
          break;
        case "Q": {
          const cp1x = cx + (2 / 3) * (cmd.x1 - cx);
          const cp1y = cy + (2 / 3) * (cmd.y1 - cy);
          const cp2x = cmd.x + (2 / 3) * (cmd.x1 - cmd.x);
          const cp2y = cmd.y + (2 / 3) * (cmd.y1 - cmd.y);
          cx = cmd.x; cy = cmd.y;
          ops.push(`${f(cp1x)} ${f(cp1y)} ${f(cp2x)} ${f(cp2y)} ${f(cmd.x)} ${f(cmd.y)} c`);
          break;
        }
        case "Z":
          ops.push("h");
          break;
      }
    }
    advanceX += glyph.advanceWidth! * scale + letterSpacing;
  }
  return ops.join("\n");
}

function measureText(font: Font, text: string, fontSize: number, letterSpacing: number): number {
  const scale = fontSize / font.unitsPerEm;
  let w = 0;
  for (const char of text) {
    w += font.charToGlyph(char).advanceWidth! * scale + letterSpacing;
  }
  return w - letterSpacing;
}

// ─── render helpers (card coordinate space) ───
// 글로벌 변환: [sx 0 0 -sy 0 pageH] → card y-down을 PDF y-up으로 변환
// 이 공간에서 (0,0)=좌상단, y 증가=아래쪽

function renderText(
  font: Font, text: string,
  x: number, y: number,
  fontSize: number, letterSpacing: number
): string {
  // CSS top = 텍스트 상단(ascender top) 위치
  // opentype.js baseline = y=0, ascender = 음수 y
  // → baseline을 y + ascent 에 배치해야 CSS top과 일치
  const ascent = font.ascender * (fontSize / font.unitsPerEm);
  return [
    "q",
    `1 0 0 1 ${f(x)} ${f(y + ascent)} cm`,
    `${K100} k`,
    textToPdfOps(font, text, fontSize, letterSpacing),
    "f",
    "Q",
  ].join("\n");
}

function renderSvg(
  svg: ParsedSvg,
  x: number, y: number,
  renderW: number, renderH?: number
): string {
  const [, , vw, vh] = svg.viewBox;
  const rh = renderH ?? renderW * (vh / vw);
  const scaleX = renderW / vw;
  const scaleY = rh / vh;

  const ops: string[] = ["q"];
  // SVG 좌표계도 y-down → card 좌표계와 동일, 변환만 적용
  ops.push(`${f(scaleX)} 0 0 ${f(scaleY)} ${f(x)} ${f(y)} cm`);

  for (const shape of svg.shapes) {
    ops.push(`${hexToCmyk(shape.fill)} k`);
    ops.push(shape.ops);
    ops.push("f");
  }

  ops.push("Q");
  return ops.join("\n");
}

// ─── card renderers ───

async function renderJocodingCard(
  data: CardData, pageW: number, pageH: number
): Promise<string> {
  const fonts = await loadFonts();
  const [logo, symbol, iconMap, iconMail, iconPhone] = await Promise.all([
    fetchSvg("/icons/jocoding/logo.svg"),
    fetchSvg("/icons/jocoding/symbol.svg"),
    fetchSvg("/icons/jocoding/icon-map.svg"),
    fetchSvg("/icons/jocoding/icon-mail.svg"),
    fetchSvg("/icons/jocoding/icon-phone.svg"),
  ]);

  const sx = pageW / CARD_W;
  const sy = pageH / CARD_H;
  const ops: string[] = [];

  // 글로벌 변환: card→PDF (y축 반전)
  ops.push(`${f(sx)} 0 0 ${f(-sy)} 0 ${f(pageH)} cm`);

  // 흰 배경
  ops.push("0 0 0 0 k");
  ops.push(`0 0 ${CARD_W} ${CARD_H} re f`);

  // 로고 (top:24, left:32, height:18)
  const logoH = 18;
  const logoW = logoH * (logo.viewBox[2] / logo.viewBox[3]);
  ops.push(renderSvg(logo, 32, 24, logoW, logoH));

  // 심볼 (right:-10, top:-20, width:240)
  const symW = 240;
  const symH = symW * (symbol.viewBox[3] / symbol.viewBox[2]);
  ops.push(renderSvg(symbol, CARD_W - symW + 10, -20, symW, symH));

  // 이름 (top:88, left:32, 42px Bold)
  ops.push(renderText(fonts.bold, data.name || "이름", 32, 88, 42, 1.05));

  // 직책 (top:148, left:34, 21px SemiBold)
  ops.push(renderText(fonts.semibold, data.title || "직책", 34, 148, 21, 0.525));

  // 연락처 (bottom:28, 각 행 14px, gap 9px)
  const iconSz = 14;
  const cfs = 13;
  const cls = 0.325;
  const row2Y = CARD_H - 28 - iconSz;       // 265 (하단 행 top)
  const row1Y = row2Y - 9 - iconSz;          // 242 (상단 행 top)

  // 주소 (상단 행)
  ops.push(renderSvg(iconMap, 32, row1Y, iconSz, iconSz));
  ops.push(renderText(fonts.semibold, FIXED_ADDRESS, 32 + iconSz + 7, row1Y, cfs, cls));

  // 이메일 + 전화 (하단 행)
  const emailText = `${data.email || "email"}${TEMPLATE_CONFIG.jocoding.emailDomain}`;
  ops.push(renderSvg(iconMail, 32, row2Y, iconSz, iconSz));
  ops.push(renderText(fonts.semibold, emailText, 32 + iconSz + 7, row2Y, cfs, cls));

  const emailW = measureText(fonts.semibold, emailText, cfs, cls);
  const phoneX = 32 + iconSz + 7 + emailW + 20;
  ops.push(renderSvg(iconPhone, phoneX, row2Y, iconSz, iconSz));
  ops.push(renderText(fonts.semibold, data.phone || "010 0000 0000", phoneX + iconSz + 7, row2Y, cfs, cls));

  return ops.join("\n");
}

async function renderDemodevCard(
  data: CardData, pageW: number, pageH: number
): Promise<string> {
  const fonts = await loadFonts();
  const [logo, qr, iconPhone, iconMail, iconYT, iconMap] = await Promise.all([
    fetchSvg("/icons/demodev/logo.svg"),
    fetchSvg("/icons/demodev/qr.svg"),
    fetchSvg("/icons/demodev/icon-phone.svg"),
    fetchSvg("/icons/demodev/icon-mail.svg"),
    fetchSvg("/icons/demodev/icon-youtube.svg"),
    fetchSvg("/icons/demodev/icon-map.svg"),
  ]);

  const sx = pageW / CARD_W;
  const sy = pageH / CARD_H;
  const ops: string[] = [];

  ops.push(`${f(sx)} 0 0 ${f(-sy)} 0 ${f(pageH)} cm`);

  // 흰 배경
  ops.push("0 0 0 0 k");
  ops.push(`0 0 ${CARD_W} ${CARD_H} re f`);

  // 로고
  const logoH = 18;
  const logoW = logoH * (logo.viewBox[2] / logo.viewBox[3]);
  ops.push(renderSvg(logo, 32, 26, logoW, logoH));

  // QR (top:18, right:24, 88×88)
  ops.push(renderSvg(qr, CARD_W - 24 - 88, 18, 88, 88));

  // 이름
  ops.push(renderText(fonts.bold, data.name || "이름", 32, 92, 42, 1.05));

  // 직책
  ops.push(renderText(fonts.semibold, data.title || "직책", 34, 152, 21, 0.525));

  // 연락처 - 2열 (bottom:28, 각 행 14px, gap 9px)
  const contactY2 = CARD_H - 28 - 14;  // 265 (하단 행 top)
  const contactY1 = contactY2 - 9 - 14; // 242 (상단 행 top)
  const iconSz = 14;
  const cfs = 13;
  const cls = 0.325;

  // 좌측: 전화, 메일
  ops.push(renderSvg(iconPhone, 32, contactY1, iconSz, iconSz));
  ops.push(renderText(fonts.semibold, data.phone || "010 0000 0000", 32 + iconSz + 7, contactY1, cfs, cls));

  const emailText = `${data.email || "email"}${TEMPLATE_CONFIG.demodev.emailDomain}`;
  ops.push(renderSvg(iconMail, 32, contactY2, iconSz, iconSz));
  ops.push(renderText(fonts.semibold, emailText, 32 + iconSz + 7, contactY2, cfs, cls));

  // 우측: 유튜브, 주소
  const rx = 300;
  ops.push(renderSvg(iconYT, rx, contactY1, iconSz, iconSz));
  ops.push(renderText(fonts.semibold, "대모산개발단", rx + iconSz + 7, contactY1, cfs, cls));

  ops.push(renderSvg(iconMap, rx, contactY2, iconSz, iconSz));
  ops.push(renderText(fonts.semibold, FIXED_ADDRESS, rx + iconSz + 7, contactY2, cfs, cls));

  return ops.join("\n");
}

// ─── deflate ───

async function deflateData(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate");
  const writer = cs.writable.getWriter();
  writer.write(data.buffer as ArrayBuffer);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  let len = 0;
  for (const c of chunks) len += c.length;
  const result = new Uint8Array(len);
  let off = 0;
  for (const c of chunks) { result.set(c, off); off += c.length; }
  return result;
}

// ─── PDF assembler ───

export async function buildVectorPdf(
  data: CardData,
  template: TemplateType,
  pageWmm: number,
  pageHmm: number
): Promise<Uint8Array> {
  const pageW = pageWmm * MM_TO_PT;
  const pageH = pageHmm * MM_TO_PT;

  const contentOps =
    template === "jocoding"
      ? await renderJocodingCard(data, pageW, pageH)
      : await renderDemodevCard(data, pageW, pageH);

  const enc = new TextEncoder();
  const contentCompressed = await deflateData(enc.encode(contentOps));

  const d = new Date();
  const p2 = (n: number) => String(n).padStart(2, "0");
  const dateStr = `D:${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;

  // PDF objects: 1=Catalog, 2=Pages, 3=Page, 4=ContentStream, 5=Info
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(pageW)} ${f(pageH)}] /TrimBox [0 0 ${f(pageW)} ${f(pageH)}] /Contents 4 0 R /Resources << >> >>\nendobj\n`;
  const obj4h = `4 0 obj\n<< /Length ${contentCompressed.length} /Filter /FlateDecode >>\nstream\n`;
  const obj4t = `\nendstream\nendobj\n`;
  const obj5 = `5 0 obj\n<< /Creator (Business Card Generator) /Producer (Vector CMYK PDF) /CreationDate (${dateStr}) >>\nendobj\n`;

  const header = new Uint8Array([
    0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x34,0x0a,
    0x25,0xe2,0xe3,0xcf,0xd3,0x0a,
  ]);

  const b1 = enc.encode(obj1);
  const b2 = enc.encode(obj2);
  const b3 = enc.encode(obj3);
  const b4h = enc.encode(obj4h);
  const b4t = enc.encode(obj4t);
  const b5 = enc.encode(obj5);

  let pos = header.length;
  const offsets: number[] = [];
  offsets.push(pos); pos += b1.length;
  offsets.push(pos); pos += b2.length;
  offsets.push(pos); pos += b3.length;
  offsets.push(pos); pos += b4h.length + contentCompressed.length + b4t.length;
  offsets.push(pos); pos += b5.length;

  const xrefOffset = pos;
  const p10 = (n: number) => String(n).padStart(10, "0");
  let xref = `xref\n0 6\n${p10(0)} 65535 f \r\n`;
  for (const o of offsets) xref += `${p10(o)} 00000 n \r\n`;
  xref += `trailer\n<< /Size 6 /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const parts: Uint8Array[] = [header, b1, b2, b3, b4h, contentCompressed, b4t, b5, enc.encode(xref)];
  let total = 0;
  for (const p of parts) total += p.length;
  const pdf = new Uint8Array(total);
  let wp = 0;
  for (const p of parts) { pdf.set(p, wp); wp += p.length; }

  return pdf;
}
