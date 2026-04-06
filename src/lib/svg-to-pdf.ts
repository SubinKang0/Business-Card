/**
 * SVG → PDF 벡터 변환기
 *
 * 지원 요소: <path>, <circle>, <rect>, <polygon>
 * 지원 path 명령: M,m,L,l,H,h,V,v,C,c,S,s,Q,q,Z,z
 */

// ─── SVG path d → PDF ops ───

function tokenize(d: string): string[] {
  const tokens: string[] = [];
  const re = /([MmLlHhVvCcSsQqZz])|(-?\d*\.?\d+(?:e[+-]?\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    tokens.push(m[0]);
  }
  return tokens;
}

const f = (n: number) => (Math.round(n * 1000) / 1000).toString();

export function svgPathToPdfOps(d: string): string {
  const tokens = tokenize(d);
  let i = 0;
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let lcx = 0, lcy = 0;
  let lastCmd = "";
  const ops: string[] = [];
  const num = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    let cmd = tokens[i];
    if (!/[MmLlHhVvCcSsQqZz]/.test(cmd)) {
      cmd = lastCmd;
      if (cmd === "M") cmd = "L";
      if (cmd === "m") cmd = "l";
    } else {
      i++;
    }

    switch (cmd) {
      case "M": cx = num(); cy = num(); sx = cx; sy = cy; ops.push(`${f(cx)} ${f(cy)} m`); break;
      case "m": cx += num(); cy += num(); sx = cx; sy = cy; ops.push(`${f(cx)} ${f(cy)} m`); break;
      case "L": cx = num(); cy = num(); ops.push(`${f(cx)} ${f(cy)} l`); break;
      case "l": cx += num(); cy += num(); ops.push(`${f(cx)} ${f(cy)} l`); break;
      case "H": cx = num(); ops.push(`${f(cx)} ${f(cy)} l`); break;
      case "h": cx += num(); ops.push(`${f(cx)} ${f(cy)} l`); break;
      case "V": cy = num(); ops.push(`${f(cx)} ${f(cy)} l`); break;
      case "v": cy += num(); ops.push(`${f(cx)} ${f(cy)} l`); break;
      case "C": { const x1=num(),y1=num(),x2=num(),y2=num(),x=num(),y=num(); ops.push(`${f(x1)} ${f(y1)} ${f(x2)} ${f(y2)} ${f(x)} ${f(y)} c`); lcx=x2; lcy=y2; cx=x; cy=y; break; }
      case "c": { const x1=cx+num(),y1=cy+num(),x2=cx+num(),y2=cy+num(),x=cx+num(),y=cy+num(); ops.push(`${f(x1)} ${f(y1)} ${f(x2)} ${f(y2)} ${f(x)} ${f(y)} c`); lcx=x2; lcy=y2; cx=x; cy=y; break; }
      case "S": { const rx=2*cx-lcx,ry=2*cy-lcy,x2=num(),y2=num(),x=num(),y=num(); ops.push(`${f(rx)} ${f(ry)} ${f(x2)} ${f(y2)} ${f(x)} ${f(y)} c`); lcx=x2; lcy=y2; cx=x; cy=y; break; }
      case "s": { const rx=2*cx-lcx,ry=2*cy-lcy,x2=cx+num(),y2=cy+num(),x=cx+num(),y=cy+num(); ops.push(`${f(rx)} ${f(ry)} ${f(x2)} ${f(y2)} ${f(x)} ${f(y)} c`); lcx=x2; lcy=y2; cx=x; cy=y; break; }
      case "Q": { const qx=num(),qy=num(),x=num(),y=num(); ops.push(`${f(cx+(2/3)*(qx-cx))} ${f(cy+(2/3)*(qy-cy))} ${f(x+(2/3)*(qx-x))} ${f(y+(2/3)*(qy-y))} ${f(x)} ${f(y)} c`); lcx=qx; lcy=qy; cx=x; cy=y; break; }
      case "q": { const qx=cx+num(),qy=cy+num(),x=cx+num(),y=cy+num(); ops.push(`${f(cx+(2/3)*(qx-cx))} ${f(cy+(2/3)*(qy-cy))} ${f(x+(2/3)*(qx-x))} ${f(y+(2/3)*(qy-y))} ${f(x)} ${f(y)} c`); lcx=qx; lcy=qy; cx=x; cy=y; break; }
      case "Z": case "z": ops.push("h"); cx=sx; cy=sy; break;
    }
    if (!"CcSs".includes(cmd)) { lcx = cx; lcy = cy; }
    lastCmd = cmd;
  }
  return ops.join("\n");
}

