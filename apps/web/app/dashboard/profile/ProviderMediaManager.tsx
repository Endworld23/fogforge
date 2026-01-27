"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { createBrowserClient } from "../../../lib/supabase/browser";
import { getPublicStorageUrl } from "../../../lib/supabase/storageUrl";

const MAX_MEDIA = 6;

type ProviderMedia = {
  id: string;
  url: string;
  sort_order: number;
};

type ProviderMediaManagerProps = {
  providerId: string;
  initialLogoUrl: string | null;
  initialLogoPath: string | null;
  initialMedia: ProviderMedia[];
  canEditMedia: boolean;
  providerState: "UNCLAIMED" | "CLAIMED_UNVERIFIED" | "VERIFIED";
  isPublished: boolean;
};

const STORAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function getStoragePathFromPublicUrl(url: string | null, bucket: string) {
  if (!url || !STORAGE_BASE) return null;
  const prefix = `${STORAGE_BASE}/storage/v1/object/public/${bucket}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

export default function ProviderMediaManager({
  providerId,
  initialLogoUrl,
  initialLogoPath,
  initialMedia,
  canEditMedia,
  providerState,
  isPublished,
}: ProviderMediaManagerProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [logoPath, setLogoPath] = useState<string | null>(initialLogoPath);
  const [media, setMedia] = useState<ProviderMedia[]>(initialMedia);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const logoSrc = logoUrl ?? getPublicStorageUrl("provider-logos", logoPath ?? undefined);
  const canUploadMore = media.length < MAX_MEDIA;
  const uploadsEnabled = canEditMedia;

  const uploadLogo = (file: File) => {
    if (!uploadsEnabled) return;
    startTransition(async () => {
      setNotice(null);
      const supabase = createBrowserClient();
      const path = `${providerId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("provider-logos")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        setNotice(uploadError.message);
        return;
      }
      const publicUrl = getPublicStorageUrl("provider-logos", path);
      const { error: updateError } = await supabase
        .from("providers")
        .update({ logo_url: publicUrl, logo_path: path })
        .eq("id", providerId);
      if (updateError) {
        setNotice(updateError.message);
        return;
      }
      if (logoPath) {
        await supabase.storage.from("provider-logos").remove([logoPath]);
      } else if (logoUrl) {
        const legacyPath = getStoragePathFromPublicUrl(logoUrl, "provider-logos");
        if (legacyPath) {
          await supabase.storage.from("provider-logos").remove([legacyPath]);
        }
      }
      setLogoPath(path);
      setLogoUrl(publicUrl ?? null);
    });
  };

  const removeLogo = () => {
    if (!uploadsEnabled) return;
    if (!logoPath && !logoUrl) return;
    startTransition(async () => {
      setNotice(null);
      const supabase = createBrowserClient();
      const paths: string[] = [];
      if (logoPath) paths.push(logoPath);
      if (!logoPath && logoUrl) {
        const legacyPath = getStoragePathFromPublicUrl(logoUrl, "provider-logos");
        if (legacyPath) paths.push(legacyPath);
      }
      if (paths.length) {
        await supabase.storage.from("provider-logos").remove(paths);
      }
      const { error } = await supabase
        .from("providers")
        .update({ logo_url: null, logo_path: null })
        .eq("id", providerId);
      if (error) {
        setNotice(error.message);
        return;
      }
      setLogoPath(null);
      setLogoUrl(null);
    });
  };

  const uploadMedia = (files: FileList | null) => {
    if (!files?.length || !uploadsEnabled) return;
    if (!canUploadMore) {
      setNotice(`You can upload up to ${MAX_MEDIA} photos.`);
      return;
    }
    startTransition(async () => {
      setNotice(null);
      const supabase = createBrowserClient();
      const newMedia: ProviderMedia[] = [];
      const filesArray = Array.from(files).slice(0, MAX_MEDIA - media.length);

      for (const file of filesArray) {
        const path = `${providerId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("provider-photos")
          .upload(path, file);
        if (uploadError) {
          setNotice(uploadError.message);
          continue;
        }
        const publicUrl = getPublicStorageUrl("provider-photos", path);
        if (!publicUrl) {
          setNotice("Unable to build a public URL for this image.");
          continue;
        }
        const { data, error: insertError } = await supabase
          .from("provider_media")
          .insert({ provider_id: providerId, url: publicUrl, sort_order: Date.now() })
          .select("id, url, sort_order")
          .maybeSingle();
        if (insertError) {
          setNotice(insertError.message);
          continue;
        }
        if (data) {
          newMedia.push({ id: data.id, url: data.url, sort_order: data.sort_order ?? 0 });
        }
      }

      if (newMedia.length) {
        setMedia((prev) => [...newMedia, ...prev]);
      }
    });
  };

  const removeMedia = (item: ProviderMedia) => {
    if (!uploadsEnabled) return;
    startTransition(async () => {
      setNotice(null);
      const supabase = createBrowserClient();
      const path = getStoragePathFromPublicUrl(item.url, "provider-photos");
      if (path) {
        await supabase.storage.from("provider-photos").remove([path]);
      }
      const { error } = await supabase.from("provider_media").delete().eq("id", item.id);
      if (error) {
        setNotice(error.message);
        return;
      }
      setMedia((prev) => prev.filter((entry) => entry.id !== item.id));
    });
  };

  return (
    <div className="space-y-4">
      {providerState === "UNCLAIMED" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          You need to claim this business before uploading media.
          <Link className="ml-2 font-semibold underline-offset-4 hover:underline" href="/get-started?mode=claim">
            Claim a business
          </Link>
        </div>
      ) : null}
      {providerState === "CLAIMED_UNVERIFIED" ? (
        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          Images will go public after verification.
        </div>
      ) : null}
      {providerState === "VERIFIED" && !isPublished ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          Publish your listing to make your logo and gallery visible.
        </div>
      ) : null}

      <div>
        <div className="text-sm font-semibold text-foreground">Logo</div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt="Provider logo"
              width={64}
              height={64}
              className="h-16 w-16 rounded-full border border-border object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground">
              No logo
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            disabled={isPending || !uploadsEnabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                uploadLogo(file);
              }
              event.currentTarget.value = "";
            }}
          />
          {logoPath || logoUrl ? (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={removeLogo}
              disabled={isPending || !uploadsEnabled}
            >
              Remove logo
            </Button>
          ) : null}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-foreground">Photos</div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Input
            type="file"
            accept="image/*"
            multiple
            disabled={isPending || !uploadsEnabled || !canUploadMore}
            onChange={(event) => {
              uploadMedia(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <span className="text-xs text-muted-foreground">
            {media.length}/{MAX_MEDIA} used
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {media.length ? (
            media.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/70 p-2">
                <Image
                  src={item.url}
                  alt="Provider photo"
                  width={480}
                  height={320}
                  className="h-32 w-full rounded-md object-cover"
                  unoptimized
                />
                <Button
                  className="mt-2 w-full"
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => removeMedia(item)}
                  disabled={isPending || !uploadsEnabled}
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No photos uploaded yet.</div>
          )}
        </div>
      </div>

      {notice ? <div className="text-xs text-rose-600">{notice}</div> : null}
    </div>
  );
}
