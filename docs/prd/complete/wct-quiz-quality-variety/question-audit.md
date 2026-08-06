# WCT v2 question audit

- project: main/production ccawzrrkxuirrwvaecvw
- generator: wct-review-v2
- books/days/questions: 2/44/220
- source correction manifest hash: 62ac2ffd9e911bf05c29b9ed0fd3daa2a661c0211e39567e4c617592a8983b3b
- pre-correction source inventory hash: cc5d1f5cc1f6979947a3507e98fa9655df91bffbf4cb32f66923fe1bebc985ac
- post-correction source inventory hash: 5dea55cb64177e6f02d3d34e89237700bec8a0e787ed99a9899696370dc2d682
- question artifact hash: 9c1e2cfbfddef63eb168cc6a217080f40980cf11111fb85fba19fc42820a69b6
- Premium-set snapshot hash: 369f629146db3a94ed2866756c7311bc348d849ef9f20f9c9638912e23baf1b6
- machine failures: 0

## 1. prenovice Day 1 · slot 1

- topic: 인칭대명사·3인칭
- format/kind: true_false / pattern
- source: Do you like sports?
- pattern: Do/Does + 주어 + like ...?
- prompt: "Do/Does + 주어 + like ...?" 패턴을 사용해 "스포츠를 좋아하나요?"에 맞는 문장이면 O, 아니면 X를 고르세요: "Do you like sports?"
- correct answer: O
- explanation: "Do you like sports?"는 주어 "you" 앞에 "Do"를 두고 뒤에 동사원형 "like"를 써서 묻는 현재형 의문문이므로 맞습니다.
- feedback reason: "Do you like sports?"는 주어 "you" 앞에 "Do"를 두고 뒤에 동사원형 "like"를 써서 묻는 현재형 의문문이므로 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 2. prenovice Day 1 · slot 2

- topic: 인칭대명사·3인칭
- format/kind: multiple_choice / translation
- source: He likes her.
- pattern: He/She + likes + 목적어
- prompt: "그는 그녀를 좋아한다."에 맞는 영어 문장을 고르세요.
- correct answer: He likes her.
- explanation: 이 문장에서는 "likes" 형태가 맞습니다.
- feedback reason: 이 문장에서는 "likes" 형태가 맞습니다.

Choices:
- [distractor] He liking her.
- [distractor] He liked her.
- [correct] He likes her.
- [distractor] He like her.

Mutation evidence:
- fixed_expression/fixed_expression: `likes` → `liking` — 이 문장에서는 "likes" 형태가 맞습니다.
- fixed_expression/fixed_expression: `likes` → `liked` — 이 문장에서는 "likes" 형태가 맞습니다.
- fixed_expression/fixed_expression: `likes` → `like` — 이 문장에서는 "likes" 형태가 맞습니다.

---

## 3. prenovice Day 1 · slot 3

- topic: 인칭대명사·3인칭
- format/kind: fill_blank / translation
- source: They like her.
- pattern: I/You/We/They + like + 목적어
- prompt: "그들은 그녀를 좋아한다."에 맞게 빈칸을 채우세요: They ____ her.
- correct answer: like
- explanation: 이 문장에서는 "like" 형태가 맞습니다.
- feedback reason: 이 문장에서는 "like" 형태가 맞습니다.

Choices:
- [correct] like
- [distractor] liked
- [distractor] likes
- [distractor] liking

Mutation evidence:
- fixed_expression/fixed_expression: `like` → `liked` — 이 문장에서는 "like" 형태가 맞습니다.
- fixed_expression/fixed_expression: `like` → `likes` — 이 문장에서는 "like" 형태가 맞습니다.
- fixed_expression/fixed_expression: `like` → `liking` — 이 문장에서는 "like" 형태가 맞습니다.

---

## 4. prenovice Day 1 · slot 4

- topic: 인칭대명사·3인칭
- format/kind: multiple_choice / translation
- source: My friend likes you.
- pattern: He/She + likes + 목적어
- prompt: "내 친구는 너를 좋아한다."에 맞는 영어 문장을 고르세요.
- correct answer: My friend likes you.
- explanation: 한국어의 목적어가 "너"이므로 목적격 대명사 "you"를 써야 합니다. 정답 표현은 "you"입니다.
- feedback reason: 한국어의 목적어가 "너"이므로 목적격 대명사 "you"를 써야 합니다. 정답 표현은 "you"입니다.

Choices:
- [correct] My friend likes you.
- [distractor] My friend likes her.
- [distractor] My friend likes him.
- [distractor] My friend likes us.

Mutation evidence:
- fixed_expression/fixed_expression: `you` → `her` — 한국어의 목적어가 "너"이므로 목적격 대명사 "you"를 써야 합니다. 정답 표현은 "you"입니다.
- fixed_expression/fixed_expression: `you` → `him` — 한국어의 목적어가 "너"이므로 목적격 대명사 "you"를 써야 합니다. 정답 표현은 "you"입니다.
- fixed_expression/fixed_expression: `you` → `us` — 한국어의 목적어가 "너"이므로 목적격 대명사 "you"를 써야 합니다. 정답 표현은 "you"입니다.

---

## 5. prenovice Day 1 · slot 5

- topic: 인칭대명사·3인칭
- format/kind: fill_blank / pattern
- source: Does she like sports?
- pattern: Do/Does + 주어 + like ...?
- prompt: "Do/Does + 주어 + like ...?" 패턴을 사용해 "그녀는 스포츠를 좋아하나요?"에 맞게 빈칸을 채우세요: ____ she like sports?
- correct answer: Does
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "Does" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "Does" 형태를 씁니다.

Choices:
- [correct] Does
- [distractor] Doesn't
- [distractor] Didn't
- [distractor] Don't

Mutation evidence:
- fixed_expression/fixed_expression: `Does` → `Doesn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Does" 형태를 씁니다.
- fixed_expression/fixed_expression: `Does` → `Didn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Does" 형태를 씁니다.
- fixed_expression/fixed_expression: `Does` → `Don't` — 이 문장은 긍정문이므로 부정형이 아니라 "Does" 형태를 씁니다.

---

## 6. prenovice Day 2 · slot 1

- topic: 부정문·의문문
- format/kind: multiple_choice / translation
- source: She doesn't hang out.
- pattern: 주어 + don't/doesn't + 동사원형
- prompt: "그녀는 놀러 다니지 않는다."에 맞는 영어 문장을 고르세요.
- correct answer: She doesn't hang out.
- explanation: 이 문장은 부정문이므로 긍정형이 아니라 "doesn't" 형태를 씁니다.
- feedback reason: 이 문장은 부정문이므로 긍정형이 아니라 "doesn't" 형태를 씁니다.

Choices:
- [distractor] She did hang out.
- [distractor] She does hang out.
- [correct] She doesn't hang out.
- [distractor] She do hang out.

Mutation evidence:
- grammar_slot/grammar_slot: `doesn't` → `did` — 이 문장은 부정문이므로 긍정형이 아니라 "doesn't" 형태를 씁니다.
- grammar_slot/grammar_slot: `doesn't` → `does` — 이 문장은 부정문이므로 긍정형이 아니라 "doesn't" 형태를 씁니다.
- grammar_slot/grammar_slot: `doesn't` → `do` — 이 문장은 부정문이므로 긍정형이 아니라 "doesn't" 형태를 씁니다.

---

## 7. prenovice Day 2 · slot 2

- topic: 부정문·의문문
- format/kind: fill_blank / pattern
- source: I don't sleep.
- pattern: 주어 + don't/doesn't + 동사원형
- prompt: "주어 + don't/doesn't + 동사원형" 패턴을 사용해 "나는 잠을 자지 않는다."에 맞게 빈칸을 채우세요: I ____ sleep.
- correct answer: don't
- explanation: 이 문장은 부정문이므로 긍정형이 아니라 "don't" 형태를 씁니다.
- feedback reason: 이 문장은 부정문이므로 긍정형이 아니라 "don't" 형태를 씁니다.

Choices:
- [correct] don't
- [distractor] did
- [distractor] does
- [distractor] do

Mutation evidence:
- grammar_slot/grammar_slot: `don't` → `did` — 이 문장은 부정문이므로 긍정형이 아니라 "don't" 형태를 씁니다.
- grammar_slot/grammar_slot: `don't` → `does` — 이 문장은 부정문이므로 긍정형이 아니라 "don't" 형태를 씁니다.
- grammar_slot/grammar_slot: `don't` → `do` — 이 문장은 부정문이므로 긍정형이 아니라 "don't" 형태를 씁니다.

---

## 8. prenovice Day 2 · slot 3

- topic: 부정문·의문문
- format/kind: multiple_choice / pattern
- source: Do you study?
- pattern: Do/Does + 주어 + 동사원형?
- prompt: "Do/Does + 주어 + 동사원형?" 패턴을 사용해 "공부하나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Do you study?
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "Do" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "Do" 형태를 씁니다.

Choices:
- [correct] Do you study?
- [distractor] Don't you study?
- [distractor] Doesn't you study?
- [distractor] Didn't you study?

Mutation evidence:
- grammar_slot/grammar_slot: `Do` → `Don't` — 이 문장은 긍정문이므로 부정형이 아니라 "Do" 형태를 씁니다.
- grammar_slot/grammar_slot: `Do` → `Doesn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Do" 형태를 씁니다.
- grammar_slot/grammar_slot: `Do` → `Didn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Do" 형태를 씁니다.

---

## 9. prenovice Day 2 · slot 4

- topic: 부정문·의문문
- format/kind: fill_blank / translation
- source: Does she go shopping?
- pattern: Do/Does + 주어 + 동사원형?
- prompt: "그녀는 쇼핑하러 가나요?"에 맞게 빈칸을 채우세요: ____ she go shopping?
- correct answer: Does
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "Does" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "Does" 형태를 씁니다.

Choices:
- [distractor] Doesn't
- [distractor] Don't
- [distractor] Didn't
- [correct] Does

Mutation evidence:
- grammar_slot/grammar_slot: `Does` → `Doesn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Does" 형태를 씁니다.
- grammar_slot/grammar_slot: `Does` → `Don't` — 이 문장은 긍정문이므로 부정형이 아니라 "Does" 형태를 씁니다.
- grammar_slot/grammar_slot: `Does` → `Didn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Does" 형태를 씁니다.

---

## 10. prenovice Day 2 · slot 5

- topic: 부정문·의문문
- format/kind: true_false / translation
- source: Is it important?
- pattern: 주어 + am/is/are not ... / Am/Is/Are + 주어 ...?
- prompt: "그것은 중요한가요?"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "Is it important?"
- correct answer: O
- explanation: "Is it important?"는 be동사 "Is"를 주어 "it" 앞에 둔 현재형 의문문이므로 맞습니다.
- feedback reason: "Is it important?"는 be동사 "Is"를 주어 "it" 앞에 둔 현재형 의문문이므로 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 11. prenovice Day 3 · slot 1

- topic: want·want to
- format/kind: multiple_choice / translation
- source: I want an apple.
- pattern: want + 명사
- prompt: "나는 사과 하나를 원한다."에 맞는 영어 문장을 고르세요.
- correct answer: I want an apple.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "an apple"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "an apple"입니다.

Choices:
- [distractor] I want some water.
- [distractor] I want a banana.
- [correct] I want an apple.
- [distractor] I want a sandwich.

Mutation evidence:
- fixed_expression/fixed_expression: `an apple` → `some water` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "an apple"입니다.
- fixed_expression/fixed_expression: `an apple` → `a banana` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "an apple"입니다.
- fixed_expression/fixed_expression: `an apple` → `a sandwich` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "an apple"입니다.

---

## 12. prenovice Day 3 · slot 2

- topic: want·want to
- format/kind: fill_blank / pattern
- source: I want to go home.
- pattern: want to + 동사원형
- prompt: "want to + 동사원형" 패턴을 사용해 "나는 집에 가고 싶다."에 맞게 빈칸을 채우세요: I ____.
- correct answer: want to go home
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "want to go home"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "want to go home"입니다.

Choices:
- [distractor] want to watch TV
- [distractor] want to eat lunch
- [distractor] want to take a walk
- [correct] want to go home

Mutation evidence:
- fixed_expression/fixed_expression: `want to go home` → `want to watch TV` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "want to go home"입니다.
- fixed_expression/fixed_expression: `want to go home` → `want to eat lunch` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "want to go home"입니다.
- fixed_expression/fixed_expression: `want to go home` → `want to take a walk` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "want to go home"입니다.

---

## 13. prenovice Day 3 · slot 3

- topic: want·want to
- format/kind: multiple_choice / pattern
- source: I want a glass of beer.
- pattern: want + 명사
- prompt: "want + 명사" 패턴을 사용해 "나는 맥주 한 잔을 원한다."에 맞는 영어 문장을 고르세요.
- correct answer: I want a glass of beer.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "want a glass of beer"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "want a glass of beer"입니다.

Choices:
- [distractor] I want a cup of coffee.
- [correct] I want a glass of beer.
- [distractor] I want a bottle of juice.
- [distractor] I want a glass of water.

Mutation evidence:
- fixed_expression/fixed_expression: `want a glass of beer` → `want a cup of coffee` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "want a glass of beer"입니다.
- fixed_expression/fixed_expression: `want a glass of beer` → `want a bottle of juice` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "want a glass of beer"입니다.
- fixed_expression/fixed_expression: `want a glass of beer` → `want a glass of water` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "want a glass of beer"입니다.

---

## 14. prenovice Day 3 · slot 4

- topic: want·want to
- format/kind: fill_blank / translation
- source: I want an orange.
- pattern: a/an + 단수 명사
- prompt: "나는 오렌지 하나를 원한다."에 맞게 빈칸을 채우세요: I want ____.
- correct answer: an orange
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "an orange"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "an orange"입니다.

Choices:
- [distractor] an apple
- [distractor] a banana
- [distractor] a cookie
- [correct] an orange

Mutation evidence:
- fixed_expression/fixed_expression: `an orange` → `an apple` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "an orange"입니다.
- fixed_expression/fixed_expression: `an orange` → `a banana` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "an orange"입니다.
- fixed_expression/fixed_expression: `an orange` → `a cookie` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "an orange"입니다.

---

## 15. prenovice Day 3 · slot 5

- topic: want·want to
- format/kind: true_false / translation
- source: I want to listen to you.
- pattern: want to + 동사원형
- prompt: "나는 네 말을 듣고 싶다."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I want to listen to him."
- correct answer: X
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "you"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "you"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `you` → `him` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "you"입니다.

---

## 16. prenovice Day 4 · slot 1

- topic: 일반 과거
- format/kind: multiple_choice / translation
- source: He disappeared.
- pattern: 주어 + 과거동사
- prompt: "그는 사라졌다."에 맞는 영어 문장을 고르세요.
- correct answer: He disappeared.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "He"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "He"입니다.

Choices:
- [correct] He disappeared.
- [distractor] The dog disappeared.
- [distractor] My friend disappeared.
- [distractor] She disappeared.

Mutation evidence:
- fixed_expression/fixed_expression: `He` → `The dog` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "He"입니다.
- fixed_expression/fixed_expression: `He` → `My friend` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "He"입니다.
- fixed_expression/fixed_expression: `He` → `She` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "He"입니다.

---

## 17. prenovice Day 4 · slot 2

- topic: 일반 과거
- format/kind: fill_blank / pattern
- source: They chose.
- pattern: 주어 + 과거동사
- prompt: "주어 + 과거동사" 패턴을 사용해 "그들은 선택했다."에 맞게 빈칸을 채우세요: ____.
- correct answer: They chose
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "They chose"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "They chose"입니다.

Choices:
- [correct] They chose
- [distractor] They left
- [distractor] They waited
- [distractor] They agreed

Mutation evidence:
- fixed_expression/fixed_expression: `They chose` → `They left` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "They chose"입니다.
- fixed_expression/fixed_expression: `They chose` → `They waited` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "They chose"입니다.
- fixed_expression/fixed_expression: `They chose` → `They agreed` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "They chose"입니다.

---

## 18. prenovice Day 4 · slot 3

- topic: 일반 과거
- format/kind: multiple_choice / pattern
- source: I didn't drink.
- pattern: 주어 + didn't + 동사원형 / Did + 주어 + 동사원형?
- prompt: "주어 + didn't + 동사원형 / Did + 주어 + 동사원형?" 패턴을 사용해 "나는 마시지 않았다."에 맞는 영어 문장을 고르세요.
- correct answer: I didn't drink.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "didn't drink"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "didn't drink"입니다.

Choices:
- [distractor] I didn't sleep.
- [distractor] I didn't leave.
- [correct] I didn't drink.
- [distractor] I didn't eat.

Mutation evidence:
- fixed_expression/fixed_expression: `didn't drink` → `didn't sleep` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "didn't drink"입니다.
- fixed_expression/fixed_expression: `didn't drink` → `didn't leave` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "didn't drink"입니다.
- fixed_expression/fixed_expression: `didn't drink` → `didn't eat` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "didn't drink"입니다.

---

## 19. prenovice Day 4 · slot 4

- topic: 일반 과거
- format/kind: fill_blank / translation
- source: We weren't close.
- pattern: 주어 + was/were ... / Was/Were + 주어 ...?
- prompt: "우리는 가깝지 않았다."에 맞게 빈칸을 채우세요: We weren't ____.
- correct answer: close
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "close"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "close"입니다.

Choices:
- [correct] close
- [distractor] ready
- [distractor] tired
- [distractor] happy

Mutation evidence:
- fixed_expression/fixed_expression: `close` → `ready` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "close"입니다.
- fixed_expression/fixed_expression: `close` → `tired` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "close"입니다.
- fixed_expression/fixed_expression: `close` → `happy` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "close"입니다.

---

## 20. prenovice Day 4 · slot 5

- topic: 일반 과거
- format/kind: true_false / translation
- source: Wasn't it fun?
- pattern: 주어 + was/were ... / Was/Were + 주어 ...?
- prompt: "재미있지 않았나요?"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "Wasn't it difficult?"
- correct answer: X
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "fun"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "fun"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `fun` → `difficult` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "fun"입니다.

---

## 21. prenovice Day 5 · slot 1

- topic: 과거형 응용
- format/kind: multiple_choice / translation
- source: We were students.
- pattern: was/were + 명사
- prompt: "우리는 학생이었다."에 맞는 영어 문장을 고르세요.
- correct answer: We were students.
- explanation: 학생들이었다는 뜻에는 해당 명사가 알맞습니다. 정답 표현은 "students"입니다.
- feedback reason: 학생들이었다는 뜻에는 해당 명사가 알맞습니다. 정답 표현은 "students"입니다.

Choices:
- [distractor] We were children.
- [correct] We were students.
- [distractor] We were friends.
- [distractor] We were teachers.

Mutation evidence:
- fixed_expression/fixed_expression: `students` → `children` — 학생들이었다는 뜻에는 해당 명사가 알맞습니다. 정답 표현은 "students"입니다.
- fixed_expression/fixed_expression: `students` → `friends` — 학생들이었다는 뜻에는 해당 명사가 알맞습니다. 정답 표현은 "students"입니다.
- fixed_expression/fixed_expression: `students` → `teachers` — 학생들이었다는 뜻에는 해당 명사가 알맞습니다. 정답 표현은 "students"입니다.

---

## 22. prenovice Day 5 · slot 2

- topic: 과거형 응용
- format/kind: fill_blank / pattern
- source: You were a fool.
- pattern: was/were + 명사
- prompt: "was/were + 명사" 패턴을 사용해 "너는 바보였다."에 맞게 빈칸을 채우세요: You ____ a fool.
- correct answer: were
- explanation: 주어가 "You"인 과거 긍정문에는 과거형 be동사가 필요합니다. 정답 표현은 "were"입니다.
- feedback reason: 주어가 "You"인 과거 긍정문에는 과거형 be동사가 필요합니다. 정답 표현은 "were"입니다.

Choices:
- [distractor] was
- [distractor] are
- [correct] were
- [distractor] weren't

Mutation evidence:
- fixed_expression/fixed_expression: `were` → `was` — 주어가 "You"인 과거 긍정문에는 과거형 be동사가 필요합니다. 정답 표현은 "were"입니다.
- fixed_expression/fixed_expression: `were` → `are` — 주어가 "You"인 과거 긍정문에는 과거형 be동사가 필요합니다. 정답 표현은 "were"입니다.
- fixed_expression/fixed_expression: `were` → `weren't` — 주어가 "You"인 과거 긍정문에는 과거형 be동사가 필요합니다. 정답 표현은 "were"입니다.

---

## 23. prenovice Day 5 · slot 3

- topic: 과거형 응용
- format/kind: true_false / translation
- source: I wanted to be with you.
- pattern: wanted to + 동사원형
- prompt: "나는 너와 함께 있고 싶었다."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I wanted to be with you."
- correct answer: O
- explanation: 제시된 문장은 함께 있고 싶었다는 뜻과 일치합니다. 정답 표현은 "I wanted to be with you."입니다.
- feedback reason: 제시된 문장은 함께 있고 싶었다는 뜻과 일치합니다. 정답 표현은 "I wanted to be with you."입니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 24. prenovice Day 5 · slot 4

- topic: 과거형 응용
- format/kind: multiple_choice / pattern
- source: We were students.
- pattern: was/were + 명사
- prompt: "was/were + 명사" 패턴을 사용해 "우리는 학생이었다."에 맞는 영어 문장을 고르세요.
- correct answer: We were students.
- explanation: "was/were + 명사" 패턴에서 주어 "We"의 긍정 과거 상태는 "We were students."입니다.
- feedback reason: "was/were + 명사" 패턴에서 주어 "We"의 긍정 과거 상태는 "We were students."입니다.

Choices:
- [distractor] We are students.
- [distractor] Were we students?
- [correct] We were students.
- [distractor] We weren't students.

Mutation evidence:
- fixed_expression/fixed_expression: `We were students.` → `We are students.` — "was/were + 명사" 패턴에서 주어 "We"의 긍정 과거 상태는 "We were students."입니다.
- fixed_expression/fixed_expression: `We were students.` → `Were we students?` — "was/were + 명사" 패턴에서 주어 "We"의 긍정 과거 상태는 "We were students."입니다.
- fixed_expression/fixed_expression: `We were students.` → `We weren't students.` — "was/were + 명사" 패턴에서 주어 "We"의 긍정 과거 상태는 "We were students."입니다.

---

## 25. prenovice Day 5 · slot 5

- topic: 과거형 응용
- format/kind: fill_blank / translation
- source: You were a fool.
- pattern: was/were + 명사
- prompt: "너는 바보였다."에 맞게 빈칸을 채우세요: You were ____.
- correct answer: a fool
- explanation: 과거에 바보였다는 뜻에 맞는 명사 표현은 "a fool"입니다. 정답 표현은 "a fool"입니다.
- feedback reason: 과거에 바보였다는 뜻에 맞는 명사 표현은 "a fool"입니다. 정답 표현은 "a fool"입니다.

Choices:
- [distractor] my friend
- [distractor] a student
- [distractor] a teacher
- [correct] a fool

Mutation evidence:
- fixed_expression/fixed_expression: `a fool` → `my friend` — 과거에 바보였다는 뜻에 맞는 명사 표현은 "a fool"입니다. 정답 표현은 "a fool"입니다.
- fixed_expression/fixed_expression: `a fool` → `a student` — 과거에 바보였다는 뜻에 맞는 명사 표현은 "a fool"입니다. 정답 표현은 "a fool"입니다.
- fixed_expression/fixed_expression: `a fool` → `a teacher` — 과거에 바보였다는 뜻에 맞는 명사 표현은 "a fool"입니다. 정답 표현은 "a fool"입니다.

---

## 26. prenovice Day 6 · slot 1

- topic: have·there is
- format/kind: true_false / translation
- source: Do you have a sister?
- pattern: Do/Does + 주어 + have ...?
- prompt: "자매가 있나요?"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "Do you have a sister?"
- correct answer: O
- explanation: "Do you have a sister?"는 주어 "you" 앞에 "Do"를 두고 뒤에 동사원형 "have"를 써서 소유 여부를 물으므로 맞습니다.
- feedback reason: "Do you have a sister?"는 주어 "you" 앞에 "Do"를 두고 뒤에 동사원형 "have"를 써서 소유 여부를 물으므로 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 27. prenovice Day 6 · slot 2

- topic: have·there is
- format/kind: fill_blank / translation
- source: There is a bank.
- pattern: There is + 단수 / There are + 복수
- prompt: "은행이 있다."에 맞게 빈칸을 채우세요: There ____ a bank.
- correct answer: is
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "is" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "is" 형태를 씁니다.

Choices:
- [distractor] wasn't
- [correct] is
- [distractor] isn't
- [distractor] aren't

Mutation evidence:
- fixed_expression/fixed_expression: `is` → `wasn't` — 이 문장은 긍정문이므로 부정형이 아니라 "is" 형태를 씁니다.
- fixed_expression/fixed_expression: `is` → `isn't` — 이 문장은 긍정문이므로 부정형이 아니라 "is" 형태를 씁니다.
- fixed_expression/fixed_expression: `is` → `aren't` — 이 문장은 긍정문이므로 부정형이 아니라 "is" 형태를 씁니다.

---

## 28. prenovice Day 6 · slot 3

- topic: have·there is
- format/kind: multiple_choice / pattern
- source: I have a wallet.
- pattern: have/has + 명사
- prompt: "have/has + 명사" 패턴을 사용해 "나는 지갑이 있다."에 맞는 영어 문장을 고르세요.
- correct answer: I have a wallet.
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "have" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "have" 형태를 씁니다.

Choices:
- [distractor] I hadn't a wallet.
- [distractor] I hasn't a wallet.
- [correct] I have a wallet.
- [distractor] I haven't a wallet.

Mutation evidence:
- fixed_expression/fixed_expression: `have` → `hadn't` — 이 문장은 긍정문이므로 부정형이 아니라 "have" 형태를 씁니다.
- fixed_expression/fixed_expression: `have` → `hasn't` — 이 문장은 긍정문이므로 부정형이 아니라 "have" 형태를 씁니다.
- fixed_expression/fixed_expression: `have` → `haven't` — 이 문장은 긍정문이므로 부정형이 아니라 "have" 형태를 씁니다.

---

## 29. prenovice Day 6 · slot 4

- topic: have·there is
- format/kind: fill_blank / pattern
- source: Do you have cash?
- pattern: Do/Does + 주어 + have ...?
- prompt: "Do/Does + 주어 + have ...?" 패턴을 사용해 "현금이 있나요?"에 맞게 빈칸을 채우세요: ____ you have cash?
- correct answer: Do
- explanation: 현재의 소유 여부를 긍정 의문문으로 물을 때는 주어 "you" 앞에 "Do"를 씁니다. 정답 표현은 "Do"입니다.
- feedback reason: 현재의 소유 여부를 긍정 의문문으로 물을 때는 주어 "you" 앞에 "Do"를 씁니다. 정답 표현은 "Do"입니다.

Choices:
- [distractor] Will
- [correct] Do
- [distractor] Did
- [distractor] Don't

Mutation evidence:
- fixed_expression/fixed_expression: `Do` → `Will` — 현재의 소유 여부를 긍정 의문문으로 물을 때는 주어 "you" 앞에 "Do"를 씁니다. 정답 표현은 "Do"입니다.
- fixed_expression/fixed_expression: `Do` → `Did` — 현재의 소유 여부를 긍정 의문문으로 물을 때는 주어 "you" 앞에 "Do"를 씁니다. 정답 표현은 "Do"입니다.
- fixed_expression/fixed_expression: `Do` → `Don't` — 현재의 소유 여부를 긍정 의문문으로 물을 때는 주어 "you" 앞에 "Do"를 씁니다. 정답 표현은 "Do"입니다.

---

## 30. prenovice Day 6 · slot 5

- topic: have·there is
- format/kind: multiple_choice / translation
- source: Are there coins?
- pattern: There is + 단수 / There are + 복수
- prompt: "동전이 있나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Are there coins?
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "Are" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "Are" 형태를 씁니다.

Choices:
- [distractor] Isn't there coins?
- [distractor] Aren't there coins?
- [distractor] Weren't there coins?
- [correct] Are there coins?

Mutation evidence:
- fixed_expression/fixed_expression: `Are` → `Isn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Are" 형태를 씁니다.
- fixed_expression/fixed_expression: `Are` → `Aren't` — 이 문장은 긍정문이므로 부정형이 아니라 "Are" 형태를 씁니다.
- fixed_expression/fixed_expression: `Are` → `Weren't` — 이 문장은 긍정문이므로 부정형이 아니라 "Are" 형태를 씁니다.

---

