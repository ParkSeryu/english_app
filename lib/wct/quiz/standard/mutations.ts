import { normalizeWctIdentity } from "../../normalization.ts";
import type {
  WctBlankCandidate,
  WctMutationEvidence,
  WctStandardSourceEntry
} from "./types.ts";

const agreementPairs = [["do", "does"], ["is", "are"], ["was", "were"], ["has", "have"]] as const;
const tensePairs = [["do", "did"], ["is", "was"], ["are", "were"], ["will", "would"], ["can", "could"]] as const;
const modalChoices = ["can", "could", "will", "would", "should", "might"] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
}

function tokenRegex(value: string) {
  return new RegExp(`(?<![a-z0-9'])${escapeRegex(value)}(?![a-z0-9'])`, "giu");
}

function declaredText(entry: WctStandardSourceEntry) {
  return `${entry.patternText} ${entry.usageNote ?? ""}`;
}

function hasDeclaredEquivalent(entry: WctStandardSourceEntry) {
  const normalized = normalizeWctIdentity(declaredText(entry));
  return /\b(?:can|could|will|would|should|might|do|does|did|is|are|was|were|has|have)\s*(?:\/|\bor\b)\s*(?:can|could|will|would|should|might|do|does|did|is|are|was|were|has|have)\b/u
    .test(normalized)
    || /\b(?:both|either)\b[^.]{0,48}\b(?:permitted|acceptable|correct|allowed)\b/u
      .test(normalized);
}

function replaceUnique(
  source: string,
  from: string,
  to: string,
  recipe: string,
  ruleFamily: string,
  reason: string,
  within?: { start: number; end: number }
): WctMutationEvidence | null {
  const matches = [...source.matchAll(tokenRegex(from))].filter((match) => {
    const start = match.index;
    return start !== undefined
      && (!within || (start >= within.start && start + match[0].length <= within.end));
  });
  const allMatches = [...source.matchAll(tokenRegex(from))];
  if (matches.length !== 1 || allMatches.length !== 1 || matches[0].index === undefined) {
    return null;
  }

  const match = matches[0];
  const start = match.index;
  const end = start + match[0].length;
  const text = `${source.slice(0, start)}${to}${source.slice(end)}`;
  if (normalizeWctIdentity(text) === normalizeWctIdentity(source)) return null;
  return {
    recipe,
    ruleFamily,
    text,
    changedFrom: match[0],
    changedTo: to,
    start,
    end,
    reason
  };
}

function otherMember(
  pairs: readonly (readonly [string, string])[],
  value: string
) {
  for (const [left, right] of pairs) {
    if (left === value) return right;
    if (right === value) return left;
  }
  return null;
}

function modalMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/\b(?:modal|base verb|before (?:a )?base verb)\b/u.test(declaration)) return [];

  const anchors = modalChoices.filter((choice) => tokenRegex(choice).test(entry.englishText));
  if (anchors.length !== 1) return [];
  const anchor = anchors[0];
  return modalChoices
    .filter((choice) => choice !== anchor)
    .map((choice) => replaceUnique(
      entry.englishText,
      anchor,
      choice,
      "modal_choice",
      "modal_choice",
      `The approved pattern uses "${anchor}" in this modal slot.`
    ))
    .filter((mutation): mutation is WctMutationEvidence => mutation !== null);
}

function modalPresenceMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/\bmodal\b[^.]{0,40}\b(?:required|must)\b/u.test(declaration)) return [];
  const pattern = /(?<![a-z0-9'])(?:can|could|will|would|should|might)(\s+)(?=[a-z])/giu;
  const matches = [...entry.englishText.matchAll(pattern)];
  if (matches.length !== 1 || matches[0].index === undefined) return [];
  const match = matches[0];
  const start = match.index;
  const end = start + match[0].length;
  return [{
    recipe: "modal_presence",
    ruleFamily: "modal_presence",
    text: `${entry.englishText.slice(0, start)}${entry.englishText.slice(end)}`,
    changedFrom: match[0],
    changedTo: "",
    start,
    end,
    reason: `The declared pattern requires the modal "${match[0].trim()}" before the base verb.`
  }];
}

function pairMutations(
  entry: WctStandardSourceEntry,
  pairs: readonly (readonly [string, string])[],
  family: string,
  declarationPattern: RegExp
) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!declarationPattern.test(declaration)) return [];

  const results: WctMutationEvidence[] = [];
  for (const [left, right] of pairs) {
    for (const [from, to] of [[left, right], [right, left]] as const) {
      if (!tokenRegex(from).test(declaration)) continue;
      const mutation = replaceUnique(
        entry.englishText,
        from,
        to,
        family,
        family,
        `The approved ${family.replaceAll("_", " ")} rule requires "${from}" here.`
      );
      if (mutation) results.push(mutation);
    }
  }
  return results;
}

function conditionalMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/\bconditional\b/u.test(declaration)
    || !/\bif\b/u.test(declaration)
    || !/\bpresent(?: tense)?\b/u.test(declaration)) return [];

  const comma = entry.englishText.indexOf(",");
  const clauseEnd = comma === -1 ? entry.englishText.length : comma;
  if (!/^\s*if\b/iu.test(entry.englishText.slice(0, clauseEnd))) return [];

  const results: WctMutationEvidence[] = [];
  for (const pair of tensePairs) {
    for (const from of pair) {
      const to = otherMember(tensePairs, from);
      if (!to) continue;
      const mutation = replaceUnique(
        entry.englishText,
        from,
        to,
        "conditional_clause_tense",
        "conditional_clause_tense",
        `The declared conditional keeps "${from}" in the if-clause.`,
        { start: 0, end: clauseEnd }
      );
      if (mutation) results.push(mutation);
    }
  }
  return results;
}

function indirectQuestionMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/\bindirect question\b/u.test(declaration)
    || !/\b(?:subject before verb|subject \+ verb|word order)\b/u.test(declaration)) {
    return [];
  }

  const anchorPattern = /\b(where|when|why|how|what|who)\s+(he|she|it|they|we|you|i)\s+(is|are|was|were|can|could|will|would|has|have|does|do|did)\b/giu;
  const matches = [...entry.englishText.matchAll(anchorPattern)];
  if (matches.length !== 1 || matches[0].index === undefined) return [];
  const [from, questionWord, subject, verb] = matches[0];
  const alternateVerb = otherMember([...agreementPairs, ...tensePairs], verb.toLowerCase())
    ?? (verb.toLowerCase() === "does" ? "do" : "does");
  const replacements = [
    `${questionWord} ${verb} ${subject}`,
    `${questionWord} ${alternateVerb} ${subject}`,
    `${questionWord} ${subject} ${alternateVerb}`
  ];

  return replacements.map((to) => replaceUnique(
    entry.englishText,
    from,
    to,
    "indirect_question_order",
    "indirect_question_order",
    `The declared indirect-question order is "${from}".`
  )).filter((mutation): mutation is WctMutationEvidence => mutation !== null);
}

export function enumerateSentenceMutations(
  entry: WctStandardSourceEntry
): WctMutationEvidence[] {
  if (hasDeclaredEquivalent(entry)) return [];

  const mutations = [
    ...indirectQuestionMutations(entry),
    ...conditionalMutations(entry),
    ...modalPresenceMutations(entry),
    ...pairMutations(entry, agreementPairs, "agreement", /\bagreement\b|\bwith (?:he|she|it)\b/u),
    ...pairMutations(entry, tensePairs, "tense", /\btense\b|\bpast\b|\bfuture\b/u),
    ...modalMutations(entry)
  ];
  const unique = new Map<string, WctMutationEvidence>();
  for (const mutation of mutations) {
    const key = normalizeWctIdentity(mutation.text);
    if (!unique.has(key)) unique.set(key, mutation);
  }
  return [...unique.values()];
}

export function enumerateBlankCandidates(
  entry: WctStandardSourceEntry
): WctBlankCandidate[] {
  const mutations = enumerateSentenceMutations(entry);
  const grouped = new Map<string, WctMutationEvidence[]>();
  for (const mutation of mutations) {
    const key = [
      mutation.ruleFamily,
      mutation.start,
      mutation.end,
      normalizeWctIdentity(mutation.changedFrom)
    ].join(":");
    const group = grouped.get(key) ?? [];
    group.push(mutation);
    grouped.set(key, group);
  }

  const blanks: WctBlankCandidate[] = [];
  for (const group of grouped.values()) {
    if (group.length < 3) continue;
    const distractors = group.slice(0, 3);
    const anchor = distractors[0];
    const reconstruct = (choiceText: string) => (
      `${entry.englishText.slice(0, anchor.start)}${choiceText}${entry.englishText.slice(anchor.end)}`
    );
    const choices: WctBlankCandidate["choices"] = [{
      text: anchor.changedFrom,
      category: anchor.ruleFamily,
      role: "correct"
    }, ...distractors.map((mutation) => ({
      text: mutation.changedTo,
      category: anchor.ruleFamily,
      role: "distractor" as const,
      mutation
    }))];
    if (new Set(choices.map((choice) => normalizeWctIdentity(choice.text))).size !== 4) {
      continue;
    }
    blanks.push({
      promptSentence: `${entry.englishText.slice(0, anchor.start)}____${entry.englishText.slice(anchor.end)}`,
      correctText: anchor.changedFrom,
      choices,
      reconstruct
    });
  }
  return blanks;
}
