"use client";

import { useMemo, useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [scale, setScale] = useState("2");
  const [loading, setLoading] = useState(false);
  const [json, setJson] = useState(null);
  const [error, setError] = useState("");

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  const pickedUrl = useMemo(() => {
    if (!json) return "";
    // coba tebak field URL yg umum muncul
    const candidates = [
      json?.output_url,
      json?.outputUrl,
      json?.url,
      json?.result_url,
      json?.resultUrl,
      json?.data?.output_url,
      json?.data?.url,
      json?.data?.result?.url,
      json?.data?.result_url,
    ].filter(Boolean);

    return candidates[0] || "";
  }, [json]);

  async function onSubmit() {
    setError("");
    setJson(null);

    if (!file) {
      setError("Pilih gambar dulu.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("scale", scale);

      const res = await fetch("/api/upscale", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }

      setJson(data);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1 style={styles.title}>AI Image Upscaler</h1>
          <span style={styles.badge}>Next.js</span>
        </div>

        <p style={styles.subtitle}>
          Upload gambar → pilih scale (2x/4x/8x) → proses via API Route.
        </p>

        <div style={styles.row}>
          <label style={styles.label}>Gambar</label>
          <input
            style={styles.input}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div style={styles.row}>
          <label style={styles.label}>Scale</label>
          <select style={styles.select} value={scale} onChange={(e) => setScale(e.target.value)}>
            <option value="2">2x</option>
            <option value="4">4x</option>
            <option value="8">8x</option>
          </select>
        </div>

        <button style={styles.button} onClick={onSubmit} disabled={loading}>
          {loading ? "Processing..." : "Upscale"}
        </button>

        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.grid2}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Preview</div>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="preview" src={previewUrl} style={styles.image} />
            ) : (
              <div style={styles.placeholder}>Belum ada gambar</div>
            )}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelTitle}>Result</div>
            {pickedUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="result" src={pickedUrl} style={styles.image} />
                <a href={pickedUrl} target="_blank" rel="noreferrer" style={styles.link}>
                  Buka hasil (tab baru)
                </a>
              </>
            ) : (
              <div style={styles.placeholder}>Belum ada hasil</div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={styles.panelTitle}>Response JSON</div>
          <pre style={styles.pre}>{json ? JSON.stringify(json, null, 2) : "{}"}</pre>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: "24px 12px",
    background: "#0b0f19",
    color: "#e6e8ee",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  card: {
    width: "min(920px, 100%)",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  title: { margin: 0, fontSize: 20, letterSpacing: 0.2 },
  badge: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
  },
  subtitle: { marginTop: 8, marginBottom: 16, opacity: 0.85, lineHeight: 1.45 },
  row: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  label: { fontSize: 13, opacity: 0.85 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.25)",
    color: "#e6e8ee",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.25)",
    color: "#e6e8ee",
  },
  button: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(99,102,241,0.35)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    marginTop: 6,
  },
  error: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: "rgba(239,68,68,0.18)",
    border: "1px solid rgba(239,68,68,0.35)",
    color: "#ffd6d6",
    fontSize: 13,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 16,
  },
  panel: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    padding: 12,
    minHeight: 240,
  },
  panelTitle: { fontSize: 13, opacity: 0.9, marginBottom: 10 },
  placeholder: {
    height: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.65,
    fontSize: 13,
    borderRadius: 12,
    border: "1px dashed rgba(255,255,255,0.18)",
  },
  image: {
    width: "100%",
    height: 200,
    objectFit: "contain",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
  },
  link: { display: "inline-block", marginTop: 8, fontSize: 13, color: "#b7c2ff" },
  pre: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.10)",
    fontSize: 12,
    overflowX: "auto",
  },
};
