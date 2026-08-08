"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { ClinicalImageKind } from "@prisma/client";
import { deletePatientImage, uploadPatientImage } from "@/app/actions/images";

export type PatientImageItem = {
  imageId: number;
  kind: ClinicalImageKind;
  url: string;
  caption: string | null;
  createdAt: string;
};

type Props = {
  patientId: number;
  images: PatientImageItem[];
  canEdit: boolean;
  cloudinaryReady: boolean;
};

export default function PatientImages({
  patientId,
  images,
  canEdit,
  cloudinaryReady,
}: Props) {
  const [kind, setKind] = useState<ClinicalImageKind>("photo");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div id="clinical-images" className="dash-surface p-5 space-y-5 scroll-mt-24">
      <div>
        <h2 className="text-sm font-semibold text-sand-50">Photos &amp; X-rays</h2>
        <p className="text-xs text-sand-50/40 mt-1">
          Clinical images stored for this patient
        </p>
      </div>

      {canEdit && (
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-sand-50/10 pb-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!cloudinaryReady) {
              setError(
                "Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to web/.env, then restart the server.",
              );
              return;
            }
            const form = e.currentTarget;
            const fd = new FormData(form);
            fd.set("patientId", String(patientId));
            setError(null);
            startTransition(async () => {
              try {
                await uploadPatientImage(fd);
                form.reset();
                setCaption("");
                setKind("photo");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed.");
              }
            });
          }}
        >
          <div>
            <label className="block text-xs font-medium text-sand-50/50 mb-1">Type</label>
            <select
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ClinicalImageKind)}
              className="dash-input"
            >
              <option value="photo">Photo</option>
              <option value="xray">X-ray</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-sand-50/50 mb-1">Caption</label>
            <input
              name="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              className="dash-input"
              placeholder="Optional"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-sand-50/50 mb-1">File</label>
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="block w-full text-sm text-sand-50/60 file:mr-3 file:rounded-lg file:border-0 file:bg-turq-600 file:px-3 file:py-2 file:text-ink-950 file:text-sm file:font-medium"
            />
          </div>
          {error && <p className="sm:col-span-2 text-sm text-red-400">{error}</p>}
          {!cloudinaryReady && (
            <p className="sm:col-span-2 text-xs text-amber-300/80">
              Cloudinary env vars not set yet — uploads will stay disabled until you add them.
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending || !cloudinaryReady}
              className="bg-turq-600 text-ink-950 py-2 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors disabled:opacity-60"
            >
              {pending ? "Uploading…" : "Upload image"}
            </button>
          </div>
        </form>
      )}

      {images.length === 0 ? (
        <p className="text-sm text-sand-50/40">No clinical images yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img) => (
            <figure key={img.imageId} className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-sand-50/10 bg-ink-900">
                <Image
                  src={img.url}
                  alt={img.caption || img.kind}
                  fill
                  sizes="200px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <figcaption className="text-[11px] text-sand-50/50">
                <span className="uppercase tracking-wider text-turq-300/80">{img.kind}</span>
                {img.caption ? ` · ${img.caption}` : ""}
              </figcaption>
              {canEdit && (
                <form
                  action={(fd) => {
                    startTransition(async () => {
                      try {
                        await deletePatientImage(fd);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Delete failed.");
                      }
                    });
                  }}
                >
                  <input type="hidden" name="imageId" value={img.imageId} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="text-[11px] text-sand-50/40 hover:text-red-300"
                  >
                    Delete
                  </button>
                </form>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
