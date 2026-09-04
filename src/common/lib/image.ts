/**
 * 사진 -> 방향 보정 + 리사이즈 + base64 인코딩. PhotoXcel의 compressImage.ts와
 * Glucose Vision의 analyzeMealPhoto.ts 리사이즈 로직을 하나로 합쳐 이식했다.
 *
 * createImageBitmap에 imageOrientation:"from-image"를 명시해, iOS에서 세로로 찍은
 * 사진이 EXIF 방향 태그 때문에 가로로 눕혀 보이는 문제를 canvas 렌더링 단계에서
 * 항상 바로잡는다(브라우저 기본값에 기대지 않는다).
 */
const MAX_DIMENSION = 1440;
const JPEG_QUALITY = 0.85;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export interface CompressedImage {
  base64: string;
  mimeType: string;
  /** 화면에 미리보기로 보여줄 때 쓰는 data URL (base64와 같은 바이트, 접두어만 다름). */
  dataUrl: string;
}

/** 사진을 방향 보정한 뒤 긴 변 기준 maxDimension 이하 JPEG로 리사이즈/재인코딩한다. */
export async function compressPhotoForUpload(
  file: File,
  maxDimension = MAX_DIMENSION,
  quality = JPEG_QUALITY,
): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))), "image/jpeg", quality);
    });

    const buffer = await blob.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    return { base64, mimeType: "image/jpeg", dataUrl: `data:image/jpeg;base64,${base64}` };
  } finally {
    bitmap.close();
  }
}
