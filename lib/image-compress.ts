export type CompressedImage = { dataUrl: string; blob: Blob };
const maxSourceBytes = 12 * 1024 * 1024;

export async function compressImage(file: File, max = 1200, limit = 300 * 1024): Promise<CompressedImage> {
  if (file.size > maxSourceBytes) throw new Error("Файл больше 12 МБ. Выберите изображение меньшего размера.");
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение."));
    reader.onload = () => { const image = new Image(); image.onerror = () => reject(new Error("Файл не является изображением.")); image.onload = () => resolve(image); image.src = String(reader.result); };
    reader.readAsDataURL(file);
  });
  const render = (size: number, quality: number) => {
    const scale = Math.min(1, size / Math.max(source.naturalWidth, source.naturalHeight));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(source.naturalWidth * scale); canvas.height = Math.round(source.naturalHeight * scale);
    const context = canvas.getContext("2d"); if (!context) throw new Error("Браузер не поддерживает обработку изображений.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/jpeg", quality);
  };
  let result = render(max, 0.82);
  if (bytes(result) > limit) result = render(max, 0.7);
  if (bytes(result) > limit) result = render(Math.round(max * 0.75), 0.7);
  if (bytes(result) > limit) result = render(Math.round(max * 0.6), 0.65);
  if (bytes(result) > limit) throw new Error(`Фото не удалось сжать до ${Math.round(limit / 1024)} КБ. Выберите другое изображение.`);
  return { dataUrl: result, blob: toBlob(result) };
}
function toBlob(dataUrl: string): Blob {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: "image/jpeg" });
}
function bytes(dataUrl: string) { return Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 3 / 4); }
