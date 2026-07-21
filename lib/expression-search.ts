import type { ExpressionCard, ExpressionDay } from "@/lib/types";

type SearchableExpression = Pick<ExpressionCard, "english" | "korean_prompt" | "examples">;

export function expressionMatchesQuery(expression: SearchableExpression, rawQuery: string) {
  const query = normalizeSearchText(rawQuery);
  if (!query) return true;

  const searchableText = [
    expression.english,
    expression.korean_prompt,
    ...expression.examples.flatMap((example) => [example.example_text, example.meaning_ko])
  ];

  return searchableText.some((value) => value && normalizeSearchText(value).includes(query));
}

export function filterExpressionDaysByQuery(days: ExpressionDay[], rawQuery: string) {
  return days.flatMap((day) => {
    const expressions = day.expressions.filter((expression) => expressionMatchesQuery(expression, rawQuery));
    return expressions.length > 0 ? [{ ...day, expressions }] : [];
  });
}

function normalizeSearchText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
