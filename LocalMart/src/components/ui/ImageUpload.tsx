"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, ImagePlus, AlertCircle } from "lucide-react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface LocalPreview { file: File; objectUrl: string; uploading: boolean; error?: string }

interface Props {
  images: string[];           // final uploaded URLs passed back to parent
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 5 }: Props) {
  const [previews, setPreviews]   = useState<LocalPreview[]>([]);
  const [globalError, setGlobalError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // ── Validation ───────────────────────────────────────────────────────────
  function validate(file: File): string | null {
    if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      return `"${file.name}" is not a supported format. Use JPG, PNG, or WEBP.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max size is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  }

  // ── Upload single file to Supabase ────────────────────────────────────────
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("listing-images")
      .upload(path, file, { upsert: false, contentType: file.type });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
    return data.publicUrl;
  }, [supabase]);

  // ── Handle file selection ─────────────────────────────────────────────────
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setGlobalError("");

    const totalSlots = maxImages - images.length - previews.filter(p => !p.error).length;
    if (files.length > totalSlots) {
      setGlobalError(`You can add ${totalSlots} more photo${totalSlots !== 1 ? "s" : ""}.`);
      return;
    }

    // 1. Validate all files first
    const validationErrors: string[] = [];
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      const err = validate(file);
      if (err) validationErrors.push(err);
      else validFiles.push(file);
    }
    if (validationErrors.length > 0) {
      setGlobalError(validationErrors[0]);
      if (validFiles.length === 0) return;
    }

    // 2. Create local object URLs immediately (preview appears before upload)
    const newPreviews: LocalPreview[] = validFiles.map(file => ({
      file,
      objectUrl: URL.createObjectURL(file),
      uploading: true,
    }));
    setPreviews(prev => [...prev, ...newPreviews]);

    // 3. Upload each file and replace preview with real URL
    const uploadedUrls: string[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const url = await uploadFile(file);
        if (url) uploadedUrls.push(url);
        setPreviews(prev => prev.map(p =>
          p.objectUrl === newPreviews[i].objectUrl
            ? { ...p, uploading: false }
            : p
        ));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setPreviews(prev => prev.map(p =>
          p.objectUrl === newPreviews[i].objectUrl
            ? { ...p, uploading: false, error: msg }
            : p
        ));
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls]);
    }
    // Clean up successful previews (keep errored ones so user can retry)
    setPreviews(prev => prev.filter(p => !!p.error));
  }, [images, maxImages, previews, onChange, uploadFile]);

  const removeUploaded = (url: string) => onChange(images.filter(u => u !== url));
  const removePreview  = (objectUrl: string) => {
    setPreviews(prev => {
      const p = prev.find(x => x.objectUrl === objectUrl);
      if (p) URL.revokeObjectURL(p.objectUrl);
      return prev.filter(x => x.objectUrl !== objectUrl);
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const totalUsed = images.length + previews.filter(p => !p.error).length;
  const hasSpace  = totalUsed < maxImages;

  return (
    <div className="space-y-3">
      {/* ── Uploaded thumbnails ── */}
      {(images.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {/* Already-uploaded images */}
          {images.map((url, i) => (
            <div key={url} className="relative group rounded-xl overflow-hidden bg-gray-100"
              style={{ aspectRatio: "1" }}>
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = "/placeholder-image.svg"; }} />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-brand-600 text-white rounded px-1 py-0.5 leading-none">
                  COVER
                </span>
              )}
              <button type="button" onClick={() => removeUploaded(url)}
                className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}

          {/* Local previews (before / during upload) */}
          {previews.map((p) => (
            <div key={p.objectUrl} className="relative group rounded-xl overflow-hidden bg-gray-100"
              style={{ aspectRatio: "1" }}>
              <img src={p.objectUrl} alt="Preview" className="w-full h-full object-cover" />

              {/* Uploading overlay */}
              {p.uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {p.error && (
                <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center p-1">
                  <AlertCircle className="h-4 w-4 text-red-200 mb-0.5" />
                  <span className="text-[9px] text-red-100 text-center leading-tight line-clamp-2">{p.error}</span>
                </div>
              )}

              <button type="button" onClick={() => removePreview(p.objectUrl)}
                className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Drop zone ── */}
      {hasSpace && (
        <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-8 border-gray-300 hover:border-brand-400 hover:bg-brand-50">
          <ImagePlus className="h-7 w-7 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Click or drag photos here</p>
          <p className="text-xs text-gray-400">
            {totalUsed}/{maxImages} · Max {MAX_SIZE_MB} MB each · JPG, PNG, WEBP only
          </p>
        </div>
      )}

      <input ref={fileRef} type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {globalError && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {globalError}
        </p>
      )}
    </div>
  );
}
