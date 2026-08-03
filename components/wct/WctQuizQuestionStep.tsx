import type { WctQuizChoice, WctQuizQuestion } from "@/lib/wct/quiz/types";

export function WctQuizQuestionStep({
  question,
  selectedChoiceId,
  isAnswerConfirmed,
  onSelectChoice,
  onConfirm,
  confirmDisabled,
  nextLabel,
  onNext,
  nextDisabled = false
}: {
  question: WctQuizQuestion;
  selectedChoiceId: string | null;
  isAnswerConfirmed: boolean;
  onSelectChoice: (choiceId: string) => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  const selectedIsCorrect = selectedChoiceId === question.correctChoiceId;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h1 className="text-2xl font-black leading-9 tracking-[-0.03em] text-ink">
        {question.prompt}
      </h1>
      <div className="mt-6 grid gap-3">
        {question.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            aria-pressed={!isAnswerConfirmed && choice.id === selectedChoiceId}
            aria-label={choiceLabel(choice, selectedChoiceId, question.correctChoiceId, isAnswerConfirmed)}
            onClick={() => onSelectChoice(choice.id)}
            disabled={isAnswerConfirmed}
            className={choiceClassName(choice.id, selectedChoiceId, question.correctChoiceId, isAnswerConfirmed)}
          >
            {choice.text}
          </button>
        ))}
      </div>
      {isAnswerConfirmed && selectedChoiceId ? (
        <div
          aria-live="polite"
          className={`mt-6 rounded-2xl p-4 ${selectedIsCorrect ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-900"}`}
        >
          <p className="font-black">{selectedIsCorrect ? "정답이에요" : "아쉬워요. 정답을 확인해 보세요."}</p>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.16em]">해설</p>
          <p className="mt-2 text-sm font-medium leading-6">{question.explanation}</p>
        </div>
      ) : null}
      {isAnswerConfirmed ? (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="mt-6 w-full rounded-2xl bg-teal-700 px-5 py-3 font-black text-white disabled:opacity-50"
        >
          {nextLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className="mt-6 w-full rounded-2xl bg-teal-700 px-5 py-3 font-black text-white disabled:opacity-50"
        >
          정답 확인
        </button>
      )}
    </div>
  );
}

function choiceLabel(choice: WctQuizChoice, selectedChoiceId: string | null, correctChoiceId: string, isAnswerConfirmed: boolean) {
  if (!selectedChoiceId || !isAnswerConfirmed) return choice.text;
  if (choice.id === correctChoiceId) return `${choice.text}, 정답`;
  if (choice.id === selectedChoiceId) return `${choice.text}, 오답`;
  return choice.text;
}

function choiceClassName(choiceId: string, selectedChoiceId: string | null, correctChoiceId: string, isAnswerConfirmed: boolean) {
  const base = "w-full rounded-2xl border px-4 py-4 text-left font-bold transition disabled:cursor-default";
  if (!isAnswerConfirmed) {
    if (choiceId === selectedChoiceId) return `${base} border-teal-500 bg-teal-50 text-teal-900`;
    return `${base} border-slate-200 bg-white text-ink hover:border-teal-300 hover:bg-teal-50`;
  }
  if (choiceId === correctChoiceId) return `${base} border-teal-500 bg-teal-50 text-teal-900`;
  if (choiceId === selectedChoiceId) return `${base} border-rose-300 bg-rose-50 text-rose-800`;
  return `${base} border-slate-200 bg-slate-50 text-slate-400`;
}
