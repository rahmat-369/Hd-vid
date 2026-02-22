import fs from "node:fs";
import FormData from "form-data";
import axios from "axios";
import { zencf } from "zencf";

// dari file kamu 1
const scaleAllowed = ["2", "4", "8"];

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
  "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-platform": '"Android"',
  "Accept-Language": "id-ID,id;q=0.9,en-AU;q=0.8,en;q=0.7,en-US;q=0.6",
};

async function solveTurnstile() {
  const { token } = await zencf.turnstileMin(
    "https://picupscaler.com",
    "0x4AAAAAABvAGhZHOnPwmOvR"
  );
  return token;
}

export async function upscale(imgPath, scale = "2") {
  const s = String(scale);
  if (!scaleAllowed.includes(s)) {
    throw new Error("invalid scale : " + scaleAllowed.join(", "));
  }

  const turnstileToken = await solveTurnstile();

  const form = new FormData();
  form.append("image", fs.createReadStream(imgPath), {
    filename: imgPath.split("/").pop(),
    contentType: "image/jpeg", // biarin seperti original kamu (biasanya tetap diterima)
  });

  form.append("user_id", "");
  form.append("is_public", "true");
  form.append("turnstile_token", turnstileToken);
  form.append("scale", s);

  const r = await axios.post("https://picupscaler.com/api/generate/handle", form, {
    headers: {
      ...headers,
      ...form.getHeaders(),
      origin: "https://picupscaler.com",
      referer: "https://picupscaler.com/",
      accept: "application/json, text/plain, */*",
    },
    maxBodyLength: Infinity,
  });

  return r.data;
}
