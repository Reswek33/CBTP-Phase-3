const isProduction = process.env.NODE_ENV === "production";

export const getFileUrl = (filePath: string): string => {
  if (!filePath) return "";

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  if (isProduction) {
    const baseUrl = process.env.BASE_URL || "https://yourdomain.com";
    return `${baseUrl}/${filePath}`;
  } else {
    return `http://localhost:5000/${filePath}`;
  }
};
