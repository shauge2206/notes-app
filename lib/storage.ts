import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.[^.]+$/, "").slice(0, 80) + ".webp";
}

async function compressImage(file: File): Promise<File> {
  // Skip compression for SVGs and GIFs (animated)
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    return compressed;
  } catch {
    // If compression fails, upload the original
    return file;
  }
}

export async function uploadNoteImage(
  file: File,
  tileId: string,
  sectionId: string
): Promise<{ url: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Ugyldig filtype: ${file.type}. Kun bilder er tillatt.`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Filen er for stor. Maks 10 MB.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Ikke innlogget");

  // Compress and convert to WebP
  const compressed = await compressImage(file);

  const safeName = sanitizeFilename(file.name);
  const path = `${user.id}/${tileId}/${sectionId}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage
    .from("note-images")
    .upload(path, compressed, { contentType: compressed.type });

  if (error) throw new Error(`Opplasting feilet: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("note-images")
    .getPublicUrl(path);

  return { url: urlData.publicUrl };
}

export async function deleteNoteImage(publicUrl: string): Promise<void> {
  const supabase = createClient();

  const marker = "/storage/v1/object/public/note-images/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const path = decodeURIComponent(publicUrl.slice(idx + marker.length));
  const { error } = await supabase.storage.from("note-images").remove([path]);
  if (error) console.error("Failed to delete image from storage:", error.message);
}