## 31. prenovice Day 7 · slot 1

- topic: 현재진행형
- format/kind: fill_blank / pattern
- source: Are you drinking coffee?
- pattern: Am/Is/Are + 주어 + 동사-ing?
- prompt: "Am/Is/Are + 주어 + 동사-ing?" 패턴을 사용해 "커피를 마시고 있나요?"에 맞게 빈칸을 채우세요: ____ you drinking coffee?
- correct answer: Are
- explanation: 현재 진행 중인 행동을 묻는 긍정 의문문에는 현재형 be동사가 필요합니다. 정답 표현은 "Are"입니다.
- feedback reason: 현재 진행 중인 행동을 묻는 긍정 의문문에는 현재형 be동사가 필요합니다. 정답 표현은 "Are"입니다.

Choices:
- [correct] Are
- [distractor] Aren't
- [distractor] Were
- [distractor] Weren't

Mutation evidence:
- fixed_expression/fixed_expression: `Are` → `Aren't` — 현재 진행 중인 행동을 묻는 긍정 의문문에는 현재형 be동사가 필요합니다. 정답 표현은 "Are"입니다.
- fixed_expression/fixed_expression: `Are` → `Were` — 현재 진행 중인 행동을 묻는 긍정 의문문에는 현재형 be동사가 필요합니다. 정답 표현은 "Are"입니다.
- fixed_expression/fixed_expression: `Are` → `Weren't` — 현재 진행 중인 행동을 묻는 긍정 의문문에는 현재형 be동사가 필요합니다. 정답 표현은 "Are"입니다.

---

## 32. prenovice Day 7 · slot 2

- topic: 현재진행형
- format/kind: multiple_choice / translation
- source: He is singing.
- pattern: 주어 + am/is/are + 동사-ing
- prompt: "그는 노래하고 있다."에 맞는 영어 문장을 고르세요.
- correct answer: He is singing.
- explanation: 노래하고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "singing"입니다.
- feedback reason: 노래하고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "singing"입니다.

Choices:
- [distractor] He is running.
- [correct] He is singing.
- [distractor] He is dancing.
- [distractor] He is talking.

Mutation evidence:
- fixed_expression/fixed_expression: `singing` → `running` — 노래하고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "singing"입니다.
- fixed_expression/fixed_expression: `singing` → `dancing` — 노래하고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "singing"입니다.
- fixed_expression/fixed_expression: `singing` → `talking` — 노래하고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "singing"입니다.

---

## 33. prenovice Day 7 · slot 3

- topic: 현재진행형
- format/kind: true_false / pattern
- source: I'm not running.
- pattern: 주어 + am/is/are not + 동사-ing
- prompt: "주어 + am/is/are not + 동사-ing" 패턴을 사용해 "나는 뛰고 있지 않다."에 맞는 문장이면 O, 아니면 X를 고르세요: "I'm not running."
- correct answer: O
- explanation: 현재 진행형 부정문은 be동사 뒤에 not과 동사 -ing 형태를 둡니다. 정답 표현은 "I'm not running."입니다.
- feedback reason: 현재 진행형 부정문은 be동사 뒤에 not과 동사 -ing 형태를 둡니다. 정답 표현은 "I'm not running."입니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 34. prenovice Day 7 · slot 4

- topic: 현재진행형
- format/kind: fill_blank / translation
- source: Are you cooking?
- pattern: Am/Is/Are + 주어 + 동사-ing?
- prompt: "요리하고 있나요?"에 맞게 빈칸을 채우세요: Are you ____?
- correct answer: cooking
- explanation: 요리하고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "cooking"입니다.
- feedback reason: 요리하고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "cooking"입니다.

Choices:
- [correct] cooking
- [distractor] working
- [distractor] studying
- [distractor] eating

Mutation evidence:
- fixed_expression/fixed_expression: `cooking` → `working` — 요리하고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "cooking"입니다.
- fixed_expression/fixed_expression: `cooking` → `studying` — 요리하고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "cooking"입니다.
- fixed_expression/fixed_expression: `cooking` → `eating` — 요리하고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "cooking"입니다.

---

## 35. prenovice Day 7 · slot 5

- topic: 현재진행형
- format/kind: multiple_choice / translation
- source: I am going home.
- pattern: 주어 + am/is/are + 동사-ing
- prompt: "나는 집에 가고 있다."에 맞는 영어 문장을 고르세요.
- correct answer: I am going home.
- explanation: 집에 가고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "going home"입니다.
- feedback reason: 집에 가고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "going home"입니다.

Choices:
- [distractor] I am staying here.
- [distractor] I am visiting a friend.
- [correct] I am going home.
- [distractor] I am going to work.

Mutation evidence:
- fixed_expression/fixed_expression: `going home` → `staying here` — 집에 가고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "going home"입니다.
- fixed_expression/fixed_expression: `going home` → `visiting a friend` — 집에 가고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "going home"입니다.
- fixed_expression/fixed_expression: `going home` → `going to work` — 집에 가고 있다는 뜻에 맞는 동작을 골라야 합니다. 정답 표현은 "going home"입니다.

---

## 36. prenovice Day 8 · slot 1

- topic: 과거진행형
- format/kind: multiple_choice / translation
- source: They were singing a song on stage.
- pattern: 주어 + was/were + 동사-ing
- prompt: "그들은 무대에서 노래를 부르고 있었다."에 맞는 영어 문장을 고르세요.
- correct answer: They were singing a song on stage.
- explanation: 이 문장의 정답은 "-ing" 형태인 "singing"입니다.
- feedback reason: 이 문장의 정답은 "-ing" 형태인 "singing"입니다.

Choices:
- [distractor] They were sang a song on stage.
- [correct] They were singing a song on stage.
- [distractor] They were sings a song on stage.
- [distractor] They were sing a song on stage.

Mutation evidence:
- fixed_expression/fixed_expression: `singing` → `sang` — 이 문장의 정답은 "-ing" 형태인 "singing"입니다.
- fixed_expression/fixed_expression: `singing` → `sings` — 이 문장의 정답은 "-ing" 형태인 "singing"입니다.
- fixed_expression/fixed_expression: `singing` → `sing` — 이 문장의 정답은 "-ing" 형태인 "singing"입니다.

---

## 37. prenovice Day 8 · slot 2

- topic: 과거진행형
- format/kind: true_false / pattern
- source: Were you working?
- pattern: Was/Were + 주어 + 동사-ing?
- prompt: "Was/Were + 주어 + 동사-ing?" 패턴을 사용해 "일하고 있었나요?"에 맞는 문장이면 O, 아니면 X를 고르세요: "Weren't you working?"
- correct answer: X
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "Were" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "Were" 형태를 씁니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `Were` → `Weren't` — 이 문장은 긍정문이므로 부정형이 아니라 "Were" 형태를 씁니다.

---

## 38. prenovice Day 8 · slot 3

- topic: 과거진행형
- format/kind: fill_blank / translation
- source: He wasn't lying to me.
- pattern: 주어 + was/were not + 동사-ing
- prompt: "그는 나에게 거짓말하고 있지 않았다."에 맞게 빈칸을 채우세요: He ____ lying to me.
- correct answer: wasn't
- explanation: 이 문장은 부정문이므로 긍정형이 아니라 "wasn't" 형태를 씁니다.
- feedback reason: 이 문장은 부정문이므로 긍정형이 아니라 "wasn't" 형태를 씁니다.

Choices:
- [distractor] were
- [distractor] was
- [correct] wasn't
- [distractor] is

Mutation evidence:
- fixed_expression/fixed_expression: `wasn't` → `were` — 이 문장은 부정문이므로 긍정형이 아니라 "wasn't" 형태를 씁니다.
- fixed_expression/fixed_expression: `wasn't` → `was` — 이 문장은 부정문이므로 긍정형이 아니라 "wasn't" 형태를 씁니다.
- fixed_expression/fixed_expression: `wasn't` → `is` — 이 문장은 부정문이므로 긍정형이 아니라 "wasn't" 형태를 씁니다.

---

## 39. prenovice Day 8 · slot 4

- topic: 과거진행형
- format/kind: multiple_choice / pattern
- source: Yesterday, I was reading a book.
- pattern: 주어 + was/were + 동사-ing
- prompt: "주어 + was/were + 동사-ing" 패턴을 사용해 "어제 나는 책을 읽고 있었다."에 맞는 영어 문장을 고르세요.
- correct answer: Yesterday, I was reading a book.
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.

Choices:
- [distractor] Yesterday, I wasn't reading a book.
- [distractor] Yesterday, I weren't reading a book.
- [correct] Yesterday, I was reading a book.
- [distractor] Yesterday, I isn't reading a book.

Mutation evidence:
- fixed_expression/fixed_expression: `was` → `wasn't` — 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.
- fixed_expression/fixed_expression: `was` → `weren't` — 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.
- fixed_expression/fixed_expression: `was` → `isn't` — 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.

---

## 40. prenovice Day 8 · slot 5

- topic: 과거진행형
- format/kind: fill_blank / translation
- source: Were you playing a game at that time?
- pattern: Was/Were + 주어 + 동사-ing?
- prompt: "그때 게임을 하고 있었나요?"에 맞게 빈칸을 채우세요: Were you playing ____ at that time?
- correct answer: a game
- explanation: 그때 하고 있던 활동이 게임이라는 뜻이므로 "a game"이 맞습니다. 정답 표현은 "a game"입니다.
- feedback reason: 그때 하고 있던 활동이 게임이라는 뜻이므로 "a game"이 맞습니다. 정답 표현은 "a game"입니다.

Choices:
- [correct] a game
- [distractor] cards
- [distractor] soccer
- [distractor] the piano

Mutation evidence:
- fixed_expression/fixed_expression: `a game` → `cards` — 그때 하고 있던 활동이 게임이라는 뜻이므로 "a game"이 맞습니다. 정답 표현은 "a game"입니다.
- fixed_expression/fixed_expression: `a game` → `soccer` — 그때 하고 있던 활동이 게임이라는 뜻이므로 "a game"이 맞습니다. 정답 표현은 "a game"입니다.
- fixed_expression/fixed_expression: `a game` → `the piano` — 그때 하고 있던 활동이 게임이라는 뜻이므로 "a game"이 맞습니다. 정답 표현은 "a game"입니다.

---

## 41. prenovice Day 9 · slot 1

- topic: 현재시제 비교
- format/kind: multiple_choice / translation
- source: I am going home.
- pattern: am/is/are + 동사-ing
- prompt: "나는 집에 가고 있다."에 맞는 영어 문장을 고르세요.
- correct answer: I am going home.
- explanation: 이 문장의 정답은 "-ing" 형태인 "going"입니다.
- feedback reason: 이 문장의 정답은 "-ing" 형태인 "going"입니다.

Choices:
- [distractor] I am go home.
- [distractor] I am goes home.
- [distractor] I am went home.
- [correct] I am going home.

Mutation evidence:
- declared_suffix_form/declared_suffix_form: `going` → `go` — 이 문장의 정답은 "-ing" 형태인 "going"입니다.
- declared_suffix_form/declared_suffix_form: `going` → `goes` — 이 문장의 정답은 "-ing" 형태인 "going"입니다.
- declared_suffix_form/declared_suffix_form: `going` → `went` — 이 문장의 정답은 "-ing" 형태인 "going"입니다.

---

## 42. prenovice Day 9 · slot 2

- topic: 현재시제 비교
- format/kind: fill_blank / pattern
- source: I am going home.
- pattern: am/is/are + 동사-ing
- prompt: "am/is/are + 동사-ing" 패턴을 사용해 "나는 집에 가고 있다."에 맞게 빈칸을 채우세요: I ____ going home.
- correct answer: am
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "am" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "am" 형태를 씁니다.

Choices:
- [correct] am
- [distractor] isn't
- [distractor] wasn't
- [distractor] aren't

Mutation evidence:
- grammar_slot/grammar_slot: `am` → `isn't` — 이 문장은 긍정문이므로 부정형이 아니라 "am" 형태를 씁니다.
- grammar_slot/grammar_slot: `am` → `wasn't` — 이 문장은 긍정문이므로 부정형이 아니라 "am" 형태를 씁니다.
- grammar_slot/grammar_slot: `am` → `aren't` — 이 문장은 긍정문이므로 부정형이 아니라 "am" 형태를 씁니다.

---

## 43. prenovice Day 9 · slot 3

- topic: 현재시제 비교
- format/kind: multiple_choice / translation
- source: I go to work.
- pattern: 현재형
- prompt: "나는 출근한다."에 맞는 영어 문장을 고르세요.
- correct answer: I go to work.
- explanation: 이 문장의 시제에 맞는 정답은 "go"입니다.
- feedback reason: 이 문장의 시제에 맞는 정답은 "go"입니다.

Choices:
- [distractor] I gone to work.
- [correct] I go to work.
- [distractor] I goes to work.
- [distractor] I went to work.

Mutation evidence:
- declared_tense_form/declared_tense_form: `go` → `gone` — 이 문장의 시제에 맞는 정답은 "go"입니다.
- declared_tense_form/declared_tense_form: `go` → `goes` — 이 문장의 시제에 맞는 정답은 "go"입니다.
- declared_tense_form/declared_tense_form: `go` → `went` — 이 문장의 시제에 맞는 정답은 "go"입니다.

---

## 44. prenovice Day 9 · slot 4

- topic: 현재시제 비교
- format/kind: true_false / translation
- source: Do you study English these days?
- pattern: 현재형
- prompt: "요즘 영어를 공부하나요?"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "Do you studies English these days?"
- correct answer: X
- explanation: 조동사 "Do" 뒤에는 동사원형 "study"를 씁니다.
- feedback reason: 조동사 "Do" 뒤에는 동사원형 "study"를 씁니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- declared_tense_form/declared_tense_form: `study` → `studies` — 조동사 "Do" 뒤에는 동사원형 "study"를 씁니다.

---

## 45. prenovice Day 9 · slot 5

- topic: 현재시제 비교
- format/kind: fill_blank / pattern
- source: What are you doing?
- pattern: am/is/are + 동사-ing
- prompt: "am/is/are + 동사-ing" 패턴을 사용해 "지금 무엇을 하고 있나요?"에 맞게 빈칸을 채우세요: What ____ you doing?
- correct answer: are
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "are" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "are" 형태를 씁니다.

Choices:
- [distractor] weren't
- [distractor] aren't
- [distractor] isn't
- [correct] are

Mutation evidence:
- grammar_slot/grammar_slot: `are` → `weren't` — 이 문장은 긍정문이므로 부정형이 아니라 "are" 형태를 씁니다.
- grammar_slot/grammar_slot: `are` → `aren't` — 이 문장은 긍정문이므로 부정형이 아니라 "are" 형태를 씁니다.
- grammar_slot/grammar_slot: `are` → `isn't` — 이 문장은 긍정문이므로 부정형이 아니라 "are" 형태를 씁니다.

---

## 46. prenovice Day 10 · slot 1

- topic: 과거시제 비교
- format/kind: multiple_choice / translation
- source: What did you do in your free time?
- pattern: What did + 주어 + 동사원형 ...?
- prompt: "여가 시간에 무엇을 했나요?"에 맞는 영어 문장을 고르세요.
- correct answer: What did you do in your free time?
- explanation: 여가 시간을 묻는 뜻에 맞는 시간 표현을 골라야 합니다. 정답 표현은 "your free time"입니다.
- feedback reason: 여가 시간을 묻는 뜻에 맞는 시간 표현을 골라야 합니다. 정답 표현은 "your free time"입니다.

Choices:
- [distractor] What did you do in the office?
- [distractor] What did you do in class?
- [correct] What did you do in your free time?
- [distractor] What did you do in the morning?

Mutation evidence:
- fixed_expression/fixed_expression: `your free time` → `the office` — 여가 시간을 묻는 뜻에 맞는 시간 표현을 골라야 합니다. 정답 표현은 "your free time"입니다.
- fixed_expression/fixed_expression: `your free time` → `class` — 여가 시간을 묻는 뜻에 맞는 시간 표현을 골라야 합니다. 정답 표현은 "your free time"입니다.
- fixed_expression/fixed_expression: `your free time` → `the morning` — 여가 시간을 묻는 뜻에 맞는 시간 표현을 골라야 합니다. 정답 표현은 "your free time"입니다.

---

## 47. prenovice Day 10 · slot 2

- topic: 과거시제 비교
- format/kind: fill_blank / pattern
- source: What were you doing?
- pattern: What was/were + 주어 + 동사-ing ...?
- prompt: "What was/were + 주어 + 동사-ing ...?" 패턴을 사용해 "무엇을 하고 있었나요?"에 맞게 빈칸을 채우세요: What ____?
- correct answer: were you doing
- explanation: 과거에 진행 중이던 행동을 묻는 의문문에는 과거진행형을 씁니다. 정답 표현은 "were you doing"입니다.
- feedback reason: 과거에 진행 중이던 행동을 묻는 의문문에는 과거진행형을 씁니다. 정답 표현은 "were you doing"입니다.

Choices:
- [distractor] did you do
- [correct] were you doing
- [distractor] have you done
- [distractor] are you doing

Mutation evidence:
- fixed_expression/fixed_expression: `were you doing` → `did you do` — 과거에 진행 중이던 행동을 묻는 의문문에는 과거진행형을 씁니다. 정답 표현은 "were you doing"입니다.
- fixed_expression/fixed_expression: `were you doing` → `have you done` — 과거에 진행 중이던 행동을 묻는 의문문에는 과거진행형을 씁니다. 정답 표현은 "were you doing"입니다.
- fixed_expression/fixed_expression: `were you doing` → `are you doing` — 과거에 진행 중이던 행동을 묻는 의문문에는 과거진행형을 씁니다. 정답 표현은 "were you doing"입니다.

---

## 48. prenovice Day 10 · slot 3

- topic: 과거시제 비교
- format/kind: multiple_choice / pattern
- source: What did you do in your free time?
- pattern: What did + 주어 + 동사원형 ...?
- prompt: "What did + 주어 + 동사원형 ...?" 패턴을 사용해 "여가 시간에 무엇을 했나요?"에 맞는 영어 문장을 고르세요.
- correct answer: What did you do in your free time?
- explanation: 과거에 한 행동을 묻는 의문문에는 과거 조동사와 동사원형을 씁니다. 정답 표현은 "did you do"입니다.
- feedback reason: 과거에 한 행동을 묻는 의문문에는 과거 조동사와 동사원형을 씁니다. 정답 표현은 "did you do"입니다.

Choices:
- [distractor] What have you done in your free time?
- [distractor] What do you do in your free time?
- [distractor] What were you doing in your free time?
- [correct] What did you do in your free time?

Mutation evidence:
- fixed_expression/fixed_expression: `did you do` → `have you done` — 과거에 한 행동을 묻는 의문문에는 과거 조동사와 동사원형을 씁니다. 정답 표현은 "did you do"입니다.
- fixed_expression/fixed_expression: `did you do` → `do you do` — 과거에 한 행동을 묻는 의문문에는 과거 조동사와 동사원형을 씁니다. 정답 표현은 "did you do"입니다.
- fixed_expression/fixed_expression: `did you do` → `were you doing` — 과거에 한 행동을 묻는 의문문에는 과거 조동사와 동사원형을 씁니다. 정답 표현은 "did you do"입니다.

---

## 49. prenovice Day 10 · slot 4

- topic: 과거시제 비교
- format/kind: fill_blank / translation
- source: What were you doing?
- pattern: What was/were + 주어 + 동사-ing ...?
- prompt: "무엇을 하고 있었나요?"에 맞게 빈칸을 채우세요: What were you ____?
- correct answer: doing
- explanation: 무엇을 하고 있었는지 넓게 묻는 뜻에는 해당 동사를 씁니다. 정답 표현은 "doing"입니다.
- feedback reason: 무엇을 하고 있었는지 넓게 묻는 뜻에는 해당 동사를 씁니다. 정답 표현은 "doing"입니다.

Choices:
- [distractor] watching
- [distractor] reading
- [distractor] studying
- [correct] doing

Mutation evidence:
- fixed_expression/fixed_expression: `doing` → `watching` — 무엇을 하고 있었는지 넓게 묻는 뜻에는 해당 동사를 씁니다. 정답 표현은 "doing"입니다.
- fixed_expression/fixed_expression: `doing` → `reading` — 무엇을 하고 있었는지 넓게 묻는 뜻에는 해당 동사를 씁니다. 정답 표현은 "doing"입니다.
- fixed_expression/fixed_expression: `doing` → `studying` — 무엇을 하고 있었는지 넓게 묻는 뜻에는 해당 동사를 씁니다. 정답 표현은 "doing"입니다.

---

## 50. prenovice Day 10 · slot 5

- topic: 과거시제 비교
- format/kind: true_false / translation
- source: What did you do in your free time?
- pattern: What did + 주어 + 동사원형 ...?
- prompt: "여가 시간에 무엇을 했나요?"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "What didn't you do in your free time?"
- correct answer: X
- explanation: 제시된 뜻은 과거의 긍정 의문문이며 부정 의문문이 아닙니다. 정답 표현은 "did"입니다.
- feedback reason: 제시된 뜻은 과거의 긍정 의문문이며 부정 의문문이 아닙니다. 정답 표현은 "did"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `did` → `didn't` — 제시된 뜻은 과거의 긍정 의문문이며 부정 의문문이 아닙니다. 정답 표현은 "did"입니다.

---

## 51. prenovice Day 11 · slot 1

- topic: 시제 종합·명령문
- format/kind: true_false / pattern
- source: Work.
- pattern: 동사원형 / Don't + 동사원형
- prompt: "동사원형 / Don't + 동사원형" 패턴을 사용해 "일해."에 맞는 문장이면 O, 아니면 X를 고르세요: "Work."
- correct answer: O
- explanation: "Work."는 주어 없이 동사원형 "Work"로 시작한 긍정 명령문이므로 맞습니다.
- feedback reason: "Work."는 주어 없이 동사원형 "Work"로 시작한 긍정 명령문이므로 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 52. prenovice Day 11 · slot 2

- topic: 시제 종합·명령문
- format/kind: fill_blank / pattern
- source: Did you understand?
- pattern: Do/Are/Did/Were + 주어 ...?
- prompt: "Do/Are/Did/Were + 주어 ...?" 패턴을 사용해 "이해했나요?"에 맞게 빈칸을 채우세요: ____ you understand?
- correct answer: Did
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "Did" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "Did" 형태를 씁니다.

Choices:
- [distractor] Didn't
- [distractor] Don't
- [correct] Did
- [distractor] Doesn't

Mutation evidence:
- grammar_slot/grammar_slot: `Did` → `Didn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Did" 형태를 씁니다.
- grammar_slot/grammar_slot: `Did` → `Don't` — 이 문장은 긍정문이므로 부정형이 아니라 "Did" 형태를 씁니다.
- grammar_slot/grammar_slot: `Did` → `Doesn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Did" 형태를 씁니다.

---

## 53. prenovice Day 11 · slot 3

- topic: 시제 종합·명령문
- format/kind: multiple_choice / translation
- source: Are you following him?
- pattern: Do/Are/Did/Were + 주어 ...?
- prompt: "그를 따라가고 있나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Are you following him?
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "Are" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "Are" 형태를 씁니다.

Choices:
- [distractor] Isn't you following him?
- [correct] Are you following him?
- [distractor] Aren't you following him?
- [distractor] Weren't you following him?

Mutation evidence:
- grammar_slot/grammar_slot: `Are` → `Isn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Are" 형태를 씁니다.
- grammar_slot/grammar_slot: `Are` → `Aren't` — 이 문장은 긍정문이므로 부정형이 아니라 "Are" 형태를 씁니다.
- grammar_slot/grammar_slot: `Are` → `Weren't` — 이 문장은 긍정문이므로 부정형이 아니라 "Are" 형태를 씁니다.

---

## 54. prenovice Day 11 · slot 4

- topic: 시제 종합·명령문
- format/kind: fill_blank / translation
- source: Don't work.
- pattern: 동사원형 / Don't + 동사원형
- prompt: "일하지 마."에 맞게 빈칸을 채우세요: ____ work.
- correct answer: Don't
- explanation: 이 문장은 부정문이므로 긍정형이 아니라 "Don't" 형태를 씁니다.
- feedback reason: 이 문장은 부정문이므로 긍정형이 아니라 "Don't" 형태를 씁니다.

Choices:
- [distractor] Do
- [distractor] Did
- [correct] Don't
- [distractor] Does

Mutation evidence:
- grammar_slot/grammar_slot: `Don't` → `Do` — 이 문장은 부정문이므로 긍정형이 아니라 "Don't" 형태를 씁니다.
- grammar_slot/grammar_slot: `Don't` → `Did` — 이 문장은 부정문이므로 긍정형이 아니라 "Don't" 형태를 씁니다.
- grammar_slot/grammar_slot: `Don't` → `Does` — 이 문장은 부정문이므로 긍정형이 아니라 "Don't" 형태를 씁니다.

---

## 55. prenovice Day 11 · slot 5

- topic: 시제 종합·명령문
- format/kind: multiple_choice / translation
- source: She was washing.
- pattern: I study / I'm studying / I studied / I was studying
- prompt: "그녀는 씻고 있었다."에 맞는 영어 문장을 고르세요.
- correct answer: She was washing.
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.

Choices:
- [distractor] She weren't washing.
- [correct] She was washing.
- [distractor] She wasn't washing.
- [distractor] She isn't washing.

Mutation evidence:
- grammar_slot/grammar_slot: `was` → `weren't` — 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.
- grammar_slot/grammar_slot: `was` → `wasn't` — 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.
- grammar_slot/grammar_slot: `was` → `isn't` — 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.

---

## 56. prenovice Day 12 · slot 1

- topic: will 미래
- format/kind: multiple_choice / translation
- source: I will learn English.
- pattern: will + 동사원형
- prompt: "나는 영어를 배울 것이다."에 맞는 영어 문장을 고르세요.
- correct answer: I will learn English.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.

Choices:
- [distractor] I will learn Spanish.
- [correct] I will learn English.
- [distractor] I will learn Japanese.
- [distractor] I will learn French.

Mutation evidence:
- fixed_expression/fixed_expression: `English` → `Spanish` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.
- fixed_expression/fixed_expression: `English` → `Japanese` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.
- fixed_expression/fixed_expression: `English` → `French` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.

---

## 57. prenovice Day 12 · slot 2

- topic: will 미래
- format/kind: fill_blank / pattern
- source: He will wait for her.
- pattern: will + 동사원형
- prompt: "will + 동사원형" 패턴을 사용해 "그는 그녀를 기다릴 것이다."에 맞게 빈칸을 채우세요: He ____.
- correct answer: will wait for her
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "will wait for her"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "will wait for her"입니다.

Choices:
- [correct] will wait for her
- [distractor] will look for her
- [distractor] will call her
- [distractor] will write to her

Mutation evidence:
- fixed_expression/fixed_expression: `will wait for her` → `will look for her` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "will wait for her"입니다.
- fixed_expression/fixed_expression: `will wait for her` → `will call her` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "will wait for her"입니다.
- fixed_expression/fixed_expression: `will wait for her` → `will write to her` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "will wait for her"입니다.

---

## 58. prenovice Day 12 · slot 3

- topic: will 미래
- format/kind: multiple_choice / pattern
- source: It will be difficult.
- pattern: will be + 형용사/명사
- prompt: "will be + 형용사/명사" 패턴을 사용해 "그것은 어려울 것이다."에 맞는 영어 문장을 고르세요.
- correct answer: It will be difficult.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "will be difficult"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "will be difficult"입니다.

Choices:
- [distractor] It will be fun.
- [distractor] It will be interesting.
- [correct] It will be difficult.
- [distractor] It will be easy.

Mutation evidence:
- fixed_expression/fixed_expression: `will be difficult` → `will be fun` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "will be difficult"입니다.
- fixed_expression/fixed_expression: `will be difficult` → `will be interesting` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "will be difficult"입니다.
- fixed_expression/fixed_expression: `will be difficult` → `will be easy` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "will be difficult"입니다.

---

## 59. prenovice Day 12 · slot 4

- topic: will 미래
- format/kind: fill_blank / translation
- source: I won't see a doctor tomorrow.
- pattern: won't ... / Will + 주어 ...?
- prompt: "나는 내일 의사를 만나지 않을 것이다."에 맞게 빈칸을 채우세요: I won't see ____ tomorrow.
- correct answer: a doctor
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "a doctor"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "a doctor"입니다.

Choices:
- [correct] a doctor
- [distractor] my teacher
- [distractor] my friend
- [distractor] my parents

