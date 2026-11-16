/**
 * Automated moderation pipeline for third-party catalog entries.
 *
 * Every folder name and video title pulled from a source passes through
 * `moderateText` before it can be listed publicly. Entries that match a
 * hard-banned signal are rejected automatically and recorded in the
 * moderation log; they are never rendered anywhere on the platform.
 *
 * The blocklist enforces the platform's adult-content policy:
 *  - absolute ban on any content involving minors,
 *  - ban on non-consensual content (including revenge porn, deepfakes,
 *    voyeurism/hidden cameras and leaked/hacked material),
 *  - ban on incest-themed content.
 */

export type ModerationReason =
  | "MINOR_INDICATOR"
  | "NON_CONSENSUAL"
  | "PRIVACY_VIOLATION"
  | "INCEST_THEME"
  | "POLICY_VIOLATION";

export interface ModerationVerdict {
  approved: boolean;
  reason: ModerationReason | null;
  /** Matched keyword (lowercase) for the internal moderation log only. */
  matched: string | null;
}

interface BlockRule {
  code: ModerationReason;
  pattern: RegExp;
}

/**
 * Order matters: the first matching rule wins. Word boundaries prevent
 * false positives (e.g. "history" must not match "his").
 */
const BLOCK_RULES: BlockRule[] = [
  // ---- Absolute ban: any hint of minors ---------------------------------
  {
    code: "MINOR_INDICATOR",
    pattern: /\b(pedo|pedophile|paedophile|pthc|jailbait|loli|lolicon|shota|shotcon|underage|preteen|pre-teen|tween|child|children|kid|kids|childhood)\b/i,
  },
  { code: "MINOR_INDICATOR", pattern: /\bteen(?:s|age|ager|agers)?\b/i },
  {
    code: "MINOR_INDICATOR",
    // Indonesian school/young-girl slang included deliberately (sma/smp = high
    // school, abg = "anak baru gede", pelajar = pupil).
    pattern: /\b(high\s?school|schoolgirl|schoolboy|student|cheerleader|babysitter|sma|smp|pelajar|abg)\b/i,
  },
  { code: "MINOR_INDICATOR", pattern: /\b(barely\s?legal|not\s?yet\s?legal)\b/i },
  { code: "MINOR_INDICATOR", pattern: /\b(daughter|son|niece|nephew|granddaughter|grandson|little\s?(girl|boy))\b/i },

  // ---- Non-consensual ----------------------------------------------------
  {
    code: "NON_CONSENSUAL",
    pattern: /\b(rape|raped|raping|non\s?consensual|nonconsensual|without\s?consent|forced|coerced|coercion|drugged|sedated|unconscious|passed\s?out|knocked\s?out|asleep|sleeping|kidnapped|kidnap|trafficking|trafficked|abduction|harass|harassing|harassment)\b/i,
  },
  {
    code: "NON_CONSENSUAL",
    // "perkos" catches perkosa/diperkosa/perkosaan (Indonesian: rape) —
    // substring match on purpose: word boundaries break on prefixes.
    pattern: /perkos/i,
  },
  {
    code: "NON_CONSENSUAL",
    // "tidur" = sleeping (Indonesian) — incapacitation framing.
    pattern: /\b(asleep|sleeping|sleepy|tidur|ketiduran)\b/i,
  },
  {
    code: "NON_CONSENSUAL",
    pattern: /\b(terpaksa|dipaksa|paksaan|torture|beaten|beating|abused|abusing)\b/i,
  },

  // ---- Privacy violations: leaked/hacked/voyeur material -----------------
  {
    code: "PRIVACY_VIOLATION",
    pattern: /\b(leak|leaked|leaking|hack|hacked|hacking|stolen|data\s?breach)\b/i,
  },
  {
    code: "PRIVACY_VIOLATION",
    pattern: /\b(hidden\s?cam|hidden\s?camera|spy\s?cam|spycam|spy\s?camera|voyeur|voyeurism|secretly\s?recorded|secret\s?recording|peeping)\b/i,
  },
  {
    code: "PRIVACY_VIOLATION",
    pattern: /\b(revenge\s?porn|ex\s?girlfriend|ex\s?wife|exgf|exwife|deep\s?fake|deepfake|face\s?swap|faceswap)\b/i,
  },

  // ---- Incest themes -----------------------------------------------------
  {
    code: "INCEST_THEME",
    pattern: /\b(incest|step\s?mom|stepmom|step\s?mother|step\s?son|stepson|step\s?daughter|stepdaughter|step\s?sister|stepsister|step\s?brother|stepbrother|step\s?family)\b/i,
  },
  {
    code: "INCEST_THEME",
    pattern: /\b(family\s?(sex|taboo|affair)|mom\s?(and|&)son|mother\s?(and|&)son|dad\s?(and|&)daughter|father\s?(and|&)daughter)\b/i,
  },
];

