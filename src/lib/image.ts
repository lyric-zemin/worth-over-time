import { MAX_IMAGE_DATA_URL_LENGTH } from "@/lib/storage";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("读取图片失败，请重新选择"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("这张图片无法打开，换一张试试"));
    image.src = src;
  });
}

function drawSquare(image: HTMLImageElement, size: number, quality: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器不支持图片处理");
  const side = Math.min(image.width, image.height);
  const sx = (image.width - side) / 2;
  const sy = (image.height - side) / 2;
  context.drawImage(image, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL("image/webp", quality);
}

/** 上传图标统一裁成正方形并压到 256px 以内，控制 localStorage 占用 */
export async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");
  if (file.size > 8 * 1024 * 1024) throw new Error("图片太大了，请选择 8 MB 以内的图片");

  const source = await readAsDataUrl(file);
  const image = await loadImage(source);

  let size = 256;
  let quality = 0.82;
  let result = drawSquare(image, size, quality);
  while (result.length > MAX_IMAGE_DATA_URL_LENGTH && size > 96) {
    size = Math.floor(size * 0.75);
    quality = Math.max(0.55, quality - 0.12);
    result = drawSquare(image, size, quality);
  }
  if (result.length > MAX_IMAGE_DATA_URL_LENGTH) {
    throw new Error("这张图片压缩后仍然太大，换一张小一点的图片");
  }
  return result;
}