Mutation evidence:
- fixed_expression/fixed_expression: `a doctor` → `my teacher` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "a doctor"입니다.
- fixed_expression/fixed_expression: `a doctor` → `my friend` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "a doctor"입니다.
- fixed_expression/fixed_expression: `a doctor` → `my parents` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "a doctor"입니다.

---

## 60. prenovice Day 12 · slot 5

- topic: will 미래
- format/kind: true_false / translation
- source: We will be happy.
- pattern: will be + 형용사/명사
- prompt: "우리는 행복할 것이다."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "We will be happy."
- correct answer: O
- explanation: "We will be happy."는 "will be + 형용사" 형태로 미래의 상태를 나타내므로 맞습니다.
- feedback reason: "We will be happy."는 "will be + 형용사" 형태로 미래의 상태를 나타내므로 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 61. prenovice Day 13 · slot 1

- topic: can 가능·허락
- format/kind: fill_blank / translation
- source: Can I use your pen?
- pattern: Can I + 동사원형?
- prompt: "펜을 사용해도 될까요?"에 맞게 빈칸을 채우세요: Can I ____ your pen?
- correct answer: use
- explanation: 조동사 "Can" 뒤의 정답은 동사원형 "use"입니다.
- feedback reason: 조동사 "Can" 뒤의 정답은 동사원형 "use"입니다.

Choices:
- [distractor] used
- [correct] use
- [distractor] uses
- [distractor] using

Mutation evidence:
- fixed_expression/fixed_expression: `use` → `used` — 조동사 "Can" 뒤의 정답은 동사원형 "use"입니다.
- fixed_expression/fixed_expression: `use` → `uses` — 조동사 "Can" 뒤의 정답은 동사원형 "use"입니다.
- fixed_expression/fixed_expression: `use` → `using` — 조동사 "Can" 뒤의 정답은 동사원형 "use"입니다.

---

## 62. prenovice Day 13 · slot 2

- topic: can 가능·허락
- format/kind: multiple_choice / translation
- source: Can I take you home?
- pattern: Can I + 동사원형?
- prompt: "집에 데려다줘도 될까요?"에 맞는 영어 문장을 고르세요.
- correct answer: Can I take you home?
- explanation: 집에 데려다줘도 되는지를 묻는 뜻에는 "take you home"이 맞습니다. 정답 표현은 "take you home"입니다.
- feedback reason: 집에 데려다줘도 되는지를 묻는 뜻에는 "take you home"이 맞습니다. 정답 표현은 "take you home"입니다.

Choices:
- [correct] Can I take you home?
- [distractor] Can I call you later?
- [distractor] Can I visit you tomorrow?
- [distractor] Can I leave you here?

Mutation evidence:
- fixed_expression/fixed_expression: `take you home` → `call you later` — 집에 데려다줘도 되는지를 묻는 뜻에는 "take you home"이 맞습니다. 정답 표현은 "take you home"입니다.
- fixed_expression/fixed_expression: `take you home` → `visit you tomorrow` — 집에 데려다줘도 되는지를 묻는 뜻에는 "take you home"이 맞습니다. 정답 표현은 "take you home"입니다.
- fixed_expression/fixed_expression: `take you home` → `leave you here` — 집에 데려다줘도 되는지를 묻는 뜻에는 "take you home"이 맞습니다. 정답 표현은 "take you home"입니다.

---

## 63. prenovice Day 13 · slot 3

- topic: can 가능·허락
- format/kind: true_false / pattern
- source: Can you hear me?
- pattern: Can you + 동사원형?
- prompt: "Can you + 동사원형?" 패턴을 사용해 "내 말이 들리나요?"에 맞는 문장이면 O, 아니면 X를 고르세요: "Can you hear me?"
- correct answer: O
- explanation: "Can you hear me?"는 "Can + 주어 + 동사원형" 순서로 가능 여부를 묻는 의문문이므로 맞습니다.
- feedback reason: "Can you hear me?"는 "Can + 주어 + 동사원형" 순서로 가능 여부를 묻는 의문문이므로 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 64. prenovice Day 13 · slot 4

- topic: can 가능·허락
- format/kind: fill_blank / pattern
- source: She can't drive a car.
- pattern: can/can't + 동사원형
- prompt: "can/can't + 동사원형" 패턴을 사용해 "그녀는 운전할 수 없다."에 맞게 빈칸을 채우세요: She can't ____ a car.
- correct answer: drive
- explanation: 조동사 "can't" 뒤의 정답은 동사원형 "drive"입니다.
- feedback reason: 조동사 "can't" 뒤의 정답은 동사원형 "drive"입니다.

Choices:
- [correct] drive
- [distractor] drove
- [distractor] driving
- [distractor] drives

Mutation evidence:
- fixed_expression/fixed_expression: `drive` → `drove` — 조동사 "can't" 뒤의 정답은 동사원형 "drive"입니다.
- fixed_expression/fixed_expression: `drive` → `driving` — 조동사 "can't" 뒤의 정답은 동사원형 "drive"입니다.
- fixed_expression/fixed_expression: `drive` → `drives` — 조동사 "can't" 뒤의 정답은 동사원형 "drive"입니다.

---

## 65. prenovice Day 13 · slot 5

- topic: can 가능·허락
- format/kind: multiple_choice / translation
- source: I can play the piano.
- pattern: can/can't + 동사원형
- prompt: "나는 피아노를 칠 수 있다."에 맞는 영어 문장을 고르세요.
- correct answer: I can play the piano.
- explanation: 피아노를 칠 수 있다는 능력을 나타내므로 조동사 "can"이 맞습니다. 정답 표현은 "can"입니다.
- feedback reason: 피아노를 칠 수 있다는 능력을 나타내므로 조동사 "can"이 맞습니다. 정답 표현은 "can"입니다.

Choices:
- [distractor] I will play the piano.
- [distractor] I might play the piano.
- [distractor] I should play the piano.
- [correct] I can play the piano.

Mutation evidence:
- fixed_expression/fixed_expression: `can` → `will` — 피아노를 칠 수 있다는 능력을 나타내므로 조동사 "can"이 맞습니다. 정답 표현은 "can"입니다.
- fixed_expression/fixed_expression: `can` → `might` — 피아노를 칠 수 있다는 능력을 나타내므로 조동사 "can"이 맞습니다. 정답 표현은 "can"입니다.
- fixed_expression/fixed_expression: `can` → `should` — 피아노를 칠 수 있다는 능력을 나타내므로 조동사 "can"이 맞습니다. 정답 표현은 "can"입니다.

---

## 66. prenovice Day 14 · slot 1

- topic: might·may
- format/kind: multiple_choice / translation
- source: It might be tough for her.
- pattern: might be + 형용사/명사/동사-ing
- prompt: "그녀에게 힘들지도 모른다."에 맞는 영어 문장을 고르세요.
- correct answer: It might be tough for her.
- explanation: 이 문장에서는 "be" 형태가 맞습니다.
- feedback reason: 이 문장에서는 "be" 형태가 맞습니다.

Choices:
- [distractor] It might are tough for her.
- [correct] It might be tough for her.
- [distractor] It might is tough for her.
- [distractor] It might am tough for her.

Mutation evidence:
- fixed_expression/fixed_expression: `be` → `are` — 이 문장에서는 "be" 형태가 맞습니다.
- fixed_expression/fixed_expression: `be` → `is` — 이 문장에서는 "be" 형태가 맞습니다.
- fixed_expression/fixed_expression: `be` → `am` — 이 문장에서는 "be" 형태가 맞습니다.

---

## 67. prenovice Day 14 · slot 2

- topic: might·may
- format/kind: fill_blank / pattern
- source: May I come at 8 p.m.?
- pattern: May I + 동사원형?
- prompt: "May I + 동사원형?" 패턴을 사용해 "오후 8시에 와도 될까요?"에 맞게 빈칸을 채우세요: May I ____ at 8 p.m.?
- correct answer: come
- explanation: 조동사 "May" 뒤의 정답은 동사원형 "come"입니다.
- feedback reason: 조동사 "May" 뒤의 정답은 동사원형 "come"입니다.

Choices:
- [distractor] came
- [distractor] coming
- [correct] come
- [distractor] comes

Mutation evidence:
- fixed_expression/fixed_expression: `come` → `came` — 조동사 "May" 뒤의 정답은 동사원형 "come"입니다.
- fixed_expression/fixed_expression: `come` → `coming` — 조동사 "May" 뒤의 정답은 동사원형 "come"입니다.
- fixed_expression/fixed_expression: `come` → `comes` — 조동사 "May" 뒤의 정답은 동사원형 "come"입니다.

---

## 68. prenovice Day 14 · slot 3

- topic: might·may
- format/kind: multiple_choice / pattern
- source: May I talk to you later?
- pattern: May I + 동사원형?
- prompt: "May I + 동사원형?" 패턴을 사용해 "나중에 이야기해도 될까요?"에 맞는 영어 문장을 고르세요.
- correct answer: May I talk to you later?
- explanation: 나중에 이야기해도 되는지를 묻는 뜻에는 "talk to you later"가 맞습니다. 정답 표현은 "talk to you later"입니다.
- feedback reason: 나중에 이야기해도 되는지를 묻는 뜻에는 "talk to you later"가 맞습니다. 정답 표현은 "talk to you later"입니다.

Choices:
- [distractor] May I ask you later?
- [correct] May I talk to you later?
- [distractor] May I meet you later?
- [distractor] May I talk to you now?

Mutation evidence:
- fixed_expression/fixed_expression: `talk to you later` → `ask you later` — 나중에 이야기해도 되는지를 묻는 뜻에는 "talk to you later"가 맞습니다. 정답 표현은 "talk to you later"입니다.
- fixed_expression/fixed_expression: `talk to you later` → `meet you later` — 나중에 이야기해도 되는지를 묻는 뜻에는 "talk to you later"가 맞습니다. 정답 표현은 "talk to you later"입니다.
- fixed_expression/fixed_expression: `talk to you later` → `talk to you now` — 나중에 이야기해도 되는지를 묻는 뜻에는 "talk to you later"가 맞습니다. 정답 표현은 "talk to you later"입니다.

---

## 69. prenovice Day 14 · slot 4

- topic: might·may
- format/kind: true_false / translation
- source: He might not come.
- pattern: might/might not + 동사원형
- prompt: "그는 오지 않을지도 모른다."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "He might not comes."
- correct answer: X
- explanation: 조동사 "might" 뒤의 정답은 동사원형 "come"입니다.
- feedback reason: 조동사 "might" 뒤의 정답은 동사원형 "come"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `come` → `comes` — 조동사 "might" 뒤의 정답은 동사원형 "come"입니다.

---

## 70. prenovice Day 14 · slot 5

- topic: might·may
- format/kind: fill_blank / translation
- source: I might be studying at that time.
- pattern: might be + 형용사/명사/동사-ing
- prompt: "그때 나는 공부하고 있을지도 모른다."에 맞게 빈칸을 채우세요: I might be ____ at that time.
- correct answer: studying
- explanation: 그때 하고 있을지도 모르는 행동이 공부라는 뜻이므로 "studying"이 맞습니다. 정답 표현은 "studying"입니다.
- feedback reason: 그때 하고 있을지도 모르는 행동이 공부라는 뜻이므로 "studying"이 맞습니다. 정답 표현은 "studying"입니다.

Choices:
- [distractor] sleeping
- [distractor] working
- [distractor] driving
- [correct] studying

Mutation evidence:
- fixed_expression/fixed_expression: `studying` → `sleeping` — 그때 하고 있을지도 모르는 행동이 공부라는 뜻이므로 "studying"이 맞습니다. 정답 표현은 "studying"입니다.
- fixed_expression/fixed_expression: `studying` → `working` — 그때 하고 있을지도 모르는 행동이 공부라는 뜻이므로 "studying"이 맞습니다. 정답 표현은 "studying"입니다.
- fixed_expression/fixed_expression: `studying` → `driving` — 그때 하고 있을지도 모르는 행동이 공부라는 뜻이므로 "studying"이 맞습니다. 정답 표현은 "studying"입니다.

---

## 71. prenovice Day 15 · slot 1

- topic: should 조언
- format/kind: multiple_choice / translation
- source: You should read books.
- pattern: should/shouldn't + 동사원형
- prompt: "책을 읽는 것이 좋다."에 맞는 영어 문장을 고르세요.
- correct answer: You should read books.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "books"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "books"입니다.

Choices:
- [correct] You should read books.
- [distractor] You should read newspapers.
- [distractor] You should read magazines.
- [distractor] You should read articles.

Mutation evidence:
- fixed_expression/fixed_expression: `books` → `newspapers` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "books"입니다.
- fixed_expression/fixed_expression: `books` → `magazines` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "books"입니다.
- fixed_expression/fixed_expression: `books` → `articles` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "books"입니다.

---

## 72. prenovice Day 15 · slot 2

- topic: should 조언
- format/kind: fill_blank / pattern
- source: Should I call him?
- pattern: Should I/we + 동사원형?
- prompt: "Should I/we + 동사원형?" 패턴을 사용해 "그에게 전화해야 할까요?"에 맞게 빈칸을 채우세요: ____?
- correct answer: Should I call him
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "Should I call him"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "Should I call him"입니다.

Choices:
- [distractor] Should I visit him
- [distractor] Should I write to him
- [correct] Should I call him
- [distractor] Should I wait for him

Mutation evidence:
- fixed_expression/fixed_expression: `Should I call him` → `Should I visit him` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Should I call him"입니다.
- fixed_expression/fixed_expression: `Should I call him` → `Should I write to him` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Should I call him"입니다.
- fixed_expression/fixed_expression: `Should I call him` → `Should I wait for him` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Should I call him"입니다.

---

## 73. prenovice Day 15 · slot 3

- topic: should 조언
- format/kind: multiple_choice / pattern
- source: Let me think.
- pattern: Let's ... / Let's not ... / Let me ...
- prompt: "Let's ... / Let's not ... / Let me ..." 패턴을 사용해 "생각 좀 해볼게."에 맞는 영어 문장을 고르세요.
- correct answer: Let me think.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "Let me think"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "Let me think"입니다.

Choices:
- [distractor] Let me decide.
- [correct] Let me think.
- [distractor] Let me check.
- [distractor] Let me explain.

Mutation evidence:
- fixed_expression/fixed_expression: `Let me think` → `Let me decide` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Let me think"입니다.
- fixed_expression/fixed_expression: `Let me think` → `Let me check` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Let me think"입니다.
- fixed_expression/fixed_expression: `Let me think` → `Let me explain` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Let me think"입니다.

---

## 74. prenovice Day 15 · slot 4

- topic: should 조언
- format/kind: fill_blank / translation
- source: Should we go to the fitness center?
- pattern: Should I/we + 동사원형?
- prompt: "헬스장에 가야 할까요?"에 맞게 빈칸을 채우세요: Should we go to ____?
- correct answer: the fitness center
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "the fitness center"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "the fitness center"입니다.

Choices:
- [distractor] the office
- [distractor] the park
- [distractor] the library
- [correct] the fitness center

Mutation evidence:
- fixed_expression/fixed_expression: `the fitness center` → `the office` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "the fitness center"입니다.
- fixed_expression/fixed_expression: `the fitness center` → `the park` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "the fitness center"입니다.
- fixed_expression/fixed_expression: `the fitness center` → `the library` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "the fitness center"입니다.

---

## 75. prenovice Day 15 · slot 5

- topic: should 조언
- format/kind: true_false / translation
- source: Let's not drink.
- pattern: Let's ... / Let's not ... / Let me ...
- prompt: "술을 마시지 말자."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "Let's not drive."
- correct answer: X
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "drink"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "drink"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `drink` → `drive` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "drink"입니다.

---

## 76. prenovice Day 16 · slot 1

- topic: 전체 문형 복습
- format/kind: multiple_choice / pattern
- source: She will be kind.
- pattern: will/might/can/should + be + 형용사
- prompt: "will/might/can/should + be + 형용사" 패턴을 사용해 "그녀는 친절할 것이다."에 맞는 영어 문장을 고르세요.
- correct answer: She will be kind.
- explanation: 이 문장에서는 "be" 형태가 맞습니다.
- feedback reason: 이 문장에서는 "be" 형태가 맞습니다.

Choices:
- [correct] She will be kind.
- [distractor] She will are kind.
- [distractor] She will am kind.
- [distractor] She will is kind.

Mutation evidence:
- fixed_expression/fixed_expression: `be` → `are` — 이 문장에서는 "be" 형태가 맞습니다.
- fixed_expression/fixed_expression: `be` → `am` — 이 문장에서는 "be" 형태가 맞습니다.
- fixed_expression/fixed_expression: `be` → `is` — 이 문장에서는 "be" 형태가 맞습니다.

---

## 77. prenovice Day 16 · slot 2

- topic: 전체 문형 복습
- format/kind: fill_blank / translation
- source: She was studying.
- pattern: study / be studying / studied / was studying
- prompt: "그녀는 공부하고 있었다."에 맞게 빈칸을 채우세요: She ____ studying.
- correct answer: was
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.

Choices:
- [distractor] wasn't
- [correct] was
- [distractor] weren't
- [distractor] isn't

Mutation evidence:
- fixed_expression/fixed_expression: `was` → `wasn't` — 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.
- fixed_expression/fixed_expression: `was` → `weren't` — 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.
- fixed_expression/fixed_expression: `was` → `isn't` — 이 문장은 긍정문이므로 부정형이 아니라 "was" 형태를 씁니다.

---

## 78. prenovice Day 16 · slot 3

- topic: 전체 문형 복습
- format/kind: true_false / pattern
- source: I might study.
- pattern: will/might/can/should + 동사원형
- prompt: "will/might/can/should + 동사원형" 패턴을 사용해 "나는 공부할지도 모른다."에 맞는 문장이면 O, 아니면 X를 고르세요: "I might studies."
- correct answer: X
- explanation: 조동사 "might" 뒤의 정답은 동사원형 "study"입니다.
- feedback reason: 조동사 "might" 뒤의 정답은 동사원형 "study"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `study` → `studies` — 조동사 "might" 뒤의 정답은 동사원형 "study"입니다.

---

## 79. prenovice Day 16 · slot 4

- topic: 전체 문형 복습
- format/kind: multiple_choice / translation
- source: We can be kind.
- pattern: will/might/can/should + be + 형용사
- prompt: "우리는 친절할 수 있다."에 맞는 영어 문장을 고르세요.
- correct answer: We can be kind.
- explanation: 친절할 수 있다는 가능성을 나타내므로 조동사 "can"이 맞습니다. 정답 표현은 "can"입니다.
- feedback reason: 친절할 수 있다는 가능성을 나타내므로 조동사 "can"이 맞습니다. 정답 표현은 "can"입니다.

Choices:
- [distractor] We should be kind.
- [correct] We can be kind.
- [distractor] We will be kind.
- [distractor] We might be kind.

Mutation evidence:
- fixed_expression/fixed_expression: `can` → `should` — 친절할 수 있다는 가능성을 나타내므로 조동사 "can"이 맞습니다. 정답 표현은 "can"입니다.
- fixed_expression/fixed_expression: `can` → `will` — 친절할 수 있다는 가능성을 나타내므로 조동사 "can"이 맞습니다. 정답 표현은 "can"입니다.
- fixed_expression/fixed_expression: `can` → `might` — 친절할 수 있다는 가능성을 나타내므로 조동사 "can"이 맞습니다. 정답 표현은 "can"입니다.

---

## 80. prenovice Day 16 · slot 5

- topic: 전체 문형 복습
- format/kind: fill_blank / translation
- source: You should study.
- pattern: will/might/can/should + 동사원형
- prompt: "너는 공부해야 한다."에 맞게 빈칸을 채우세요: You ____ study.
- correct answer: should
- explanation: 공부해야 한다는 조언·당위를 나타내므로 조동사 "should"가 맞습니다. 정답 표현은 "should"입니다.
- feedback reason: 공부해야 한다는 조언·당위를 나타내므로 조동사 "should"가 맞습니다. 정답 표현은 "should"입니다.

Choices:
- [distractor] will
- [correct] should
- [distractor] can
- [distractor] might

Mutation evidence:
- fixed_expression/fixed_expression: `should` → `will` — 공부해야 한다는 조언·당위를 나타내므로 조동사 "should"가 맞습니다. 정답 표현은 "should"입니다.
- fixed_expression/fixed_expression: `should` → `can` — 공부해야 한다는 조언·당위를 나타내므로 조동사 "should"가 맞습니다. 정답 표현은 "should"입니다.
- fixed_expression/fixed_expression: `should` → `might` — 공부해야 한다는 조언·당위를 나타내므로 조동사 "should"가 맞습니다. 정답 표현은 "should"입니다.

---

## 81. novice Day 1 · slot 1

- topic: 시제·조동사 복습
- format/kind: multiple_choice / pattern
- source: Did you wash?
- pattern: do/does/did + 동사원형
- prompt: "do/does/did + 동사원형" 패턴을 사용해 "씻었나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Did you wash?
- explanation: 이 문장은 긍정문이므로 부정형이 아니라 "Did" 형태를 씁니다.
- feedback reason: 이 문장은 긍정문이므로 부정형이 아니라 "Did" 형태를 씁니다.

Choices:
- [distractor] Doesn't you wash?
- [distractor] Don't you wash?
- [correct] Did you wash?
- [distractor] Didn't you wash?

Mutation evidence:
- grammar_slot/grammar_slot: `Did` → `Doesn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Did" 형태를 씁니다.
- grammar_slot/grammar_slot: `Did` → `Don't` — 이 문장은 긍정문이므로 부정형이 아니라 "Did" 형태를 씁니다.
- grammar_slot/grammar_slot: `Did` → `Didn't` — 이 문장은 긍정문이므로 부정형이 아니라 "Did" 형태를 씁니다.

---

## 82. novice Day 1 · slot 2

- topic: 시제·조동사 복습
- format/kind: fill_blank / translation
- source: Didn't you watch TV?
- pattern: do/does/did + 동사원형
- prompt: "TV를 보지 않았나요?"에 맞게 빈칸을 채우세요: ____ you watch TV?
- correct answer: Didn't
- explanation: 이 문장은 부정문이므로 긍정형이 아니라 "Didn't" 형태를 씁니다.
- feedback reason: 이 문장은 부정문이므로 긍정형이 아니라 "Didn't" 형태를 씁니다.

Choices:
- [correct] Didn't
- [distractor] Do
- [distractor] Does
- [distractor] Did

Mutation evidence:
- grammar_slot/grammar_slot: `Didn't` → `Do` — 이 문장은 부정문이므로 긍정형이 아니라 "Didn't" 형태를 씁니다.
- grammar_slot/grammar_slot: `Didn't` → `Does` — 이 문장은 부정문이므로 긍정형이 아니라 "Didn't" 형태를 씁니다.
- grammar_slot/grammar_slot: `Didn't` → `Did` — 이 문장은 부정문이므로 긍정형이 아니라 "Didn't" 형태를 씁니다.

---

## 83. novice Day 1 · slot 3

- topic: 시제·조동사 복습
- format/kind: multiple_choice / translation
- source: He might come.
- pattern: can/might/should + 동사원형
- prompt: "그가 올지도 몰라요."에 맞는 영어 문장을 고르세요.
- correct answer: He might come.
- explanation: 조동사 "might" 뒤의 정답은 동사원형 "come"입니다.
- feedback reason: 조동사 "might" 뒤의 정답은 동사원형 "come"입니다.

Choices:
- [distractor] He might comes.
- [distractor] He might coming.
- [distractor] He might came.
- [correct] He might come.

Mutation evidence:
- modal_base_form/modal_base_form: `come` → `comes` — 조동사 "might" 뒤의 정답은 동사원형 "come"입니다.
- modal_base_form/modal_base_form: `come` → `coming` — 조동사 "might" 뒤의 정답은 동사원형 "come"입니다.
- modal_base_form/modal_base_form: `come` → `came` — 조동사 "might" 뒤의 정답은 동사원형 "come"입니다.

---

## 84. novice Day 1 · slot 4

- topic: 시제·조동사 복습
- format/kind: fill_blank / pattern
- source: You shouldn't touch it.
- pattern: can/might/should + 동사원형
- prompt: "can/might/should + 동사원형" 패턴을 사용해 "그것을 만지면 안 돼요."에 맞게 빈칸을 채우세요: You shouldn't ____ it.
- correct answer: touch
- explanation: 조동사 "shouldn't" 뒤의 정답은 동사원형 "touch"입니다.
- feedback reason: 조동사 "shouldn't" 뒤의 정답은 동사원형 "touch"입니다.

Choices:
- [distractor] touching
- [distractor] touched
- [distractor] touches
- [correct] touch

Mutation evidence:
- modal_base_form/modal_base_form: `touch` → `touching` — 조동사 "shouldn't" 뒤의 정답은 동사원형 "touch"입니다.
- modal_base_form/modal_base_form: `touch` → `touched` — 조동사 "shouldn't" 뒤의 정답은 동사원형 "touch"입니다.
- modal_base_form/modal_base_form: `touch` → `touches` — 조동사 "shouldn't" 뒤의 정답은 동사원형 "touch"입니다.

---

## 85. novice Day 1 · slot 5

- topic: 시제·조동사 복습
- format/kind: true_false / translation
- source: Were you walking?
- pattern: be + -ing
- prompt: "걷고 있었나요?"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "Were you walking?"
- correct answer: O
- explanation: "Were you walking?"은 "Were + 주어 + -ing" 형태의 과거진행 의문문이며, "걷고 있었나요?"라는 뜻과 일치합니다.
- feedback reason: "Were you walking?"은 "Were + 주어 + -ing" 형태의 과거진행 의문문이며, "걷고 있었나요?"라는 뜻과 일치합니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 86. novice Day 2 · slot 1

- topic: 조언·의무·금지
- format/kind: multiple_choice / translation
- source: He has to pay the fine.
- pattern: have to / don't have to + 동사원형
- prompt: "그는 벌금을 내야 해요."에 맞는 영어 문장을 고르세요.
- correct answer: He has to pay the fine.
- explanation: 벌금을 낼 의무가 있다는 뜻이므로 "has to"가 맞습니다. "might"는 가능성, "must not"은 금지, "doesn't have to"는 의무가 없음을 나타냅니다.
- feedback reason: 벌금을 낼 의무가 있다는 뜻이므로 "has to"가 맞습니다. "might"는 가능성, "must not"은 금지, "doesn't have to"는 의무가 없음을 나타냅니다.

Choices:
- [correct] He has to pay the fine.
- [distractor] He must not pay the fine.
- [distractor] He might pay the fine.
- [distractor] He doesn't have to pay the fine.

Mutation evidence:
- fixed_expression/fixed_expression: `has to` → `must not` — 벌금을 낼 의무가 있다는 뜻이므로 "has to"가 맞습니다. "might"는 가능성, "must not"은 금지, "doesn't have to"는 의무가 없음을 나타냅니다.
- fixed_expression/fixed_expression: `has to` → `might` — 벌금을 낼 의무가 있다는 뜻이므로 "has to"가 맞습니다. "might"는 가능성, "must not"은 금지, "doesn't have to"는 의무가 없음을 나타냅니다.
- fixed_expression/fixed_expression: `has to` → `doesn't have to` — 벌금을 낼 의무가 있다는 뜻이므로 "has to"가 맞습니다. "might"는 가능성, "must not"은 금지, "doesn't have to"는 의무가 없음을 나타냅니다.

---

## 87. novice Day 2 · slot 2

- topic: 조언·의무·금지
- format/kind: fill_blank / pattern
- source: Children must not lie.
- pattern: must / must not + 동사원형
- prompt: "must / must not + 동사원형" 패턴을 사용해 "아이들은 거짓말하면 안 돼요."에 맞게 빈칸을 채우세요: Children ____ lie.
- correct answer: must not
- explanation: 거짓말하면 안 된다는 강한 금지를 나타내야 합니다. 정답 표현은 "must not"입니다.
- feedback reason: 거짓말하면 안 된다는 강한 금지를 나타내야 합니다. 정답 표현은 "must not"입니다.

Choices:
- [correct] must not
- [distractor] must
- [distractor] don't have to
- [distractor] shouldn't

Mutation evidence:
- fixed_expression/fixed_expression: `must not` → `must` — 거짓말하면 안 된다는 강한 금지를 나타내야 합니다. 정답 표현은 "must not"입니다.
- fixed_expression/fixed_expression: `must not` → `don't have to` — 거짓말하면 안 된다는 강한 금지를 나타내야 합니다. 정답 표현은 "must not"입니다.
- fixed_expression/fixed_expression: `must not` → `shouldn't` — 거짓말하면 안 된다는 강한 금지를 나타내야 합니다. 정답 표현은 "must not"입니다.

