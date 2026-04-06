declare module "opentype.js" {
  export interface PathCommand {
    type: "M" | "L" | "C" | "Q" | "Z";
    x: number;
    y: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  export interface Path {
    commands: PathCommand[];
  }

  export interface Glyph {
    advanceWidth: number | null;
    getPath(x: number, y: number, fontSize: number): Path;
  }

  export interface Font {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    charToGlyph(char: string): Glyph;
    getPath(text: string, x: number, y: number, fontSize: number): Path;
  }

  export function parse(buffer: ArrayBuffer): Font;

  const opentype: { parse: typeof parse };
  export default opentype;
}