/** Neutral reason label used in moderation logs (never shown to end users). */
const REASON_LABELS: Record<ModerationReason, string> = {
  MINOR_INDICATOR: "Indikasi konten anak di bawah umur",
  NON_CONSENSUAL: "Indikasi konten non-konsensual",
  PRIVACY_VIOLATION: "Indikasi konten bocor/pelanggaran privasi",
  INCEST_THEME: "Tema inses",
  POLICY_VIOLATION: "Pelanggaran kebijakan konten",
};

export function moderationReasonLabel(code: ModerationReason): string {
  return REASON_LABELS[code];
}

/** Run a folder name / video title through the hard blocklist. */
export function moderateText(raw: string): ModerationVerdict {
  const text = normalizeLeet((raw ?? "").toLowerCase());
  if (text.length === 0) {
    return { approved: false, reason: "POLICY_VIOLATION", matched: null };
  }
  for (const rule of BLOCK_RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      return { approved: false, reason: rule.code, matched: match[0].toLowerCase() };
    }
  }
  // Family-pair rules: parent+child kinship, or a child-family term combined
  // with explicit sexual terms (covers leetspeak/censored spellings after
  // normalization). Two distinct child-family terms together are also
  // incest-framed ("kakak adek..."). Step-family ("kakak tiri", "ibu tiri")
  // is matched explicitly.
  const stepFamilyHit = text.match(STEP_FAMILY_PATTERN);
  if (stepFamilyHit) {
    return { approved: false, reason: "INCEST_THEME", matched: stepFamilyHit[0] };
  }
  const parentHit = text.match(PARENT_TERM_PATTERN);
  const childHits = [...text.matchAll(new RegExp(CHILD_TERM_PATTERN.source, "gi"))].map(
    (match) => match[0].toLowerCase(),
  );
  const distinctChildTerms = new Set(childHits).size;
  const sexualHit = text.match(SEXUAL_TERM_PATTERN);

  if (parentHit && distinctChildTerms >= 1) {
    return { approved: false, reason: "INCEST_THEME", matched: `${parentHit[0]}+${childHits[0]}` };
  }
  if (distinctChildTerms >= 2) {
    return { approved: false, reason: "INCEST_THEME", matched: `${childHits[0]}+${childHits[1]}` };
  }
  if (distinctChildTerms >= 1 && sexualHit) {
    return { approved: false, reason: "INCEST_THEME", matched: `${childHits[0]}+${sexualHit[0]}` };
  }
  // Parent framing combined with explicit sexual terms is treated as
  // family-roleplay/incest-adjacent and rejected conservatively.
  if (parentHit && sexualHit) {
    return { approved: false, reason: "INCEST_THEME", matched: `${parentHit[0]}+${sexualHit[0]}` };
  }
  return { approved: true, reason: null, matched: null };
}

/** Step-family framing ("kakak tiri", "ibu tiri", "anak tiri"...). */
const STEP_FAMILY_PATTERN = /\b(kakak|adek|adik|ibu|bapak|mama|mamah|papa|anak|sepupu|menantu|saudara)\s+tiri\b/i;

/**
 * Normalize common leetspeak/censoring so blocked terms cannot evade the
 * blocklist by spelling tricks (k0nt0l, colm*k, m4ma...).
 */
