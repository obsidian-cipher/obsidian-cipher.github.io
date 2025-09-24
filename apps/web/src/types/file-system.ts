export type FileSystemEntry = {
  name: string;
  type: "file" | "directory" | "binary" | "symlink" | "unknown";
};

export const ICONS: Record<FileSystemEntry["type"], string> = {
  file: "\uea7b",
  directory: "\uf413",
  binary: "\ueae8",
  symlink: "\ueaee",
  unknown: "\udb84\udc36",
};