// ─── circle → PDF ops (4 cubic beziers) ───

function circleToPdfOps(cx: number, cy: number, r: number): string {
  const k = r * 0.5522847498; // bezier approximation constant
  return [
    `${f(cx + r)} ${f(cy)} m`,
    `${f(cx + r)} ${f(cy + k)} ${f(cx + k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} c`,
    `${f(cx - k)} ${f(cy + r)} ${f(cx - r)} ${f(cy + k)} ${f(cx - r)} ${f(cy)} c`,
    `${f(cx - r)} ${f(cy - k)} ${f(cx - k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} c`,
    `${f(cx + k)} ${f(cy - r)} ${f(cx + r)} ${f(cy - k)} ${f(cx + r)} ${f(cy)} c`,
    "h",
  ].join("\n");
}

// ─── rect → PDF ops ───

function rectToPdfOps(x: number, y: number, w: number, h: number): string {
  return `${f(x)} ${f(y)} ${f(w)} ${f(h)} re`;
}

// ─── polygon → PDF ops ───

function polygonToPdfOps(points: string): string {
  const nums = points.trim().split(/[\s,]+/).map(Number);
  const ops: string[] = [];
  for (let i = 0; i < nums.length; i += 2) {
    ops.push(i === 0 ? `${f(nums[i])} ${f(nums[i + 1])} m` : `${f(nums[i])} ${f(nums[i + 1])} l`);
  }
  ops.push("h");
  return ops.join("\n");
}

// ─── SVG parsing ───

export interface SvgShape {
  ops: string;  // PDF path operators
  fill: string; // hex color
}

export interface ParsedSvg {
  viewBox: [number, number, number, number];
  shapes: SvgShape[];
}

export function parseSvgString(svgText: string): ParsedSvg {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg")!;

  const vb = svg.getAttribute("viewBox")!.split(/[\s,]+/).map(Number);
  const viewBox: [number, number, number, number] = [vb[0], vb[1], vb[2], vb[3]];

  // CSS fill map
  const colorMap = new Map<string, string>();
  svg.querySelectorAll("style").forEach((s) => {
    const re = /\.([a-zA-Z0-9_-]+)\s*\{[^}]*fill:\s*(#[0-9a-fA-F]{3,6}|none)[^}]*\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s.textContent || "")) !== null) {
      colorMap.set(m[1], m[2]);
    }
  });

  const shapes: SvgShape[] = [];

  function getFill(el: Element): string | null {
    const inline = el.getAttribute("fill");
    if (inline) return inline === "none" ? null : inline;
    const cls = el.getAttribute("class");
    if (cls) {
      for (const c of cls.split(/\s+/)) {
        const f = colorMap.get(c);
        if (f) return f === "none" ? null : f;
      }
    }
    return "#000000";
  }

  // paths
  doc.querySelectorAll("path").forEach((el) => {
    const d = el.getAttribute("d");
    const fill = getFill(el);
    if (!d || !fill) return;
    shapes.push({ ops: svgPathToPdfOps(d), fill });
  });

  // circles
  doc.querySelectorAll("circle").forEach((el) => {
    const cx = parseFloat(el.getAttribute("cx") || "0");
    const cy = parseFloat(el.getAttribute("cy") || "0");
    const r = parseFloat(el.getAttribute("r") || "0");
    const fill = getFill(el);
    if (!fill || r <= 0) return;
    shapes.push({ ops: circleToPdfOps(cx, cy, r), fill });
  });

  // rects
  doc.querySelectorAll("rect").forEach((el) => {
    const x = parseFloat(el.getAttribute("x") || "0");
    const y = parseFloat(el.getAttribute("y") || "0");
    const w = parseFloat(el.getAttribute("width") || "0");
    const h = parseFloat(el.getAttribute("height") || "0");
    const fill = getFill(el);
    if (!fill || w <= 0 || h <= 0) return;
    shapes.push({ ops: rectToPdfOps(x, y, w, h), fill });
  });

  // polygons
  doc.querySelectorAll("polygon").forEach((el) => {
    const points = el.getAttribute("points");
    const fill = getFill(el);
    if (!points || !fill) return;
    shapes.push({ ops: polygonToPdfOps(points), fill });
  });

  return { viewBox, shapes };
}