function normalizeLeet(text: string): string {
  return text
    .replace(/[0]/g, "o")
    .replace(/[1|!]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[*_+~.\-]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Family-role terms (parents). Presence alone is fine (MILF-style genre
 * labels); the dangerous case is a parent term *paired* with a child term,
 * or a parent/child term paired with explicit sexual terms. Indonesian
 * possessive suffixes (nya/ku/mu) are allowed so "putranya"/"kakaknya"
 * still match.
 */
const PARENT_TERM_PATTERN =
  /\b(mama|mamah|mami|papa|papah|bapak|ayah|ibu|emak|mother|father|mommy|mom|dad)(?:nya|ku|mu|kah)?\b/i;

/** Child/family-member terms — sex + these is incest-framed. */
const CHILD_TERM_PATTERN =
  /\b(anak|putra|putri|kakak|kaka|adek|adik|ponakan|keponakan|sepupu|menantu|mertua|ipar|son|daughter|sister|brother|cousin|nephew|niece|in-law)(?:nya|ku|mu|kah)?\b/i;

/** Hard Indonesian/English sexual terms (used only in combination rules). */
const SEXUAL_TERM_PATTERN =
  /\b(ngewe|ngentot|entot|col\s?m[3e]?\s?k|bokep|sange|memek|pepek|kontol|titit|sepong|horny|sex|seks|genjot|ewean|diewe)(?:nya|ku|mu|an|in)?\b/i;

/**
 * Neutral category taxonomy. Labels are intentionally non-vulgar and are the
 * only category labels rendered anywhere on the platform.
 */
export interface CategoryDefinition {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  keywords: RegExp;
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    slug: "asia",
    name: "Asia",
    description: "Koleksi dari kreator dan studio Asia.",
    sortOrder: 1,
    keywords: /\b(asian|japan|japanese|jav|jepang|korean|korea|thai|thailand|indo|indonesia|indonesian|vietnamese|chinese|taiwan|hongkong|filipino|filipina)\b/i,
  },
  {
    slug: "barat",
    name: "Barat",
    description: "Koleksi dari kreator dan studio Barat.",
    sortOrder: 2,
    keywords: /\b(western|american|usa|european|euro|british|german|french|italian|spanish|russian|ukrainian|polish|czech|canadian|australian|latina|latino)\b/i,
  },
  {
    slug: "amatir",
    name: "Amatir",
    description: "Koleksi amatir dari kreator independen.",
    sortOrder: 3,
    keywords: /\b(amateur|homemade|selfshot|selfie|onlyfans|fansly|personal|independent)\b/i,
  },
  {
    slug: "animasi",
    name: "Animasi Dewasa",
    description: "Koleksi animasi dan gambar gerak dewasa.",
    sortOrder: 4,
    keywords: /\b(hentai|anime|cartoon|animation|animated|eroge|sfm|3d|manga)\b/i,
  },
  {
    slug: "mature",
    name: "Mature",
    description: "Koleksi dengan label kelompok usia matang.",
    sortOrder: 5,
    keywords: /\b(milf|mature|cougar|granny|gilf|older\s?woman)\b/i,
  },
  {
    slug: "pasangan",
    name: "Pasangan",
    description: "Koleksi berpasangan konsensual.",
    sortOrder: 6,
    keywords: /\b(couple|couples|swinger|swingers|wifeswap|partner)\b/i,
  },
  {
    slug: "solo",
    name: "Solo",
    description: "Koleksi perorangan.",
    sortOrder: 7,
    keywords: /\b(solo)\b/i,
  },
  {
    // Fallback bucket for entries that match no keyword: every approved
    // folder must live in a category so category navigation stays complete.
    slug: "umum",
    name: "Koleksi Umum",
    description: "Koleksi umum dari berbagai kreator terverifikasi.",
    sortOrder: 99,
    keywords: /(?!x)x/, // never matches; assigned explicitly as fallback
  },
];

/** Assign a neutral category to a folder name, or null when unmatched. */
export function categorizeFolder(name: string): string | null {
  for (const definition of CATEGORY_DEFINITIONS) {
    if (definition.keywords.test(name)) return definition.slug;
  }
  return null;
}

/**
 * Neutral, honest catalog description for a video. No invented metadata:
 * Videytube only describes what it actually knows.
 */
export function videoCatalogDescription(sourceName: string, siteName: string): string {
  return (
    `Konten dewasa dari sumber terverifikasi ${sourceName}. ` +
    `Metadata ditampilkan apa adanya dari sumber. ${siteName} tidak menyimpan atau ` +
    `mendistribusikan file video; pemutaran disajikan langsung dari sumber pihak ketiga.`
  );
}

/** Neutral catalog description for a folder. */
export function folderCatalogDescription(folderName: string, sourceName: string): string {
  return (
    `Kumpulan video dari folder "${folderName}" pada sumber ${sourceName}. ` +
    `Seluruh entri telah melewati pemeriksaan sumber dan moderasi otomatis sebelum ditampilkan.`
  );
}
