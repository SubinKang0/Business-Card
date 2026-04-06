import { toPng } from "html-to-image";
import { buildVectorPdf } from "./pdf-vector";
import { EXPORT_WIDTH, EXPORT_HEIGHT, PRINT_WIDTH_MM, PRINT_HEIGHT_MM } from "./constants";
import type { CardData, TemplateType } from "@/types";

/**
 * PNG 다운로드 (RGB, 1088×615px)
 */
export async function exportToPng(
  element: HTMLElement,
  filename: string
) {
  const dataUrl = await toPng(element, {
    canvasWidth: EXPORT_WIDTH,
    canvasHeight: EXPORT_HEIGHT,
    pixelRatio: 1,
  });

  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * PDF 다운로드 (벡터, DeviceCMYK, 92×52mm)
 * - 텍스트: 윤곽선(아웃라인) 변환
 * - SVG 로고/아이콘: 벡터 경로
 * - QR코드: 고해상도 CMYK 래스터
 */
export async function exportToPdf(
  filename: string,
  data: CardData,
  template: TemplateType
) {
  const pdfBytes = await buildVectorPdf(
    data,
    template,
    PRINT_WIDTH_MM,
    PRINT_HEIGHT_MM
  );

  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${filename}.pdf`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