---

## 88. novice Day 2 · slot 3

- topic: 조언·의무·금지
- format/kind: true_false / translation
- source: I shouldn't eat too much.
- pattern: should / shouldn't + 동사원형
- prompt: "너무 많이 먹지 않는 게 좋아요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I shouldn't eat too much."
- correct answer: O
- explanation: 너무 많이 먹지 않는 편이 좋다는 조언과 일치합니다. 정답 표현은 "I shouldn't eat too much."입니다.
- feedback reason: 너무 많이 먹지 않는 편이 좋다는 조언과 일치합니다. 정답 표현은 "I shouldn't eat too much."입니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 89. novice Day 2 · slot 4

- topic: 조언·의무·금지
- format/kind: multiple_choice / pattern
- source: We must vote.
- pattern: must / must not + 동사원형
- prompt: "must / must not + 동사원형" 패턴을 사용해 "우리는 반드시 투표해야 해요."에 맞는 영어 문장을 고르세요.
- correct answer: We must vote.
- explanation: 반드시 투표해야 한다는 의무를 나타내야 합니다. 정답 표현은 "must"입니다.
- feedback reason: 반드시 투표해야 한다는 의무를 나타내야 합니다. 정답 표현은 "must"입니다.

Choices:
- [distractor] We should vote.
- [distractor] We don't have to vote.
- [correct] We must vote.
- [distractor] We must not vote.

Mutation evidence:
- fixed_expression/fixed_expression: `must` → `should` — 반드시 투표해야 한다는 의무를 나타내야 합니다. 정답 표현은 "must"입니다.
- fixed_expression/fixed_expression: `must` → `don't have to` — 반드시 투표해야 한다는 의무를 나타내야 합니다. 정답 표현은 "must"입니다.
- fixed_expression/fixed_expression: `must` → `must not` — 반드시 투표해야 한다는 의무를 나타내야 합니다. 정답 표현은 "must"입니다.

---

## 90. novice Day 2 · slot 5

- topic: 조언·의무·금지
- format/kind: fill_blank / translation
- source: He doesn't have to work on the weekend.
- pattern: have to / don't have to + 동사원형
- prompt: "그는 주말에 일할 필요가 없어요."에 맞게 빈칸을 채우세요: He ____ work on the weekend.
- correct answer: doesn't have to
- explanation: 주말에 일할 필요가 없다는 뜻을 나타내야 합니다. 정답 표현은 "doesn't have to"입니다.
- feedback reason: 주말에 일할 필요가 없다는 뜻을 나타내야 합니다. 정답 표현은 "doesn't have to"입니다.

Choices:
- [distractor] should
- [distractor] has to
- [distractor] must not
- [correct] doesn't have to

Mutation evidence:
- fixed_expression/fixed_expression: `doesn't have to` → `should` — 주말에 일할 필요가 없다는 뜻을 나타내야 합니다. 정답 표현은 "doesn't have to"입니다.
- fixed_expression/fixed_expression: `doesn't have to` → `has to` — 주말에 일할 필요가 없다는 뜻을 나타내야 합니다. 정답 표현은 "doesn't have to"입니다.
- fixed_expression/fixed_expression: `doesn't have to` → `must not` — 주말에 일할 필요가 없다는 뜻을 나타내야 합니다. 정답 표현은 "doesn't have to"입니다.

---

## 91. novice Day 3 · slot 1

- topic: be going to
- format/kind: multiple_choice / translation
- source: She is going to go shopping.
- pattern: be going to + 동사원형
- prompt: "그녀는 쇼핑하러 갈 예정이에요."에 맞는 영어 문장을 고르세요.
- correct answer: She is going to go shopping.
- explanation: 쇼핑하러 갈 예정인 사람이 그녀라는 뜻에 맞아야 합니다. 정답 표현은 "She is"입니다.
- feedback reason: 쇼핑하러 갈 예정인 사람이 그녀라는 뜻에 맞아야 합니다. 정답 표현은 "She is"입니다.

Choices:
- [correct] She is going to go shopping.
- [distractor] He is going to go shopping.
- [distractor] We are going to go shopping.
- [distractor] They are going to go shopping.

Mutation evidence:
- fixed_expression/fixed_expression: `She is` → `He is` — 쇼핑하러 갈 예정인 사람이 그녀라는 뜻에 맞아야 합니다. 정답 표현은 "She is"입니다.
- fixed_expression/fixed_expression: `She is` → `We are` — 쇼핑하러 갈 예정인 사람이 그녀라는 뜻에 맞아야 합니다. 정답 표현은 "She is"입니다.
- fixed_expression/fixed_expression: `She is` → `They are` — 쇼핑하러 갈 예정인 사람이 그녀라는 뜻에 맞아야 합니다. 정답 표현은 "She is"입니다.

---

## 92. novice Day 3 · slot 2

- topic: be going to
- format/kind: fill_blank / pattern
- source: Were you going to submit an application?
- pattern: was/were going to + 동사원형
- prompt: "was/were going to + 동사원형" 패턴을 사용해 "지원서를 제출하려고 했나요?"에 맞게 빈칸을 채우세요: ____ an application?
- correct answer: Were you going to submit
- explanation: 과거에 하려고 했던 계획을 묻는 형태를 써야 합니다. 정답 표현은 "Were you going to submit"입니다.
- feedback reason: 과거에 하려고 했던 계획을 묻는 형태를 써야 합니다. 정답 표현은 "Were you going to submit"입니다.

Choices:
- [distractor] Did you submit
- [distractor] Were you able to submit
- [distractor] Are you going to submit
- [correct] Were you going to submit

Mutation evidence:
- fixed_expression/fixed_expression: `Were you going to submit` → `Did you submit` — 과거에 하려고 했던 계획을 묻는 형태를 써야 합니다. 정답 표현은 "Were you going to submit"입니다.
- fixed_expression/fixed_expression: `Were you going to submit` → `Were you able to submit` — 과거에 하려고 했던 계획을 묻는 형태를 써야 합니다. 정답 표현은 "Were you going to submit"입니다.
- fixed_expression/fixed_expression: `Were you going to submit` → `Are you going to submit` — 과거에 하려고 했던 계획을 묻는 형태를 써야 합니다. 정답 표현은 "Were you going to submit"입니다.

---

## 93. novice Day 3 · slot 3

- topic: be going to
- format/kind: true_false / translation
- source: I am going to go shopping.
- pattern: be going to + 동사원형
- prompt: "쇼핑하러 갈 예정이에요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I am going to go shopping."
- correct answer: O
- explanation: 쇼핑하러 갈 예정이라는 뜻과 일치합니다. 정답 표현은 "I am going to go shopping."입니다.
- feedback reason: 쇼핑하러 갈 예정이라는 뜻과 일치합니다. 정답 표현은 "I am going to go shopping."입니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 94. novice Day 3 · slot 4

- topic: be going to
- format/kind: multiple_choice / pattern
- source: I was going to call you yesterday.
- pattern: was/were going to + 동사원형
- prompt: "was/were going to + 동사원형" 패턴을 사용해 "어제 전화하려고 했어요."에 맞는 영어 문장을 고르세요.
- correct answer: I was going to call you yesterday.
- explanation: 어제 전화하려고 했던 계획을 나타내야 합니다. 정답 표현은 "was going to call"입니다.
- feedback reason: 어제 전화하려고 했던 계획을 나타내야 합니다. 정답 표현은 "was going to call"입니다.

Choices:
- [distractor] I forgot to call you yesterday.
- [distractor] I was talking to you yesterday.
- [distractor] I called you yesterday.
- [correct] I was going to call you yesterday.

Mutation evidence:
- fixed_expression/fixed_expression: `was going to call` → `forgot to call` — 어제 전화하려고 했던 계획을 나타내야 합니다. 정답 표현은 "was going to call"입니다.
- fixed_expression/fixed_expression: `was going to call` → `was talking to` — 어제 전화하려고 했던 계획을 나타내야 합니다. 정답 표현은 "was going to call"입니다.
- fixed_expression/fixed_expression: `was going to call` → `called` — 어제 전화하려고 했던 계획을 나타내야 합니다. 정답 표현은 "was going to call"입니다.

---

## 95. novice Day 3 · slot 5

- topic: be going to
- format/kind: fill_blank / translation
- source: Were you going to submit an application?
- pattern: was/were going to + 동사원형
- prompt: "지원서를 제출하려고 했나요?"에 맞게 빈칸을 채우세요: Were you going to submit ____?
- correct answer: an application
- explanation: 제출하려던 대상이 지원서라는 뜻에 맞아야 합니다. 정답 표현은 "an application"입니다.
- feedback reason: 제출하려던 대상이 지원서라는 뜻에 맞아야 합니다. 정답 표현은 "an application"입니다.

Choices:
- [correct] an application
- [distractor] the report
- [distractor] your homework
- [distractor] a complaint

Mutation evidence:
- fixed_expression/fixed_expression: `an application` → `the report` — 제출하려던 대상이 지원서라는 뜻에 맞아야 합니다. 정답 표현은 "an application"입니다.
- fixed_expression/fixed_expression: `an application` → `your homework` — 제출하려던 대상이 지원서라는 뜻에 맞아야 합니다. 정답 표현은 "an application"입니다.
- fixed_expression/fixed_expression: `an application` → `a complaint` — 제출하려던 대상이 지원서라는 뜻에 맞아야 합니다. 정답 표현은 "an application"입니다.

---

## 96. novice Day 4 · slot 1

- topic: going to 구별
- format/kind: multiple_choice / pattern
- source: I am going to go home.
- pattern: be going to + 동사원형
- prompt: "be going to + 동사원형" 패턴을 사용해 "집에 갈 예정이에요."에 맞는 영어 문장을 고르세요.
- correct answer: I am going to go home.
- explanation: 집에 갈 예정이라는 미래 계획을 나타내야 합니다. 정답 표현은 "am going to go home"입니다.
- feedback reason: 집에 갈 예정이라는 미래 계획을 나타내야 합니다. 정답 표현은 "am going to go home"입니다.

Choices:
- [distractor] I was going to go home.
- [distractor] I am going home.
- [correct] I am going to go home.
- [distractor] I am going to stay home.

Mutation evidence:
- fixed_expression/fixed_expression: `am going to go home` → `was going to go home` — 집에 갈 예정이라는 미래 계획을 나타내야 합니다. 정답 표현은 "am going to go home"입니다.
- fixed_expression/fixed_expression: `am going to go home` → `am going home` — 집에 갈 예정이라는 미래 계획을 나타내야 합니다. 정답 표현은 "am going to go home"입니다.
- fixed_expression/fixed_expression: `am going to go home` → `am going to stay home` — 집에 갈 예정이라는 미래 계획을 나타내야 합니다. 정답 표현은 "am going to go home"입니다.

---

## 97. novice Day 4 · slot 2

- topic: going to 구별
- format/kind: fill_blank / translation
- source: Where are you going?
- pattern: be going + 장소
- prompt: "어디에 가고 있나요?"에 맞게 빈칸을 채우세요: ____ are you going?
- correct answer: Where
- explanation: 가는 장소를 묻는 의문사가 필요합니다. 정답 표현은 "Where"입니다.
- feedback reason: 가는 장소를 묻는 의문사가 필요합니다. 정답 표현은 "Where"입니다.

Choices:
- [distractor] How
- [distractor] When
- [correct] Where
- [distractor] Why

Mutation evidence:
- fixed_expression/fixed_expression: `Where` → `How` — 가는 장소를 묻는 의문사가 필요합니다. 정답 표현은 "Where"입니다.
- fixed_expression/fixed_expression: `Where` → `When` — 가는 장소를 묻는 의문사가 필요합니다. 정답 표현은 "Where"입니다.
- fixed_expression/fixed_expression: `Where` → `Why` — 가는 장소를 묻는 의문사가 필요합니다. 정답 표현은 "Where"입니다.

---

## 98. novice Day 4 · slot 3

- topic: going to 구별
- format/kind: true_false / translation
- source: I am going home.
- pattern: be going + 장소
- prompt: "집에 가는 중이에요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I am going to school."
- correct answer: X
- explanation: 제시된 뜻은 학교가 아니라 집에 가는 중이라는 내용입니다. 정답 표현은 "home"입니다.
- feedback reason: 제시된 뜻은 학교가 아니라 집에 가는 중이라는 내용입니다. 정답 표현은 "home"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `home` → `to school` — 제시된 뜻은 학교가 아니라 집에 가는 중이라는 내용입니다. 정답 표현은 "home"입니다.

---

## 99. novice Day 4 · slot 4

- topic: going to 구별
- format/kind: multiple_choice / pattern
- source: What are you going to do?
- pattern: be going to + 동사원형
- prompt: "be going to + 동사원형" 패턴을 사용해 "무엇을 할 예정인가요?"에 맞는 영어 문장을 고르세요.
- correct answer: What are you going to do?
- explanation: 앞으로 무엇을 할 예정인지 묻는 형태를 써야 합니다. 정답 표현은 "What are you going to do?"입니다.
- feedback reason: 앞으로 무엇을 할 예정인지 묻는 형태를 써야 합니다. 정답 표현은 "What are you going to do?"입니다.

Choices:
- [distractor] What did you decide to do?
- [distractor] What are you doing?
- [distractor] Where is she going?
- [correct] What are you going to do?

Mutation evidence:
- fixed_expression/fixed_expression: `What are you going to do?` → `What did you decide to do?` — 앞으로 무엇을 할 예정인지 묻는 형태를 써야 합니다. 정답 표현은 "What are you going to do?"입니다.
- fixed_expression/fixed_expression: `What are you going to do?` → `What are you doing?` — 앞으로 무엇을 할 예정인지 묻는 형태를 써야 합니다. 정답 표현은 "What are you going to do?"입니다.
- fixed_expression/fixed_expression: `What are you going to do?` → `Where is she going?` — 앞으로 무엇을 할 예정인지 묻는 형태를 써야 합니다. 정답 표현은 "What are you going to do?"입니다.

---

## 100. novice Day 4 · slot 5

- topic: going to 구별
- format/kind: fill_blank / translation
- source: I am going to go home.
- pattern: be going to + 동사원형
- prompt: "집에 갈 예정이에요."에 맞게 빈칸을 채우세요: I am going to ____.
- correct answer: go home
- explanation: 집에 갈 예정이라는 뜻에 맞는 행동을 골라야 합니다. 정답 표현은 "go home"입니다.
- feedback reason: 집에 갈 예정이라는 뜻에 맞는 행동을 골라야 합니다. 정답 표현은 "go home"입니다.

Choices:
- [distractor] call her
- [distractor] stay home
- [correct] go home
- [distractor] study tonight

Mutation evidence:
- fixed_expression/fixed_expression: `go home` → `call her` — 집에 갈 예정이라는 뜻에 맞는 행동을 골라야 합니다. 정답 표현은 "go home"입니다.
- fixed_expression/fixed_expression: `go home` → `stay home` — 집에 갈 예정이라는 뜻에 맞는 행동을 골라야 합니다. 정답 표현은 "go home"입니다.
- fixed_expression/fixed_expression: `go home` → `study tonight` — 집에 갈 예정이라는 뜻에 맞는 행동을 골라야 합니다. 정답 표현은 "go home"입니다.

---

## 101. novice Day 5 · slot 1

- topic: -ing·-ed 감정
- format/kind: multiple_choice / translation
- source: The class is boring.
- pattern: 감정 형용사 -ing
- prompt: "그 수업은 지루해요."에 맞는 영어 문장을 고르세요.
- correct answer: The class is boring.
- explanation: 지루하게 만드는 대상이 수업이라는 뜻에 맞아야 합니다. 정답 표현은 "The class"입니다.
- feedback reason: 지루하게 만드는 대상이 수업이라는 뜻에 맞아야 합니다. 정답 표현은 "The class"입니다.

Choices:
- [distractor] The book is boring.
- [correct] The class is boring.
- [distractor] The movie is boring.
- [distractor] The meeting is boring.

Mutation evidence:
- fixed_expression/fixed_expression: `The class` → `The book` — 지루하게 만드는 대상이 수업이라는 뜻에 맞아야 합니다. 정답 표현은 "The class"입니다.
- fixed_expression/fixed_expression: `The class` → `The movie` — 지루하게 만드는 대상이 수업이라는 뜻에 맞아야 합니다. 정답 표현은 "The class"입니다.
- fixed_expression/fixed_expression: `The class` → `The meeting` — 지루하게 만드는 대상이 수업이라는 뜻에 맞아야 합니다. 정답 표현은 "The class"입니다.

---

## 102. novice Day 5 · slot 2

- topic: -ing·-ed 감정
- format/kind: fill_blank / pattern
- source: The weather is depressing.
- pattern: 감정 형용사 -ing
- prompt: "감정 형용사 -ing" 패턴을 사용해 "그 날씨는 사람을 우울하게 만들어요."에 맞게 빈칸을 채우세요: The weather is ____.
- correct answer: depressing
- explanation: 감정을 일으키는 원인인 날씨에는 -ing 형태의 감정 형용사를 씁니다. 정답 표현은 "depressing"입니다.
- feedback reason: 감정을 일으키는 원인인 날씨에는 -ing 형태의 감정 형용사를 씁니다. 정답 표현은 "depressing"입니다.

Choices:
- [distractor] frustrating
- [distractor] frustrated
- [correct] depressing
- [distractor] depressed

Mutation evidence:
- fixed_expression/fixed_expression: `depressing` → `frustrating` — 감정을 일으키는 원인인 날씨에는 -ing 형태의 감정 형용사를 씁니다. 정답 표현은 "depressing"입니다.
- fixed_expression/fixed_expression: `depressing` → `frustrated` — 감정을 일으키는 원인인 날씨에는 -ing 형태의 감정 형용사를 씁니다. 정답 표현은 "depressing"입니다.
- fixed_expression/fixed_expression: `depressing` → `depressed` — 감정을 일으키는 원인인 날씨에는 -ing 형태의 감정 형용사를 씁니다. 정답 표현은 "depressing"입니다.

---

## 103. novice Day 5 · slot 3

- topic: -ing·-ed 감정
- format/kind: multiple_choice / pattern
- source: I was frustrated with English.
- pattern: 감정 형용사 -ed
- prompt: "감정 형용사 -ed" 패턴을 사용해 "나는 영어 때문에 좌절했어요."에 맞는 영어 문장을 고르세요.
- correct answer: I was frustrated with English.
- explanation: 감정을 느끼는 사람이 주어일 때는 -ed 형태의 감정 형용사를 씁니다. 정답 표현은 "I was frustrated with English."입니다.
- feedback reason: 감정을 느끼는 사람이 주어일 때는 -ed 형태의 감정 형용사를 씁니다. 정답 표현은 "I was frustrated with English."입니다.

Choices:
- [correct] I was frustrated with English.
- [distractor] I was satisfied with English.
- [distractor] English was frustrating for beginners.
- [distractor] The English class was depressing.

Mutation evidence:
- fixed_expression/fixed_expression: `I was frustrated with English.` → `I was satisfied with English.` — 감정을 느끼는 사람이 주어일 때는 -ed 형태의 감정 형용사를 씁니다. 정답 표현은 "I was frustrated with English."입니다.
- fixed_expression/fixed_expression: `I was frustrated with English.` → `English was frustrating for beginners.` — 감정을 느끼는 사람이 주어일 때는 -ed 형태의 감정 형용사를 씁니다. 정답 표현은 "I was frustrated with English."입니다.
- fixed_expression/fixed_expression: `I was frustrated with English.` → `The English class was depressing.` — 감정을 느끼는 사람이 주어일 때는 -ed 형태의 감정 형용사를 씁니다. 정답 표현은 "I was frustrated with English."입니다.

---

## 104. novice Day 5 · slot 4

- topic: -ing·-ed 감정
- format/kind: true_false / translation
- source: I'm tired of you.
- pattern: 감정 형용사 -ed
- prompt: "나는 너에게 지쳤어요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I'm tired of work."
- correct answer: X
- explanation: 제시된 뜻은 일에 지친 것이 아니라 상대에게 지쳤다는 내용입니다. 정답 표현은 "you"입니다.
- feedback reason: 제시된 뜻은 일에 지친 것이 아니라 상대에게 지쳤다는 내용입니다. 정답 표현은 "you"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `you` → `work` — 제시된 뜻은 일에 지친 것이 아니라 상대에게 지쳤다는 내용입니다. 정답 표현은 "you"입니다.

---

## 105. novice Day 5 · slot 5

- topic: -ing·-ed 감정
- format/kind: fill_blank / translation
- source: The class is boring.
- pattern: 감정 형용사 -ing
- prompt: "그 수업은 지루해요."에 맞게 빈칸을 채우세요: The class is ____.
- correct answer: boring
- explanation: 수업이 지루하게 만든다는 뜻에 맞는 감정 형용사를 골라야 합니다. 정답 표현은 "boring"입니다.
- feedback reason: 수업이 지루하게 만든다는 뜻에 맞는 감정 형용사를 골라야 합니다. 정답 표현은 "boring"입니다.

Choices:
- [distractor] exciting
- [correct] boring
- [distractor] relaxing
- [distractor] interesting

Mutation evidence:
- fixed_expression/fixed_expression: `boring` → `exciting` — 수업이 지루하게 만든다는 뜻에 맞는 감정 형용사를 골라야 합니다. 정답 표현은 "boring"입니다.
- fixed_expression/fixed_expression: `boring` → `relaxing` — 수업이 지루하게 만든다는 뜻에 맞는 감정 형용사를 골라야 합니다. 정답 표현은 "boring"입니다.
- fixed_expression/fixed_expression: `boring` → `interesting` — 수업이 지루하게 만든다는 뜻에 맞는 감정 형용사를 골라야 합니다. 정답 표현은 "boring"입니다.

---

## 106. novice Day 6 · slot 1

- topic: Yes/No 의문문
- format/kind: multiple_choice / translation
- source: Is she pretty?
- pattern: be/조동사 + 주어 ...?
- prompt: "그녀는 예쁜가요?"에 맞는 영어 문장을 고르세요.
- correct answer: Is she pretty?
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "pretty"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "pretty"입니다.

Choices:
- [distractor] Is she busy?
- [distractor] Is she tired?
- [distractor] Is she ready?
- [correct] Is she pretty?

Mutation evidence:
- fixed_expression/fixed_expression: `pretty` → `busy` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "pretty"입니다.
- fixed_expression/fixed_expression: `pretty` → `tired` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "pretty"입니다.
- fixed_expression/fixed_expression: `pretty` → `ready` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "pretty"입니다.

---

## 107. novice Day 6 · slot 2

- topic: Yes/No 의문문
- format/kind: fill_blank / pattern
- source: Can you play the piano?
- pattern: be/조동사 + 주어 ...?
- prompt: "be/조동사 + 주어 ...?" 패턴을 사용해 "피아노를 칠 수 있나요?"에 맞게 빈칸을 채우세요: ____ you play the piano?
- correct answer: Can
- explanation: "피아노를 칠 수 있나요?"는 현재의 능력을 묻기 때문에 문두에 조동사 "Can"을 두고, 주어 "you" 뒤에는 동사원형 "play"를 씁니다. 정답 표현은 "Can you play the piano?"입니다.
- feedback reason: "피아노를 칠 수 있나요?"는 현재의 능력을 묻기 때문에 문두에 조동사 "Can"을 두고, 주어 "you" 뒤에는 동사원형 "play"를 씁니다. 정답 표현은 "Can you play the piano?"입니다.

Choices:
- [distractor] Will
- [distractor] Did
- [distractor] Should
- [correct] Can

Mutation evidence:
- fixed_expression/fixed_expression: `Can` → `Will` — "피아노를 칠 수 있나요?"는 현재의 능력을 묻기 때문에 문두에 조동사 "Can"을 두고, 주어 "you" 뒤에는 동사원형 "play"를 씁니다. 정답 표현은 "Can you play the piano?"입니다.
- fixed_expression/fixed_expression: `Can` → `Did` — "피아노를 칠 수 있나요?"는 현재의 능력을 묻기 때문에 문두에 조동사 "Can"을 두고, 주어 "you" 뒤에는 동사원형 "play"를 씁니다. 정답 표현은 "Can you play the piano?"입니다.
- fixed_expression/fixed_expression: `Can` → `Should` — "피아노를 칠 수 있나요?"는 현재의 능력을 묻기 때문에 문두에 조동사 "Can"을 두고, 주어 "you" 뒤에는 동사원형 "play"를 씁니다. 정답 표현은 "Can you play the piano?"입니다.

---

## 108. novice Day 6 · slot 3

- topic: Yes/No 의문문
- format/kind: multiple_choice / pattern
- source: Does he live in Suwon?
- pattern: do/does/did + 주어 + 동사원형 ...?
- prompt: "do/does/did + 주어 + 동사원형 ...?" 패턴을 사용해 "그는 수원에 사나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Does he live in Suwon?
- explanation: 현재의 거주 여부를 묻는 일반동사 의문문에서는 3인칭 단수 주어 "he" 앞에 "Does"를 두고, 본동사 "live"는 원형으로 씁니다. 정답 표현은 "Does he live in Suwon?"입니다.
- feedback reason: 현재의 거주 여부를 묻는 일반동사 의문문에서는 3인칭 단수 주어 "he" 앞에 "Does"를 두고, 본동사 "live"는 원형으로 씁니다. 정답 표현은 "Does he live in Suwon?"입니다.

Choices:
- [correct] Does he live in Suwon?
- [distractor] Does she live in Suwon?
- [distractor] Is he living in Suwon?
- [distractor] Did he live in Suwon?

Mutation evidence:
- fixed_expression/fixed_expression: `Does he live in Suwon?` → `Does she live in Suwon?` — 현재의 거주 여부를 묻는 일반동사 의문문에서는 3인칭 단수 주어 "he" 앞에 "Does"를 두고, 본동사 "live"는 원형으로 씁니다. 정답 표현은 "Does he live in Suwon?"입니다.
- fixed_expression/fixed_expression: `Does he live in Suwon?` → `Is he living in Suwon?` — 현재의 거주 여부를 묻는 일반동사 의문문에서는 3인칭 단수 주어 "he" 앞에 "Does"를 두고, 본동사 "live"는 원형으로 씁니다. 정답 표현은 "Does he live in Suwon?"입니다.
- fixed_expression/fixed_expression: `Does he live in Suwon?` → `Did he live in Suwon?` — 현재의 거주 여부를 묻는 일반동사 의문문에서는 3인칭 단수 주어 "he" 앞에 "Does"를 두고, 본동사 "live"는 원형으로 씁니다. 정답 표현은 "Does he live in Suwon?"입니다.

---

## 109. novice Day 6 · slot 4

- topic: Yes/No 의문문
- format/kind: true_false / translation
- source: Did you have dinner?
- pattern: do/does/did + 주어 + 동사원형 ...?
- prompt: "저녁을 먹었나요?"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "Did you have breakfast?"
- correct answer: X
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "dinner"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "dinner"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `dinner` → `breakfast` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "dinner"입니다.

---

## 110. novice Day 6 · slot 5

- topic: Yes/No 의문문
- format/kind: fill_blank / translation
- source: Can you play the piano?
- pattern: be/조동사 + 주어 ...?
- prompt: "피아노를 칠 수 있나요?"에 맞게 빈칸을 채우세요: Can you play ____?
- correct answer: the piano
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "the piano"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "the piano"입니다.

Choices:
- [correct] the piano
- [distractor] the drums
- [distractor] the guitar
- [distractor] the violin

Mutation evidence:
- fixed_expression/fixed_expression: `the piano` → `the drums` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "the piano"입니다.
- fixed_expression/fixed_expression: `the piano` → `the guitar` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "the piano"입니다.
- fixed_expression/fixed_expression: `the piano` → `the violin` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "the piano"입니다.

---

## 111. novice Day 7 · slot 1

- topic: 의문사+일반 의문문
- format/kind: multiple_choice / translation
- source: Why do you study English?
- pattern: Wh- + be/조동사 + 주어 ...?
- prompt: "왜 영어를 공부하나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Why do you study English?
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.

Choices:
- [distractor] Why do you study Korean?
- [distractor] Why do you study Spanish?
- [correct] Why do you study English?
- [distractor] Why do you study French?

Mutation evidence:
- fixed_expression/fixed_expression: `English` → `Korean` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.
- fixed_expression/fixed_expression: `English` → `Spanish` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.
- fixed_expression/fixed_expression: `English` → `French` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.

---

## 112. novice Day 7 · slot 2

