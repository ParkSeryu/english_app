# WCT Premium Day 1 설계

## 상태

- 사용자 승인 완료: 2026-07-27
- 대상 브랜치: `dev`
- 대상 화면: `/lessons`와 새 WCT Premium 읽기 경로

## 목표

- `/lessons`의 `WCT Premium` 준비 중 항목을 실제 Premium 수업 입구로 전환한다.
- 첫 콘텐츠로 `Premium Day 1 — 관계대명사 기초`를 제공한다.
- Premium 콘텐츠는 스캔, OCR, 교재 가져오기, WCT 데이터베이스와 분리한다.
- 이후 Day도 사용자와 대화로 원고를 확정한 뒤 같은 구조에 추가할 수 있게 한다.

## 사용자 흐름

1. 사용자가 하단 GNB의 `수업`을 연다.
2. `/lessons`에서 기존 WCT 교재와 `WCT Premium` 카드를 함께 본다.
3. `WCT Premium` 카드를 눌러 `/lessons/premium`으로 이동한다.
4. Premium Day 목록에서 `Day 1`을 선택한다.
5. `/lessons/premium/days/day-1`에서 승인된 관계대명사 수업 내용을 읽는다.

인증되지 않은 사용자는 기존 수업 화면과 동일하게 로그인 흐름을 따른다. 존재하지 않는 Premium Day ID는 `notFound()`로 처리한다.

## 아키텍처

### 콘텐츠 저장

- Premium Day는 버전 관리되는 TypeScript 콘텐츠로 저장한다.
- 콘텐츠는 `lib/wct/premium-lessons.ts`에서 내보낸다.
- 데이터베이스, Supabase 마이그레이션, WCT 가져오기 API를 사용하지 않는다.
- `book` 또는 `ai_supplement` 출처로 가장하지 않으며, 기존 `WCT_SOURCE_KINDS`를 확장하지 않는다.

### 콘텐츠 모델

Premium Day는 다음처럼 읽기 화면에 필요한 최소 정보만 가진다.

- 안정적인 ID
- Day 번호와 표시 라벨
- 주제
- 짧은 도입
- 제목이 있는 섹션 목록
- 섹션 안의 문단, 문장 결합 예시, 규칙, 목록
- 마지막 핵심 패턴

문단과 예시를 안전한 문자열 데이터로 관리하고 HTML 문자열은 저장하지 않는다. 새 Day는 데이터 한 건을 추가하는 방식으로 확장한다.

### UI 구성

- 기존 `WctPremiumPlaceholderCard`를 링크 카드로 전환한다.
- Premium 목록 페이지는 기존 WCT 책 목록 페이지와 같은 헤더 및 카드 스타일을 사용한다.
- Premium Day 상세 페이지는 기존 WCT Day 페이지와 같은 헤더 간격, 타이포그래피, 카드 톤을 사용한다.
- Premium 본문은 전용 `WctPremiumDayContent`가 렌더링한다.
- 전용 렌더러를 사용해 기존 교재용 `WctDayContent`, 출처 배지, 가져오기 타입을 변경하지 않는다.
- 새 퀴즈, 암기 기능, 편집 버튼은 추가하지 않는다.

## 승인된 Day 1 원고

### 표시 정보

- 시리즈: `WCT Premium`
- Day: `Day 1`
- 주제: `관계대명사 기초 — 두 문장을 하나로 합치기`

### 핵심 내용

관계대명사는 두 문장에 반복되는 명사를 대신하면서, 앞의 명사를 뒤에서 설명해 준다.

```text
I know the person.
The person came to WCT.
→ I know the person who came to WCT.
```

`the person who came to WCT` 전체는 명사 덩어리이고, `who came to WCT`가 `the person`을 설명한다.

`someone who came to WCT`도 ‘WCT에 왔던 사람’이라는 명사 덩어리이며, 이것만으로는 완성된 문장이 아니다.

### 주격과 목적격

관계대명사는 앞의 명사를 대신하면서 뒤의 설명 안에서 주어 또는 목적어 역할을 한다.

#### 관계대명사가 행동의 주인공이면 주격

