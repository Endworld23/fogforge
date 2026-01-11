"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { updateProviderPublishAction } from "../actions";

type ProviderActionsProps = {
  providerId: string;
  isPublished: boolean;
  publicUrl: string | null;
};

export default function ProviderActions({
  providerId,
  isPublished,
  publicUrl,
}: ProviderActionsProps) {
  const [published, setPublished] = useState(isPublished);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const publicLink = useMemo(() => publicUrl ?? "", [publicUrl]);

  useEffect(() => {
    setPublished(isPublished);
    setNotice(null);
    setCopied(false);
  }, [providerId, isPublished]);

  const handlePublishToggle = (nextValue: boolean) => {
    setNotice(null);
    startTransition(async () => {
      const result = await updateProviderPublishAction(providerId, nextValue);
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      setPublished(Boolean(result.is_published));
    });
  };

  const handleCopy = async () => {
    if (!publicLink) return;
    try {
      const absoluteUrl = publicLink.startsWith("http")
        ? publicLink
        : `${window.location.origin}${publicLink}`;
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setNotice("Unable to copy link.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={published ? "outline" : "default"}
        disabled={isPending}
        onClick={() => handlePublishToggle(!published)}
      >
        {isPending
          ? published
            ? "Unpublishing..."
            : "Publishing..."
          : published
            ? "Unpublish"
            : "Publish"}
      </Button>
      {publicLink ? (
        <Button asChild variant="outline">
          <Link href={publicLink} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            View public page
          </Link>
        </Button>
      ) : (
        <Button type="button" variant="outline" disabled>
          View public page
        </Button>
      )}
      <Button type="button" variant="outline" disabled={!publicLink} onClick={handleCopy}>
        <Copy className="mr-2 h-4 w-4" />
        {copied ? "Copied" : "Copy public link"}
      </Button>
      {notice ? <span className="text-xs text-rose-600">{notice}</span> : null}
    </div>
  );
}
