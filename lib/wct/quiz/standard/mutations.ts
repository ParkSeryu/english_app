import { normalizeWctIdentity } from "../../normalization.ts";
import type {
  WctBlankCandidate,
  WctMutationEvidence,
  WctStandardSourceEntry
} from "./types.ts";

const agreementPairs = [["do", "does"], ["is", "are"], ["was", "were"], ["has", "have"]] as const;
const tensePairs = [["do", "did"], ["is", "was"], ["are", "were"], ["will", "would"], ["can", "could"]] as const;
const modalChoices = [
  "can", "could", "will", "would", "should", "might", "may", "must"
] as const;
const auxiliaryAlternatives = new Map<string, readonly string[]>([
  ["do", ["don't", "doesn't", "didn't"]],
  ["does", ["doesn't", "don't", "didn't"]],
  ["did", ["didn't", "don't", "doesn't"]],
  ["don't", ["do", "does", "did"]],
  ["doesn't", ["does", "do", "did"]],
  ["didn't", ["did", "do", "does"]],
  ["am", ["isn't", "aren't", "wasn't"]],
  ["is", ["isn't", "aren't", "wasn't"]],
  ["are", ["aren't", "isn't", "weren't"]],
  ["was", ["wasn't", "weren't", "isn't"]],
  ["were", ["weren't", "wasn't", "aren't"]],
  ["isn't", ["is", "are", "was"]],
  ["aren't", ["are", "is", "were"]],
  ["wasn't", ["was", "were", "is"]],
  ["weren't", ["were", "was", "are"]],
  ["have", ["haven't", "hasn't", "hadn't"]],
  ["has", ["hasn't", "haven't", "hadn't"]],
  ["had", ["hadn't", "haven't", "hasn't"]],
  ["haven't", ["have", "has", "had"]],
  ["hasn't", ["has", "have", "had"]],
  ["hadn't", ["had", "have", "has"]]
]);
const auxiliaryFamilies = [
  ["do", "does", "did", "don't", "doesn't", "didn't"],
  ["am", "is", "are", "was", "were", "isn't", "aren't", "wasn't", "weren't"],
  ["have", "has", "had", "haven't", "hasn't", "hadn't"]
] as const;
const verbParadigms = [
  ["be", "am", "is", "are", "was", "were", "been", "being"],
  ["do", "does", "did", "done", "doing"],
  ["go", "goes", "went", "gone", "going"],
  ["run", "runs", "ran", "running"],
  ["drink", "drinks", "drank", "drunk", "drinking"],
  ["choose", "chooses", "chose", "chosen", "choosing"],
  ["meet", "meets", "met", "meeting"],
  ["fight", "fights", "fought", "fighting"],
  ["make", "makes", "made", "making"],
  ["bite", "bites", "bit", "bitten", "biting"],
  ["lie", "lies", "lied", "lying"],
  ["write", "writes", "wrote", "written", "writing"],
  ["read", "reads", "reading"],
  ["speak", "speaks", "spoke", "spoken", "speaking"],
  ["hear", "hears", "heard", "hearing"],
  ["see", "sees", "saw", "seen", "seeing"],
  ["come", "comes", "came", "coming"],
  ["take", "takes", "took", "taken", "taking"],
  ["buy", "buys", "bought", "buying"],
  ["get", "gets", "got", "getting"],
  ["have", "has", "had", "having"],
  ["like", "likes", "liked", "liking"],
  ["love", "loves", "loved", "loving"],
  ["want", "wants", "wanted", "wanting"],
  ["disappear", "disappears", "disappeared", "disappearing"],
  ["finish", "finishes", "finished", "finishing"],
  ["study", "studies", "studied", "studying"],
  ["work", "works", "worked", "working"],
  ["practice", "practices", "practiced", "practicing"],
  ["wash", "washes", "washed", "washing"],
  ["follow", "follows", "followed", "following"],
  ["learn", "learns", "learned", "learning"],
  ["wait", "waits", "waited", "waiting"],
  ["play", "plays", "played", "playing"],
  ["drive", "drives", "drove", "driven", "driving"],
  ["use", "uses", "used", "using"],
  ["help", "helps", "helped", "helping"],
  ["touch", "touches", "touched", "touching"],
  ["talk", "talks", "talked", "talking"],
  ["call", "calls", "called", "calling"],
  ["think", "thinks", "thought", "thinking"],
  ["walk", "walks", "walked", "walking"],
  ["pay", "pays", "paid", "paying"],
  ["eat", "eats", "ate", "eaten", "eating"],
  ["vote", "votes", "voted", "voting"],
  ["shop", "shops", "shopped", "shopping"],
  ["submit", "submits", "submitted", "submitting"],
  ["live", "lives", "lived", "living"],
  ["draw", "draws", "drew", "drawn", "drawing"],
  ["move", "moves", "moved", "moving"],
  ["invent", "invents", "invented", "inventing"],
  ["date", "dates", "dated", "dating"],
  ["win", "wins", "won", "winning"],
  ["stop", "stops", "stopped", "stopping"],
  ["enjoy", "enjoys", "enjoyed", "enjoying"],
  ["avoid", "avoids", "avoided", "avoiding"],
  ["keep", "keeps", "kept", "keeping"],
  ["snore", "snores", "snored", "snoring"],
  ["happen", "happens", "happened", "happening"],
  ["sing", "sings", "sang", "sung", "singing"],
  ["sleep", "sleeps", "slept", "sleeping"],
  ["cook", "cooks", "cooked", "cooking"],
  ["bore", "bores", "bored", "boring"],
  ["depress", "depresses", "depressed", "depressing"],
  ["tire", "tires", "tired", "tiring"],
  ["frustrate", "frustrates", "frustrated", "frustrating"],
  ["prepare", "prepares", "prepared", "preparing"],
  ["visit", "visits", "visited", "visiting"],
  ["clean", "cleans", "cleaned", "cleaning"],
  ["catch", "catches", "caught", "catching"],
  ["plan", "plans", "planned", "planning"],
  ["ask", "asks", "asked", "asking"],
  ["water", "waters", "watered", "watering"],
  ["book", "books", "booked", "booking"],
  ["order", "orders", "ordered", "ordering"],
  ["exercise", "exercises", "exercised", "exercising"],
  ["pack", "packs", "packed", "packing"],
  ["check", "checks", "checked", "checking"],
  ["stay", "stays", "stayed", "staying"],
  ["miss", "misses", "missed", "missing"],
  ["leave", "leaves", "left", "leaving"],
  ["start", "starts", "started", "starting"]
] as const;
const lexicalStopWords = new Set([
  "a", "an", "the", "i", "you", "we", "they", "he", "she", "it", "my", "your",
  "his", "her", "our", "their", "this", "that", "these", "those", "and", "or", "not"
]);
const boundedModalQuestionSubjects = new Set([
  "i", "you", "he", "she", "it", "we", "they", "children"
]);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
}

