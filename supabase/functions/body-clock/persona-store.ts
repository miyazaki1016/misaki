import type {
  SupabaseClient,
} from "npm:@supabase/supabase-js@2.57.4";

import {
  createFallbackPersonaPrompt,
  type PersonaChannel,
} from "./fallback-persona.ts";

type PromptModuleRow = {
  module_key: string;
  content: string;
  sort_order: number;
  metadata:
    | Record<string, unknown>
    | null;
};

type PersonaCacheEntry = {
  expiresAt: number;
  versionCode: string;
  modules: PromptModuleRow[];
};

export type LoadedPersonaPrompt = {
  text: string;
  source:
    | "database"
    | "fallback";
  versionCode:
    | string
    | null;
};

const CACHE_TTL_MS =
  5 * 60 * 1000;

let globalCache:
  PersonaCacheEntry | null =
    null;

function moduleSupportsChannel(
  module: PromptModuleRow,
  channel: PersonaChannel
) {
  const channels =
    module.metadata?.channels;

  if (!Array.isArray(channels)) {
    return true;
  }

  return channels.some(
    (value) =>
      value === channel
  );
}

async function loadActiveGlobalModules(
  supabase: SupabaseClient
) {
  const now = Date.now();

  if (
    globalCache &&
    globalCache.expiresAt > now
  ) {
    return globalCache;
  }

  const {
    data: versions,
    error: versionError,
  } =
    await supabase
      .from(
        "misaki_persona_versions"
      )
      .select(
        "id, version_code"
      )
      .eq(
        "status",
        "active"
      )
      .order(
        "activated_at",
        {
          ascending: false,
          nullsFirst: false,
        }
      )
      .limit(1);

  if (versionError) {
    throw versionError;
  }

  const version =
    versions?.[0];

  if (!version) {
    throw new Error(
      "No active Misaki persona version"
    );
  }

  const {
    data: modules,
    error: modulesError,
  } =
    await supabase
      .from(
        "misaki_prompt_modules"
      )
      .select(
        "module_key, content, sort_order, metadata"
      )
      .eq(
        "version_id",
        version.id
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );

  if (modulesError) {
    throw modulesError;
  }

  const entry:
    PersonaCacheEntry = {
    expiresAt:
      now + CACHE_TTL_MS,
    versionCode:
      version.version_code,
    modules:
      (modules ?? []) as
        PromptModuleRow[],
  };

  globalCache = entry;

  return entry;
}

async function loadUserRelationshipTraits(
  supabase: SupabaseClient,
  userId: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "misaki_user_relationship_traits"
      )
      .select(
        "trait_key, content, strength"
      )
      .eq(
        "user_id",
        userId
      )
      .order(
        "strength",
        {
          ascending: false,
        }
      )
      .limit(20);

  if (error) {
    throw error;
  }

  if (
    !data ||
    data.length === 0
  ) {
    return "";
  }

  return `
【このユーザーとの関係で育った特徴】

${data
  .map(
    (trait) =>
      `・${trait.content}`
  )
  .join("\n")}

これはこのユーザーとの関係だけに使ってください。
他のユーザーや美咲全体の固定人格へ広げないでください。
`.trim();
}

export async function loadPersonaPrompt(
  supabase: SupabaseClient,
  userId: string,
  channel: PersonaChannel
): Promise<LoadedPersonaPrompt> {
  try {
    const [
      active,
      userTraits,
    ] =
      await Promise.all([
        loadActiveGlobalModules(
          supabase
        ),
        loadUserRelationshipTraits(
          supabase,
          userId
        ),
      ]);

    const globalText =
      active.modules
        .filter(
          (module) =>
            moduleSupportsChannel(
              module,
              channel
            )
        )
        .map(
          (module) =>
            module.content.trim()
        )
        .filter(Boolean)
        .join("\n\n");

    if (!globalText) {
      throw new Error(
        "Active persona has no usable prompt modules"
      );
    }

    return {
      text:
        [
          globalText,
          userTraits,
        ]
          .filter(Boolean)
          .join("\n\n"),
      source: "database",
      versionCode:
        active.versionCode,
    };
  } catch (error) {
    console.error(
      "PERSONA DB FALLBACK:",
      error
    );

    return {
      text:
        createFallbackPersonaPrompt(
          channel
        ),
      source: "fallback",
      versionCode: null,
    };
  }
}

export function clearPersonaPromptCache() {
  globalCache = null;
}