```text
I know the person.
The person came to WCT.
→ I know the person who came to WCT.
```

`the person`이 `came`의 주어이므로 이를 대신한 `who`도 주어 역할을 한다. `who`를 지우면 `came`의 주어가 없어지므로 생략할 수 없다.

#### 다른 주어가 행동하고 관계대명사가 그 대상이면 목적격

```text
I know the person.
I like the person.
→ I know the person (who/that) I like.
```

행동하는 주어는 `I`이고 `the person`은 좋아하는 대상이다. 이를 대신한 `who/that`은 목적어 역할을 하므로 생략할 수 있다.

```text
I know the person I like.
```

### 생략 규칙

```text
관계대명사 뒤에 바로 동사가 나오면 → 생략 불가
관계대명사 뒤에 별도의 주어 + 동사가 나오면 → 생략 가능
```

- `someone who came to WCT` → 생략 불가
- `the book that is on the table` → 생략 불가
- `the person (who/that) I like` → 생략 가능
- `the place (which/that) I go to` → 생략 가능

정리하면 관계대명사가 행동의 주인공이면 **주격**, 다른 주어가 관계대명사를 대상으로 행동하면 **목적격**이라고 부른다.

### what과의 차이

일반 관계대명사 앞에는 설명받는 명사, 즉 선행사가 있다.

```text
the person who came
the place that I go to
```

반면 `what`은 선행사를 자체적으로 포함한다.

```text
what = the thing that
```

- `What I need is time.`
- `I know what you mean.`

따라서 `what I need`는 문장에서 명사 역할을 하는 명사절이다. `what`에는 위의 관계대명사 생략 규칙을 적용하지 않는다.

### 패턴

```text
선행사 + who / which / that + 설명

관계대명사 + 동사 → 주격 → 생략 불가
관계대명사 + 별도의 주어 + 동사 → 목적격 → 생략 가능
```

## 데이터 흐름

1. 서버 컴포넌트가 인증된 사용자를 확인한다.
2. Premium 목록 또는 ID 조회 함수를 통해 버전 관리 콘텐츠를 읽는다.
3. 목록 페이지는 Day 요약만 카드로 렌더링한다.
4. 상세 페이지는 조회된 Day를 Premium 전용 읽기 컴포넌트에 전달한다.
5. 브라우저에서 콘텐츠를 생성·수정·삭제하는 요청은 제공하지 않는다.

## 오류 및 경계 처리

- 알 수 없는 Day ID는 404로 처리한다.
- Premium 목록이 비어 있으면 간단한 빈 상태를 표시한다.
- 기존 WCT 교재 조회 실패나 빈 상태 동작은 변경하지 않는다.
- Premium 콘텐츠는 정적 데이터이므로 네트워크 저장 오류나 DB 마이그레이션이 없다.

## 테스트와 검증

- Premium 카드가 `준비 중` 문구 대신 링크로 렌더링되고 `/lessons/premium`을 가리키는지 확인한다.
- Premium 목록에 `Day 1`과 승인된 주제가 보이는지 확인한다.
- Day 1 상세 화면에 핵심 결합 예시, 생략 가능/불가 규칙, 주격·목적격 설명, `what` 구분, 마지막 패턴이 보이는지 확인한다.
- 존재하지 않는 Premium Day가 404인지 확인한다.
- 기존 WCT 교재 카드와 Day 읽기 테스트가 그대로 통과하는지 확인한다.
- `npm run lint`, `npm run typecheck`, 관련 컴포넌트 테스트, 관련 Playwright 흐름을 실행한다.
- `0.0.0.0`에 바인딩한 dev 서버에서 로컬 주소와 WSL IP로 `/lessons`, Premium 목록, Day 1 상세 경로를 확인하고 서버 로그에 500 또는 모듈 오류가 없는지 확인한다.

## 비목표

- Premium 콘텐츠의 DB 저장
- 스캔 또는 OCR 가져오기
- 브라우저 편집 기능
- 결제, 구독, 권한 등급
- 퀴즈, 암기 카드, 진도율
- 기존 WCT 교재 데이터 구조나 가져오기 API 변경
