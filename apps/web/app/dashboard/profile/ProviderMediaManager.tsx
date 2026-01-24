"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { createBrowserClient } from "../../../lib/supabase/browser";
import { getPublicStorageUrl } from "../../../lib/supabase/storageUrl";

type ProviderPhoto = {
  id: string;
  path: string;
};

type ProviderMediaManagerProps = {
  providerId: string;
  initialLogoPath: string | null;
  initialPhotos: ProviderPhoto[];
};

export default function ProviderMediaManager({
  providerId,
  initialLogoPath,
  initialPhotos,
}: ProviderMediaManagerProps) {
  const [logoPath, setLogoPath] = useState<string | null>(initialLogoPath);
  const [photos, setPhotos] = useState<ProviderPhoto[]>(initialPhotos);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const uploadLogo = (file: File) => {
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
      const { error: updateError } = await supabase
        .from("providers")
        .update({ logo_path: path })
        .eq("id", providerId);
      if (updateError) {
        setNotice(updateError.message);
        return;
      }
      if (logoPath) {
        await supabase.storage.from("provider-logos").remove([logoPath]);
      }
      setLogoPath(path);
    });
  };

  const removeLogo = () => {
    if (!logoPath) return;
    startTransition(async () => {
      setNotice(null);
      const supabase = createBrowserClient();
      await supabase.storage.from("provider-logos").remove([logoPath]);
      const { error } = await supabase.from("providers").update({ logo_path: null }).eq("id", providerId);
      if (error) {
        setNotice(error.message);
        return;
      }
      setLogoPath(null);
    });
  };

  const uploadPhotos = (files: FileList | null) => {
    if (!files?.length) return;
    startTransition(async () => {
      setNotice(null);
      const supabase = createBrowserClient();
      const newPhotos: ProviderPhoto[] = [];

      for (const file of Array.from(files)) {
        const path = `${providerId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("provider-photos")
          .upload(path, file);
        if (uploadError) {
          setNotice(uploadError.message);
          continue;
        }
        const { data, error: insertError } = await supabase
          .from("provider_photos")
          .insert({ provider_id: providerId, path })
          .select("id, path")
          .maybeSingle();
        if (insertError) {
          setNotice(insertError.message);
          continue;
        }
        if (data) {
          newPhotos.push({ id: data.id, path: data.path });
        }
      }

      if (newPhotos.length) {
        setPhotos((prev) => [...newPhotos, ...prev]);
      }
    });
  };

  const removePhoto = (photo: ProviderPhoto) => {
    startTransition(async () => {
      setNotice(null);
      const supabase = createBrowserClient();
      await supabase.storage.from("provider-photos").remove([photo.path]);
      const { error } = await supabase.from("provider_photos").delete().eq("id", photo.id);
      if (error) {
        setNotice(error.message);
        return;
      }
      setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-foreground">Logo</div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {logoPath && getPublicStorageUrl("provider-logos", logoPath) ? (
            <Image
              src={getPublicStorageUrl("provider-logos", logoPath) ?? ""}
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
            disabled={isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                uploadLogo(file);
              }
              event.currentTarget.value = "";
            }}
          />
          {logoPath ? (
            <Button size="sm" variant="outline" type="button" onClick={removeLogo} disabled={isPending}>
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
            disabled={isPending}
            onChange={(event) => {
              uploadPhotos(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.length ? (
            photos.map((photo) => {
              const photoUrl = getPublicStorageUrl("provider-photos", photo.path);
              if (!photoUrl) {
                return null;
              }
              return (
              <div key={photo.id} className="rounded-lg border border-border/70 p-2">
                <Image
                  src={photoUrl}
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
                  onClick={() => removePhoto(photo)}
                  disabled={isPending}
                >
                  Remove
                </Button>
              </div>
            );
            })
          ) : (
            <div className="text-sm text-muted-foreground">No photos uploaded yet.</div>
          )}
        </div>
      </div>

      {notice ? <div className="text-xs text-rose-600">{notice}</div> : null}
    </div>
  );
}
