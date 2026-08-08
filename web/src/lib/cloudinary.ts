import { createHash } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

function sign(params: Record<string, string | number>): string {
  const secret = process.env.CLOUDINARY_API_SECRET!.trim();
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

export async function uploadClinicalImage(params: {
  file: File;
  patientId: number;
}): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Image uploads aren’t configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  if (!ALLOWED.has(params.file.type)) {
    throw new Error("Only JPEG, PNG, or WebP images are allowed.");
  }
  if (params.file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const cloud = process.env.CLOUDINARY_CLOUD_NAME!.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY!.trim();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `glow-dental/patients/${params.patientId}`;
  const signature = sign({ folder, timestamp });

  const body = new FormData();
  body.set("file", params.file);
  body.set("api_key", apiKey);
  body.set("timestamp", String(timestamp));
  body.set("folder", folder);
  body.set("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body,
  });

  const json = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!res.ok || !json.secure_url || !json.public_id) {
    throw new Error(json.error?.message || "Cloudinary upload failed.");
  }

  return { url: json.secure_url, publicId: json.public_id };
}

export async function destroyClinicalImage(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) return;

  const cloud = process.env.CLOUDINARY_CLOUD_NAME!.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY!.trim();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp });

  const body = new FormData();
  body.set("public_id", publicId);
  body.set("api_key", apiKey);
  body.set("timestamp", String(timestamp));
  body.set("signature", signature);

  await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
    method: "POST",
    body,
  });
}
