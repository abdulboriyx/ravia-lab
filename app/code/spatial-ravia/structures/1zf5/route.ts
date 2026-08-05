import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const filePath = path.join(process.cwd(), "app", "structures", "1ZF5.cif");
  const data = await readFile(filePath, "utf8");

  return new NextResponse(data, {
    headers: {
      "Content-Type": "chemical/x-mmcif; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
