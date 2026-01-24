export function getPublicStorageUrl(bucket: string, path?: string | null) {
  if (!path) return null;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
