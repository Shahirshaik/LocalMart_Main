"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, ImagePlus } from "lucide-react";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 5 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} photos allowed.`);
      return;
    }
    setError("");
    setUploading(true);

    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" is over 10 MB — please compress it first.`);
        continue;
      }
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { upsert: false });

      if (uploadErr) {
        setError(uploadErr.message);
        continue;
      }
      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    onChange([...images, ...newUrls]);
    setUploading(false);
  };

  const remove = (url: string) =>
    onChange(images.filter((u) => u !== url));

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((url, i) => (
            <div
              key={url}
              className="relative group rounded-xl overflow-hidden bg-gray-100"
              style={{ aspectRatio: "1" }}
            >
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Cover badge */}
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-brand-600 text-white rounded px-1 py-0.5 leading-none">
                  COVER
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-8
            ${uploading
              ? "border-brand-300 bg-brand-50 cursor-not-allowed"
              : "border-gray-300 hover:border-brand-400 hover:bg-brand-50"
            }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 text-brand-500 animate-spin" />
              <p className="text-sm text-brand-600 font-medium">Uploading…</p>
            </>
          ) : (
            <>
              <ImagePlus className="h-7 w-7 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Click or drag photos here
              </p>
              <p className="text-xs text-gray-400">
                {images.length}/{maxImages} · Max 5 MB each · JPG, PNG, WEBP
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        disabled={uploading}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
