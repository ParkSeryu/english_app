import {
  buildFillBlankCandidates,
  buildMultipleChoiceCandidates
} from "./candidates.ts";
import type {
  WctStandardQuestionCandidate,
  WctStandardQuizSource
} from "./types.ts";

type TruthState = "O" | "X";

export function standardLearningTargetKey(candidate: WctStandardQuestionCandidate) {
  const mutation = candidate.provenance.statementMutation
    ?? candidate.provenance.choiceEvidence.find((evidence) => evidence.mutation)?.mutation;
  const target = mutation
    ? [
        mutation.ruleFamily,
        String(mutation.start),
        String(mutation.end),
        mutation.changedFrom
      ]
    : ["verbatim_source", candidate.provenance.sourceSentence];
  return [
    candidate.provenance.patternId,
    candidate.provenance.exampleId,
    ...target
  ].join("\0");
}

export function hasUniqueStandardLearningTargets(
  candidates: readonly WctStandardQuestionCandidate[]
) {
  const keys = candidates.map(standardLearningTargetKey);
  return new Set(keys).size === keys.length;
}

export function eligibleStandardExampleIds(
  source: WctStandardQuizSource,
  _state: TruthState
) {
  return new Set(source.entries.flatMap((entry) => {
    const eligible = (["translation", "pattern"] as const).some((kind) => (
      buildMultipleChoiceCandidates(entry, kind).length > 0
      || buildFillBlankCandidates(entry, kind).length > 0
    ));
    return eligible ? [entry.exampleId] : [];
  }));
}

export function hasBalancedStandardSourceUsage(
  source: WctStandardQuizSource,
  candidates: readonly WctStandardQuestionCandidate[],
  state: TruthState,
  eligibleInput?: ReadonlySet<string>
) {
  const eligible = new Set(eligibleInput ?? eligibleStandardExampleIds(source, state));
  for (const candidate of candidates) eligible.add(candidate.provenance.exampleId);
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    if (!eligible.has(candidate.provenance.exampleId)) return false;
    counts.set(
      candidate.provenance.exampleId,
      (counts.get(candidate.provenance.exampleId) ?? 0) + 1
    );
  }
  if (eligible.size >= candidates.length) {
    if (counts.size !== candidates.length) return false;
  } else {
    if (counts.size !== eligible.size) return false;
    const usage = [...counts.values()];
    if (Math.max(...usage) - Math.min(...usage) > 1) return false;
  }
  const eligiblePatterns = new Set(source.entries
    .filter((entry) => eligible.has(entry.exampleId))
    .map((entry) => entry.patternId));
  const selectedPatterns = new Set(candidates.map((candidate) => (
    candidate.provenance.patternId
  )));
  return selectedPatterns.size === Math.min(eligiblePatterns.size, candidates.length)
    && [...selectedPatterns].every((patternId) => eligiblePatterns.has(patternId));
}