function tokenRegex(value: string) {
  return new RegExp(`(?<![a-z0-9'])${escapeRegex(value)}(?![a-z0-9'])`, "giu");
}

function declaredText(entry: WctStandardSourceEntry) {
  return `${entry.patternText} ${entry.usageNote ?? ""}`;
}

function hasExplicitEquivalent(entry: WctStandardSourceEntry) {
  const normalized = normalizeWctIdentity(declaredText(entry));
  return /\b(?:both|either)\b[^.]{0,48}\b(?:permitted|acceptable|correct|allowed)\b/u
    .test(normalized);
}

function declaredEnglishTokens(entry: WctStandardSourceEntry) {
  return new Set((declaredText(entry).match(/[a-z]+(?:'[a-z]+)?/giu) ?? [])
    .map((token) => token.toLowerCase()));
}

function caseLike(value: string, source: string) {
  return /^[A-Z]/u.test(source)
    ? `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`
    : value;
}

function regularForms(value: string) {
  const lower = value.toLowerCase();
  const paradigm = verbParadigms.find((forms) => forms.includes(lower as never));
  return paradigm ? [...new Set(paradigm)] : [];
}

function mutationsForReplacementSet(
  entry: WctStandardSourceEntry,
  from: string,
  replacements: readonly string[],
  family: string,
  reason: string
) {
  return replacements.map((replacement) => replaceUnique(
    entry.englishText,
    from,
    caseLike(replacement, from),
    family,
    family,
    reason
  )).filter((mutation): mutation is WctMutationEvidence => mutation !== null);
}

function subjectWhVerbMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/\bwho\b[^.]{0,24}\bwhat\b/u.test(declaration) || !/동사/u.test(declaration)) return [];
  const match = entry.englishText.match(/^(?:who|what)\s+([a-z]+)\b/iu);
  if (!match) return [];
  const forms = regularForms(match[1]);
  if (forms.length < 3) return [];
  const sourceForm = match[1].toLowerCase();
  const baseForm = forms[0];
  const thirdPersonForm = forms[1];
  const continuousForm = forms[forms.length - 1];
  if (sourceForm === baseForm || sourceForm === continuousForm) return [];
  const wrongAuxiliary = sourceForm === thirdPersonForm ? "does" : "did";
  return mutationsForReplacementSet(
    entry,
    match[1],
    [baseForm, continuousForm, `${wrongAuxiliary} ${sourceForm}`],
    "subject_wh_verb",
    `의문사가 문장의 주어인 경우 정답은 "${match[1]}"입니다.`
  );
}

function whPhraseMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  const sets = [
    ["What kind of", ["What kind", "Which kind", "What kinds"]],
    ["Whose", ["Who", "Who's", "Whom"]],
    ["How many", ["How much", "Which", "How many of"]],
    ["How long", ["How often", "When", "Why"]],
    ["How far", ["How often", "When", "Why"]],
    ["How tall", ["How old", "How strong", "How flexible"]]
  ] as const;
  for (const [from, replacements] of sets) {
    if (!tokenRegex(from).test(entry.englishText)
      || !tokenRegex(from).test(declaration)) continue;
    return mutationsForReplacementSet(
      entry,
      from,
      replacements,
      "wh_phrase",
      `질문의 초점에 맞는 의문사 표현은 "${from}"입니다.`
    );
  }
  return [];
}

function comparisonMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/(?:비교급|최상급)|\b(?:more|most|faster|fastest|harder|hardest)\b|-(?:er|est)\b/u
    .test(declaration)) return [];
  const sets = [
    ["better", ["good", "best", "more better"]],
    ["more difficult", ["difficult", "most difficult", "less difficult"]],
    ["longest", ["long", "longer", "more long"]],
    ["most interesting", ["interesting", "more interesting", "least interesting"]],
    ["faster", ["fast", "fastest", "more faster"]],
    ["harder", ["hard", "hardest", "more harder"]],
    ["fastest", ["fast", "faster", "most fast"]],
    ["hardest", ["hard", "harder", "most hard"]],
    ["more", ["much", "most", "many"]]
  ] as const;
  for (const [from, replacements] of sets) {
    if (!tokenRegex(from).test(entry.englishText)) continue;
    return mutationsForReplacementSet(
      entry,
      from,
      replacements,
      "comparison",
      `비교 의미에 맞는 형태는 "${from}"입니다.`
    );
  }
  return [];
}

function prepositionCollocationMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  const collocations = [
    ["addicted to", "to", ["for", "with", "by"]],
    ["interested in", "in", ["at", "to", "for"]],
    ["satisfied with", "with", ["to", "of", "at"]],
    ["similar to", "to", ["at", "for", "by"]],
    ["belong to", "to", ["at", "for", "by"]],
    ["deal with", "with", ["to", "at", "of"]],
    ["get rid of", "of", ["to", "at", "with"]],
    ["side of", "of", ["at", "to", "with"]],
    ["middle of", "of", ["at", "to", "with"]]
  ] as const;
  for (const [collocation, from, replacements] of collocations) {
    if (!tokenRegex(collocation).test(declaration)
      || !tokenRegex(from).test(entry.englishText)) continue;
    const mutations = mutationsForReplacementSet(
      entry,
      from,
      replacements,
      "preposition_collocation",
      `"${collocation}" 결합에서는 전치사 "${from}"를 씁니다.`
    );
    if (mutations.length >= 3) return mutations;
  }
  return [];
}

function passiveParticipleMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/\bp\.p\.|수동태/u.test(declaration)) return [];
  const perfect = /\b(?:have|has|haven't|hasn't)\s+([a-z]+)\b/iu.exec(entry.englishText);
  const passive = /\b(?:am|is|are|was|were|be|been|being)\s+([a-z]+)\b/iu.exec(
    entry.englishText
  );
  const isPresentPerfect = /\b(?:have\/?has|has\/?have|have|has)\s*\+\s*p\.p\./u
    .test(declaration);
  const sourceToken = (isPresentPerfect ? perfect?.[1] : passive?.[1]) ?? null;
  if (sourceToken) {
    const forms = regularForms(sourceToken);
    if (forms.length < 4) return [];
    const alternatives = forms.filter((form) => form !== sourceToken.toLowerCase()).slice(0, 3);
    if (alternatives.length < 3) return [];
    const mutations = mutationsForReplacementSet(
      entry,
      sourceToken,
      alternatives,
      isPresentPerfect ? "present_perfect_participle" : "passive_participle",
      isPresentPerfect
        ? `현재완료는 have/has 뒤에 과거분사를 쓰며, 정답은 "${sourceToken}"입니다.`
        : `수동태 문장에서 정답은 과거분사 "${sourceToken}"입니다.`
    );
    if (mutations.length >= 3) return mutations;
  }
  return [];
}

function infinitiveFormMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/\bto\b[^.]{0,24}(?:동사원형|\bbase verb\b)/u.test(declaration)) return [];
  for (const match of entry.englishText.matchAll(/\bto\s+([a-z]+)\b/giu)) {
    const sourceToken = match[1];
    const forms = regularForms(sourceToken);
    if (forms.length < 4) continue;
    const mutations = mutationsForReplacementSet(
      entry,
      sourceToken,
      [forms[1], forms[2], forms[forms.length - 1]],
      "infinitive_form",
      `to 뒤의 정답은 동사원형 "${sourceToken}"입니다.`
    );
    if (mutations.length >= 3) return mutations;
  }
  return [];
}

function modalBaseVerbMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/동사원형|\bbase verb\b/u.test(declaration)
    || !modalChoices.some((modal) => tokenRegex(modal).test(declaration))) return [];
  const modalPattern = /\b(?:can(?:'t)?|could(?:n't)?|will|won't|would(?:n't)?|should(?:n't)?|might|may|must)\b/giu;
  const modalMatches = [...entry.englishText.matchAll(modalPattern)];
  if (modalMatches.length !== 1) return [];
  const modal = modalMatches[0];
  if (!modal || modal.index === undefined) return [];
  const tail = entry.englishText.slice(modal.index + modal[0].length);
  const tailTokens = [...tail.matchAll(/[a-z]+/giu)];
  const firstToken = tailTokens[0]?.[0].toLowerCase();
  if (modal.index === 0 && (!firstToken || !boundedModalQuestionSubjects.has(firstToken))) {
    return [];
  }
  const subjectTokenCount = modal.index === 0 ? 1 : 0;
  const predicateTokens = tailTokens.slice(subjectTokenCount);
  const predicate = predicateTokens[0]?.[0].toLowerCase() === "not"
    ? predicateTokens[1]
    : predicateTokens[0];
  if (!predicate) return [];
  const sourceToken = predicate[0];
  const forms = regularForms(sourceToken);
  if (forms.length < 4 || forms[0] !== sourceToken.toLowerCase()) return [];
  return mutationsForReplacementSet(
    entry,
    sourceToken,
    [forms[1], forms[2], forms[forms.length - 1]],
    "modal_base_form",
    `조동사 "${modal[0]}" 뒤의 정답은 동사원형 "${sourceToken}"입니다.`
  );
}

