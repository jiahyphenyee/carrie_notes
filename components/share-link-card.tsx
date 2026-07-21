"use client";

import { useState } from "react";
import { Button, Section } from "@/components/ui";

type Props = { shareToken?: string };

export function ShareLinkCard({ shareToken }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!shareToken) return;
    const url = `${window.location.origin}/care/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (!shareToken) {
    return (
      <Section title="Share with caregiver" description="A share token will appear once the profile is ready.">
        <p className="text-sm leading-6 text-stone-600">This profile is not ready to share yet.</p>
      </Section>
    );
  }

  return (
    <Section title="Share with caregiver" description="Send this read-only link to a temporary caregiver.">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm text-stone-700">
          /care/{shareToken}
        </code>
        <Button type="button" variant="secondary" onClick={copyLink}>
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-500">
        Anyone with this link can view the profile, but they cannot edit it.
      </p>
    </Section>
  );
}