- topic: 의문사+일반 의문문
- format/kind: fill_blank / pattern
- source: Why do you study English?
- pattern: Wh- + be/조동사 + 주어 ...?
- prompt: "Wh- + be/조동사 + 주어 ...?" 패턴을 사용해 "왜 영어를 공부하나요?"에 맞게 빈칸을 채우세요: ____ study English?
- correct answer: Why do you
- explanation: 직접 Wh- 의문문은 의문사 뒤에 조동사와 주어를 둡니다. 정답은 "Why do you"입니다.
- feedback reason: 직접 Wh- 의문문은 의문사 뒤에 조동사와 주어를 둡니다. 정답은 "Why do you"입니다.

Choices:
- [distractor] Do you
- [distractor] Can you
- [correct] Why do you
- [distractor] Would you like to

Mutation evidence:
- fixed_expression/fixed_expression: `Why do you` → `Do you` — 직접 Wh- 의문문은 의문사 뒤에 조동사와 주어를 둡니다. 정답은 "Why do you"입니다.
- fixed_expression/fixed_expression: `Why do you` → `Can you` — 직접 Wh- 의문문은 의문사 뒤에 조동사와 주어를 둡니다. 정답은 "Why do you"입니다.
- fixed_expression/fixed_expression: `Why do you` → `Would you like to` — 직접 Wh- 의문문은 의문사 뒤에 조동사와 주어를 둡니다. 정답은 "Why do you"입니다.

---

## 113. novice Day 7 · slot 3

- topic: 의문사+일반 의문문
- format/kind: multiple_choice / pattern
- source: Why do you study English?
- pattern: Wh- + be/조동사 + 주어 ...?
- prompt: "Wh- + be/조동사 + 주어 ...?" 패턴을 사용해 "왜 영어를 공부하나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Why do you study English?
- explanation: 제시된 뜻과 시제에 맞는 조동사는 "do"입니다.
- feedback reason: 제시된 뜻과 시제에 맞는 조동사는 "do"입니다.

Choices:
- [distractor] Why did you study English?
- [distractor] Why will you study English?
- [correct] Why do you study English?
- [distractor] Why can you study English?

Mutation evidence:
- wh_auxiliary_form/wh_auxiliary_form: `do` → `did` — 제시된 뜻과 시제에 맞는 조동사는 "do"입니다.
- wh_auxiliary_form/wh_auxiliary_form: `do` → `will` — 제시된 뜻과 시제에 맞는 조동사는 "do"입니다.
- wh_auxiliary_form/wh_auxiliary_form: `do` → `can` — 제시된 뜻과 시제에 맞는 조동사는 "do"입니다.

---

## 114. novice Day 7 · slot 4

- topic: 의문사+일반 의문문
- format/kind: true_false / translation
- source: Why do you study English?
- pattern: Wh- + be/조동사 + 주어 ...?
- prompt: "왜 영어를 공부하나요?"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "Why do you teach English?"
- correct answer: X
- explanation: 바뀐 문장은 영어를 가르치는 이유를 묻기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.
- feedback reason: 바뀐 문장은 영어를 가르치는 이유를 묻기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `study` → `teach` — 바뀐 문장은 영어를 가르치는 이유를 묻기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.

---

## 115. novice Day 7 · slot 5

- topic: 의문사+일반 의문문
- format/kind: fill_blank / translation
- source: Why do you study English?
- pattern: Wh- + be/조동사 + 주어 ...?
- prompt: "왜 영어를 공부하나요?"에 맞게 빈칸을 채우세요: ____ do you study English?
- correct answer: Why
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "Why"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "Why"입니다.

Choices:
- [distractor] When
- [distractor] Where
- [correct] Why
- [distractor] How

Mutation evidence:
- fixed_expression/fixed_expression: `Why` → `When` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Why"입니다.
- fixed_expression/fixed_expression: `Why` → `Where` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Why"입니다.
- fixed_expression/fixed_expression: `Why` → `How` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Why"입니다.

---

## 116. novice Day 8 · slot 1

- topic: 의문사가 주어인 경우
- format/kind: multiple_choice / translation
- source: Who fought?
- pattern: Who/What + 동사 ...?
- prompt: "누가 싸웠나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Who fought?
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "fought"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "fought"입니다.

Choices:
- [distractor] Who left?
- [distractor] Who called?
- [correct] Who fought?
- [distractor] Who waited?

Mutation evidence:
- fixed_expression/fixed_expression: `fought` → `left` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "fought"입니다.
- fixed_expression/fixed_expression: `fought` → `called` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "fought"입니다.
- fixed_expression/fixed_expression: `fought` → `waited` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "fought"입니다.

---

## 117. novice Day 8 · slot 2

- topic: 의문사가 주어인 경우
- format/kind: fill_blank / translation
- source: What made you like this?
- pattern: Who/What + 동사 ...?
- prompt: "무엇 때문에 이것을 좋아하게 됐나요?"에 맞게 빈칸을 채우세요: ____ like this?
- correct answer: What made you
- explanation: 어떤 원인이 이것을 좋아하게 만들었는지 물을 때는 "What made + 목적어 + 동사원형"을 씁니다. 정답 표현은 "What made you"입니다.
- feedback reason: 어떤 원인이 이것을 좋아하게 만들었는지 물을 때는 "What made + 목적어 + 동사원형"을 씁니다. 정답 표현은 "What made you"입니다.

Choices:
- [correct] What made you
- [distractor] Where did you learn to
- [distractor] When did you start to
- [distractor] Who taught you to

Mutation evidence:
- fixed_expression/fixed_expression: `What made you` → `Where did you learn to` — 어떤 원인이 이것을 좋아하게 만들었는지 물을 때는 "What made + 목적어 + 동사원형"을 씁니다. 정답 표현은 "What made you"입니다.
- fixed_expression/fixed_expression: `What made you` → `When did you start to` — 어떤 원인이 이것을 좋아하게 만들었는지 물을 때는 "What made + 목적어 + 동사원형"을 씁니다. 정답 표현은 "What made you"입니다.
- fixed_expression/fixed_expression: `What made you` → `Who taught you to` — 어떤 원인이 이것을 좋아하게 만들었는지 물을 때는 "What made + 목적어 + 동사원형"을 씁니다. 정답 표현은 "What made you"입니다.

---

## 118. novice Day 8 · slot 3

- topic: 의문사가 주어인 경우
- format/kind: multiple_choice / pattern
- source: Who fought?
- pattern: Who/What + 동사 ...?
- prompt: "Who/What + 동사 ...?" 패턴을 사용해 "누가 싸웠나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Who fought?
- explanation: 제시된 뜻은 싸운 대상·원인·이유가 아니라 싸운 사람이 누구인지 묻습니다. 의문사 "Who"가 주어이므로 "did"를 덧붙이지 않고 바로 과거동사 "fought"를 씁니다. 정답 표현은 "Who fought?"입니다.
- feedback reason: 제시된 뜻은 싸운 대상·원인·이유가 아니라 싸운 사람이 누구인지 묻습니다. 의문사 "Who"가 주어이므로 "did"를 덧붙이지 않고 바로 과거동사 "fought"를 씁니다. 정답 표현은 "Who fought?"입니다.

Choices:
- [distractor] Who did they fight?
- [distractor] What caused the fight?
- [distractor] Why did they fight?
- [correct] Who fought?

Mutation evidence:
- fixed_expression/fixed_expression: `Who fought?` → `Who did they fight?` — 제시된 뜻은 싸운 대상·원인·이유가 아니라 싸운 사람이 누구인지 묻습니다. 의문사 "Who"가 주어이므로 "did"를 덧붙이지 않고 바로 과거동사 "fought"를 씁니다. 정답 표현은 "Who fought?"입니다.
- fixed_expression/fixed_expression: `Who fought?` → `What caused the fight?` — 제시된 뜻은 싸운 대상·원인·이유가 아니라 싸운 사람이 누구인지 묻습니다. 의문사 "Who"가 주어이므로 "did"를 덧붙이지 않고 바로 과거동사 "fought"를 씁니다. 정답 표현은 "Who fought?"입니다.
- fixed_expression/fixed_expression: `Who fought?` → `Why did they fight?` — 제시된 뜻은 싸운 대상·원인·이유가 아니라 싸운 사람이 누구인지 묻습니다. 의문사 "Who"가 주어이므로 "did"를 덧붙이지 않고 바로 과거동사 "fought"를 씁니다. 정답 표현은 "Who fought?"입니다.

---

## 119. novice Day 8 · slot 4

- topic: 의문사가 주어인 경우
- format/kind: true_false / pattern
- source: What happened?
- pattern: Who/What + 동사 ...?
- prompt: "Who/What + 동사 ...?" 패턴을 사용해 "무슨 일이 있었나요?"에 맞는 문장이면 O, 아니면 X를 고르세요: "What happened?"
- correct answer: O
- explanation: "What"이 문장의 주어이고 과거동사 "happened"가 바로 뒤에 오는 의문사 주어 문장으로, "무슨 일이 있었나요?"라는 뜻과 일치합니다.
- feedback reason: "What"이 문장의 주어이고 과거동사 "happened"가 바로 뒤에 오는 의문사 주어 문장으로, "무슨 일이 있었나요?"라는 뜻과 일치합니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 120. novice Day 8 · slot 5

- topic: 의문사가 주어인 경우
- format/kind: fill_blank / translation
- source: What made you like this?
- pattern: Who/What + 동사 ...?
- prompt: "무엇 때문에 이것을 좋아하게 됐나요?"에 맞게 빈칸을 채우세요: What made you like ____?
- correct answer: this
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "this"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "this"입니다.

Choices:
- [correct] this
- [distractor] the movie
- [distractor] the song
- [distractor] that

Mutation evidence:
- fixed_expression/fixed_expression: `this` → `the movie` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "this"입니다.
- fixed_expression/fixed_expression: `this` → `the song` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "this"입니다.
- fixed_expression/fixed_expression: `this` → `that` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "this"입니다.

---

## 121. novice Day 9 · slot 1

- topic: 현재완료 기본
- format/kind: multiple_choice / translation
- source: I have been to France.
- pattern: have/has + p.p.
- prompt: "프랑스에 가 본 적이 있어요."에 맞는 영어 문장을 고르세요.
- correct answer: I have been to France.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "France"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "France"입니다.

Choices:
- [correct] I have been to France.
- [distractor] I have been to Italy.
- [distractor] I have been to Japan.
- [distractor] I have been to Canada.

Mutation evidence:
- fixed_expression/fixed_expression: `France` → `Italy` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "France"입니다.
- fixed_expression/fixed_expression: `France` → `Japan` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "France"입니다.
- fixed_expression/fixed_expression: `France` → `Canada` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "France"입니다.

---

## 122. novice Day 9 · slot 2

- topic: 현재완료 기본
- format/kind: fill_blank / pattern
- source: I have been to France.
- pattern: have/has + p.p.
- prompt: "have/has + p.p." 패턴을 사용해 "프랑스에 가 본 적이 있어요."에 맞게 빈칸을 채우세요: I ____ to France.
- correct answer: have been
- explanation: 현재완료는 have/has 뒤에 과거분사를 두는 형태입니다. 정답은 "have been"입니다.
- feedback reason: 현재완료는 have/has 뒤에 과거분사를 두는 형태입니다. 정답은 "have been"입니다.

Choices:
- [distractor] used to go
- [distractor] was traveling
- [correct] have been
- [distractor] went

Mutation evidence:
- fixed_expression/fixed_expression: `have been` → `used to go` — 현재완료는 have/has 뒤에 과거분사를 두는 형태입니다. 정답은 "have been"입니다.
- fixed_expression/fixed_expression: `have been` → `was traveling` — 현재완료는 have/has 뒤에 과거분사를 두는 형태입니다. 정답은 "have been"입니다.
- fixed_expression/fixed_expression: `have been` → `went` — 현재완료는 have/has 뒤에 과거분사를 두는 형태입니다. 정답은 "have been"입니다.

---

## 123. novice Day 9 · slot 3

- topic: 현재완료 기본
- format/kind: multiple_choice / pattern
- source: He has lived in Busan for 10 years.
- pattern: have/has + p.p.
- prompt: "have/has + p.p." 패턴을 사용해 "그는 부산에서 10년 동안 살아왔어요."에 맞는 영어 문장을 고르세요.
- correct answer: He has lived in Busan for 10 years.
- explanation: 현재완료는 주어 He 뒤에 has와 과거분사를 씁니다. 정답은 "has lived"입니다.
- feedback reason: 현재완료는 주어 He 뒤에 has와 과거분사를 씁니다. 정답은 "has lived"입니다.

Choices:
- [distractor] He will live in Busan for 10 years.
- [distractor] He lived in Busan for 10 years.
- [distractor] He used to live in Busan for 10 years.
- [correct] He has lived in Busan for 10 years.

Mutation evidence:
- fixed_expression/fixed_expression: `has lived` → `will live` — 현재완료는 주어 He 뒤에 has와 과거분사를 씁니다. 정답은 "has lived"입니다.
- fixed_expression/fixed_expression: `has lived` → `lived` — 현재완료는 주어 He 뒤에 has와 과거분사를 씁니다. 정답은 "has lived"입니다.
- fixed_expression/fixed_expression: `has lived` → `used to live` — 현재완료는 주어 He 뒤에 has와 과거분사를 씁니다. 정답은 "has lived"입니다.

---

## 124. novice Day 9 · slot 4

- topic: 현재완료 기본
- format/kind: true_false / translation
- source: Have we met before?
- pattern: have/has + p.p.
- prompt: "우리 전에 만난 적 있나요?"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "Have we met before?"
- correct answer: O
- explanation: 현재완료 의문문 "Have we met before?"는 제시된 한국어 뜻과 일치합니다. 정답은 O입니다.
- feedback reason: 현재완료 의문문 "Have we met before?"는 제시된 한국어 뜻과 일치합니다. 정답은 O입니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 125. novice Day 9 · slot 5

- topic: 현재완료 기본
- format/kind: fill_blank / translation
- source: He has lived in Busan for 10 years.
- pattern: have/has + p.p.
- prompt: "그는 부산에서 10년 동안 살아왔어요."에 맞게 빈칸을 채우세요: He has lived in Busan for ____.
- correct answer: 10 years
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "10 years"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "10 years"입니다.

Choices:
- [distractor] 20 years
- [distractor] two years
- [distractor] five years
- [correct] 10 years

Mutation evidence:
- fixed_expression/fixed_expression: `10 years` → `20 years` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "10 years"입니다.
- fixed_expression/fixed_expression: `10 years` → `two years` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "10 years"입니다.
- fixed_expression/fixed_expression: `10 years` → `five years` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "10 years"입니다.

---

## 126. novice Day 10 · slot 1

- topic: 현재완료 상태·진행
- format/kind: multiple_choice / pattern
- source: She has been a nurse.
- pattern: have/has been + 형용사·명사
- prompt: "have/has been + 형용사·명사" 패턴을 사용해 "그녀는 계속 간호사로 일해 왔어요."에 맞는 영어 문장을 고르세요.
- correct answer: She has been a nurse.
- explanation: 계속 유지된 직업 상태를 명사로 나타내야 합니다. 정답 표현은 "a nurse"입니다.
- feedback reason: 계속 유지된 직업 상태를 명사로 나타내야 합니다. 정답 표현은 "a nurse"입니다.

Choices:
- [distractor] She has been nursing a patient.
- [distractor] She has been very tired.
- [distractor] She has been at the hospital.
- [correct] She has been a nurse.

Mutation evidence:
- fixed_expression/fixed_expression: `a nurse` → `nursing a patient` — 계속 유지된 직업 상태를 명사로 나타내야 합니다. 정답 표현은 "a nurse"입니다.
- fixed_expression/fixed_expression: `a nurse` → `very tired` — 계속 유지된 직업 상태를 명사로 나타내야 합니다. 정답 표현은 "a nurse"입니다.
- fixed_expression/fixed_expression: `a nurse` → `at the hospital` — 계속 유지된 직업 상태를 명사로 나타내야 합니다. 정답 표현은 "a nurse"입니다.

---

## 127. novice Day 10 · slot 2

- topic: 현재완료 상태·진행
- format/kind: fill_blank / translation
- source: I have been studying English hard.
- pattern: have/has been + -ing
- prompt: "계속 영어를 열심히 공부해 오고 있어요."에 맞게 빈칸을 채우세요: I have been ____.
- correct answer: studying English hard
- explanation: 계속 영어를 열심히 공부해 왔다는 뜻에 맞아야 합니다. 정답 표현은 "studying English hard"입니다.
- feedback reason: 계속 영어를 열심히 공부해 왔다는 뜻에 맞아야 합니다. 정답 표현은 "studying English hard"입니다.

Choices:
- [distractor] waiting for the bus
- [correct] studying English hard
- [distractor] drawing a picture
- [distractor] working at the office

Mutation evidence:
- fixed_expression/fixed_expression: `studying English hard` → `waiting for the bus` — 계속 영어를 열심히 공부해 왔다는 뜻에 맞아야 합니다. 정답 표현은 "studying English hard"입니다.
- fixed_expression/fixed_expression: `studying English hard` → `drawing a picture` — 계속 영어를 열심히 공부해 왔다는 뜻에 맞아야 합니다. 정답 표현은 "studying English hard"입니다.
- fixed_expression/fixed_expression: `studying English hard` → `working at the office` — 계속 영어를 열심히 공부해 왔다는 뜻에 맞아야 합니다. 정답 표현은 "studying English hard"입니다.

---

## 128. novice Day 10 · slot 3

- topic: 현재완료 상태·진행
- format/kind: true_false / translation
- source: I have always been tired.
- pattern: have/has been + 형용사·명사
- prompt: "나는 줄곧 피곤했어요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I have always been busy."
- correct answer: X
- explanation: "busy"는 "바쁜", "tired"는 "피곤한"이라는 뜻입니다. 제시된 문장은 "줄곧 바빴다"는 내용이므로 "나는 줄곧 피곤했어요."와 다릅니다. 정답은 X입니다.
- feedback reason: "busy"는 "바쁜", "tired"는 "피곤한"이라는 뜻입니다. 제시된 문장은 "줄곧 바빴다"는 내용이므로 "나는 줄곧 피곤했어요."와 다릅니다. 정답은 X입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `tired` → `busy` — "busy"는 "바쁜", "tired"는 "피곤한"이라는 뜻입니다. 제시된 문장은 "줄곧 바빴다"는 내용이므로 "나는 줄곧 피곤했어요."와 다릅니다. 정답은 X입니다.

---

## 129. novice Day 10 · slot 4

- topic: 현재완료 상태·진행
- format/kind: multiple_choice / pattern
- source: My friend has been drawing a picture.
- pattern: have/has been + -ing
- prompt: "have/has been + -ing" 패턴을 사용해 "내 친구는 계속 그림을 그리고 있어요."에 맞는 영어 문장을 고르세요.
- correct answer: My friend has been drawing a picture.
- explanation: 과거부터 지금까지 계속 그림을 그려 온 동작을 나타내야 합니다. 정답 표현은 "has been drawing"입니다.
- feedback reason: 과거부터 지금까지 계속 그림을 그려 온 동작을 나타내야 합니다. 정답 표현은 "has been drawing"입니다.

Choices:
- [correct] My friend has been drawing a picture.
- [distractor] My friend is drawing a picture.
- [distractor] My friend will draw a picture.
- [distractor] My friend drew a picture.

Mutation evidence:
- fixed_expression/fixed_expression: `has been drawing` → `is drawing` — 과거부터 지금까지 계속 그림을 그려 온 동작을 나타내야 합니다. 정답 표현은 "has been drawing"입니다.
- fixed_expression/fixed_expression: `has been drawing` → `will draw` — 과거부터 지금까지 계속 그림을 그려 온 동작을 나타내야 합니다. 정답 표현은 "has been drawing"입니다.
- fixed_expression/fixed_expression: `has been drawing` → `drew` — 과거부터 지금까지 계속 그림을 그려 온 동작을 나타내야 합니다. 정답 표현은 "has been drawing"입니다.

---

## 130. novice Day 10 · slot 5

- topic: 현재완료 상태·진행
- format/kind: fill_blank / translation
- source: I have always been tired.
- pattern: have/has been + 형용사·명사
- prompt: "나는 줄곧 피곤했어요."에 맞게 빈칸을 채우세요: I have ____ been tired.
- correct answer: always
- explanation: 줄곧 피곤했다는 뜻에 맞는 빈도 부사를 골라야 합니다. 정답 표현은 "always"입니다.
- feedback reason: 줄곧 피곤했다는 뜻에 맞는 빈도 부사를 골라야 합니다. 정답 표현은 "always"입니다.

Choices:
- [distractor] often
- [distractor] sometimes
- [distractor] recently
- [correct] always

Mutation evidence:
- fixed_expression/fixed_expression: `always` → `often` — 줄곧 피곤했다는 뜻에 맞는 빈도 부사를 골라야 합니다. 정답 표현은 "always"입니다.
- fixed_expression/fixed_expression: `always` → `sometimes` — 줄곧 피곤했다는 뜻에 맞는 빈도 부사를 골라야 합니다. 정답 표현은 "always"입니다.
- fixed_expression/fixed_expression: `always` → `recently` — 줄곧 피곤했다는 뜻에 맞는 빈도 부사를 골라야 합니다. 정답 표현은 "always"입니다.

---

## 131. novice Day 11 · slot 1

- topic: 의문사 확장 표현
- format/kind: multiple_choice / translation
- source: What kind of movie do you like?
- pattern: what kind of / which / whose + 명사
- prompt: "어떤 종류의 영화를 좋아하나요?"에 맞는 영어 문장을 고르세요.
- correct answer: What kind of movie do you like?
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "What kind of movie"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "What kind of movie"입니다.

Choices:
- [distractor] How many movies do you like?
- [correct] What kind of movie do you like?
- [distractor] Whose movie do you like?
- [distractor] Which movie do you like?

Mutation evidence:
- fixed_expression/fixed_expression: `What kind of movie` → `How many movies` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "What kind of movie"입니다.
- fixed_expression/fixed_expression: `What kind of movie` → `Whose movie` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "What kind of movie"입니다.
- fixed_expression/fixed_expression: `What kind of movie` → `Which movie` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "What kind of movie"입니다.

---

## 132. novice Day 11 · slot 2

- topic: 의문사 확장 표현
- format/kind: fill_blank / pattern
- source: How many bottles of soju can you drink?
- pattern: how many / how long / how far / how tall
- prompt: "how many / how long / how far / how tall" 패턴을 사용해 "소주를 몇 병 마실 수 있나요?"에 맞게 빈칸을 채우세요: ____ can you drink?
- correct answer: How many bottles of soju
- explanation: 셀 수 있는 수량을 물을 때는 how many와 복수 명사를 사용합니다. 정답은 "How many bottles of soju"입니다.
- feedback reason: 셀 수 있는 수량을 물을 때는 how many와 복수 명사를 사용합니다. 정답은 "How many bottles of soju"입니다.

Choices:
- [correct] How many bottles of soju
- [distractor] How much soju
- [distractor] Which kind of soju
- [distractor] What brand of soju

Mutation evidence:
- fixed_expression/fixed_expression: `How many bottles of soju` → `How much soju` — 셀 수 있는 수량을 물을 때는 how many와 복수 명사를 사용합니다. 정답은 "How many bottles of soju"입니다.
- fixed_expression/fixed_expression: `How many bottles of soju` → `Which kind of soju` — 셀 수 있는 수량을 물을 때는 how many와 복수 명사를 사용합니다. 정답은 "How many bottles of soju"입니다.
- fixed_expression/fixed_expression: `How many bottles of soju` → `What brand of soju` — 셀 수 있는 수량을 물을 때는 how many와 복수 명사를 사용합니다. 정답은 "How many bottles of soju"입니다.

---

## 133. novice Day 11 · slot 3

- topic: 의문사 확장 표현
- format/kind: multiple_choice / pattern
- source: Whose car is this?
- pattern: what kind of / which / whose + 명사
- prompt: "what kind of / which / whose + 명사" 패턴을 사용해 "이것은 누구의 차인가요?"에 맞는 영어 문장을 고르세요.
- correct answer: Whose car is this?
- explanation: "Who owns this car?"도 소유자를 묻는 뜻은 비슷하지만, 요구된 "whose + 명사" 구조를 사용하지 않습니다. 따라서 정답은 "Whose car is this?"입니다. "Does this car belong to you?"와 "Is this your car?"는 차가 상대의 것인지 묻는 예/아니요 질문입니다.
- feedback reason: "Who owns this car?"도 소유자를 묻는 뜻은 비슷하지만, 요구된 "whose + 명사" 구조를 사용하지 않습니다. 따라서 정답은 "Whose car is this?"입니다. "Does this car belong to you?"와 "Is this your car?"는 차가 상대의 것인지 묻는 예/아니요 질문입니다.

Choices:
- [correct] Whose car is this?
- [distractor] Who owns this car?
- [distractor] Does this car belong to you?
- [distractor] Is this your car?

Mutation evidence:
- fixed_expression/fixed_expression: `Whose car is this?` → `Who owns this car?` — "Who owns this car?"도 소유자를 묻는 뜻은 비슷하지만, 요구된 "whose + 명사" 구조를 사용하지 않습니다. 따라서 정답은 "Whose car is this?"입니다. "Does this car belong to you?"와 "Is this your car?"는 차가 상대의 것인지 묻는 예/아니요 질문입니다.
- fixed_expression/fixed_expression: `Whose car is this?` → `Does this car belong to you?` — "Who owns this car?"도 소유자를 묻는 뜻은 비슷하지만, 요구된 "whose + 명사" 구조를 사용하지 않습니다. 따라서 정답은 "Whose car is this?"입니다. "Does this car belong to you?"와 "Is this your car?"는 차가 상대의 것인지 묻는 예/아니요 질문입니다.
- fixed_expression/fixed_expression: `Whose car is this?` → `Is this your car?` — "Who owns this car?"도 소유자를 묻는 뜻은 비슷하지만, 요구된 "whose + 명사" 구조를 사용하지 않습니다. 따라서 정답은 "Whose car is this?"입니다. "Does this car belong to you?"와 "Is this your car?"는 차가 상대의 것인지 묻는 예/아니요 질문입니다.

---

## 134. novice Day 11 · slot 4

- topic: 의문사 확장 표현
- format/kind: true_false / translation
- source: How many bottles of soju can you drink?
- pattern: how many / how long / how far / how tall
- prompt: "소주를 몇 병 마실 수 있나요?"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "How many bottles of beer can you drink?"
- correct answer: X
- explanation: 바뀐 문장은 맥주의 양을 묻기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.
- feedback reason: 바뀐 문장은 맥주의 양을 묻기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `soju` → `beer` — 바뀐 문장은 맥주의 양을 묻기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.

---

## 135. novice Day 11 · slot 5

- topic: 의문사 확장 표현
- format/kind: fill_blank / translation
- source: What kind of movie do you like?
- pattern: what kind of / which / whose + 명사
- prompt: "어떤 종류의 영화를 좋아하나요?"에 맞게 빈칸을 채우세요: What kind of ____ do you like?
- correct answer: movie
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "movie"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "movie"입니다.

Choices:
- [correct] movie
- [distractor] books
- [distractor] music
- [distractor] sports

Mutation evidence:
- fixed_expression/fixed_expression: `movie` → `books` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "movie"입니다.
- fixed_expression/fixed_expression: `movie` → `music` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "movie"입니다.
- fixed_expression/fixed_expression: `movie` → `sports` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "movie"입니다.

---

## 136. novice Day 13 · slot 1

- topic: 비교급·최상급
- format/kind: multiple_choice / translation
- source: I am better than you.
- pattern: 형용사-er / more + 형용사 + than
- prompt: "나는 너보다 더 잘해요."에 맞는 영어 문장을 고르세요.
- correct answer: I am better than you.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "you"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "you"입니다.

Choices:
- [distractor] I am better than him.
- [distractor] I am better than them.
- [correct] I am better than you.
- [distractor] I am better than her.

Mutation evidence:
- fixed_expression/fixed_expression: `you` → `him` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "you"입니다.
- fixed_expression/fixed_expression: `you` → `them` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "you"입니다.
- fixed_expression/fixed_expression: `you` → `her` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "you"입니다.

---

## 137. novice Day 13 · slot 2

- topic: 비교급·최상급
- format/kind: fill_blank / pattern
- source: The test was more difficult than I expected.
- pattern: 형용사-er / more + 형용사 + than
- prompt: "형용사-er / more + 형용사 + than" 패턴을 사용해 "시험은 예상보다 더 어려웠어요."에 맞게 빈칸을 채우세요: The test was ____.
- correct answer: more difficult than I expected
- explanation: 비교급은 more + 형용사 + than 형태로 비교 대상을 나타냅니다. 정답은 "more difficult than I expected"입니다.
- feedback reason: 비교급은 more + 형용사 + than 형태로 비교 대상을 나타냅니다. 정답은 "more difficult than I expected"입니다.