function patternAnchorFormMutations(entry: WctStandardSourceEntry) {
  const declared = declaredEnglishTokens(entry);
  const grammarTokens = new Set<string>([
    ...auxiliaryAlternatives.keys(),
    ...modalChoices
  ]);
  const sourceTokens = entry.englishText.match(/[a-z]+(?:'[a-z]+)?/giu) ?? [];
  const results: WctMutationEvidence[] = [];
  for (const sourceToken of sourceTokens) {
    const normalized = sourceToken.toLowerCase();
    if (!declared.has(normalized)
      || grammarTokens.has(normalized)
      || lexicalStopWords.has(normalized)
      || (normalized === "left" && /\b(?:left|right) side of\b/u.test(declaredText(entry)))) {
      continue;
    }
    for (const form of regularForms(normalized)) {
      if (form === normalized || declared.has(form)) continue;
      const mutation = replaceUnique(
        entry.englishText,
        sourceToken,
        caseLike(form, sourceToken),
        "pattern_anchor_form",
        "pattern_anchor_form",
        `이 문장에서는 "${sourceToken}" 형태가 맞습니다.`
      );
      if (mutation) results.push(mutation);
    }
  }
  return results;
}

function grammarSlotMutations(entry: WctStandardSourceEntry) {
  if (tokenRegex("not").test(entry.englishText)) return [];
  const declared = declaredEnglishTokens(entry);
  const sourceTokens = entry.englishText.match(/[a-z]+(?:'[a-z]+)?/giu) ?? [];
  const results: WctMutationEvidence[] = [];
  for (const sourceToken of sourceTokens) {
    const normalized = sourceToken.toLowerCase();
    const pool = auxiliaryAlternatives.get(normalized);
    const family = auxiliaryFamilies.find((items) => items.includes(normalized as never));
    if (!pool || (!declared.has(normalized)
      && !family?.some((item) => declared.has(item)))) continue;
    const reason = normalized.includes("n't")
      ? `이 문장은 부정문이므로 긍정형이 아니라 "${sourceToken}" 형태를 씁니다.`
      : `이 문장은 긍정문이므로 부정형이 아니라 "${sourceToken}" 형태를 씁니다.`;
    for (const replacement of pool) {
      const mutation = replaceUnique(
        entry.englishText,
        sourceToken,
        caseLike(replacement, sourceToken),
        "grammar_slot",
        "grammar_slot",
        reason
      );
      if (mutation) results.push(mutation);
    }
  }
  return results;
}

function declaredTenseFormMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/(?:과거|현재형|시제)|\b(?:past|present|tense)\b/u.test(declaration)) return [];
  const isPast = /과거|\bpast\b/u.test(declaration);
  const isPresent = /현재형|\bpresent\b/u.test(declaration);
  if (isPast === isPresent) return [];
  const tokens = [...entry.englishText.matchAll(/[a-z]+/giu)];
  const isIfClause = isPresent
    && /^if\s*\+/u.test(declaration)
    && /^\s*if\b/iu.test(entry.englishText);
  const clauseEnd = isIfClause && entry.englishText.includes(",")
    ? entry.englishText.indexOf(",")
    : entry.englishText.length;
  const subjectIndex = isIfClause ? 1 : 0;
  const subject = tokens[subjectIndex]?.[0].toLowerCase();
  if (!subject) return [];
  const baseFormSubject = ["i", "you", "we", "they"].includes(subject);
  const presentAuxiliaries = new Set(["am", "is", "are", "do", "does", "have", "has"]);
  const pastAuxiliaries = new Set(["was", "were", "did", "had"]);
  const boundedQuestion = entry.englishText.match(
    /^(do|does|did)\s+(i|you|he|she|it|we|they)\s+([a-z]+)\b/iu
  );
  const boundedQuestionMatchesTense = boundedQuestion
    && (isPresent ? /^(?:do|does)$/iu.test(boundedQuestion[1]) : /^did$/iu.test(boundedQuestion[1]));
  const boundedAuxiliary = boundedQuestionMatchesTense ? boundedQuestion![1] : null;
  let sourceToken = boundedQuestionMatchesTense
    && regularForms(boundedQuestion[3])[0] === boundedQuestion[3].toLowerCase()
    ? boundedQuestion[3]
    : null;
  if (!sourceToken) {
    for (const tokenMatch of tokens.slice(subjectIndex + 1)) {
      if (tokenMatch.index === undefined || tokenMatch.index >= clauseEnd) break;
      const token = tokenMatch[0].toLowerCase();
      const forms = regularForms(token);
      const isFinite = isPresent
        ? presentAuxiliaries.has(token)
          || (forms.length >= 3 && token === forms[baseFormSubject ? 0 : 1])
        : pastAuxiliaries.has(token)
          || (forms.length >= 4 && token === forms[2]);
      if (isFinite) {
        sourceToken = tokenMatch[0];
        break;
      }
    }
  }
  if (!sourceToken) return [];
  const normalizedSourceToken = sourceToken.toLowerCase();
  const alternatives = isIfClause && normalizedSourceToken === "is"
    ? ["are", "am", "been"]
    : regularForms(sourceToken)
        .filter((form) => form !== normalizedSourceToken)
        .slice(0, 3);
  if (alternatives.length < 3) return [];
  const reason = isIfClause
    ? normalizedSourceToken === "is"
      ? `일반적인 현재형 if절에서는 단수에 맞는 be동사 형태로 "${sourceToken}"를 씁니다.`
      : `if절의 현재 조건에 맞는 정답은 "${sourceToken}"입니다.`
    : boundedAuxiliary
      ? `조동사 "${boundedAuxiliary}" 뒤에는 동사원형 "${sourceToken}"를 씁니다.`
      : `이 문장의 시제에 맞는 정답은 "${sourceToken}"입니다.`;
  return mutationsForReplacementSet(
    entry,
    sourceToken,
    alternatives,
    "declared_tense_form",
    reason
  );
}

function declaredSuffixFormMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  const suffix = /-ing/u.test(declaration) ? "ing" : /-ed/u.test(declaration) ? "ed" : null;
  if (!suffix || /\b(?:see|hear)\b/u.test(declaration)) return [];
  const predicates = [...entry.englishText.matchAll(
    /\b(?:am|is|are|was|were|be|been)\s+(?:(?:very|so|really|too)\s+)?([a-z]+)\b/giu
  )].filter((match) => match[1].toLowerCase().endsWith(suffix));
  if (predicates.length !== 1) return [];
  const sourceToken = predicates[0][1];
  const alternatives = regularForms(sourceToken)
    .filter((form) => form !== sourceToken.toLowerCase())
    .slice(0, 3);
  if (alternatives.length < 3) return [];
  return mutationsForReplacementSet(
    entry,
    sourceToken,
    alternatives,
    "declared_suffix_form",
    `이 문장의 정답은 "-${suffix}" 형태인 "${sourceToken}"입니다.`
  );
}

function directQuestionOrderMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/\bwh\b/u.test(declaration) || !/주어/u.test(declaration)) return [];
  const match = entry.englishText.match(
    /^(?:why|how|what|where|when)\s+(do|does|did|is|are|was|were|can|could|will|would|should|might|may)\s+(i|you|he|she|it|we|they)\b/iu
  );
  if (!match) return [];
  const auxiliary = match[1];
  const subject = match[2];
  const from = `${auxiliary} ${subject}`;
  const alternatives = auxiliaryAlternatives.get(auxiliary.toLowerCase())?.slice(0, 2) ?? [];
  return [auxiliary.toLowerCase(), ...alternatives].map((alternate) => replaceUnique(
    entry.englishText,
    from,
    `${subject} ${caseLike(alternate, auxiliary)}`,
    "direct_question_order",
    "direct_question_order",
    `Wh- 의문문에서는 "${from}" 어순을 사용합니다.`
  )).filter((mutation): mutation is WctMutationEvidence => mutation !== null);
}

