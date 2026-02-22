export const runtime = "nodejs"; // IMPORTANT: biar ga jalan di Edge

import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { upscale } from "@/lib/picupscaler";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("image");
    const scale = String(formData.get("scale") || "2");

    if (!file || typeof file === "string") {
      return Response.json({ error: "Field 'image' wajib file." }, { status: 400 });
    }

    // simpan file ke /tmp (Vercel writable)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext =
      (file.type && file.type.includes("png") && ".png") ||
      (file.type && file.type.includes("webp") && ".webp") ||
      ".jpg";

    const tmpPath = join(tmpdir(), `upscale_${randomUUID()}${ext}`);
    await writeFile(tmpPath, buffer);

    try {
      const result = await upscale(tmpPath, scale);
      return Response.json(result, { status: 200 });
    } finally {
      // cleanup file temp
      await unlink(tmpPath).catch(() => {});
    }
  } catch (err) {
    return Response.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
        }
