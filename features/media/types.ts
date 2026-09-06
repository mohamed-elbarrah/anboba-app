export type MediaKind = "image" | "video";

export type MediaItem = {
  id: string;
  publicPath: string;
  originalFilename: string;
  mimeType: string;
  kind: MediaKind;
  sizeBytes: number;
  createdAt: Date;
};