Choices:
- [distractor] too difficult to finish
- [correct] more difficult than I expected
- [distractor] difficult for me
- [distractor] not difficult at all

Mutation evidence:
- fixed_expression/fixed_expression: `more difficult than I expected` → `too difficult to finish` — 비교급은 more + 형용사 + than 형태로 비교 대상을 나타냅니다. 정답은 "more difficult than I expected"입니다.
- fixed_expression/fixed_expression: `more difficult than I expected` → `difficult for me` — 비교급은 more + 형용사 + than 형태로 비교 대상을 나타냅니다. 정답은 "more difficult than I expected"입니다.
- fixed_expression/fixed_expression: `more difficult than I expected` → `not difficult at all` — 비교급은 more + 형용사 + than 형태로 비교 대상을 나타냅니다. 정답은 "more difficult than I expected"입니다.

---

## 138. novice Day 13 · slot 3

- topic: 비교급·최상급
- format/kind: multiple_choice / pattern
- source: What is the longest river in the world?
- pattern: the + 형용사-est / the most + 형용사
- prompt: "the + 형용사-est / the most + 형용사" 패턴을 사용해 "세계에서 가장 긴 강은 무엇인가요?"에 맞는 영어 문장을 고르세요.
- correct answer: What is the longest river in the world?
- explanation: 최상급은 the + 형용사-est 형태로 나타냅니다. 정답은 "the longest river in the world"입니다.
- feedback reason: 최상급은 the + 형용사-est 형태로 나타냅니다. 정답은 "the longest river in the world"입니다.

Choices:
- [distractor] What is your favorite river?
- [distractor] What is a famous river in Africa?
- [distractor] What is the name of this river?
- [correct] What is the longest river in the world?

Mutation evidence:
- fixed_expression/fixed_expression: `the longest river in the world` → `your favorite river` — 최상급은 the + 형용사-est 형태로 나타냅니다. 정답은 "the longest river in the world"입니다.
- fixed_expression/fixed_expression: `the longest river in the world` → `a famous river in Africa` — 최상급은 the + 형용사-est 형태로 나타냅니다. 정답은 "the longest river in the world"입니다.
- fixed_expression/fixed_expression: `the longest river in the world` → `the name of this river` — 최상급은 the + 형용사-est 형태로 나타냅니다. 정답은 "the longest river in the world"입니다.

---

## 139. novice Day 13 · slot 4

- topic: 비교급·최상급
- format/kind: true_false / translation
- source: This movie is the most interesting.
- pattern: the + 형용사-est / the most + 형용사
- prompt: "이 영화가 가장 재미있어요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "This book is the most interesting."
- correct answer: X
- explanation: 바뀐 문장은 책을 가리키기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.
- feedback reason: 바뀐 문장은 책을 가리키기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `movie` → `book` — 바뀐 문장은 책을 가리키기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.

---

## 140. novice Day 13 · slot 5

- topic: 비교급·최상급
- format/kind: fill_blank / translation
- source: The test was more difficult than I expected.
- pattern: 형용사-er / more + 형용사 + than
- prompt: "시험은 예상보다 더 어려웠어요."에 맞게 빈칸을 채우세요: ____ was more difficult than I expected.
- correct answer: The test
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "The test"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "The test"입니다.

Choices:
- [distractor] The project
- [distractor] The assignment
- [distractor] The interview
- [correct] The test

Mutation evidence:
- fixed_expression/fixed_expression: `The test` → `The project` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "The test"입니다.
- fixed_expression/fixed_expression: `The test` → `The assignment` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "The test"입니다.
- fixed_expression/fixed_expression: `The test` → `The interview` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "The test"입니다.

---

## 141. novice Day 14 · slot 1

- topic: 수량·부사 비교급
- format/kind: multiple_choice / pattern
- source: You should study harder.
- pattern: 동사 + more / 비교급 부사
- prompt: "동사 + more / 비교급 부사" 패턴을 사용해 "더 열심히 공부해야 해요."에 맞는 영어 문장을 고르세요.
- correct answer: You should study harder.
- explanation: 더 열심히 공부해야 한다는 비교급 부사를 써야 합니다. 정답 표현은 "harder"입니다.
- feedback reason: 더 열심히 공부해야 한다는 비교급 부사를 써야 합니다. 정답 표현은 "harder"입니다.

Choices:
- [distractor] You should study hard.
- [distractor] You should study less.
- [correct] You should study harder.
- [distractor] You should study the hardest.

Mutation evidence:
- fixed_expression/fixed_expression: `harder` → `hard` — 더 열심히 공부해야 한다는 비교급 부사를 써야 합니다. 정답 표현은 "harder"입니다.
- fixed_expression/fixed_expression: `harder` → `less` — 더 열심히 공부해야 한다는 비교급 부사를 써야 합니다. 정답 표현은 "harder"입니다.
- fixed_expression/fixed_expression: `harder` → `the hardest` — 더 열심히 공부해야 한다는 비교급 부사를 써야 합니다. 정답 표현은 "harder"입니다.

---

## 142. novice Day 14 · slot 2

- topic: 수량·부사 비교급
- format/kind: true_false / translation
- source: I like you more.
- pattern: 동사 + more / 비교급 부사
- prompt: "나는 너를 더 좋아해요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I like you more."
- correct answer: O
- explanation: 상대를 더 좋아한다는 뜻과 일치합니다. 정답 표현은 "I like you more."입니다.
- feedback reason: 상대를 더 좋아한다는 뜻과 일치합니다. 정답 표현은 "I like you more."입니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 143. novice Day 14 · slot 3

- topic: 수량·부사 비교급
- format/kind: fill_blank / translation
- source: I will get there the fastest.
- pattern: the most / the fastest / the hardest
- prompt: "내가 가장 빨리 그곳에 도착할 거예요."에 맞게 빈칸을 채우세요: I will get there ____.
- correct answer: the fastest
- explanation: 가장 빨리 도착한다는 최상급 뜻을 나타내야 합니다. 정답 표현은 "the fastest"입니다.
- feedback reason: 가장 빨리 도착한다는 최상급 뜻을 나타내야 합니다. 정답 표현은 "the fastest"입니다.

Choices:
- [correct] the fastest
- [distractor] very fast
- [distractor] faster
- [distractor] much later

Mutation evidence:
- fixed_expression/fixed_expression: `the fastest` → `very fast` — 가장 빨리 도착한다는 최상급 뜻을 나타내야 합니다. 정답 표현은 "the fastest"입니다.
- fixed_expression/fixed_expression: `the fastest` → `faster` — 가장 빨리 도착한다는 최상급 뜻을 나타내야 합니다. 정답 표현은 "the fastest"입니다.
- fixed_expression/fixed_expression: `the fastest` → `much later` — 가장 빨리 도착한다는 최상급 뜻을 나타내야 합니다. 정답 표현은 "the fastest"입니다.

---

## 144. novice Day 14 · slot 4

- topic: 수량·부사 비교급
- format/kind: multiple_choice / pattern
- source: I can run faster.
- pattern: 동사 + more / 비교급 부사
- prompt: "동사 + more / 비교급 부사" 패턴을 사용해 "나는 더 빨리 달릴 수 있어요."에 맞는 영어 문장을 고르세요.
- correct answer: I can run faster.
- explanation: 더 빨리 달릴 수 있다는 비교급 부사를 써야 합니다. 정답 표현은 "faster"입니다.
- feedback reason: 더 빨리 달릴 수 있다는 비교급 부사를 써야 합니다. 정답 표현은 "faster"입니다.

Choices:
- [correct] I can run faster.
- [distractor] I can run fast.
- [distractor] I can run the fastest.
- [distractor] I can run more slowly.

Mutation evidence:
- fixed_expression/fixed_expression: `faster` → `fast` — 더 빨리 달릴 수 있다는 비교급 부사를 써야 합니다. 정답 표현은 "faster"입니다.
- fixed_expression/fixed_expression: `faster` → `the fastest` — 더 빨리 달릴 수 있다는 비교급 부사를 써야 합니다. 정답 표현은 "faster"입니다.
- fixed_expression/fixed_expression: `faster` → `more slowly` — 더 빨리 달릴 수 있다는 비교급 부사를 써야 합니다. 정답 표현은 "faster"입니다.

---

## 145. novice Day 14 · slot 5

- topic: 수량·부사 비교급
- format/kind: fill_blank / translation
- source: You should study harder.
- pattern: 동사 + more / 비교급 부사
- prompt: "더 열심히 공부해야 해요."에 맞게 빈칸을 채우세요: You should ____ harder.
- correct answer: study
- explanation: 더 열심히 해야 하는 행동이 공부라는 뜻에 맞아야 합니다. 정답 표현은 "study"입니다.
- feedback reason: 더 열심히 해야 하는 행동이 공부라는 뜻에 맞아야 합니다. 정답 표현은 "study"입니다.

Choices:
- [distractor] train
- [distractor] practice
- [distractor] work
- [correct] study

Mutation evidence:
- fixed_expression/fixed_expression: `study` → `train` — 더 열심히 해야 하는 행동이 공부라는 뜻에 맞아야 합니다. 정답 표현은 "study"입니다.
- fixed_expression/fixed_expression: `study` → `practice` — 더 열심히 해야 하는 행동이 공부라는 뜻에 맞아야 합니다. 정답 표현은 "study"입니다.
- fixed_expression/fixed_expression: `study` → `work` — 더 열심히 해야 하는 행동이 공부라는 뜻에 맞아야 합니다. 정답 표현은 "study"입니다.

---

## 146. novice Day 15 · slot 1

- topic: 기본 전치사 활용
- format/kind: multiple_choice / translation
- source: I will study for three hours today.
- pattern: with / for / by
- prompt: "오늘 세 시간 동안 공부할 거예요."에 맞는 영어 문장을 고르세요.
- correct answer: I will study for three hours today.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "three hours"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "three hours"입니다.

Choices:
- [correct] I will study for three hours today.
- [distractor] I will study for one hour today.
- [distractor] I will study for four hours today.
- [distractor] I will study for two hours today.

Mutation evidence:
- fixed_expression/fixed_expression: `three hours` → `one hour` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "three hours"입니다.
- fixed_expression/fixed_expression: `three hours` → `four hours` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "three hours"입니다.
- fixed_expression/fixed_expression: `three hours` → `two hours` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "three hours"입니다.

---

## 147. novice Day 15 · slot 2

- topic: 기본 전치사 활용
- format/kind: fill_blank / pattern
- source: What do you think of me?
- pattern: of / about
- prompt: "of / about" 패턴을 사용해 "나를 어떻게 생각하나요?"에 맞게 빈칸을 채우세요: What do you ____?
- correct answer: think of me
- explanation: "나를 어떻게 생각하는지" 묻는 표현에는 "think of me"가 맞습니다.
- feedback reason: "나를 어떻게 생각하는지" 묻는 표현에는 "think of me"가 맞습니다.

Choices:
- [distractor] think about the plan
- [distractor] feel about the idea
- [correct] think of me
- [distractor] know about the issue

Mutation evidence:
- fixed_expression/fixed_expression: `think of me` → `think about the plan` — "나를 어떻게 생각하는지" 묻는 표현에는 "think of me"가 맞습니다.
- fixed_expression/fixed_expression: `think of me` → `feel about the idea` — "나를 어떻게 생각하는지" 묻는 표현에는 "think of me"가 맞습니다.
- fixed_expression/fixed_expression: `think of me` → `know about the issue` — "나를 어떻게 생각하는지" 묻는 표현에는 "think of me"가 맞습니다.

---

## 148. novice Day 15 · slot 3

- topic: 기본 전치사 활용
- format/kind: multiple_choice / pattern
- source: I will study for three hours today.
- pattern: with / for / by
- prompt: "with / for / by" 패턴을 사용해 "오늘 세 시간 동안 공부할 거예요."에 맞는 영어 문장을 고르세요.
- correct answer: I will study for three hours today.
- explanation: 기간을 나타낼 때는 "for + 기간"을 쓰므로 "for three hours"가 맞습니다.
- feedback reason: 기간을 나타낼 때는 "for + 기간"을 쓰므로 "for three hours"가 맞습니다.

Choices:
- [distractor] I will study with my friend today.
- [distractor] I will study for the exam today.
- [correct] I will study for three hours today.
- [distractor] I will study by myself today.

Mutation evidence:
- fixed_expression/fixed_expression: `for three hours` → `with my friend` — 기간을 나타낼 때는 "for + 기간"을 쓰므로 "for three hours"가 맞습니다.
- fixed_expression/fixed_expression: `for three hours` → `for the exam` — 기간을 나타낼 때는 "for + 기간"을 쓰므로 "for three hours"가 맞습니다.
- fixed_expression/fixed_expression: `for three hours` → `by myself` — 기간을 나타낼 때는 "for + 기간"을 쓰므로 "for three hours"가 맞습니다.

---

## 149. novice Day 15 · slot 4

- topic: 기본 전치사 활용
- format/kind: true_false / translation
- source: I've heard a lot about you.
- pattern: of / about
- prompt: "당신에 관해 많이 들었어요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I've heard a lot about you."
- correct answer: O
- explanation: "I've heard a lot about you."에서 "a lot"은 "많이", "about you"는 "당신에 관해"를 뜻하므로 제시된 한국어 뜻과 일치합니다.
- feedback reason: "I've heard a lot about you."에서 "a lot"은 "많이", "about you"는 "당신에 관해"를 뜻하므로 제시된 한국어 뜻과 일치합니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 150. novice Day 15 · slot 5

- topic: 기본 전치사 활용
- format/kind: fill_blank / translation
- source: What do you think of me?
- pattern: of / about
- prompt: "나를 어떻게 생각하나요?"에 맞게 빈칸을 채우세요: What do you think of ____?
- correct answer: me
- explanation: "나를"에 해당하는 목적격 대명사는 "me"입니다.
- feedback reason: "나를"에 해당하는 목적격 대명사는 "me"입니다.

Choices:
- [distractor] them
- [correct] me
- [distractor] her
- [distractor] him

Mutation evidence:
- fixed_expression/fixed_expression: `me` → `them` — "나를"에 해당하는 목적격 대명사는 "me"입니다.
- fixed_expression/fixed_expression: `me` → `her` — "나를"에 해당하는 목적격 대명사는 "me"입니다.
- fixed_expression/fixed_expression: `me` → `him` — "나를"에 해당하는 목적격 대명사는 "me"입니다.

---

## 151. novice Day 16 · slot 1

- topic: 시간 전치사
- format/kind: multiple_choice / translation
- source: I usually have dinner with my family at Christmas.
- pattern: at + 시각·특정 시점
- prompt: "크리스마스에는 보통 가족과 저녁을 먹어요."에 맞는 영어 문장을 고르세요.
- correct answer: I usually have dinner with my family at Christmas.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "usually"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "usually"입니다.

Choices:
- [distractor] I always have dinner with my family at Christmas.
- [distractor] I often have dinner with my family at Christmas.
- [correct] I usually have dinner with my family at Christmas.
- [distractor] I sometimes have dinner with my family at Christmas.

Mutation evidence:
- fixed_expression/fixed_expression: `usually` → `always` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "usually"입니다.
- fixed_expression/fixed_expression: `usually` → `often` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "usually"입니다.
- fixed_expression/fixed_expression: `usually` → `sometimes` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "usually"입니다.

---

## 152. novice Day 16 · slot 2

- topic: 시간 전치사
- format/kind: fill_blank / pattern
- source: I go on a picnic in spring.
- pattern: on + 요일·날짜 / in + 월·연도·계절
- prompt: "on + 요일·날짜 / in + 월·연도·계절" 패턴을 사용해 "봄에 소풍을 가요."에 맞게 빈칸을 채우세요: I go on a picnic ____.
- correct answer: in spring
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "in spring"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "in spring"입니다.

Choices:
- [distractor] on Friday
- [distractor] in July
- [distractor] at Christmas
- [correct] in spring

Mutation evidence:
- fixed_expression/fixed_expression: `in spring` → `on Friday` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "in spring"입니다.
- fixed_expression/fixed_expression: `in spring` → `in July` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "in spring"입니다.
- fixed_expression/fixed_expression: `in spring` → `at Christmas` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "in spring"입니다.

---

## 153. novice Day 16 · slot 3

- topic: 시간 전치사
- format/kind: multiple_choice / pattern
- source: I usually have dinner with my family at Christmas.
- pattern: at + 시각·특정 시점
- prompt: "at + 시각·특정 시점" 패턴을 사용해 "크리스마스에는 보통 가족과 저녁을 먹어요."에 맞는 영어 문장을 고르세요.
- correct answer: I usually have dinner with my family at Christmas.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "at Christmas"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "at Christmas"입니다.

Choices:
- [distractor] I usually have dinner with my family at noon.
- [correct] I usually have dinner with my family at Christmas.
- [distractor] I usually have dinner with my family in spring.
- [distractor] I usually have dinner with my family on Friday.

Mutation evidence:
- fixed_expression/fixed_expression: `at Christmas` → `at noon` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "at Christmas"입니다.
- fixed_expression/fixed_expression: `at Christmas` → `in spring` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "at Christmas"입니다.
- fixed_expression/fixed_expression: `at Christmas` → `on Friday` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "at Christmas"입니다.

---

## 154. novice Day 16 · slot 4

- topic: 시간 전치사
- format/kind: true_false / translation
- source: I go on a picnic in spring.
- pattern: on + 요일·날짜 / in + 월·연도·계절
- prompt: "봄에 소풍을 가요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I go on a hike in spring."
- correct answer: X
- explanation: 바뀐 문장은 봄에 소풍을 가는 것이 아니라 하이킹을 간다는 뜻이므로 제시된 한국어 뜻과 다릅니다.
- feedback reason: 바뀐 문장은 봄에 소풍을 가는 것이 아니라 하이킹을 간다는 뜻이므로 제시된 한국어 뜻과 다릅니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `on a picnic` → `on a hike` — 바뀐 문장은 봄에 소풍을 가는 것이 아니라 하이킹을 간다는 뜻이므로 제시된 한국어 뜻과 다릅니다.

---

## 155. novice Day 16 · slot 5

- topic: 시간 전치사
- format/kind: fill_blank / translation
- source: I usually have dinner with my family at Christmas.
- pattern: at + 시각·특정 시점
- prompt: "크리스마스에는 보통 가족과 저녁을 먹어요."에 맞게 빈칸을 채우세요: I usually have ____ with my family at Christmas.
- correct answer: dinner
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "dinner"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "dinner"입니다.

Choices:
- [distractor] brunch
- [distractor] breakfast
- [distractor] lunch
- [correct] dinner

Mutation evidence:
- fixed_expression/fixed_expression: `dinner` → `brunch` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "dinner"입니다.
- fixed_expression/fixed_expression: `dinner` → `breakfast` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "dinner"입니다.
- fixed_expression/fixed_expression: `dinner` → `lunch` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "dinner"입니다.

---

## 156. novice Day 17 · slot 1

- topic: 장소 전치사
- format/kind: multiple_choice / translation
- source: I had coffee with my friend at the coffee shop.
- pattern: in / at / on + 장소
- prompt: "커피숍에서 친구와 커피를 마셨어요."에 맞는 영어 문장을 고르세요.
- correct answer: I had coffee with my friend at the coffee shop.
- explanation: 함께 커피를 마신 사람이 친구라는 뜻에 맞는 표현은 "my friend"입니다.
- feedback reason: 함께 커피를 마신 사람이 친구라는 뜻에 맞는 표현은 "my friend"입니다.

Choices:
- [distractor] I had coffee with my coworker at the coffee shop.
- [distractor] I had coffee with my brother at the coffee shop.
- [correct] I had coffee with my friend at the coffee shop.
- [distractor] I had coffee with my teacher at the coffee shop.

Mutation evidence:
- fixed_expression/fixed_expression: `my friend` → `my coworker` — 함께 커피를 마신 사람이 친구라는 뜻에 맞는 표현은 "my friend"입니다.
- fixed_expression/fixed_expression: `my friend` → `my brother` — 함께 커피를 마신 사람이 친구라는 뜻에 맞는 표현은 "my friend"입니다.
- fixed_expression/fixed_expression: `my friend` → `my teacher` — 함께 커피를 마신 사람이 친구라는 뜻에 맞는 표현은 "my friend"입니다.

---

## 157. novice Day 17 · slot 2

- topic: 장소 전치사
- format/kind: fill_blank / pattern
- source: I had coffee with my friend at the coffee shop.
- pattern: in / at / on + 장소
- prompt: "in / at / on + 장소" 패턴을 사용해 "커피숍에서 친구와 커피를 마셨어요."에 맞게 빈칸을 채우세요: I had coffee with my friend ____.
- correct answer: at the coffee shop
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "at the coffee shop"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "at the coffee shop"입니다.

Choices:
- [distractor] at the library
- [correct] at the coffee shop
- [distractor] in the park
- [distractor] on the beach

Mutation evidence:
- fixed_expression/fixed_expression: `at the coffee shop` → `at the library` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "at the coffee shop"입니다.
- fixed_expression/fixed_expression: `at the coffee shop` → `in the park` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "at the coffee shop"입니다.
- fixed_expression/fixed_expression: `at the coffee shop` → `on the beach` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "at the coffee shop"입니다.

---

## 158. novice Day 17 · slot 3

- topic: 장소 전치사
- format/kind: multiple_choice / pattern
- source: I live in Suwon.
- pattern: in / at / on + 장소
- prompt: "in / at / on + 장소" 패턴을 사용해 "수원에 살아요."에 맞는 영어 문장을 고르세요.
- correct answer: I live in Suwon.
- explanation: 도시 안에 거주한다는 뜻에는 "in"을 쓰므로 "in Suwon"이 맞습니다.
- feedback reason: 도시 안에 거주한다는 뜻에는 "in"을 쓰므로 "in Suwon"이 맞습니다.

Choices:
- [distractor] I live at Suwon.
- [correct] I live in Suwon.
- [distractor] I live on Suwon.
- [distractor] I live near Suwon.

Mutation evidence:
- fixed_expression/fixed_expression: `in Suwon` → `at Suwon` — 도시 안에 거주한다는 뜻에는 "in"을 쓰므로 "in Suwon"이 맞습니다.
- fixed_expression/fixed_expression: `in Suwon` → `on Suwon` — 도시 안에 거주한다는 뜻에는 "in"을 쓰므로 "in Suwon"이 맞습니다.
- fixed_expression/fixed_expression: `in Suwon` → `near Suwon` — 도시 안에 거주한다는 뜻에는 "in"을 쓰므로 "in Suwon"이 맞습니다.

---

## 159. novice Day 17 · slot 4

- topic: 장소 전치사
- format/kind: true_false / translation
- source: The cup is on the desk.
- pattern: in / at / on + 장소
- prompt: "컵은 책상 위에 있어요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "The cup is on the desk."
- correct answer: O
- explanation: 책상 표면 위에 있다는 뜻에는 "on the desk"를 쓰므로 제시된 문장이 맞습니다.
- feedback reason: 책상 표면 위에 있다는 뜻에는 "on the desk"를 쓰므로 제시된 문장이 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 160. novice Day 17 · slot 5

- topic: 장소 전치사
- format/kind: fill_blank / translation
- source: I live in Suwon.
- pattern: in / at / on + 장소
- prompt: "수원에 살아요."에 맞게 빈칸을 채우세요: I live in ____.
- correct answer: Suwon
- explanation: 사는 도시가 수원이라는 뜻에 맞는 지명은 "Suwon"입니다.
- feedback reason: 사는 도시가 수원이라는 뜻에 맞는 지명은 "Suwon"입니다.

Choices:
- [distractor] Seoul
- [distractor] Incheon
- [distractor] Busan
- [correct] Suwon

Mutation evidence:
- fixed_expression/fixed_expression: `Suwon` → `Seoul` — 사는 도시가 수원이라는 뜻에 맞는 지명은 "Suwon"입니다.
- fixed_expression/fixed_expression: `Suwon` → `Incheon` — 사는 도시가 수원이라는 뜻에 맞는 지명은 "Suwon"입니다.
- fixed_expression/fixed_expression: `Suwon` → `Busan` — 사는 도시가 수원이라는 뜻에 맞는 지명은 "Suwon"입니다.

---

## 161. novice Day 18 · slot 1

- topic: 형용사+전치사
- format/kind: multiple_choice / translation
- source: She is addicted to watching TV.
- pattern: be used/addicted/afraid/tired + 전치사
- prompt: "그녀는 TV 보는 것에 중독됐어요."에 맞는 영어 문장을 고르세요.
- correct answer: She is addicted to watching TV.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "watching TV"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "watching TV"입니다.

Choices:
- [distractor] She is addicted to shopping online.
- [distractor] She is addicted to playing games.
- [distractor] She is addicted to using social media.
- [correct] She is addicted to watching TV.

Mutation evidence:
- fixed_expression/fixed_expression: `watching TV` → `shopping online` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "watching TV"입니다.
- fixed_expression/fixed_expression: `watching TV` → `playing games` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "watching TV"입니다.
- fixed_expression/fixed_expression: `watching TV` → `using social media` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "watching TV"입니다.

---

## 162. novice Day 18 · slot 2

- topic: 형용사+전치사
- format/kind: fill_blank / pattern
- source: She is afraid of speaking English.
- pattern: be used/addicted/afraid/tired + 전치사
- prompt: "be used/addicted/afraid/tired + 전치사" 패턴을 사용해 "그녀는 영어로 말하는 것을 두려워해요."에 맞게 빈칸을 채우세요: She is ____.
- correct answer: afraid of speaking English
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "afraid of speaking English"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "afraid of speaking English"입니다.

Choices:
- [correct] afraid of speaking English
- [distractor] used to speaking in public
- [distractor] tired of working late
- [distractor] interested in learning French

Mutation evidence:
- fixed_expression/fixed_expression: `afraid of speaking English` → `used to speaking in public` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "afraid of speaking English"입니다.
- fixed_expression/fixed_expression: `afraid of speaking English` → `tired of working late` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "afraid of speaking English"입니다.
- fixed_expression/fixed_expression: `afraid of speaking English` → `interested in learning French` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "afraid of speaking English"입니다.

---

## 163. novice Day 18 · slot 3

- topic: 형용사+전치사
- format/kind: multiple_choice / pattern
- source: Tim is satisfied with second place.
- pattern: be interested/satisfied/similar/different + 전치사
- prompt: "be interested/satisfied/similar/different + 전치사" 패턴을 사용해 "Tim은 2등에 만족해요."에 맞는 영어 문장을 고르세요.
- correct answer: Tim is satisfied with second place.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "satisfied with second place"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "satisfied with second place"입니다.

Choices:
- [correct] Tim is satisfied with second place.
- [distractor] Tim is interested in the result.
- [distractor] Tim is different from the winner.
- [distractor] Tim is similar to his brother.

Mutation evidence:
- fixed_expression/fixed_expression: `satisfied with second place` → `interested in the result` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "satisfied with second place"입니다.
- fixed_expression/fixed_expression: `satisfied with second place` → `different from the winner` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "satisfied with second place"입니다.
- fixed_expression/fixed_expression: `satisfied with second place` → `similar to his brother` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "satisfied with second place"입니다.

---

## 164. novice Day 18 · slot 4

- topic: 형용사+전치사
- format/kind: true_false / translation
- source: This is similar to your cell phone.
- pattern: be interested/satisfied/similar/different + 전치사
- prompt: "이것은 당신의 휴대전화와 비슷해요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "This is similar to your cell phone."
- correct answer: O
- explanation: "similar"은 비교 대상을 "to"로 연결하므로 "similar to your cell phone"이 "휴대전화와 비슷하다"에 맞습니다.
- feedback reason: "similar"은 비교 대상을 "to"로 연결하므로 "similar to your cell phone"이 "휴대전화와 비슷하다"에 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 165. novice Day 18 · slot 5

- topic: 형용사+전치사
- format/kind: fill_blank / translation
- source: Mine is different from yours.
- pattern: be interested/satisfied/similar/different + 전치사
- prompt: "내 것은 네 것과 달라요."에 맞게 빈칸을 채우세요: Mine is different from ____.
- correct answer: yours
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "yours"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "yours"입니다.

Choices:
- [correct] yours
- [distractor] ours
- [distractor] his
- [distractor] hers

Mutation evidence:
- fixed_expression/fixed_expression: `yours` → `ours` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "yours"입니다.
- fixed_expression/fixed_expression: `yours` → `his` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "yours"입니다.
- fixed_expression/fixed_expression: `yours` → `hers` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "yours"입니다.