function whQuestionSemanticMutations(entry: WctStandardSourceEntry) {
  const declaration = normalizeWctIdentity(declaredText(entry));
  if (!/\bwh\b/u.test(declaration)) return [];
  const match = entry.englishText.match(
    /^(why|how|what|where|when)\s+(do|does|did|is|are|was|were|can|could|will|would|should|might|may)\s+(i|you|he|she|it|we|they)\s+([a-z]+)\b/iu
  );
  if (!match) return [];
  const questionWord = match[1];
  const auxiliary = match[2];
  const subject = match[3];
  const verb = match[4];
  const questionWords = ["why", "when", "where", "how"]
    .filter((item) => item !== questionWord.toLowerCase())
    .slice(0, 3);
  const subjectPools: Record<string, readonly string[]> = {
    i: ["you", "we", "they"],
    you: ["we", "they", "your friends"],
    he: ["she", "it", "my friend"],
    she: ["he", "it", "my friend"],
    it: ["he", "she", "this"],
    we: ["you", "they", "my friends"],
    they: ["you", "we", "my friends"]
  };
  const normalizedAuxiliary = auxiliary.toLowerCase();
  const auxiliaryPool = ["do", "does", "did"].includes(normalizedAuxiliary)
    ? [
        normalizedAuxiliary === "did"
          ? ["he", "she", "it"].includes(subject.toLowerCase()) ? "does" : "do"
          : "did",
        "can",
        "will"
      ]
    : [];
  const verbPool = ["do", "does", "did"].includes(normalizedAuxiliary)
    ? regularForms(verb).filter((form) => form !== verb.toLowerCase()).slice(0, 3)
    : [];
  return [
    ...mutationsForReplacementSet(
      entry,
      questionWord,
      questionWords,
      "wh_question_word",
      `제시된 뜻에서 의문사는 "${questionWord}"입니다.`
    ),
    ...mutationsForReplacementSet(
      entry,
      subject,
      subjectPools[subject.toLowerCase()] ?? [],
      "wh_question_subject",
      `제시된 뜻에서 주어는 "${subject}"입니다.`
    ),
    ...mutationsForReplacementSet(
      entry,
      auxiliary,
      auxiliaryPool,
      "wh_auxiliary_form",
      `제시된 뜻과 시제에 맞는 조동사는 "${auxiliary}"입니다.`
    ),
    ...mutationsForReplacementSet(
      entry,
      verb,
      verbPool,
      "wh_base_verb",
      `조동사 "${auxiliary}" 뒤의 정답은 동사원형 "${verb}"입니다.`
    )
  ];
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
  if (matches.length !== 1
    || (!within && allMatches.length !== 1)
    || matches[0].index === undefined) {
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
    reason: `동사원형 앞에 필요한 조동사는 "${match[0].trim()}"입니다.`
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
        family === "agreement"
          ? `주어에 맞는 동사 형태는 "${from}"입니다.`
          : `이 문장의 시제에는 "${from}" 형태가 맞습니다.`
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
        `if절에는 "${from}" 형태를 사용합니다.`,
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
    `간접의문문에서는 "${from}" 어순을 사용합니다.`
  )).filter((mutation): mutation is WctMutationEvidence => mutation !== null);
}

export function enumerateSentenceMutations(
  entry: WctStandardSourceEntry
): WctMutationEvidence[] {
  if (hasExplicitEquivalent(entry)) return [];

  const mutations = [
    ...indirectQuestionMutations(entry),
    ...whQuestionSemanticMutations(entry),
    ...directQuestionOrderMutations(entry),
    ...subjectWhVerbMutations(entry),
    ...whPhraseMutations(entry),
    ...comparisonMutations(entry),
    ...prepositionCollocationMutations(entry),
    ...passiveParticipleMutations(entry),
    ...infinitiveFormMutations(entry),
    ...modalBaseVerbMutations(entry),
    ...conditionalMutations(entry),
    ...modalPresenceMutations(entry),
    ...pairMutations(entry, agreementPairs, "agreement", /\bagreement\b|\bwith (?:he|she|it)\b/u),
    ...pairMutations(entry, tensePairs, "tense", /\btense\b|\bpast\b|\bfuture\b/u),
    ...grammarSlotMutations(entry),
    ...patternAnchorFormMutations(entry),
    ...declaredTenseFormMutations(entry),
    ...declaredSuffixFormMutations(entry)
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
