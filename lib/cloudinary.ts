import { compressImage } from "@/lib/image-compress";

export type UploadedImage = { url: string; publicId: string };
const CLOUDINARY_HOST = /^https?:\/\/res\.cloudinary\.com\//;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Внешние и локальные (/images/…) адреса возвращаются без изменений.
export function cloudImage(url: string, width: number): string {
  if (!CLOUDINARY_HOST.test(url) || url.includes("f_auto")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}
export async function uploadImage(file: File): Promise<UploadedImage> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) throw new Error("Cloudinary не настроен: заполните NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME и NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Файл больше 10 МБ. Выберите изображение меньшего размера.");
  if (!file.type.startsWith("image/")) throw new Error("Неверный формат файла. Нужно изображение (JPEG, PNG или WebP).");
  const { blob } = await compressImage(file);
  const form = new FormData();
  form.append("file", blob, "upload.jpg");
  form.append("upload_preset", preset);
  let response: Response;
  try { response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form }); }
  catch { throw new Error("Нет соединения с интернетом. Проверьте сеть и попробуйте ещё раз."); }
  const data = await response.json().catch(() => null) as { secure_url?: string; public_id?: string; error?: { message?: string } } | null;
  if (!response.ok || !data?.secure_url) throw new Error(data?.error?.message ? `Не удалось загрузить фото: ${data.error.message}` : "Не удалось загрузить фото. Попробуйте ещё раз.");
  return { url: data.secure_url, publicId: data.public_id ?? "" };
}