---

## 166. novice Day 19 · slot 1

- topic: 동사+전치사
- format/kind: multiple_choice / translation
- source: I argued with my father about my curfew.
- pattern: argue with / ask for / believe in / belong to
- prompt: "통금 시간 문제로 아버지와 다퉜어요."에 맞는 영어 문장을 고르세요.
- correct answer: I argued with my father about my curfew.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "my father"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "my father"입니다.

Choices:
- [distractor] I argued with my brother about my curfew.
- [correct] I argued with my father about my curfew.
- [distractor] I argued with my mother about my curfew.
- [distractor] I argued with my friend about my curfew.

Mutation evidence:
- fixed_expression/fixed_expression: `my father` → `my brother` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "my father"입니다.
- fixed_expression/fixed_expression: `my father` → `my mother` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "my father"입니다.
- fixed_expression/fixed_expression: `my father` → `my friend` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "my father"입니다.

---

## 167. novice Day 19 · slot 2

- topic: 동사+전치사
- format/kind: fill_blank / pattern
- source: She asked me for help.
- pattern: argue with / ask for / believe in / belong to
- prompt: "argue with / ask for / believe in / belong to" 패턴을 사용해 "그녀는 내게 도움을 요청했어요."에 맞게 빈칸을 채우세요: She ____.
- correct answer: asked me for help
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "asked me for help"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "asked me for help"입니다.

Choices:
- [distractor] asked us for directions
- [correct] asked me for help
- [distractor] asked them for money
- [distractor] asked him for advice

Mutation evidence:
- fixed_expression/fixed_expression: `asked me for help` → `asked us for directions` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "asked me for help"입니다.
- fixed_expression/fixed_expression: `asked me for help` → `asked them for money` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "asked me for help"입니다.
- fixed_expression/fixed_expression: `asked me for help` → `asked him for advice` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "asked me for help"입니다.

---

## 168. novice Day 19 · slot 3

- topic: 동사+전치사
- format/kind: multiple_choice / pattern
- source: He believes in ghosts.
- pattern: argue with / ask for / believe in / belong to
- prompt: "argue with / ask for / believe in / belong to" 패턴을 사용해 "그는 유령의 존재를 믿어요."에 맞는 영어 문장을 고르세요.
- correct answer: He believes in ghosts.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "believes in ghosts"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "believes in ghosts"입니다.

Choices:
- [correct] He believes in ghosts.
- [distractor] He argues with his friend.
- [distractor] He asks for help.
- [distractor] He belongs to this club.

Mutation evidence:
- fixed_expression/fixed_expression: `believes in ghosts` → `argues with his friend` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "believes in ghosts"입니다.
- fixed_expression/fixed_expression: `believes in ghosts` → `asks for help` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "believes in ghosts"입니다.
- fixed_expression/fixed_expression: `believes in ghosts` → `belongs to this club` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "believes in ghosts"입니다.

---

## 169. novice Day 19 · slot 4

- topic: 동사+전치사
- format/kind: true_false / translation
- source: He got rid of his old clothes.
- pattern: deal with / get rid of / hear about / think about
- prompt: "그는 낡은 옷을 처분했어요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "He got rid of his old clothes."
- correct answer: O
- explanation: "get rid of"는 "~을 처분하다"라는 뜻이고 "old clothes"는 "낡은 옷"을 나타내므로 제시된 문장이 맞습니다.
- feedback reason: "get rid of"는 "~을 처분하다"라는 뜻이고 "old clothes"는 "낡은 옷"을 나타내므로 제시된 문장이 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 170. novice Day 19 · slot 5

- topic: 동사+전치사
- format/kind: fill_blank / translation
- source: I always think about you.
- pattern: deal with / get rid of / hear about / think about
- prompt: "나는 항상 당신을 생각해요."에 맞게 빈칸을 채우세요: I ____ think about you.
- correct answer: always
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "always"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "always"입니다.

Choices:
- [correct] always
- [distractor] sometimes
- [distractor] often
- [distractor] rarely

Mutation evidence:
- fixed_expression/fixed_expression: `always` → `sometimes` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "always"입니다.
- fixed_expression/fixed_expression: `always` → `often` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "always"입니다.
- fixed_expression/fixed_expression: `always` → `rarely` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "always"입니다.

---

## 171. novice Day 20 · slot 1

- topic: 수동태
- format/kind: multiple_choice / translation
- source: The chair was moved.
- pattern: be + p.p. (+ by 행위자)
- prompt: "의자가 옮겨졌어요."에 맞는 영어 문장을 고르세요.
- correct answer: The chair was moved.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "The chair"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "The chair"입니다.

Choices:
- [distractor] The table was moved.
- [correct] The chair was moved.
- [distractor] The box was moved.
- [distractor] The sofa was moved.

Mutation evidence:
- fixed_expression/fixed_expression: `The chair` → `The table` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "The chair"입니다.
- fixed_expression/fixed_expression: `The chair` → `The box` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "The chair"입니다.
- fixed_expression/fixed_expression: `The chair` → `The sofa` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "The chair"입니다.

---

## 172. novice Day 20 · slot 2

- topic: 수동태
- format/kind: fill_blank / pattern
- source: The phone was invented by Bell.
- pattern: be + p.p. (+ by 행위자)
- prompt: "be + p.p. (+ by 행위자)" 패턴을 사용해 "전화기는 Bell에 의해 발명됐어요."에 맞게 빈칸을 채우세요: The phone ____ by Bell.
- correct answer: was invented
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "was invented"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "was invented"입니다.

Choices:
- [distractor] was replaced
- [correct] was invented
- [distractor] was repaired
- [distractor] was damaged

Mutation evidence:
- fixed_expression/fixed_expression: `was invented` → `was replaced` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "was invented"입니다.
- fixed_expression/fixed_expression: `was invented` → `was repaired` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "was invented"입니다.
- fixed_expression/fixed_expression: `was invented` → `was damaged` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "was invented"입니다.

---

## 173. novice Day 20 · slot 3

- topic: 수동태
- format/kind: multiple_choice / pattern
- source: I was bitten by a dog.
- pattern: be + p.p. (+ by 행위자)
- prompt: "be + p.p. (+ by 행위자)" 패턴을 사용해 "나는 개에게 물렸어요."에 맞는 영어 문장을 고르세요.
- correct answer: I was bitten by a dog.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "was bitten"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "was bitten"입니다.

Choices:
- [distractor] I was chased by a dog.
- [distractor] I was found by a dog.
- [distractor] I was helped by a dog.
- [correct] I was bitten by a dog.

Mutation evidence:
- fixed_expression/fixed_expression: `was bitten` → `was chased` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "was bitten"입니다.
- fixed_expression/fixed_expression: `was bitten` → `was found` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "was bitten"입니다.
- fixed_expression/fixed_expression: `was bitten` → `was helped` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "was bitten"입니다.

---

## 174. novice Day 20 · slot 4

- topic: 수동태
- format/kind: true_false / translation
- source: The chair was moved.
- pattern: be + p.p. (+ by 행위자)
- prompt: "의자가 옮겨졌어요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "The chair was broken."
- correct answer: X
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "moved"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "moved"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `moved` → `broken` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "moved"입니다.

---

## 175. novice Day 20 · slot 5

- topic: 수동태
- format/kind: fill_blank / translation
- source: The phone was invented by Bell.
- pattern: be + p.p. (+ by 행위자)
- prompt: "전화기는 Bell에 의해 발명됐어요."에 맞게 빈칸을 채우세요: The phone was invented by ____.
- correct answer: Bell
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "Bell"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "Bell"입니다.

Choices:
- [correct] Bell
- [distractor] Edison
- [distractor] Tesla
- [distractor] Marconi

Mutation evidence:
- fixed_expression/fixed_expression: `Bell` → `Edison` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Bell"입니다.
- fixed_expression/fixed_expression: `Bell` → `Tesla` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Bell"입니다.
- fixed_expression/fixed_expression: `Bell` → `Marconi` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "Bell"입니다.

---

## 176. novice Day 21 · slot 1

- topic: if 조건문
- format/kind: fill_blank / translation
- source: If the weather is nice tomorrow, let's go on a trip.
- pattern: If + 현재형, 명령문/제안
- prompt: "내일 날씨가 좋으면 여행 가요."에 맞게 빈칸을 채우세요: If the weather ____ nice tomorrow, let's go on a trip.
- correct answer: is
- explanation: 일반적인 현재형 if절에서는 단수에 맞는 be동사 형태로 "is"를 씁니다.
- feedback reason: 일반적인 현재형 if절에서는 단수에 맞는 be동사 형태로 "is"를 씁니다.

Choices:
- [distractor] am
- [correct] is
- [distractor] are
- [distractor] been

Mutation evidence:
- declared_tense_form/declared_tense_form: `is` → `am` — 일반적인 현재형 if절에서는 단수에 맞는 be동사 형태로 "is"를 씁니다.
- declared_tense_form/declared_tense_form: `is` → `are` — 일반적인 현재형 if절에서는 단수에 맞는 be동사 형태로 "is"를 씁니다.
- declared_tense_form/declared_tense_form: `is` → `been` — 일반적인 현재형 if절에서는 단수에 맞는 be동사 형태로 "is"를 씁니다.

---

## 177. novice Day 21 · slot 2

- topic: if 조건문
- format/kind: multiple_choice / translation
- source: If I date a native speaker, I will be good at English.
- pattern: If + 현재형, 주어 + will + 동사원형
- prompt: "원어민과 사귀면 영어를 잘하게 될 거예요."에 맞는 영어 문장을 고르세요.
- correct answer: If I date a native speaker, I will be good at English.
- explanation: 조동사 "will" 뒤의 정답은 동사원형 "be"입니다.
- feedback reason: 조동사 "will" 뒤의 정답은 동사원형 "be"입니다.

Choices:
- [distractor] If I date a native speaker, I will am good at English.
- [distractor] If I date a native speaker, I will being good at English.
- [distractor] If I date a native speaker, I will is good at English.
- [correct] If I date a native speaker, I will be good at English.

Mutation evidence:
- modal_base_form/modal_base_form: `be` → `am` — 조동사 "will" 뒤의 정답은 동사원형 "be"입니다.
- modal_base_form/modal_base_form: `be` → `being` — 조동사 "will" 뒤의 정답은 동사원형 "be"입니다.
- modal_base_form/modal_base_form: `be` → `is` — 조동사 "will" 뒤의 정답은 동사원형 "be"입니다.

---

## 178. novice Day 21 · slot 3

- topic: if 조건문
- format/kind: fill_blank / translation
- source: If I make a lot of money, I will buy a house.
- pattern: If + 현재형, 주어 + will + 동사원형
- prompt: "돈을 많이 벌면 집을 살 거예요."에 맞게 빈칸을 채우세요: If I ____ a lot of money, I will buy a house.
- correct answer: make
- explanation: if절의 현재 조건에 맞는 정답은 "make"입니다.
- feedback reason: if절의 현재 조건에 맞는 정답은 "make"입니다.

Choices:
- [distractor] makes
- [distractor] made
- [correct] make
- [distractor] making

Mutation evidence:
- declared_tense_form/declared_tense_form: `make` → `makes` — if절의 현재 조건에 맞는 정답은 "make"입니다.
- declared_tense_form/declared_tense_form: `make` → `made` — if절의 현재 조건에 맞는 정답은 "make"입니다.
- declared_tense_form/declared_tense_form: `make` → `making` — if절의 현재 조건에 맞는 정답은 "make"입니다.

---

## 179. novice Day 21 · slot 4

- topic: if 조건문
- format/kind: multiple_choice / pattern
- source: If I make a lot of money, I will buy a house.
- pattern: If + 현재형, 주어 + will + 동사원형
- prompt: "If + 현재형, 주어 + will + 동사원형" 패턴을 사용해 "돈을 많이 벌면 집을 살 거예요."에 맞는 영어 문장을 고르세요.
- correct answer: If I make a lot of money, I will buy a house.
- explanation: 조동사 "will" 뒤의 정답은 동사원형 "buy"입니다.
- feedback reason: 조동사 "will" 뒤의 정답은 동사원형 "buy"입니다.

Choices:
- [distractor] If I make a lot of money, I will buys a house.
- [distractor] If I make a lot of money, I will bought a house.
- [correct] If I make a lot of money, I will buy a house.
- [distractor] If I make a lot of money, I will buying a house.

Mutation evidence:
- modal_base_form/modal_base_form: `buy` → `buys` — 조동사 "will" 뒤의 정답은 동사원형 "buy"입니다.
- modal_base_form/modal_base_form: `buy` → `bought` — 조동사 "will" 뒤의 정답은 동사원형 "buy"입니다.
- modal_base_form/modal_base_form: `buy` → `buying` — 조동사 "will" 뒤의 정답은 동사원형 "buy"입니다.

---

## 180. novice Day 21 · slot 5

- topic: if 조건문
- format/kind: true_false / pattern
- source: If there is a good person, introduce me.
- pattern: If + 현재형, 명령문/제안
- prompt: "If + 현재형, 명령문/제안" 패턴을 사용해 "좋은 사람이 있으면 소개해 주세요."에 맞는 문장이면 O, 아니면 X를 고르세요: "If there are a good person, introduce me."
- correct answer: X
- explanation: 일반적인 현재형 if절에서는 단수에 맞는 be동사 형태로 "is"를 씁니다.
- feedback reason: 일반적인 현재형 if절에서는 단수에 맞는 be동사 형태로 "is"를 씁니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- declared_tense_form/declared_tense_form: `is` → `are` — 일반적인 현재형 if절에서는 단수에 맞는 be동사 형태로 "is"를 씁니다.

---

## 181. novice Day 22 · slot 1

- topic: if 가정법
- format/kind: multiple_choice / translation
- source: If I were you, I wouldn't date him.
- pattern: If + 과거형, 주어 + would + 동사원형
- prompt: "내가 너라면 그와 사귀지 않을 거예요."에 맞는 영어 문장을 고르세요.
- correct answer: If I were you, I wouldn't date him.
- explanation: 제시된 뜻은 그와 사귀지 않겠다는 내용이므로 "wouldn't" 뒤에는 "date him"이 와야 합니다.
- feedback reason: 제시된 뜻은 그와 사귀지 않겠다는 내용이므로 "wouldn't" 뒤에는 "date him"이 와야 합니다.

Choices:
- [distractor] If I were you, I wouldn't call him.
- [distractor] If I were you, I wouldn't marry him.
- [correct] If I were you, I wouldn't date him.
- [distractor] If I were you, I wouldn't work with him.

Mutation evidence:
- fixed_expression/fixed_expression: `date him` → `call him` — 제시된 뜻은 그와 사귀지 않겠다는 내용이므로 "wouldn't" 뒤에는 "date him"이 와야 합니다.
- fixed_expression/fixed_expression: `date him` → `marry him` — 제시된 뜻은 그와 사귀지 않겠다는 내용이므로 "wouldn't" 뒤에는 "date him"이 와야 합니다.
- fixed_expression/fixed_expression: `date him` → `work with him` — 제시된 뜻은 그와 사귀지 않겠다는 내용이므로 "wouldn't" 뒤에는 "date him"이 와야 합니다.

---

## 182. novice Day 22 · slot 2

- topic: if 가정법
- format/kind: fill_blank / pattern
- source: If I won the lottery, I would buy a car.
- pattern: If + 과거형, 주어 + would + 동사원형
- prompt: "If + 과거형, 주어 + would + 동사원형" 패턴을 사용해 "복권에 당첨된다면 차를 살 텐데요."에 맞게 빈칸을 채우세요: ____, I would buy a car.
- correct answer: If I won the lottery
- explanation: 가정법 과거는 If + 과거형 절로 시작합니다. 정답은 "If I won the lottery"입니다.
- feedback reason: 가정법 과거는 If + 과거형 절로 시작합니다. 정답은 "If I won the lottery"입니다.

Choices:
- [distractor] Whenever I won the lottery
- [distractor] After I won the lottery
- [distractor] Because I had won the lottery
- [correct] If I won the lottery

Mutation evidence:
- fixed_expression/fixed_expression: `If I won the lottery` → `Whenever I won the lottery` — 가정법 과거는 If + 과거형 절로 시작합니다. 정답은 "If I won the lottery"입니다.
- fixed_expression/fixed_expression: `If I won the lottery` → `After I won the lottery` — 가정법 과거는 If + 과거형 절로 시작합니다. 정답은 "If I won the lottery"입니다.
- fixed_expression/fixed_expression: `If I won the lottery` → `Because I had won the lottery` — 가정법 과거는 If + 과거형 절로 시작합니다. 정답은 "If I won the lottery"입니다.

---

## 183. novice Day 22 · slot 3

- topic: if 가정법
- format/kind: multiple_choice / pattern
- source: If I won the lottery, I would buy a car.
- pattern: If + 과거형, 주어 + would + 동사원형
- prompt: "If + 과거형, 주어 + would + 동사원형" 패턴을 사용해 "복권에 당첨된다면 차를 살 텐데요."에 맞는 영어 문장을 고르세요.
- correct answer: If I won the lottery, I would buy a car.
- explanation: 가정한 결과는 주어 + would + 동사원형으로 나타냅니다. 정답은 "would"입니다.
- feedback reason: 가정한 결과는 주어 + would + 동사원형으로 나타냅니다. 정답은 "would"입니다.

Choices:
- [distractor] If I won the lottery, I should buy a car.
- [correct] If I won the lottery, I would buy a car.
- [distractor] If I won the lottery, I could buy a car.
- [distractor] If I won the lottery, I might buy a car.

Mutation evidence:
- fixed_expression/fixed_expression: `would` → `should` — 가정한 결과는 주어 + would + 동사원형으로 나타냅니다. 정답은 "would"입니다.
- fixed_expression/fixed_expression: `would` → `could` — 가정한 결과는 주어 + would + 동사원형으로 나타냅니다. 정답은 "would"입니다.
- fixed_expression/fixed_expression: `would` → `might` — 가정한 결과는 주어 + would + 동사원형으로 나타냅니다. 정답은 "would"입니다.

---

## 184. novice Day 22 · slot 4

- topic: if 가정법
- format/kind: true_false / translation
- source: If I were a bird, I would fly in the sky.
- pattern: If + 과거형, 주어 + would + 동사원형
- prompt: "내가 새라면 하늘을 날 텐데요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "If I were a bird, I would swim in the sea."
- correct answer: X
- explanation: 바뀐 문장은 하늘을 나는 것이 아니라 바다에서 헤엄친다는 뜻이므로 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.
- feedback reason: 바뀐 문장은 하늘을 나는 것이 아니라 바다에서 헤엄친다는 뜻이므로 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `fly in the sky` → `swim in the sea` — 바뀐 문장은 하늘을 나는 것이 아니라 바다에서 헤엄친다는 뜻이므로 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.

---

## 185. novice Day 22 · slot 5

- topic: if 가정법
- format/kind: fill_blank / translation
- source: If I were a bird, I would fly in the sky.
- pattern: If + 과거형, 주어 + would + 동사원형
- prompt: "내가 새라면 하늘을 날 텐데요."에 맞게 빈칸을 채우세요: If I were ____, I would fly in the sky.
- correct answer: a bird
- explanation: 제시된 뜻은 내가 새라고 가정하는 내용이므로 빈칸에는 "a bird"가 와야 합니다.
- feedback reason: 제시된 뜻은 내가 새라고 가정하는 내용이므로 빈칸에는 "a bird"가 와야 합니다.

Choices:
- [distractor] a superhero
- [distractor] a dragon
- [correct] a bird
- [distractor] a pilot

Mutation evidence:
- fixed_expression/fixed_expression: `a bird` → `a superhero` — 제시된 뜻은 내가 새라고 가정하는 내용이므로 빈칸에는 "a bird"가 와야 합니다.
- fixed_expression/fixed_expression: `a bird` → `a dragon` — 제시된 뜻은 내가 새라고 가정하는 내용이므로 빈칸에는 "a bird"가 와야 합니다.
- fixed_expression/fixed_expression: `a bird` → `a pilot` — 제시된 뜻은 내가 새라고 가정하는 내용이므로 빈칸에는 "a bird"가 와야 합니다.

---

## 186. novice Day 23 · slot 1

- topic: 위치 묘사
- format/kind: multiple_choice / translation
- source: There is a house in the middle of the picture.
- pattern: in the middle of
- prompt: "그림 가운데에 집이 있어요."에 맞는 영어 문장을 고르세요.
- correct answer: There is a house in the middle of the picture.
- explanation: 그림 가운데에 있는 것이 집이라는 뜻에 맞는 표현은 "a house"입니다.
- feedback reason: 그림 가운데에 있는 것이 집이라는 뜻에 맞는 표현은 "a house"입니다.

Choices:
- [distractor] There is a tree in the middle of the picture.
- [distractor] There is a person in the middle of the picture.
- [correct] There is a house in the middle of the picture.
- [distractor] There is a car in the middle of the picture.

Mutation evidence:
- fixed_expression/fixed_expression: `a house` → `a tree` — 그림 가운데에 있는 것이 집이라는 뜻에 맞는 표현은 "a house"입니다.
- fixed_expression/fixed_expression: `a house` → `a person` — 그림 가운데에 있는 것이 집이라는 뜻에 맞는 표현은 "a house"입니다.
- fixed_expression/fixed_expression: `a house` → `a car` — 그림 가운데에 있는 것이 집이라는 뜻에 맞는 표현은 "a house"입니다.

---

## 187. novice Day 23 · slot 2

- topic: 위치 묘사
- format/kind: fill_blank / pattern
- source: There is a house in the middle of the picture.
- pattern: in the middle of
- prompt: "in the middle of" 패턴을 사용해 "그림 가운데에 집이 있어요."에 맞게 빈칸을 채우세요: There is a house ____ the picture.
- correct answer: in the middle of
- explanation: 가운데 위치를 나타내는 패턴의 정답은 "in the middle of"입니다.
- feedback reason: 가운데 위치를 나타내는 패턴의 정답은 "in the middle of"입니다.

Choices:
- [distractor] next to
- [correct] in the middle of
- [distractor] on the edge of
- [distractor] outside

Mutation evidence:
- fixed_expression/fixed_expression: `in the middle of` → `next to` — 가운데 위치를 나타내는 패턴의 정답은 "in the middle of"입니다.
- fixed_expression/fixed_expression: `in the middle of` → `on the edge of` — 가운데 위치를 나타내는 패턴의 정답은 "in the middle of"입니다.
- fixed_expression/fixed_expression: `in the middle of` → `outside` — 가운데 위치를 나타내는 패턴의 정답은 "in the middle of"입니다.

---

## 188. novice Day 23 · slot 3

- topic: 위치 묘사
- format/kind: multiple_choice / pattern
- source: A tree is on the right side of the house.
- pattern: on the upper/lower/left/right side of
- prompt: "on the upper/lower/left/right side of" 패턴을 사용해 "나무가 집의 오른쪽에 있어요."에 맞는 영어 문장을 고르세요.
- correct answer: A tree is on the right side of the house.
- explanation: 오른쪽 위치는 "on the right side of"로 나타냅니다.
- feedback reason: 오른쪽 위치는 "on the right side of"로 나타냅니다.

Choices:
- [distractor] A tree is behind the house.
- [distractor] A tree is in front of the house.
- [correct] A tree is on the right side of the house.
- [distractor] A tree is on the left side of the house.

Mutation evidence:
- fixed_expression/fixed_expression: `on the right side of` → `behind` — 오른쪽 위치는 "on the right side of"로 나타냅니다.
- fixed_expression/fixed_expression: `on the right side of` → `in front of` — 오른쪽 위치는 "on the right side of"로 나타냅니다.
- fixed_expression/fixed_expression: `on the right side of` → `on the left side of` — 오른쪽 위치는 "on the right side of"로 나타냅니다.

---

## 189. novice Day 23 · slot 4

- topic: 위치 묘사
- format/kind: true_false / translation
- source: The chair is on the left side of the desk.
- pattern: on the upper/lower/left/right side of
- prompt: "의자가 책상의 왼쪽에 있어요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "The chair is on the left side of the desk."
- correct answer: O
- explanation: "on the left side of"가 "~의 왼쪽에"를 나타내므로 제시된 문장은 한국어 뜻과 일치합니다.
- feedback reason: "on the left side of"가 "~의 왼쪽에"를 나타내므로 제시된 문장은 한국어 뜻과 일치합니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 190. novice Day 23 · slot 5

- topic: 위치 묘사
- format/kind: fill_blank / translation
- source: A tree is on the right side of the house.
- pattern: on the upper/lower/left/right side of
- prompt: "나무가 집의 오른쪽에 있어요."에 맞게 빈칸을 채우세요: A tree is on the right side of ____.
- correct answer: the house
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "the house"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "the house"입니다.

Choices:
- [distractor] the building
- [distractor] the park
- [distractor] the school
- [correct] the house

Mutation evidence:
- fixed_expression/fixed_expression: `the house` → `the building` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "the house"입니다.
- fixed_expression/fixed_expression: `the house` → `the park` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "the house"입니다.
- fixed_expression/fixed_expression: `the house` → `the school` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "the house"입니다.

---

## 191. novice Day 24 · slot 1

- topic: 반응 표현
- format/kind: multiple_choice / translation
- source: Good for you!
- pattern: Sounds great! / Good for you! / Lucky you!
- prompt: "잘됐네요!"에 맞는 영어 문장을 고르세요.
- correct answer: Good for you!
- explanation: "Good for you!"는 상대의 좋은 소식에 긍정적으로 반응할 때 쓰는 표현입니다.
- feedback reason: "Good for you!"는 상대의 좋은 소식에 긍정적으로 반응할 때 쓰는 표현입니다.

Choices:
- [correct] Good for you!
- [distractor] I'm listening.
- [distractor] That's a shame.
- [distractor] That's too bad.

Mutation evidence:
- fixed_expression/fixed_expression: `Good for you!` → `I'm listening.` — "Good for you!"는 상대의 좋은 소식에 긍정적으로 반응할 때 쓰는 표현입니다.
- fixed_expression/fixed_expression: `Good for you!` → `That's a shame.` — "Good for you!"는 상대의 좋은 소식에 긍정적으로 반응할 때 쓰는 표현입니다.
- fixed_expression/fixed_expression: `Good for you!` → `That's too bad.` — "Good for you!"는 상대의 좋은 소식에 긍정적으로 반응할 때 쓰는 표현입니다.

---

## 192. novice Day 24 · slot 2

- topic: 반응 표현
- format/kind: fill_blank / pattern
- source: I'm listening.
- pattern: That's too bad. / That's a shame. / I'm listening.
- prompt: "That's too bad. / That's a shame. / I'm listening." 패턴을 사용해 "듣고 있어요."에 맞게 빈칸을 채우세요: I'm ____.
- correct answer: listening
- explanation: "I'm listening."에서는 be동사 뒤에 "listening"을 써서 지금 듣고 있다는 뜻을 나타냅니다.
- feedback reason: "I'm listening."에서는 be동사 뒤에 "listening"을 써서 지금 듣고 있다는 뜻을 나타냅니다.

Choices:
- [distractor] listen
- [distractor] listened
- [correct] listening
- [distractor] listens

Mutation evidence:
- fixed_expression/fixed_expression: `listening` → `listen` — "I'm listening."에서는 be동사 뒤에 "listening"을 써서 지금 듣고 있다는 뜻을 나타냅니다.
- fixed_expression/fixed_expression: `listening` → `listened` — "I'm listening."에서는 be동사 뒤에 "listening"을 써서 지금 듣고 있다는 뜻을 나타냅니다.
- fixed_expression/fixed_expression: `listening` → `listens` — "I'm listening."에서는 be동사 뒤에 "listening"을 써서 지금 듣고 있다는 뜻을 나타냅니다.

---

## 193. novice Day 24 · slot 3

- topic: 반응 표현
- format/kind: multiple_choice / pattern
- source: Lucky you!
- pattern: Sounds great! / Good for you! / Lucky you!
- prompt: "Sounds great! / Good for you! / Lucky you!" 패턴을 사용해 "좋겠네요!"에 맞는 영어 문장을 고르세요.
- correct answer: Lucky you!
- explanation: "Lucky you!"는 상대의 행운을 부러워하거나 축하할 때 쓰는 표현입니다.
- feedback reason: "Lucky you!"는 상대의 행운을 부러워하거나 축하할 때 쓰는 표현입니다.

Choices:
- [correct] Lucky you!
- [distractor] I'm listening.
- [distractor] That's a shame.
- [distractor] That's too bad.

