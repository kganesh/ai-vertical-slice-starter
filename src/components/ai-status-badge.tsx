"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";

type Health = { ai: { enabled: boolean; provider?: string; model?: string } };

/** Makes the AI mode visible: reviewers see at a glance whether fallback is active. */
export function AiStatusBadge() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    api<Health>("/api/health")
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  if (!health) return null;
  return health.ai.enabled ? (
    <Badge variant="default" title={`${health.ai.provider} · ${health.ai.model}`}>
      <Sparkles className="size-3" aria-hidden /> AI on · {health.ai.model}
    </Badge>
  ) : (
    <Badge variant="warning" title="No API key configured: AI features use rule-based fallbacks">
      <Sparkles className="size-3" aria-hidden /> AI fallback mode
    </Badge>
  );
}
