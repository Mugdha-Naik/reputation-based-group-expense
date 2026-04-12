
import { v2 as cloudinary } from "cloudinary";

function sanitizeEnv(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

cloudinary.config({
  cloud_name: sanitizeEnv(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: sanitizeEnv(process.env.CLOUDINARY_API_KEY),
  api_secret: sanitizeEnv(process.env.CLOUDINARY_API_SECRET),
});

export default cloudinary;