Mutation evidence:
- fixed_expression/fixed_expression: `Lucky you!` → `I'm listening.` — "Lucky you!"는 상대의 행운을 부러워하거나 축하할 때 쓰는 표현입니다.
- fixed_expression/fixed_expression: `Lucky you!` → `That's a shame.` — "Lucky you!"는 상대의 행운을 부러워하거나 축하할 때 쓰는 표현입니다.
- fixed_expression/fixed_expression: `Lucky you!` → `That's too bad.` — "Lucky you!"는 상대의 행운을 부러워하거나 축하할 때 쓰는 표현입니다.

---

## 194. novice Day 24 · slot 4

- topic: 반응 표현
- format/kind: true_false / translation
- source: That's too bad.
- pattern: That's too bad. / That's a shame. / I'm listening.
- prompt: "안됐네요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "That's very bad."
- correct answer: X
- explanation: "That's too bad."는 안타까움이나 유감을 나타내는 고정 표현입니다.
- feedback reason: "That's too bad."는 안타까움이나 유감을 나타내는 고정 표현입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `too` → `very` — "That's too bad."는 안타까움이나 유감을 나타내는 고정 표현입니다.

---

## 195. novice Day 24 · slot 5

- topic: 반응 표현
- format/kind: fill_blank / translation
- source: That's a shame.
- pattern: That's too bad. / That's a shame. / I'm listening.
- prompt: "아쉽네요."에 맞게 빈칸을 채우세요: That's ____ shame.
- correct answer: a
- explanation: 아쉬움을 나타낼 때는 "That's a shame." 형태로 말합니다.
- feedback reason: 아쉬움을 나타낼 때는 "That's a shame." 형태로 말합니다.

Choices:
- [correct] a
- [distractor] some
- [distractor] the
- [distractor] an

Mutation evidence:
- fixed_expression/fixed_expression: `a` → `some` — 아쉬움을 나타낼 때는 "That's a shame." 형태로 말합니다.
- fixed_expression/fixed_expression: `a` → `the` — 아쉬움을 나타낼 때는 "That's a shame." 형태로 말합니다.
- fixed_expression/fixed_expression: `a` → `an` — 아쉬움을 나타낼 때는 "That's a shame." 형태로 말합니다.

---

## 196. novice Day 27 · slot 1

- topic: to부정사 3가지 용법
- format/kind: fill_blank / translation
- source: To study is hard.
- pattern: To + 동사원형 + is ...
- prompt: "공부하는 것은 어려워요."에 맞게 빈칸을 채우세요: To ____ is hard.
- correct answer: study
- explanation: to 뒤의 정답은 동사원형 "study"입니다.
- feedback reason: to 뒤의 정답은 동사원형 "study"입니다.

Choices:
- [distractor] studied
- [distractor] studying
- [correct] study
- [distractor] studies

Mutation evidence:
- infinitive_form/infinitive_form: `study` → `studied` — to 뒤의 정답은 동사원형 "study"입니다.
- infinitive_form/infinitive_form: `study` → `studying` — to 뒤의 정답은 동사원형 "study"입니다.
- infinitive_form/infinitive_form: `study` → `studies` — to 뒤의 정답은 동사원형 "study"입니다.

---

## 197. novice Day 27 · slot 2

- topic: to부정사 3가지 용법
- format/kind: true_false / translation
- source: I study English to go abroad.
- pattern: to + 동사원형 (목적)
- prompt: "해외에 가기 위해 영어를 공부해요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I study English to go abroad."
- correct answer: O
- explanation: "to go abroad"는 영어를 공부하는 목적을 나타내며, 목적의 to부정사는 "to + 동사원형" 형태이므로 제시된 문장이 맞습니다.
- feedback reason: "to go abroad"는 영어를 공부하는 목적을 나타내며, 목적의 to부정사는 "to + 동사원형" 형태이므로 제시된 문장이 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 198. novice Day 27 · slot 3

- topic: to부정사 3가지 용법
- format/kind: multiple_choice / translation
- source: Do you have a pen to use?
- pattern: 명사 + to + 동사원형
- prompt: "사용할 펜이 있나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Do you have a pen to use?
- explanation: to 뒤의 정답은 동사원형 "use"입니다.
- feedback reason: to 뒤의 정답은 동사원형 "use"입니다.

Choices:
- [distractor] Do you have a pen to using?
- [distractor] Do you have a pen to used?
- [distractor] Do you have a pen to uses?
- [correct] Do you have a pen to use?

Mutation evidence:
- infinitive_form/infinitive_form: `use` → `using` — to 뒤의 정답은 동사원형 "use"입니다.
- infinitive_form/infinitive_form: `use` → `used` — to 뒤의 정답은 동사원형 "use"입니다.
- infinitive_form/infinitive_form: `use` → `uses` — to 뒤의 정답은 동사원형 "use"입니다.

---

## 199. novice Day 27 · slot 4

- topic: to부정사 3가지 용법
- format/kind: fill_blank / pattern
- source: He is at the bus stop to get on the bus.
- pattern: to + 동사원형 (목적)
- prompt: "to + 동사원형 (목적)" 패턴을 사용해 "버스를 타려고 버스 정류장에 있어요."에 맞게 빈칸을 채우세요: He is at the bus stop to ____ on the bus.
- correct answer: get
- explanation: to 뒤의 정답은 동사원형 "get"입니다.
- feedback reason: to 뒤의 정답은 동사원형 "get"입니다.

Choices:
- [correct] get
- [distractor] got
- [distractor] gets
- [distractor] getting

Mutation evidence:
- infinitive_form/infinitive_form: `get` → `got` — to 뒤의 정답은 동사원형 "get"입니다.
- infinitive_form/infinitive_form: `get` → `gets` — to 뒤의 정답은 동사원형 "get"입니다.
- infinitive_form/infinitive_form: `get` → `getting` — to 뒤의 정답은 동사원형 "get"입니다.

---

## 200. novice Day 27 · slot 5

- topic: to부정사 3가지 용법
- format/kind: multiple_choice / pattern
- source: I have many things to do.
- pattern: 명사 + to + 동사원형
- prompt: "명사 + to + 동사원형" 패턴을 사용해 "할 일이 많아요."에 맞는 영어 문장을 고르세요.
- correct answer: I have many things to do.
- explanation: to 뒤의 정답은 동사원형 "do"입니다.
- feedback reason: to 뒤의 정답은 동사원형 "do"입니다.

Choices:
- [distractor] I have many things to doing.
- [correct] I have many things to do.
- [distractor] I have many things to did.
- [distractor] I have many things to does.

Mutation evidence:
- infinitive_form/infinitive_form: `do` → `doing` — to 뒤의 정답은 동사원형 "do"입니다.
- infinitive_form/infinitive_form: `do` → `did` — to 뒤의 정답은 동사원형 "do"입니다.
- infinitive_form/infinitive_form: `do` → `does` — to 뒤의 정답은 동사원형 "do"입니다.

---

## 201. novice Day 28 · slot 1

- topic: 동사+to부정사
- format/kind: multiple_choice / translation
- source: Do you want to drink coffee?
- pattern: 동사 + to + 동사원형
- prompt: "커피를 마시고 싶나요?"에 맞는 영어 문장을 고르세요.
- correct answer: Do you want to drink coffee?
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "coffee"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "coffee"입니다.

Choices:
- [correct] Do you want to drink coffee?
- [distractor] Do you want to drink water?
- [distractor] Do you want to drink tea?
- [distractor] Do you want to drink juice?

Mutation evidence:
- fixed_expression/fixed_expression: `coffee` → `water` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "coffee"입니다.
- fixed_expression/fixed_expression: `coffee` → `tea` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "coffee"입니다.
- fixed_expression/fixed_expression: `coffee` → `juice` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "coffee"입니다.

---

## 202. novice Day 28 · slot 2

- topic: 동사+to부정사
- format/kind: fill_blank / pattern
- source: I decided not to read a book.
- pattern: 동사 + to + 동사원형
- prompt: "동사 + to + 동사원형" 패턴을 사용해 "책을 읽지 않기로 결정했어요."에 맞게 빈칸을 채우세요: I ____ a book.
- correct answer: decided not to read
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "decided not to read"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "decided not to read"입니다.

Choices:
- [distractor] forgot to read
- [correct] decided not to read
- [distractor] wanted to read
- [distractor] planned to read

Mutation evidence:
- fixed_expression/fixed_expression: `decided not to read` → `forgot to read` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "decided not to read"입니다.
- fixed_expression/fixed_expression: `decided not to read` → `wanted to read` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "decided not to read"입니다.
- fixed_expression/fixed_expression: `decided not to read` → `planned to read` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "decided not to read"입니다.

---

## 203. novice Day 28 · slot 3

- topic: 동사+to부정사
- format/kind: multiple_choice / pattern
- source: I want you to be with me.
- pattern: 동사 + 목적어 + to + 동사원형
- prompt: "동사 + 목적어 + to + 동사원형" 패턴을 사용해 "나는 당신이 나와 함께 있기를 원해요."에 맞는 영어 문장을 고르세요.
- correct answer: I want you to be with me.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "want you to be"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "want you to be"입니다.

Choices:
- [correct] I want you to be with me.
- [distractor] I asked you to come with me.
- [distractor] I need you to stay with me.
- [distractor] I would like you to wait with me.

Mutation evidence:
- fixed_expression/fixed_expression: `want you to be` → `asked you to come` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "want you to be"입니다.
- fixed_expression/fixed_expression: `want you to be` → `need you to stay` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "want you to be"입니다.
- fixed_expression/fixed_expression: `want you to be` → `would like you to wait` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "want you to be"입니다.

---

## 204. novice Day 28 · slot 4

- topic: 동사+to부정사
- format/kind: true_false / translation
- source: I would like you to buy me a bag.
- pattern: 동사 + 목적어 + to + 동사원형
- prompt: "당신이 내게 가방을 사주면 좋겠어요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I would like you to buy me a book."
- correct answer: X
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "a bag"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "a bag"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `a bag` → `a book` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "a bag"입니다.

---

## 205. novice Day 28 · slot 5

- topic: 동사+to부정사
- format/kind: fill_blank / translation
- source: Do you want to drink coffee?
- pattern: 동사 + to + 동사원형
- prompt: "커피를 마시고 싶나요?"에 맞게 빈칸을 채우세요: Do you want to ____ coffee?
- correct answer: drink
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "drink"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "drink"입니다.

Choices:
- [distractor] buy
- [distractor] make
- [correct] drink
- [distractor] order

Mutation evidence:
- fixed_expression/fixed_expression: `drink` → `buy` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "drink"입니다.
- fixed_expression/fixed_expression: `drink` → `make` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "drink"입니다.
- fixed_expression/fixed_expression: `drink` → `order` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "drink"입니다.

---

## 206. novice Day 29 · slot 1

- topic: 동명사·to부정사
- format/kind: multiple_choice / translation
- source: I enjoy talking in English.
- pattern: enjoy/finish/avoid/keep/practice + -ing
- prompt: "영어로 대화하는 것을 즐겨요."에 맞는 영어 문장을 고르세요.
- correct answer: I enjoy talking in English.
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "in English"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "in English"입니다.

Choices:
- [distractor] I enjoy talking with my friends.
- [correct] I enjoy talking in English.
- [distractor] I enjoy talking after class.
- [distractor] I enjoy talking in Korean.

Mutation evidence:
- fixed_expression/fixed_expression: `in English` → `with my friends` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "in English"입니다.
- fixed_expression/fixed_expression: `in English` → `after class` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "in English"입니다.
- fixed_expression/fixed_expression: `in English` → `in Korean` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "in English"입니다.

---

## 207. novice Day 29 · slot 2

- topic: 동명사·to부정사
- format/kind: fill_blank / pattern
- source: I keep studying English.
- pattern: enjoy/finish/avoid/keep/practice + -ing
- prompt: "enjoy/finish/avoid/keep/practice + -ing" 패턴을 사용해 "계속 영어를 공부해요."에 맞게 빈칸을 채우세요: I ____ English.
- correct answer: keep studying
- explanation: keep + -ing 패턴의 정답은 "keep studying"입니다.
- feedback reason: keep + -ing 패턴의 정답은 "keep studying"입니다.

Choices:
- [distractor] want to study
- [correct] keep studying
- [distractor] will study
- [distractor] study

Mutation evidence:
- fixed_expression/fixed_expression: `keep studying` → `want to study` — keep + -ing 패턴의 정답은 "keep studying"입니다.
- fixed_expression/fixed_expression: `keep studying` → `will study` — keep + -ing 패턴의 정답은 "keep studying"입니다.
- fixed_expression/fixed_expression: `keep studying` → `study` — keep + -ing 패턴의 정답은 "keep studying"입니다.

---

## 208. novice Day 29 · slot 3

- topic: 동명사·to부정사
- format/kind: multiple_choice / pattern
- source: I heard you snoring.
- pattern: see/hear + 목적어 + -ing
- prompt: "see/hear + 목적어 + -ing" 패턴을 사용해 "당신이 코 고는 것을 들었어요."에 맞는 영어 문장을 고르세요.
- correct answer: I heard you snoring.
- explanation: "see/hear + 목적어 + -ing"에서 -ing형은 목적어가 하는 동작을 나타냅니다. 여기서는 "코를 고는 것"을 들었으므로 "talking", "singing", "crying"이 아니라 "snoring"이 맞습니다.
- feedback reason: "see/hear + 목적어 + -ing"에서 -ing형은 목적어가 하는 동작을 나타냅니다. 여기서는 "코를 고는 것"을 들었으므로 "talking", "singing", "crying"이 아니라 "snoring"이 맞습니다.

Choices:
- [correct] I heard you snoring.
- [distractor] I heard you talking.
- [distractor] I heard you singing.
- [distractor] I heard you crying.

Mutation evidence:
- fixed_expression/fixed_expression: `snoring` → `talking` — "see/hear + 목적어 + -ing"에서 -ing형은 목적어가 하는 동작을 나타냅니다. 여기서는 "코를 고는 것"을 들었으므로 "talking", "singing", "crying"이 아니라 "snoring"이 맞습니다.
- fixed_expression/fixed_expression: `snoring` → `singing` — "see/hear + 목적어 + -ing"에서 -ing형은 목적어가 하는 동작을 나타냅니다. 여기서는 "코를 고는 것"을 들었으므로 "talking", "singing", "crying"이 아니라 "snoring"이 맞습니다.
- fixed_expression/fixed_expression: `snoring` → `crying` — "see/hear + 목적어 + -ing"에서 -ing형은 목적어가 하는 동작을 나타냅니다. 여기서는 "코를 고는 것"을 들었으므로 "talking", "singing", "crying"이 아니라 "snoring"이 맞습니다.

---

## 209. novice Day 29 · slot 4

- topic: 동명사·to부정사
- format/kind: true_false / translation
- source: I saw him running.
- pattern: see/hear + 목적어 + -ing
- prompt: "그가 달리는 것을 봤어요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "I saw him running."
- correct answer: O
- explanation: "see + 목적어 + -ing"는 목적어가 동작 중인 장면을 본 것을 나타내므로 "saw him running"이 "그가 달리는 것을 봤어요"에 맞습니다.
- feedback reason: "see + 목적어 + -ing"는 목적어가 동작 중인 장면을 본 것을 나타내므로 "saw him running"이 "그가 달리는 것을 봤어요"에 맞습니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 210. novice Day 29 · slot 5

- topic: 동명사·to부정사
- format/kind: fill_blank / translation
- source: I keep studying English.
- pattern: enjoy/finish/avoid/keep/practice + -ing
- prompt: "계속 영어를 공부해요."에 맞게 빈칸을 채우세요: I keep studying ____.
- correct answer: English
- explanation: 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.
- feedback reason: 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.

Choices:
- [correct] English
- [distractor] math
- [distractor] Korean
- [distractor] science

Mutation evidence:
- fixed_expression/fixed_expression: `English` → `math` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.
- fixed_expression/fixed_expression: `English` → `Korean` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.
- fixed_expression/fixed_expression: `English` → `science` — 제시된 한국어 뜻과 문맥에 맞는 표현은 "English"입니다.

---

## 211. novice Day 30 · slot 1

- topic: 동명사·to부정사 역할
- format/kind: multiple_choice / translation
- source: My hobby is playing badminton.
- pattern: 주어 + be + -ing / to + 동사원형
- prompt: "내 취미는 배드민턴을 치는 거예요."에 맞는 영어 문장을 고르세요.
- correct answer: My hobby is playing badminton.
- explanation: 취미로 하는 운동이 배드민턴이라는 뜻에 맞아야 합니다. 정답 표현은 "badminton"입니다.
- feedback reason: 취미로 하는 운동이 배드민턴이라는 뜻에 맞아야 합니다. 정답 표현은 "badminton"입니다.

Choices:
- [distractor] My hobby is playing baseball.
- [correct] My hobby is playing badminton.
- [distractor] My hobby is playing chess.
- [distractor] My hobby is playing tennis.

Mutation evidence:
- fixed_expression/fixed_expression: `badminton` → `baseball` — 취미로 하는 운동이 배드민턴이라는 뜻에 맞아야 합니다. 정답 표현은 "badminton"입니다.
- fixed_expression/fixed_expression: `badminton` → `chess` — 취미로 하는 운동이 배드민턴이라는 뜻에 맞아야 합니다. 정답 표현은 "badminton"입니다.
- fixed_expression/fixed_expression: `badminton` → `tennis` — 취미로 하는 운동이 배드민턴이라는 뜻에 맞아야 합니다. 정답 표현은 "badminton"입니다.

---

## 212. novice Day 30 · slot 2

- topic: 동명사·to부정사 역할
- format/kind: fill_blank / pattern
- source: My job is to stop people.
- pattern: 주어 + be + -ing / to + 동사원형
- prompt: "주어 + be + -ing / to + 동사원형" 패턴을 사용해 "내 일은 사람들을 제지하는 거예요."에 맞게 빈칸을 채우세요: My job is ____.
- correct answer: to stop people
- explanation: 직업의 역할이나 내용을 "to + 동사원형"으로 설명하므로 "to stop people"이 맞습니다.
- feedback reason: 직업의 역할이나 내용을 "to + 동사원형"으로 설명하므로 "to stop people"이 맞습니다.

Choices:
- [correct] to stop people
- [distractor] to help people
- [distractor] important to many people
- [distractor] related to stopping people

Mutation evidence:
- fixed_expression/fixed_expression: `to stop people` → `to help people` — 직업의 역할이나 내용을 "to + 동사원형"으로 설명하므로 "to stop people"이 맞습니다.
- fixed_expression/fixed_expression: `to stop people` → `important to many people` — 직업의 역할이나 내용을 "to + 동사원형"으로 설명하므로 "to stop people"이 맞습니다.
- fixed_expression/fixed_expression: `to stop people` → `related to stopping people` — 직업의 역할이나 내용을 "to + 동사원형"으로 설명하므로 "to stop people"이 맞습니다.

---

## 213. novice Day 30 · slot 3

- topic: 동명사·to부정사 역할
- format/kind: multiple_choice / pattern
- source: Being rich is good.
- pattern: -ing / To + 동사원형 + is ...
- prompt: "-ing / To + 동사원형 + is ..." 패턴을 사용해 "부자인 것은 좋아요."에 맞는 영어 문장을 고르세요.
- correct answer: Being rich is good.
- explanation: 동명사구 "Being rich"를 주어로 두고 부자인 상태가 좋다고 설명해야 합니다. 정답 표현은 "Being rich is good."입니다.
- feedback reason: 동명사구 "Being rich"를 주어로 두고 부자인 상태가 좋다고 설명해야 합니다. 정답 표현은 "Being rich is good."입니다.

Choices:
- [distractor] Being rich was difficult.
- [distractor] Getting rich takes time.
- [distractor] Rich people can be generous.
- [correct] Being rich is good.

Mutation evidence:
- fixed_expression/fixed_expression: `Being rich is good.` → `Being rich was difficult.` — 동명사구 "Being rich"를 주어로 두고 부자인 상태가 좋다고 설명해야 합니다. 정답 표현은 "Being rich is good."입니다.
- fixed_expression/fixed_expression: `Being rich is good.` → `Getting rich takes time.` — 동명사구 "Being rich"를 주어로 두고 부자인 상태가 좋다고 설명해야 합니다. 정답 표현은 "Being rich is good."입니다.
- fixed_expression/fixed_expression: `Being rich is good.` → `Rich people can be generous.` — 동명사구 "Being rich"를 주어로 두고 부자인 상태가 좋다고 설명해야 합니다. 정답 표현은 "Being rich is good."입니다.

---

## 214. novice Day 30 · slot 4

- topic: 동명사·to부정사 역할
- format/kind: true_false / translation
- source: To study is good for your future.
- pattern: -ing / To + 동사원형 + is ...
- prompt: "공부하는 것은 미래에 도움이 돼요."에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: "To study is good for your health."
- correct answer: X
- explanation: 제시된 뜻은 공부가 건강이 아니라 미래에 도움이 된다는 내용입니다. 정답 표현은 "your future"입니다.
- feedback reason: 제시된 뜻은 공부가 건강이 아니라 미래에 도움이 된다는 내용입니다. 정답 표현은 "your future"입니다.

Choices:
- [distractor] O
- [correct] X

Mutation evidence:
- fixed_expression/fixed_expression: `your future` → `your health` — 제시된 뜻은 공부가 건강이 아니라 미래에 도움이 된다는 내용입니다. 정답 표현은 "your future"입니다.

---

## 215. novice Day 30 · slot 5

- topic: 동명사·to부정사 역할
- format/kind: fill_blank / translation
- source: My job is to stop people.
- pattern: 주어 + be + -ing / to + 동사원형
- prompt: "내 일은 사람들을 제지하는 거예요."에 맞게 빈칸을 채우세요: ____ is to stop people.
- correct answer: My job
- explanation: 사람들을 제지하는 일이 내 직업이라는 뜻에 맞아야 합니다. 정답 표현은 "My job"입니다.
- feedback reason: 사람들을 제지하는 일이 내 직업이라는 뜻에 맞아야 합니다. 정답 표현은 "My job"입니다.

Choices:
- [correct] My job
- [distractor] Your job
- [distractor] Their job
- [distractor] His job

Mutation evidence:
- fixed_expression/fixed_expression: `My job` → `Your job` — 사람들을 제지하는 일이 내 직업이라는 뜻에 맞아야 합니다. 정답 표현은 "My job"입니다.
- fixed_expression/fixed_expression: `My job` → `Their job` — 사람들을 제지하는 일이 내 직업이라는 뜻에 맞아야 합니다. 정답 표현은 "My job"입니다.
- fixed_expression/fixed_expression: `My job` → `His job` — 사람들을 제지하는 일이 내 직업이라는 뜻에 맞아야 합니다. 정답 표현은 "My job"입니다.

---

## 216. novice Day 31 · slot 1

- topic: It + 형용사 + to
- format/kind: fill_blank / translation
- source: It's difficult not to be late.
- pattern: It is + 형용사 + to + 동사원형
- prompt: "늦지 않는 것은 어려워요."에 맞게 빈칸을 채우세요: It's difficult not to ____ late.
- correct answer: be
- explanation: to 뒤의 정답은 동사원형 "be"입니다.
- feedback reason: to 뒤의 정답은 동사원형 "be"입니다.

Choices:
- [distractor] am
- [distractor] is
- [distractor] being
- [correct] be

Mutation evidence:
- infinitive_form/infinitive_form: `be` → `am` — to 뒤의 정답은 동사원형 "be"입니다.
- infinitive_form/infinitive_form: `be` → `is` — to 뒤의 정답은 동사원형 "be"입니다.
- infinitive_form/infinitive_form: `be` → `being` — to 뒤의 정답은 동사원형 "be"입니다.

---

## 217. novice Day 31 · slot 2

- topic: It + 형용사 + to
- format/kind: multiple_choice / translation
- source: It's difficult for you to learn Japanese.
- pattern: It is + 형용사 + for + 사람 + to + 동사원형
- prompt: "당신이 일본어를 배우는 것은 어려워요."에 맞는 영어 문장을 고르세요.
- correct answer: It's difficult for you to learn Japanese.
- explanation: 어렵다는 뜻의 "difficult", 행동 주체인 "for you", 학습 대상인 "Japanese"가 모두 제시된 뜻과 일치해야 합니다.
- feedback reason: 어렵다는 뜻의 "difficult", 행동 주체인 "for you", 학습 대상인 "Japanese"가 모두 제시된 뜻과 일치해야 합니다.

Choices:
- [distractor] It's difficult for you to learn Korean.
- [distractor] It's easy for you to learn Japanese.
- [correct] It's difficult for you to learn Japanese.
- [distractor] It's difficult for me to learn Japanese.

Mutation evidence:
- fixed_expression/fixed_expression: `It's difficult for you to learn Japanese.` → `It's difficult for you to learn Korean.` — 어렵다는 뜻의 "difficult", 행동 주체인 "for you", 학습 대상인 "Japanese"가 모두 제시된 뜻과 일치해야 합니다.
- fixed_expression/fixed_expression: `It's difficult for you to learn Japanese.` → `It's easy for you to learn Japanese.` — 어렵다는 뜻의 "difficult", 행동 주체인 "for you", 학습 대상인 "Japanese"가 모두 제시된 뜻과 일치해야 합니다.
- fixed_expression/fixed_expression: `It's difficult for you to learn Japanese.` → `It's difficult for me to learn Japanese.` — 어렵다는 뜻의 "difficult", 행동 주체인 "for you", 학습 대상인 "Japanese"가 모두 제시된 뜻과 일치해야 합니다.

---

## 218. novice Day 31 · slot 3

- topic: It + 형용사 + to
- format/kind: fill_blank / translation
- source: It's difficult for you to learn Japanese.
- pattern: It is + 형용사 + for + 사람 + to + 동사원형
- prompt: "당신이 일본어를 배우는 것은 어려워요."에 맞게 빈칸을 채우세요: It's difficult for you to ____ Japanese.
- correct answer: learn
- explanation: to 뒤의 정답은 동사원형 "learn"입니다.
- feedback reason: to 뒤의 정답은 동사원형 "learn"입니다.

Choices:
- [correct] learn
- [distractor] learned
- [distractor] learns
- [distractor] learning

Mutation evidence:
- infinitive_form/infinitive_form: `learn` → `learned` — to 뒤의 정답은 동사원형 "learn"입니다.
- infinitive_form/infinitive_form: `learn` → `learns` — to 뒤의 정답은 동사원형 "learn"입니다.
- infinitive_form/infinitive_form: `learn` → `learning` — to 뒤의 정답은 동사원형 "learn"입니다.

---

## 219. novice Day 31 · slot 4

- topic: It + 형용사 + to
- format/kind: true_false / pattern
- source: It's important for me to make money.
- pattern: It is + 형용사 + for + 사람 + to + 동사원형
- prompt: "It is + 형용사 + for + 사람 + to + 동사원형" 패턴을 사용해 "내가 돈을 버는 것은 중요해요."에 맞는 문장이면 O, 아니면 X를 고르세요: "It's important for me to make money."
- correct answer: O
- explanation: "for me"는 행동 주체가 나임을 나타내고 "to make money"는 돈을 버는 행동을 나타내므로 제시된 뜻과 일치합니다.
- feedback reason: "for me"는 행동 주체가 나임을 나타내고 "to make money"는 돈을 버는 행동을 나타내므로 제시된 뜻과 일치합니다.

Choices:
- [correct] O
- [distractor] X

Mutation evidence:
- none (verbatim source or correct answer)

---

## 220. novice Day 31 · slot 5

- topic: It + 형용사 + to
- format/kind: multiple_choice / pattern
- source: It's nice to go home.
- pattern: It is + 형용사 + to + 동사원형
- prompt: "It is + 형용사 + to + 동사원형" 패턴을 사용해 "집에 가는 것은 좋아요."에 맞는 영어 문장을 고르세요.
- correct answer: It's nice to go home.
- explanation: to 뒤의 정답은 동사원형 "go"입니다.
- feedback reason: to 뒤의 정답은 동사원형 "go"입니다.

Choices:
- [distractor] It's nice to going home.
- [distractor] It's nice to went home.
- [correct] It's nice to go home.
- [distractor] It's nice to goes home.

Mutation evidence:
- infinitive_form/infinitive_form: `go` → `going` — to 뒤의 정답은 동사원형 "go"입니다.
- infinitive_form/infinitive_form: `go` → `went` — to 뒤의 정답은 동사원형 "go"입니다.
- infinitive_form/infinitive_form: `go` → `goes` — to 뒤의 정답은 동사원형 "go"입니다.
