import fs from "fs/promises";

export const deleteFileIfExists = async (
  filePath: string,
): Promise<boolean> => {
  try {
    if (
      filePath &&
      (await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false))
    ) {
      await fs.unlink(filePath);
      console.log(`Successfully deleted: ${filePath}`);
      return true;
    }
    console.log(`File not found: ${filePath}`);
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
};
