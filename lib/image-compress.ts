const limit = 150 * 1024;
export async function compressImage(file: File): Promise<string> {
  if (file.size > 12 * 1024 * 1024) throw new Error("Файл больше 12 МБ. Выберите изображение меньшего размера.");
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение."));
    reader.onload = () => { const image = new Image(); image.onerror = () => reject(new Error("Файл не является изображением.")); image.onload = () => resolve(image); image.src = String(reader.result); };
    reader.readAsDataURL(file);
  });
  const render = (max: number, quality: number) => {
    const scale = Math.min(1, max / Math.max(source.naturalWidth, source.naturalHeight));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(source.naturalWidth * scale); canvas.height = Math.round(source.naturalHeight * scale);
    const context = canvas.getContext("2d"); if (!context) throw new Error("Браузер не поддерживает обработку изображений.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/jpeg", quality);
  };
  let result = render(600, 0.7);
  if (bytes(result) > limit) result = render(600, 0.6);
  if (bytes(result) > limit) result = render(500, 0.6);
  if (bytes(result) > limit) throw new Error("Фото не удалось сжать до 150 КБ. Выберите другое изображение.");
  return result;
}
function bytes(dataUrl: string) { return Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 3 / 4); }
