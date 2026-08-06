import {
  buildFillBlankCandidates,
  buildMultipleChoiceCandidates,
  buildTrueFalseCandidate,
  standardFillBlankPrompt,
  standardMultipleChoicePrompt,
  standardTrueFalsePrompt
} from "./candidates.ts";
import type {
  WctMutationEvidence,
  WctStandardLevel,
  WctStandardQuestionCandidate,
  WctStandardSourceEntry
} from "./types.ts";

export type WctStandardDayOverride = {
  level: WctStandardLevel;
  dayNumber: number;
  expectedSourceHash: string;
  questions: readonly WctStandardQuestionCandidate[];
};

function sourceEntry(
  patternId: string,
  exampleId: string,
  patternText: string,
  patternMeaningKo: string,
  englishText: string,
  meaningKo: string
): WctStandardSourceEntry {
  return {
    patternId,
    exampleId,
    patternText,
    patternMeaningKo,
    usageNote: null,
    englishText,
    meaningKo
  };
}

const d15Duration = sourceEntry(
  "67ee0ad6-c7ca-4599-b98a-28e6820b7c43",
  "1d1baf64-346a-4f87-a78e-4563fdd1e58d",
  "with / for / by",
  "~와 함께·~을 위해·~에 의해/수단으로",
  "I will study for three hours today.",
  "오늘 세 시간 동안 공부할 거예요."
);
const d15Think = sourceEntry(
  "9b5e0d86-b351-4273-90e3-05feb8962a88",
  "85fa5142-ae97-473b-8728-78c69c9381fb",
  "of / about",
  "~의·~에 관하여",
  "What do you think of me?",
  "나를 어떻게 생각하나요?"
);
const d15Hear = sourceEntry(
  "9b5e0d86-b351-4273-90e3-05feb8962a88",
  "5aebbaaa-e258-4139-b4dd-7cfc1211cec0",
  "of / about",
  "~의·~에 관하여",
  "I've heard a lot about you.",
  "당신에 관해 많이 들었어요."
);
const d16Christmas = sourceEntry(
  "59ca0c76-000a-4a96-923d-b6410982962d",
  "e2bb996b-ae60-4e21-aebd-ee1fa7066cd9",
  "at + 시각·특정 시점",
  "~시에",
  "I usually have dinner with my family at Christmas.",
  "크리스마스에는 보통 가족과 저녁을 먹어요."
);
const d16Spring = sourceEntry(
  "b4377bbe-d08e-4d93-bae7-d6a9cd1b1abd",
  "61d8c02c-1981-4c38-ba6f-d1f24a9e1b8b",
  "on + 요일·날짜 / in + 월·연도·계절",
  "~요일에 / ~월·연도·계절에",
  "I go on a picnic in spring.",
  "봄에 소풍을 가요."
);
const d17Suwon = sourceEntry(
  "5d1c6eb4-f0ae-4b09-afa9-653901820779",
  "dc050e31-1e4f-436c-95a2-3b65b3e1ed4a",
  "in / at / on + 장소",
  "~안에·특정 지점에·표면 위에",
  "I live in Suwon.",
  "수원에 살아요."
);
const d17Coffee = sourceEntry(
  "5d1c6eb4-f0ae-4b09-afa9-653901820779",
  "6e856eaf-8636-45a0-847a-176cfc27df8b",
  "in / at / on + 장소",
  "~안에·특정 지점에·표면 위에",
  "I had coffee with my friend at the coffee shop.",
  "커피숍에서 친구와 커피를 마셨어요."
);
const d17Desk = sourceEntry(
  "5d1c6eb4-f0ae-4b09-afa9-653901820779",
  "b34c7941-5127-4727-83e0-bd027923c852",
  "in / at / on + 장소",
  "~안에·특정 지점에·표면 위에",
  "The cup is on the desk.",
  "컵은 책상 위에 있어요."
);
const d18Addicted = sourceEntry(
  "8bef4631-7d8d-4110-ac27-a6776a9820ba",
  "e5ac67e6-cfe3-4196-95e1-4831ec5a21f8",
  "be used/addicted/afraid/tired + 전치사",
  "~에 익숙하다·중독되다·두렵다·지치다",
  "She is addicted to watching TV.",
  "그녀는 TV 보는 것에 중독됐어요."
);
const d18Afraid = sourceEntry(
  "8bef4631-7d8d-4110-ac27-a6776a9820ba",
  "dd043a39-5d0e-422e-aab0-5b89b9391a04",
  "be used/addicted/afraid/tired + 전치사",
  "~에 익숙하다·중독되다·두렵다·지치다",
  "She is afraid of speaking English.",
  "그녀는 영어로 말하는 것을 두려워해요."
);
const d18Satisfied = sourceEntry(
  "c4031c1c-1c0f-46b8-929d-28c362a088d0",
  "ffcf413c-98f9-49ce-b790-6178125277bf",
  "be interested/satisfied/similar/different + 전치사",
  "~에 관심 있다·만족하다·비슷하다·다르다",
  "Tim is satisfied with second place.",
  "Tim은 2등에 만족해요."
);
const d18Similar = sourceEntry(
  "c4031c1c-1c0f-46b8-929d-28c362a088d0",
  "f11bda80-a43d-4b1d-902e-0be75b5ef655",
  "be interested/satisfied/similar/different + 전치사",
  "~에 관심 있다·만족하다·비슷하다·다르다",
  "This is similar to your cell phone.",
  "이것은 당신의 휴대전화와 비슷해요."
);
const d18Different = sourceEntry(
  "c4031c1c-1c0f-46b8-929d-28c362a088d0",
  "8242db01-e146-4849-aa1d-3922e98045a8",
  "be interested/satisfied/similar/different + 전치사",
  "~에 관심 있다·만족하다·비슷하다·다르다",
  "Mine is different from yours.",
  "내 것은 네 것과 달라요."
);

const pn1Sports = sourceEntry(
  "f1e60da8-2d86-468a-8223-ac71ddd1ac80",
  "458bd0be-1eb8-4e9b-a688-c5ccc9cf9a4a",
  "Do/Does + 주어 + like ...?", "~을 좋아하나요?",
  "Do you like sports?", "스포츠를 좋아하나요?"
);
const pn1HeLikes = sourceEntry(
  "4ed20075-7e76-4b3f-92ee-74d70bdf2b38",
  "978cdf2b-6731-45cb-877f-8d2742be1ad9",
  "He/She + likes + 목적어", "그/그녀는 ~을 좋아한다",
  "He likes her.", "그는 그녀를 좋아한다."
);
const pn1TheyLike = sourceEntry(
  "61e93054-d36f-4417-9e91-326e1d55d2b4",
  "19d15135-4539-4e62-83e7-35d5f23aec34",
  "I/You/We/They + like + 목적어", "나는/너는/우리는/그들은 ~을 좋아한다",
  "They like her.", "그들은 그녀를 좋아한다."
);
const pn1FriendLikes = sourceEntry(
  "4ed20075-7e76-4b3f-92ee-74d70bdf2b38",
  "d796e9b1-e878-4a9a-8311-47ee49b6628e",
  "He/She + likes + 목적어", "그/그녀는 ~을 좋아한다",
  "My friend likes you.", "내 친구는 너를 좋아한다."
);
const pn1DoesShe = sourceEntry(
  "f1e60da8-2d86-468a-8223-ac71ddd1ac80",
  "7d3881c5-fa26-4cd7-a709-c0312d1fe8ea",
  "Do/Does + 주어 + like ...?", "~을 좋아하나요?",
  "Does she like sports?", "그녀는 스포츠를 좋아하나요?"
);
const pn3Apple = sourceEntry(
  "e69bea89-5281-4c06-ae52-1586e540ccd7",
  "55c77755-eec6-4c2a-88fc-ebeec5b7204e",
  "want + 명사", "~을 원한다", "I want an apple.", "나는 사과 하나를 원한다."
);
const pn3Beer = sourceEntry(
  "e69bea89-5281-4c06-ae52-1586e540ccd7",
  "80c15412-b4a4-4518-8e4e-097166547134",
  "want + 명사", "~을 원한다", "I want a glass of beer.", "나는 맥주 한 잔을 원한다."
);
const pn3GoHome = sourceEntry(
  "c3792a25-4903-42e0-bf14-2e2b6bb679eb",
  "f5a5e94a-09e4-489f-b01e-ac02d43179db",
  "want to + 동사원형", "~하고 싶다", "I want to go home.", "나는 집에 가고 싶다."
);
const pn3Listen = sourceEntry(
  "c3792a25-4903-42e0-bf14-2e2b6bb679eb",
  "3ebb846f-738b-417c-9599-d7d7ceae4795",
  "want to + 동사원형", "~하고 싶다", "I want to listen to you.", "나는 네 말을 듣고 싶다."
);
const pn3Orange = sourceEntry(
  "7691928a-f870-4a36-ad5e-77e67fe5cdf0",
  "066dfccb-b686-4420-8bf6-130328f3d64f",
  "a/an + 단수 명사", "하나의 ~", "I want an orange.", "나는 오렌지 하나를 원한다."
);
const pn4Disappeared = sourceEntry(
  "6e6f0929-ebc0-42d0-a3d2-a18f028cf362",
  "44c61d26-9300-427b-959d-1ad4c050a21c",
  "주어 + 과거동사", "~했다", "He disappeared.", "그는 사라졌다."
);
const pn4Chose = sourceEntry(
  "6e6f0929-ebc0-42d0-a3d2-a18f028cf362",
  "4a7a9eaf-b909-44f6-bac6-eff39cbbee5c",
  "주어 + 과거동사", "~했다", "They chose.", "그들은 선택했다."
);
const pn4DidntDrink = sourceEntry(
  "b2f1f060-f183-4d04-bb2b-4389c75e8d0b",
  "a4f3b23b-6f81-4404-8e90-06f3f1aca112",
  "주어 + didn't + 동사원형 / Did + 주어 + 동사원형?",
  "과거 행동의 부정문과 의문문",
  "I didn't drink.", "나는 마시지 않았다."
);
const pn4WerentClose = sourceEntry(
  "0de18ba7-64c7-45f5-8cf6-af1bb3eb8062",
  "2fa970b9-9e1c-4512-9499-6aa712aae2d6",
  "주어 + was/were ... / Was/Were + 주어 ...?",
  "과거 상태의 문장",
  "We weren't close.", "우리는 가깝지 않았다."
);
const pn4WasntFun = sourceEntry(
  "0de18ba7-64c7-45f5-8cf6-af1bb3eb8062",
  "b342ba93-41f1-46a2-9ab7-0a7ce032bd92",
  "주어 + was/were ... / Was/Were + 주어 ...?",
  "과거 상태의 문장",
  "Wasn't it fun?", "재미있지 않았나요?"
);
const pn5Fool = sourceEntry(
  "1879befe-3ee5-44b5-b8ef-0e7aee2411cd",
  "15900358-0be1-4a95-a8c7-f0034ffa1a5e",
  "was/were + 명사", "과거에 ~였다",
  "You were a fool.", "너는 바보였다."
);
const pn5Students = sourceEntry(
  "1879befe-3ee5-44b5-b8ef-0e7aee2411cd",
  "d0b529a9-c93a-48fa-94d0-aa29de941871",
  "was/were + 명사", "과거에 ~였다",
  "We were students.", "우리는 학생이었다."
);
const pn5Wanted = sourceEntry(
  "e68178d4-6bfc-4417-8082-8598607a0c0a",
  "18a8b998-e515-4136-b1ed-cdf330cc6623",
  "wanted to + 동사원형", "~하고 싶었다",
  "I wanted to be with you.", "나는 너와 함께 있고 싶었다."
);
const pn6Sister = sourceEntry(
  "a57dfad6-658d-4f4b-be7f-21f42b81ab17",
  "745cad43-8753-47f0-bd86-f69cd6e4ac84",
  "Do/Does + 주어 + have ...?", "~을 가지고 있나요?",
  "Do you have a sister?", "자매가 있나요?"
);
const pn6Bank = sourceEntry(
  "30813764-a79d-4a4d-b725-dd36135dec35",
  "28a9eb18-b765-4ee9-af43-bf0c5d76c192",
  "There is + 단수 / There are + 복수", "~이 있다",
  "There is a bank.", "은행이 있다."
);
const pn6Wallet = sourceEntry(
  "51f12379-6dc0-4de3-805b-58d86890945f",
  "afbc0304-00f3-4a33-905b-ab0674b75cc1",
  "have/has + 명사", "~을 가지고 있다",
  "I have a wallet.", "나는 지갑이 있다."
);
const pn6Cash = sourceEntry(
  "a57dfad6-658d-4f4b-be7f-21f42b81ab17",
  "fbcf1c87-1d2b-4e75-a07a-0adb9b502685",
  "Do/Does + 주어 + have ...?", "~을 가지고 있나요?",
  "Do you have cash?", "현금이 있나요?"
);
const pn6Coins = sourceEntry(
  "30813764-a79d-4a4d-b725-dd36135dec35",
  "bda5b0ef-c632-4833-8c73-621aad72942c",
  "There is + 단수 / There are + 복수", "~이 있다",
  "Are there coins?", "동전이 있나요?"
);
const pn8Singing = sourceEntry(
  "12594eb3-b804-47e0-872a-1721425be24c",
  "08f555d0-52df-4b9a-92b4-a1a887a8c91e",
  "주어 + was/were + 동사-ing", "과거에 ~하고 있었다",
  "They were singing a song on stage.", "그들은 무대에서 노래를 부르고 있었다."
);
const pn8Working = sourceEntry(
  "486f2ae6-1f1a-46d2-ac0b-7d978daccfd9",
  "2429e381-b344-46fb-aecb-602cfe8f5e5f",
  "Was/Were + 주어 + 동사-ing?", "과거에 ~하고 있었나요?",
  "Were you working?", "일하고 있었나요?"
);
const pn8Lying = sourceEntry(
  "0d8ae6f7-3cee-4103-8d3a-6190f4a6477b",
  "95876e8e-fada-4442-9c1d-9961925bcb8c",
  "주어 + was/were not + 동사-ing", "과거에 ~하고 있지 않았다",
  "He wasn't lying to me.", "그는 나에게 거짓말하고 있지 않았다."
);
const pn8Reading = sourceEntry(
  "12594eb3-b804-47e0-872a-1721425be24c",
  "3c5f7a9c-4841-4f05-aada-3c558cd62421",
  "주어 + was/were + 동사-ing", "과거에 ~하고 있었다",
  "Yesterday, I was reading a book.", "어제 나는 책을 읽고 있었다."
);
const pn8Game = sourceEntry(
  "486f2ae6-1f1a-46d2-ac0b-7d978daccfd9",
  "464bfbf0-6223-45d4-91fd-0600397ad6ef",
  "Was/Were + 주어 + 동사-ing?", "과거에 ~하고 있었나요?",
  "Were you playing a game at that time?", "그때 게임을 하고 있었나요?"
);
const pn7Cooking = sourceEntry(
  "944bc6d1-ac21-4a97-b509-c1b5784e337f",
  "702ca900-afed-4d72-977c-72cbe1fdb058",
  "Am/Is/Are + 주어 + 동사-ing?", "지금 ~하고 있나요?",
  "Are you cooking?", "요리하고 있나요?"
);
const pn7Coffee = sourceEntry(
  "944bc6d1-ac21-4a97-b509-c1b5784e337f",
  "a6311c70-14b1-48a3-b959-dbae12c8cf18",
  "Am/Is/Are + 주어 + 동사-ing?", "지금 ~하고 있나요?",
  "Are you drinking coffee?", "커피를 마시고 있나요?"
);
const pn7NotRunning = sourceEntry(
  "a5aa10fe-014a-4431-a55e-72c68b6bd03d",
  "7e0c53b6-79b8-4b69-b2c7-05dd25879573",
  "주어 + am/is/are not + 동사-ing", "지금 ~하고 있지 않다",
  "I'm not running.", "나는 뛰고 있지 않다."
);
const pn7Singing = sourceEntry(
  "d76777a7-50ae-4094-9eb7-f0869037380b",
  "6cd594a8-c634-44b6-858f-dfe9bc7c2b67",
  "주어 + am/is/are + 동사-ing", "지금 ~하고 있다",
  "He is singing.", "그는 노래하고 있다."
);
const pn7GoingHome = sourceEntry(
  "d76777a7-50ae-4094-9eb7-f0869037380b",
  "ef12d586-d814-4c7b-98c2-9c8792017110",
  "주어 + am/is/are + 동사-ing", "지금 ~하고 있다",
  "I am going home.", "나는 집에 가고 있다."
);
const pn10WhatDid = sourceEntry(
  "ca7efbf4-1eac-404c-a742-2694c5bf020a",
  "e7281013-2d4a-470a-a139-c6a3febe83e9",
  "What did + 주어 + 동사원형 ...?", "무엇을 했나요?",
  "What did you do in your free time?", "여가 시간에 무엇을 했나요?"
);
const pn10WhatWere = sourceEntry(
  "7072b68e-7172-43ca-9020-9dacf0aea8ad",
  "d840ceaf-33e7-4386-88f3-c6dbe71fe637",
  "What was/were + 주어 + 동사-ing ...?", "무엇을 하고 있었나요?",
  "What were you doing?", "무엇을 하고 있었나요?"
);
const pn12Learn = sourceEntry(
  "28a96934-5b21-40db-a9eb-ab7873f2f9f0",
  "54410b53-68ba-45cb-b0f8-73484469fd7b",
  "will + 동사원형", "앞으로 ~할 것이다",
  "I will learn English.", "나는 영어를 배울 것이다."
);
const pn12Wait = sourceEntry(
  "28a96934-5b21-40db-a9eb-ab7873f2f9f0",
  "c23fdfc4-4e59-4750-be5b-5a7a4cdd9805",
  "will + 동사원형", "앞으로 ~할 것이다",
  "He will wait for her.", "그는 그녀를 기다릴 것이다."
);
const pn12Happy = sourceEntry(
  "5dee51b9-9b6f-44ae-b905-7ea6f9b1969d",
  "aba61663-1e37-48cc-91ef-12e83ab11fe5",
  "will be + 형용사/명사", "앞으로 ~일 것이다",
  "We will be happy.", "우리는 행복할 것이다."
);
const pn12Difficult = sourceEntry(
  "5dee51b9-9b6f-44ae-b905-7ea6f9b1969d",
  "f1702241-ea37-47b3-9db4-58ec9b45da24",
  "will be + 형용사/명사", "앞으로 ~일 것이다",
  "It will be difficult.", "그것은 어려울 것이다."
);
const pn12WontSee = sourceEntry(
  "7a6e4126-306c-41fa-a904-d732141c7e70",
  "9eb6a8fa-945a-4173-b789-f1b713dc7d47",
  "won't ... / Will + 주어 ...?", "미래의 부정문과 의문문",
  "I won't see a doctor tomorrow.", "나는 내일 의사를 만나지 않을 것이다."
);
const pn13UsePen = sourceEntry(
  "a1940b2f-5966-4df7-b74f-19c902a7c8ef",
  "99094b2c-1ab6-45b3-a583-5d33eac42556",
  "Can I + 동사원형?", "제가 ~해도 될까요?",
  "Can I use your pen?", "펜을 사용해도 될까요?"
);
const pn13TakeHome = sourceEntry(
  "a1940b2f-5966-4df7-b74f-19c902a7c8ef",
  "b76fbdc4-3569-4c80-b9dd-567f77e137b4",
  "Can I + 동사원형?", "제가 ~해도 될까요?",
  "Can I take you home?", "집에 데려다줘도 될까요?"
);
const pn13Hear = sourceEntry(
  "2ff0da88-7228-4fcd-a1f9-51d69cd600a3",
  "7d1890bf-4bea-4fa8-9718-ac4fcc4dd5b8",
  "Can you + 동사원형?", "~해줄 수 있나요?",
  "Can you hear me?", "내 말이 들리나요?"
);
const pn13CantDrive = sourceEntry(
  "707a8dec-520f-4e13-a9c9-2a888563c1ac",
  "9e33c4ce-3c01-4648-a6cb-aa808fa489f3",
  "can/can't + 동사원형", "~할 수 있다/없다",
  "She can't drive a car.", "그녀는 운전할 수 없다."
);
const pn13Piano = sourceEntry(
  "707a8dec-520f-4e13-a9c9-2a888563c1ac",
  "4d356056-3fb3-41f0-b72b-1f490f2a6d80",
  "can/can't + 동사원형", "~할 수 있다/없다",
  "I can play the piano.", "나는 피아노를 칠 수 있다."
);
const pn14Tough = sourceEntry(
  "a26f53b4-0b35-464c-a58d-bf57f85b1609",
  "e3cfe3ce-b9fb-46b2-a533-35ea17a59700",
  "might be + 형용사/명사/동사-ing", "~일지도 모른다/~하고 있을지도 모른다",
  "It might be tough for her.", "그녀에게 힘들지도 모른다."
);
const pn14ComeAtEight = sourceEntry(
  "3550431e-1300-429e-81ed-e5d1fd3b8cbd",
  "a79fd569-c9e2-4654-b249-016a6fe42ee9",
  "May I + 동사원형?", "제가 ~해도 될까요?",
  "May I come at 8 p.m.?", "오후 8시에 와도 될까요?"
);
const pn14TalkLater = sourceEntry(
  "3550431e-1300-429e-81ed-e5d1fd3b8cbd",
  "23e00836-1dd6-48d3-810f-ec30400f1faa",
  "May I + 동사원형?", "제가 ~해도 될까요?",
  "May I talk to you later?", "나중에 이야기해도 될까요?"
);
const pn14MightNotCome = sourceEntry(
  "658ef897-7546-4c5e-8ce0-907cdcf9c035",
  "bd37351e-20c7-495d-810e-42ce5aac7572",
  "might/might not + 동사원형", "~할지도 모른다/않을지도 모른다",
  "He might not come.", "그는 오지 않을지도 모른다."
);
const pn14Studying = sourceEntry(
  "a26f53b4-0b35-464c-a58d-bf57f85b1609",
  "5e821d8d-eb4d-40c1-96f1-e8f6b4fb949f",
  "might be + 형용사/명사/동사-ing", "~일지도 모른다/~하고 있을지도 모른다",
  "I might be studying at that time.", "그때 나는 공부하고 있을지도 모른다."
);
const pn16WillKind = sourceEntry(
  "08445842-cd37-474d-abeb-7358a98fb6b2",
  "9ae30f16-e7bf-4147-a808-cdacd280caf9",
  "will/might/can/should + be + 형용사", "조동사와 상태 표현",
  "She will be kind.", "그녀는 친절할 것이다."
);
const pn16WasStudying = sourceEntry(
  "270c8e8c-0fa1-45d9-a6b0-d62f1c9c1d44",
  "4efc2fb9-ab55-471f-b922-a47bea29ebf7",
  "study / be studying / studied / was studying", "현재·진행·과거·과거진행 복습",
  "She was studying.", "그녀는 공부하고 있었다."
);
const pn16MightStudy = sourceEntry(
  "1c076e02-a070-4881-8ef5-795442185a20",
  "eb6dc27b-983c-4a4b-80f8-dccae98ecd7c",
  "will/might/can/should + 동사원형", "조동사와 일반동사",
  "I might study.", "나는 공부할지도 모른다."
);
const pn16CanKind = sourceEntry(
  "08445842-cd37-474d-abeb-7358a98fb6b2",
  "e057cac5-5fd5-4b66-a697-35ae1007abce",
  "will/might/can/should + be + 형용사", "조동사와 상태 표현",
  "We can be kind.", "우리는 친절할 수 있다."
);
const pn16ShouldStudy = sourceEntry(
  "1c076e02-a070-4881-8ef5-795442185a20",
  "03d9057b-cf77-429c-816f-81396f88f7aa",
  "will/might/can/should + 동사원형", "조동사와 일반동사",
  "You should study.", "너는 공부해야 한다."
);
const pn15Read = sourceEntry(
  "f36dea93-06e7-4cfe-a83d-ba30b302048f",
  "f2804c85-e428-41ef-9741-c26fb1d4566d",
  "should/shouldn't + 동사원형", "~해야 한다/하지 말아야 한다",
  "You should read books.", "책을 읽는 것이 좋다."
);
const pn15Call = sourceEntry(
  "549e7433-c226-452b-a9e0-8166f433f614",
  "a29023de-18ab-4ba8-bc98-f58354342e64",
  "Should I/we + 동사원형?", "제가/우리가 ~해야 할까요?",
  "Should I call him?", "그에게 전화해야 할까요?"
);
const pn15Fitness = sourceEntry(
  "549e7433-c226-452b-a9e0-8166f433f614",
  "6a9a2a0d-1964-4ca7-a01a-529c98dad9b5",
  "Should I/we + 동사원형?", "제가/우리가 ~해야 할까요?",
  "Should we go to the fitness center?", "헬스장에 가야 할까요?"
);
const pn15LetsNot = sourceEntry(
  "71d92f94-6b8f-4f46-adc3-480c9f44478d",
  "724ba224-0c92-433f-a46f-d3baede18461",
  "Let's ... / Let's not ... / Let me ...", "함께 하자/하지 말자/내가 하게 해줘",
  "Let's not drink.", "술을 마시지 말자."
);
const pn15LetMe = sourceEntry(
  "71d92f94-6b8f-4f46-adc3-480c9f44478d",
  "d8bb8748-74b3-4922-af2f-a0eb5371c7f9",
  "Let's ... / Let's not ... / Let me ...", "함께 하자/하지 말자/내가 하게 해줘",
  "Let me think.", "생각 좀 해볼게."
);
const n2MustNot = sourceEntry(
  "05cbfde8-cf69-4bde-9d43-2de0fc2e7ff2",
  "11b7571d-3eaf-4026-a655-1fa9ce7c1bab",
  "must / must not + 동사원형", "반드시 ~해야 한다 / 절대 ~하면 안 된다",
  "Children must not lie.", "아이들은 거짓말하면 안 돼요."
);
const n2Must = sourceEntry(
  "05cbfde8-cf69-4bde-9d43-2de0fc2e7ff2",
  "a3b14756-5db5-42ff-8870-2d8f54fd2a6f",
  "must / must not + 동사원형", "반드시 ~해야 한다 / 절대 ~하면 안 된다",
  "We must vote.", "우리는 반드시 투표해야 해요."
);
const n2Shouldnt = sourceEntry(
  "65645654-333a-4c13-b465-e24bc67461c0",
  "76183cf0-eb3c-4c33-8e3b-10a8d88f469d",
  "should / shouldn't + 동사원형", "~하는 게 좋다 / ~하지 않는 게 좋다",
  "I shouldn't eat too much.", "너무 많이 먹지 않는 게 좋아요."
);
const n2DoesntHaveTo = sourceEntry(
  "99c47fdb-424b-48ad-b03b-4848483853b7",
  "63acde97-91cb-42f5-b0d7-81668de788b8",
  "have to / don't have to + 동사원형", "~해야 한다 / ~할 필요는 없다",
  "He doesn't have to work on the weekend.", "그는 주말에 일할 필요가 없어요."
);
const n2HasTo = sourceEntry(
  "99c47fdb-424b-48ad-b03b-4848483853b7",
  "f1004c64-502b-40ff-a664-ed753fb36e76",
  "have to / don't have to + 동사원형", "~해야 한다 / ~할 필요는 없다",
  "He has to pay the fine.", "그는 벌금을 내야 해요."
);
const n3Application = sourceEntry(
  "051a2b0f-935b-4eea-84d3-6a1490e167e8",
  "34ad4223-1d20-4ca5-b032-1e89131a9852",
  "was/were going to + 동사원형", "~하려고 했었다",
  "Were you going to submit an application?", "지원서를 제출하려고 했나요?"
);
const n3Call = sourceEntry(
  "051a2b0f-935b-4eea-84d3-6a1490e167e8",
  "f8755e14-788f-48d5-a398-4ca55e0435e6",
  "was/were going to + 동사원형", "~하려고 했었다",
  "I was going to call you yesterday.", "어제 전화하려고 했어요."
);
const n3SheShopping = sourceEntry(
  "d8db6ac7-731d-49af-98c2-2e8294fcef76",
  "45a0cd36-5d9a-474c-aba2-a746a3b38cea",
  "be going to + 동사원형", "~할 예정이다",
  "She is going to go shopping.", "그녀는 쇼핑하러 갈 예정이에요."
);
const n3IShopping = sourceEntry(
  "d8db6ac7-731d-49af-98c2-2e8294fcef76",
  "9748bc17-ae9b-45d3-8440-bda42662fc42",
  "be going to + 동사원형", "~할 예정이다",
  "I am going to go shopping.", "쇼핑하러 갈 예정이에요."
);
const n4GoingToDo = sourceEntry(
  "5e8db374-fb8b-4604-9f2f-350d330c7ee5",
  "650c1260-a5e7-4275-aa68-178b336d3d50",
  "be going to + 동사원형", "~할 예정이다",
  "What are you going to do?", "무엇을 할 예정인가요?"
);
const n4GoingToGoHome = sourceEntry(
  "5e8db374-fb8b-4604-9f2f-350d330c7ee5",
  "6f34c98a-90e8-4a1d-8973-c8117dc92f38",
  "be going to + 동사원형", "~할 예정이다",
  "I am going to go home.", "집에 갈 예정이에요."
);
const n4WhereGoing = sourceEntry(
  "760c1e57-6713-419b-8400-57ede7880bbb",
  "2e06f29b-48b5-4add-a3f4-40cacf6679ec",
  "be going + 장소", "~로 가는 중이다",
  "Where are you going?", "어디에 가고 있나요?"
);
const n4GoingHome = sourceEntry(
  "760c1e57-6713-419b-8400-57ede7880bbb",
  "e41fb7cb-45a0-4854-8f12-fd436aaccd4a",
  "be going + 장소", "~로 가는 중이다",
  "I am going home.", "집에 가는 중이에요."
);
const n5Class = sourceEntry(
  "557eee5b-879f-44dc-ac63-a2e495638139",
  "6787d24b-011a-48ff-8145-ea02bf9bba02",
  "감정 형용사 -ing", "~하게 만드는",
  "The class is boring.", "그 수업은 지루해요."
);
const n5Weather = sourceEntry(
  "557eee5b-879f-44dc-ac63-a2e495638139",
  "37ff0120-8494-4377-b64e-a83d70bdfda0",
  "감정 형용사 -ing", "~하게 만드는",
  "The weather is depressing.", "그 날씨는 사람을 우울하게 만들어요."
);
const n5Tired = sourceEntry(
  "b967e7d6-d99b-43f9-87ce-0f298775fc8f",
  "7293309a-4999-4f1f-8120-7a0af70f0130",
  "감정 형용사 -ed", "~한 감정을 느끼는",
  "I'm tired of you.", "나는 너에게 지쳤어요."
);
const n5Frustrated = sourceEntry(
  "b967e7d6-d99b-43f9-87ce-0f298775fc8f",
  "c4a5972b-0604-4449-afd4-46d0ea48ec97",
  "감정 형용사 -ed", "~한 감정을 느끼는",
  "I was frustrated with English.", "나는 영어 때문에 좌절했어요."
);
const n10Studying = sourceEntry(
  "1c4baca6-de04-4f3d-8805-6b3fb55a4aa4",
  "1ab49671-332d-4e6e-a81c-586ddd4dbd34",
  "have/has been + -ing", "계속 ~해 오고 있다",
  "I have been studying English hard.", "계속 영어를 열심히 공부해 오고 있어요."
);
const n10Drawing = sourceEntry(
  "1c4baca6-de04-4f3d-8805-6b3fb55a4aa4",
  "e09f6d1a-c317-4d78-ad66-71417c92d72d",
  "have/has been + -ing", "계속 ~해 오고 있다",
  "My friend has been drawing a picture.", "내 친구는 계속 그림을 그리고 있어요."
);
const n10Nurse = sourceEntry(
  "e3ce9d60-998c-4565-9de9-e875186191aa",
  "221146f2-3053-4482-8b36-ee0e3a26ad05",
  "have/has been + 형용사·명사", "계속 ~한 상태였다",
  "She has been a nurse.", "그녀는 계속 간호사로 일해 왔어요."
);
const n10Tired = sourceEntry(
  "e3ce9d60-998c-4565-9de9-e875186191aa",
  "89c3b3c6-e769-4b3b-ae6b-9a4dfc4928e1",
  "have/has been + 형용사·명사", "계속 ~한 상태였다",
  "I have always been tired.", "나는 줄곧 피곤했어요."
);
const n14Fastest = sourceEntry(
  "1b2adc4f-de49-47cf-b06d-8ce4064177c3",
  "f580521f-57b6-488b-bfd9-4c934a94312a",
  "the most / the fastest / the hardest", "가장 많이·빠르게·열심히",
  "I will get there the fastest.", "내가 가장 빨리 그곳에 도착할 거예요."
);
const n14More = sourceEntry(
  "95798781-02e1-4f27-9696-422baf342185",
  "1fb14398-3b26-4cb9-a808-ec8311a0da1d",
  "동사 + more / 비교급 부사", "더 많이·더 잘·더 빠르게 ~하다",
  "I like you more.", "나는 너를 더 좋아해요."
);
const n14Harder = sourceEntry(
  "95798781-02e1-4f27-9696-422baf342185",
  "29ec6c3d-9023-4575-8c0f-3a4643c6533b",
  "동사 + more / 비교급 부사", "더 많이·더 잘·더 빠르게 ~하다",
  "You should study harder.", "더 열심히 공부해야 해요."
);
const n14Faster = sourceEntry(
  "95798781-02e1-4f27-9696-422baf342185",
  "a4d32f34-2e7e-4f39-93ef-12be1f05157f",
  "동사 + more / 비교급 부사", "더 많이·더 잘·더 빠르게 ~하다",
  "I can run faster.", "나는 더 빨리 달릴 수 있어요."
);
const n30Hobby = sourceEntry(
  "8db44f7a-31cc-4a17-a18e-2b3a6f713745",
  "172705a8-03ad-4519-8480-f784d0260ef5",
  "주어 + be + -ing / to + 동사원형", "주어의 활동·목표를 설명하기",
  "My hobby is playing badminton.", "내 취미는 배드민턴을 치는 거예요."
);
const n30Job = sourceEntry(
  "8db44f7a-31cc-4a17-a18e-2b3a6f713745",
  "99245268-bd85-41b6-9134-3e9758d6dc60",
  "주어 + be + -ing / to + 동사원형", "주어의 활동·목표를 설명하기",
  "My job is to stop people.", "내 일은 사람들을 제지하는 거예요."
);
const n30Study = sourceEntry(
  "e65a26dc-86e9-4c9b-99ae-ddf44fea108f",
  "1fe994a0-225a-4970-ac7c-57fb7d2fe045",
  "-ing / To + 동사원형 + is ...", "~하는 것은 ...이다",
  "To study is good for your future.", "공부하는 것은 미래에 도움이 돼요."
);
const n30Rich = sourceEntry(
  "e65a26dc-86e9-4c9b-99ae-ddf44fea108f",
  "d4c92579-2365-4398-8362-cd7483ed22f0",
  "-ing / To + 동사원형 + is ...", "~하는 것은 ...이다",
  "Being rich is good.", "부자인 것은 좋아요."
);
const n6Pretty = sourceEntry(
  "e04e84e4-7f70-4f44-a9ae-638fdce2d1e9",
  "ddae13b4-6fd8-4604-a882-b575487110d2",
  "be/조동사 + 주어 ...?", "be동사·조동사 의문문",
  "Is she pretty?", "그녀는 예쁜가요?"
);
const n6Piano = sourceEntry(
  "e04e84e4-7f70-4f44-a9ae-638fdce2d1e9",
  "b09f0cc7-1e2b-41bc-9cf6-ab6eafbb4a90",
  "be/조동사 + 주어 ...?", "be동사·조동사 의문문",
  "Can you play the piano?", "피아노를 칠 수 있나요?"
);
const n6Live = sourceEntry(
  "89786c1c-b457-4e90-85d0-923a4ac865cb",
  "3e53c4cb-3831-4963-8575-795814203eb4",
  "do/does/did + 주어 + 동사원형 ...?", "일반동사 의문문",
  "Does he live in Suwon?", "그는 수원에 사나요?"
);
const n6Dinner = sourceEntry(
  "89786c1c-b457-4e90-85d0-923a4ac865cb",
  "62c99b78-0e97-4fec-95fc-86a7fccc584b",
  "do/does/did + 주어 + 동사원형 ...?", "일반동사 의문문",
  "Did you have dinner?", "저녁을 먹었나요?"
);
const n8Fought = sourceEntry(
  "aa20cf36-a8ee-4683-b841-014c31a8c7d4",
  "b82d7c24-8937-4b12-830f-05bc19ede618",
  "Who/What + 동사 ...?", "누가·무엇이 ~하는가",
  "Who fought?", "누가 싸웠나요?"
);
const n8Made = sourceEntry(
  "aa20cf36-a8ee-4683-b841-014c31a8c7d4",
  "d9187f9a-d912-45f0-aa22-05aeff236d27",
  "Who/What + 동사 ...?", "누가·무엇이 ~하는가",
  "What made you like this?", "무엇 때문에 이것을 좋아하게 됐나요?"
);
const n8Happened = sourceEntry(
  "aa20cf36-a8ee-4683-b841-014c31a8c7d4",
  "0ee23aac-5d44-4239-ab9d-79612ade9795",
  "Who/What + 동사 ...?", "누가·무엇이 ~하는가",
  "What happened?", "무슨 일이 있었나요?"
);
const n19Argued = sourceEntry(
  "82801998-9d99-43f4-ba87-5d90be2f2a70",
  "625d50f3-e6c6-428f-ab9f-d3feee706ae9",
  "argue with / ask for / believe in / belong to",
  "~와 다투다·~을 요청하다·~을 믿다·~에 속하다",
  "I argued with my father about my curfew.", "통금 시간 문제로 아버지와 다퉜어요."
);
const n19Asked = sourceEntry(
  "82801998-9d99-43f4-ba87-5d90be2f2a70",
  "b8d03b73-8937-4047-821e-931737739f7a",
  "argue with / ask for / believe in / belong to",
  "~와 다투다·~을 요청하다·~을 믿다·~에 속하다",
  "She asked me for help.", "그녀는 내게 도움을 요청했어요."
);
const n19Believes = sourceEntry(
  "82801998-9d99-43f4-ba87-5d90be2f2a70",
  "528134f3-cf7a-44e4-b799-04604fd82c2a",
  "argue with / ask for / believe in / belong to",
  "~와 다투다·~을 요청하다·~을 믿다·~에 속하다",
  "He believes in ghosts.", "그는 유령의 존재를 믿어요."
);
const n19GotRid = sourceEntry(
  "f1d47746-f26e-418a-82d7-8ca073e21c49",
  "7d28ae9a-40a0-4e29-a32d-5332c43683c8",
  "deal with / get rid of / hear about / think about",
  "~을 다루다·없애다·소식을 듣다·생각하다",
  "He got rid of his old clothes.", "그는 낡은 옷을 처분했어요."
);
const n19Think = sourceEntry(
  "f1d47746-f26e-418a-82d7-8ca073e21c49",
  "37d2b1eb-f2f2-468f-a6a2-e010d9402057",
  "deal with / get rid of / hear about / think about",
  "~을 다루다·없애다·소식을 듣다·생각하다",
  "I always think about you.", "나는 항상 당신을 생각해요."
);
const n20Chair = sourceEntry(
  "2859ab8c-a413-4bc2-a438-20a86f30dabc",
  "d596b552-0e10-4961-90d9-724545c3696d",
  "be + p.p. (+ by 행위자)", "~되다 / ~당하다",
  "The chair was moved.", "의자가 옮겨졌어요."
);
const n20Phone = sourceEntry(
  "2859ab8c-a413-4bc2-a438-20a86f30dabc",
  "ed2e0ff2-8829-4054-b395-787edc1f51af",
  "be + p.p. (+ by 행위자)", "~되다 / ~당하다",
  "The phone was invented by Bell.", "전화기는 Bell에 의해 발명됐어요."
);
const n20Bitten = sourceEntry(
  "2859ab8c-a413-4bc2-a438-20a86f30dabc",
  "3bdaa3f4-61c1-4599-9693-7ea20fd3380f",
  "be + p.p. (+ by 행위자)", "~되다 / ~당하다",
  "I was bitten by a dog.", "나는 개에게 물렸어요."
);
const n28Drink = sourceEntry(
  "58c5f184-b86f-4d0d-a18e-2c9e8110b7d5",
  "aae710fb-ed32-43ca-83e9-183a50be888c",
  "동사 + to + 동사원형", "~하기를 원하다·계획하다·결정하다",
  "Do you want to drink coffee?", "커피를 마시고 싶나요?"
);
const n28Decided = sourceEntry(
  "58c5f184-b86f-4d0d-a18e-2c9e8110b7d5",
  "dd9ce0f6-152e-4de2-9fa1-47877e31ab22",
  "동사 + to + 동사원형", "~하기를 원하다·계획하다·결정하다",
  "I decided not to read a book.", "책을 읽지 않기로 결정했어요."
);
const n28Want = sourceEntry(
  "311f0464-a282-4a08-9f0e-119af0a16dbd",
  "c4b5112c-47b9-4e5a-9224-e59a7b58ae7a",
  "동사 + 목적어 + to + 동사원형", "목적어가 ~하기를 원하다·부탁하다",
  "I want you to be with me.", "나는 당신이 나와 함께 있기를 원해요."
);
const n28WouldLike = sourceEntry(
  "311f0464-a282-4a08-9f0e-119af0a16dbd",
  "1817f988-ce5c-4e37-89ec-f44f729fecf8",
  "동사 + 목적어 + to + 동사원형", "목적어가 ~하기를 원하다·부탁하다",
  "I would like you to buy me a bag.", "당신이 내게 가방을 사주면 좋겠어요."
);
const n7WhyStudy = sourceEntry(
  "914b29ec-0108-439b-80cc-e68c6a62bce6",
  "314405fe-e85b-4607-82c3-8ed1a980dff8",
  "Wh- + be/조동사 + 주어 ...?", "의문사 의문문",
  "Why do you study English?", "왜 영어를 공부하나요?"
);
const n9Met = sourceEntry(
  "4995bb45-77ac-411c-b241-42b3cb6ddd08",
  "d80be46b-cb02-4a25-95a6-1a2175516b47",
  "have/has + p.p.", "~해 본 적이 있다 / 지금까지 ~해 왔다",
  "Have we met before?", "우리 전에 만난 적 있나요?"
);
const n9France = sourceEntry(
  "4995bb45-77ac-411c-b241-42b3cb6ddd08",
  "4c3978f3-0216-45d8-b798-714a93df152c",
  "have/has + p.p.", "~해 본 적이 있다 / 지금까지 ~해 왔다",
  "I have been to France.", "프랑스에 가 본 적이 있어요."
);
const n9Busan = sourceEntry(
  "4995bb45-77ac-411c-b241-42b3cb6ddd08",
  "28d0dd21-434f-40f7-b565-9c12eb32f2a7",
  "have/has + p.p.", "~해 본 적이 있다 / 지금까지 ~해 왔다",
  "He has lived in Busan for 10 years.", "그는 부산에서 10년 동안 살아왔어요."
);
const n11Movie = sourceEntry(
  "c78eb1a0-21c0-4792-8c34-3cdf8941e40c",
  "76801670-640f-402e-89fd-930dc639c895",
  "what kind of / which / whose + 명사", "어떤 종류의 / 어느 / 누구의",
  "What kind of movie do you like?", "어떤 종류의 영화를 좋아하나요?"
);
const n11WhoseCar = sourceEntry(
  "c78eb1a0-21c0-4792-8c34-3cdf8941e40c",
  "a45abf6f-ab92-41d4-aa82-a762dd03fdd3",
  "what kind of / which / whose + 명사", "어떤 종류의 / 어느 / 누구의",
  "Whose car is this?", "이것은 누구의 차인가요?"
);
const n11HowMany = sourceEntry(
  "c2970d6c-f10e-47ab-8b2b-aa963636075f",
  "d6fb440f-f08d-43a8-b6cf-e0041df33acf",
  "how many / how long / how far / how tall", "수량·기간·거리·키 묻기",
  "How many bottles of soju can you drink?", "소주를 몇 병 마실 수 있나요?"
);
const n13Better = sourceEntry(
  "7060ec15-0be4-45a4-9ba0-39662d94b059",
  "2440b6ea-9011-4a25-a82e-cc123ed1e6cf",
  "형용사-er / more + 형용사 + than", "~보다 더 ~하다",
  "I am better than you.", "나는 너보다 더 잘해요."
);
const n13Difficult = sourceEntry(
  "7060ec15-0be4-45a4-9ba0-39662d94b059",
  "7774b9cc-9181-4bed-9957-be51b1d7325c",
  "형용사-er / more + 형용사 + than", "~보다 더 ~하다",
  "The test was more difficult than I expected.", "시험은 예상보다 더 어려웠어요."
);
const n13Longest = sourceEntry(
  "4ccf2686-c544-4d49-8432-76d966596729",
  "942194e6-1b7b-4368-b364-bca139b80ddc",
  "the + 형용사-est / the most + 형용사", "가장 ~하다",
  "What is the longest river in the world?", "세계에서 가장 긴 강은 무엇인가요?"
);
const n13Interesting = sourceEntry(
  "4ccf2686-c544-4d49-8432-76d966596729",
  "ae3bc92d-788f-4b3e-a527-2369002babcb",
  "the + 형용사-est / the most + 형용사", "가장 ~하다",
  "This movie is the most interesting.", "이 영화가 가장 재미있어요."
);
const n22You = sourceEntry(
  "83e1401a-1d72-4eca-8957-a9e0c0ceb5bf",
  "763e2bbe-40da-41aa-b58b-86b9744a8c6a",
  "If + 과거형, 주어 + would + 동사원형", "만약 ~라면 ~할 텐데",
  "If I were you, I wouldn't date him.", "내가 너라면 그와 사귀지 않을 거예요."
);
const n22Bird = sourceEntry(
  "83e1401a-1d72-4eca-8957-a9e0c0ceb5bf",
  "d8ba0f89-5d79-4435-8597-723d4f1a59b5",
  "If + 과거형, 주어 + would + 동사원형", "만약 ~라면 ~할 텐데",
  "If I were a bird, I would fly in the sky.", "내가 새라면 하늘을 날 텐데요."
);
const n22Lottery = sourceEntry(
  "83e1401a-1d72-4eca-8957-a9e0c0ceb5bf",
  "ce338116-6406-4cc1-8dfe-bddd60dbc9b9",
  "If + 과거형, 주어 + would + 동사원형", "만약 ~라면 ~할 텐데",
  "If I won the lottery, I would buy a car.", "복권에 당첨된다면 차를 살 텐데요."
);
const n23Right = sourceEntry(
  "384e773c-d04b-43ad-beaa-55bdda9e7c7c",
  "94df2fb0-3de6-4d0e-85c3-84e71f221473",
  "on the upper/lower/left/right side of", "~의 위쪽·아래쪽·왼쪽·오른쪽에",
  "A tree is on the right side of the house.", "나무가 집의 오른쪽에 있어요."
);
const n23Left = sourceEntry(
  "384e773c-d04b-43ad-beaa-55bdda9e7c7c",
  "9ed4a838-e66d-43af-b9d0-e866d16a38db",
  "on the upper/lower/left/right side of", "~의 위쪽·아래쪽·왼쪽·오른쪽에",
  "The chair is on the left side of the desk.", "의자가 책상의 왼쪽에 있어요."
);
const n23Middle = sourceEntry(
  "86656cd9-be99-4566-8abe-9283082f7e66",
  "72372809-ee2b-47e0-a5d0-576b9cd752ad",
  "in the middle of", "~의 가운데에",
  "There is a house in the middle of the picture.", "그림 가운데에 집이 있어요."
);
const n27Hard = sourceEntry(
  "be43a301-a0d8-40aa-86ce-87938799c465",
  "88fc90d1-54cc-4529-8323-60480e00d353",
  "To + 동사원형 + is ...", "~하는 것은 ...이다",
  "To study is hard.", "공부하는 것은 어려워요."
);
const n27Abroad = sourceEntry(
  "a0cbec44-dceb-430b-bb63-6f1fa76979ff",
  "57d3a214-01a9-4169-b03e-3bc840b929a1",
  "to + 동사원형 (목적)", "~하기 위해",
  "I study English to go abroad.", "해외에 가기 위해 영어를 공부해요."
);
const n27Pen = sourceEntry(
  "75cf3a78-4cf2-4e4c-bc85-ffea5eecb99d",
  "52175474-440b-4812-849d-f03b20d3648e",
  "명사 + to + 동사원형", "~할 명사",
  "Do you have a pen to use?", "사용할 펜이 있나요?"
);
const n27BusStop = sourceEntry(
  "a0cbec44-dceb-430b-bb63-6f1fa76979ff",
  "407f4fa0-3bce-45b3-8448-6c9957127d99",
  "to + 동사원형 (목적)", "~하기 위해",
  "He is at the bus stop to get on the bus.", "버스를 타려고 버스 정류장에 있어요."
);
const n27Things = sourceEntry(
  "75cf3a78-4cf2-4e4c-bc85-ffea5eecb99d",
  "480fa6ae-2bf1-476e-a69f-5d942c25d5ca",
  "명사 + to + 동사원형", "~할 명사",
  "I have many things to do.", "할 일이 많아요."
);
const n29Enjoy = sourceEntry(
  "07972de5-3d42-445a-aed4-7d55d925bd8f",
  "10472aeb-5dfd-40a5-a0ef-753516707baa",
  "enjoy/finish/avoid/keep/practice + -ing",
  "~하는 것을 즐기다·끝내다·피하다·계속하다·연습하다",
  "I enjoy talking in English.", "영어로 대화하는 것을 즐겨요."
);
const n29Keep = sourceEntry(
  "07972de5-3d42-445a-aed4-7d55d925bd8f",
  "285796ea-5f3e-466a-b4d2-6506914e521c",
  "enjoy/finish/avoid/keep/practice + -ing",
  "~하는 것을 즐기다·끝내다·피하다·계속하다·연습하다",
  "I keep studying English.", "계속 영어를 공부해요."
);
const n29SawRunning = sourceEntry(
  "417ba2b4-d5c9-4036-9ec3-f26f7f243ffa",
  "09e83dd1-322b-45c3-ac7d-bb642f5e3445",
  "see/hear + 목적어 + -ing", "목적어가 ~하는 것을 보다·듣다",
  "I saw him running.", "그가 달리는 것을 봤어요."
);
const n29Heard = sourceEntry(
  "417ba2b4-d5c9-4036-9ec3-f26f7f243ffa",
  "05089a8b-66da-429f-a01f-2cf82560230e",
  "see/hear + 목적어 + -ing", "목적어가 ~하는 것을 보다·듣다",
  "I heard you snoring.", "당신이 코 고는 것을 들었어요."
);
const day29HeardReason = "\"see/hear + 목적어 + -ing\"에서 -ing형은 목적어가 하는 동작을 나타냅니다. 여기서는 \"코를 고는 것\"을 들었으므로 \"talking\", \"singing\", \"crying\"이 아니라 \"snoring\"이 맞습니다.";
const n31Late = sourceEntry(
  "8332c6dc-62f4-4c70-850d-87c53cfbbb0a",
  "8cc63128-8e47-4700-be64-b9fe890554fd",
  "It is + 형용사 + to + 동사원형", "~하는 것은 ...하다",
  "It's difficult not to be late.", "늦지 않는 것은 어려워요."
);
const n31Japanese = sourceEntry(
  "30409927-3c74-4306-b9bb-0743acdf7e55",
  "d15e6862-9896-4910-88d9-fffdb207a22a",
  "It is + 형용사 + for + 사람 + to + 동사원형", "사람이 ~하는 것은 ...하다",
  "It's difficult for you to learn Japanese.", "당신이 일본어를 배우는 것은 어려워요."
);
const n31Money = sourceEntry(
  "30409927-3c74-4306-b9bb-0743acdf7e55",
  "caa4aabe-77a7-47b5-8b4f-6b9c2b049490",
  "It is + 형용사 + for + 사람 + to + 동사원형", "사람이 ~하는 것은 ...하다",
  "It's important for me to make money.", "내가 돈을 버는 것은 중요해요."
);
const n31Home = sourceEntry(
  "8332c6dc-62f4-4c70-850d-87c53cfbbb0a",
  "593ecaab-170e-4d76-962e-544101744a7e",
  "It is + 형용사 + to + 동사원형", "~하는 것은 ...하다",
  "It's nice to go home.", "집에 가는 것은 좋아요."
);

const positivePattern = "Sounds great! / Good for you! / Lucky you!";
const listeningPattern = "That's too bad. / That's a shame. / I'm listening.";
const goodForYou: WctStandardSourceEntry = {
  patternId: "f26d971b-2dd9-46da-8e9a-f687a81bc265",
  exampleId: "e66075f3-75be-4be5-a571-18b7fef3eca0",
  patternText: positivePattern,
  patternMeaningKo: "긍정·축하 반응",
  usageNote: null,
  englishText: "Good for you!",
  meaningKo: "잘됐네요!"
};
const luckyYou: WctStandardSourceEntry = {
  patternId: "f26d971b-2dd9-46da-8e9a-f687a81bc265",
  exampleId: "7656b49f-dc42-46e6-962f-7612b4c148b4",
  patternText: positivePattern,
  patternMeaningKo: "긍정·축하 반응",
  usageNote: null,
  englishText: "Lucky you!",
  meaningKo: "좋겠네요!"
};
const imListening: WctStandardSourceEntry = {
  patternId: "3964827b-55e9-4882-8dab-060a75e1bf41",
  exampleId: "b366a7ea-4786-4096-9872-eb66e6e0c299",
  patternText: listeningPattern,
  patternMeaningKo: "아쉬움·공감·경청 반응",
  usageNote: null,
  englishText: "I'm listening.",
  meaningKo: "듣고 있어요."
};
const thatsTooBad: WctStandardSourceEntry = {
  patternId: "3964827b-55e9-4882-8dab-060a75e1bf41",
  exampleId: "7b3dd2c6-4b91-445f-882b-77053f56824f",
  patternText: listeningPattern,
  patternMeaningKo: "아쉬움·공감·경청 반응",
  usageNote: null,
  englishText: "That's too bad.",
  meaningKo: "안됐네요."
};
const thatsAShame: WctStandardSourceEntry = {
  patternId: "3964827b-55e9-4882-8dab-060a75e1bf41",
  exampleId: "fb8e940f-4974-4bfd-8151-8a189bbba6af",
  patternText: listeningPattern,
  patternMeaningKo: "아쉬움·공감·경청 반응",
  usageNote: null,
  englishText: "That's a shame.",
  meaningKo: "아쉽네요."
};

function feedback(entry: WctStandardSourceEntry, reason: string) {
  return { correctSentence: entry.englishText, pattern: entry.patternText, reason };
}

function exactSpanStart(source: string, from: string) {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&").replace(/\s+/gu, "\\s+");
  const matches = [...source.matchAll(new RegExp(
    `(?<![a-z0-9'])${escaped}(?![a-z0-9'])`,
    "giu"
  ))];
  if (matches.length !== 1 || matches[0].index === undefined) {
    throw new Error(`WCT v2 fixed override span must occur exactly once: ${from}`);
  }
  return matches[0].index;
}

function mutation(
  entry: WctStandardSourceEntry,
  from: string,
  to: string,
  family: string,
  reason: string
): WctMutationEvidence {
  const start = exactSpanStart(entry.englishText, from);
  const end = start + from.length;
  return {
    recipe: family,
    ruleFamily: family,
    text: `${entry.englishText.slice(0, start)}${to}${entry.englishText.slice(end)}`,
    changedFrom: from,
    changedTo: to,
    start,
    end,
    reason
  };
}

function fixedMultipleChoice(
  id: string,
  entry: WctStandardSourceEntry,
  kind: "translation" | "pattern",
  from: string,
  replacements: readonly string[],
  reason: string
): WctStandardQuestionCandidate {
  const mutations = replacements.map((replacement) => mutation(
    entry,
    from,
    replacement,
    "fixed_expression",
    reason
  ));
  const texts = [mutations[0].text, entry.englishText, mutations[1].text, mutations[2].text];
  const choices = texts.map((text, index) => ({ id: `${id}-c${index + 1}`, text }));
  return {
    question: {
      id,
      kind,
      format: "multiple_choice",
      prompt: standardMultipleChoicePrompt(entry, kind),
      choices,
      correctChoiceId: choices[1].id,
      explanation: reason,
      feedback: feedback(entry, reason)
    },
    provenance: {
      patternId: entry.patternId,
      exampleId: entry.exampleId,
      sourceSentence: entry.englishText,
      choiceEvidence: choices.map((choice) => {
        const evidence = mutations.find((item) => item.text === choice.text);
        return evidence
          ? { choiceText: choice.text, role: "distractor" as const, mutation: evidence }
          : { choiceText: choice.text, role: "correct" as const };
      })
    }
  };
}

function fixedFill(
  id: string,
  entry: WctStandardSourceEntry,
  kind: "translation" | "pattern",
  from: string,
  replacements: readonly string[],
  reason: string
): WctStandardQuestionCandidate {
  const start = exactSpanStart(entry.englishText, from);
  const end = start + from.length;
  const mutations = replacements.map((replacement) => mutation(
    entry,
    from,
    replacement,
    "fixed_expression",
    reason
  ));
  const texts = [mutations[0].changedTo, from, mutations[1].changedTo, mutations[2].changedTo];
  const choices = texts.map((text, index) => ({ id: `${id}-c${index + 1}`, text }));
  const promptSentence = `${entry.englishText.slice(0, start)}____${entry.englishText.slice(end)}`;
  return {
    question: {
      id,
      kind,
      format: "fill_blank",
      prompt: standardFillBlankPrompt(entry, kind, promptSentence),
      choices,
      correctChoiceId: choices[1].id,
      explanation: reason,
      feedback: feedback(entry, reason)
    },
    provenance: {
      patternId: entry.patternId,
      exampleId: entry.exampleId,
      sourceSentence: entry.englishText,
      choiceEvidence: choices.map((choice) => {
        const evidence = mutations.find((item) => item.changedTo === choice.text);
        return evidence
          ? { choiceText: choice.text, role: "distractor" as const, mutation: evidence }
          : { choiceText: choice.text, role: "correct" as const };
      }),
      blankSpan: { start, end, correctText: from }
    }
  };
}

function fixedTrueFalseX(
  id: string,
  entry: WctStandardSourceEntry,
  kind: "translation" | "pattern",
  from: string,
  to: string,
  reason: string
): WctStandardQuestionCandidate {
  const statementMutation = mutation(entry, from, to, "fixed_expression", reason);
  const choices = [{ id: `${id}-o`, text: "O" }, { id: `${id}-x`, text: "X" }];
  return {
    question: {
      id,
      kind,
      format: "true_false",
      prompt: standardTrueFalsePrompt(entry, kind, statementMutation.text),
      choices,
      correctChoiceId: choices[1].id,
      explanation: reason,
      feedback: feedback(entry, reason)
    },
    provenance: {
      patternId: entry.patternId,
      exampleId: entry.exampleId,
      sourceSentence: entry.englishText,
      choiceEvidence: [
        { choiceText: "O", role: "distractor" },
        { choiceText: "X", role: "correct" }
      ],
      statementMutation
    }
  };
}

function fixedTrueFalseO(
  id: string,
  entry: WctStandardSourceEntry,
  kind: "translation" | "pattern",
  reason: string
): WctStandardQuestionCandidate {
  const choices = [{ id: `${id}-o`, text: "O" }, { id: `${id}-x`, text: "X" }];
  return {
    question: {
      id,
      kind,
      format: "true_false",
      prompt: standardTrueFalsePrompt(entry, kind, entry.englishText),
      choices,
      correctChoiceId: choices[0].id,
      explanation: reason,
      feedback: feedback(entry, reason)
    },
    provenance: {
      patternId: entry.patternId,
      exampleId: entry.exampleId,
      sourceSentence: entry.englishText,
      choiceEvidence: [
        { choiceText: "O", role: "correct" },
        { choiceText: "X", role: "distractor" }
      ]
    }
  };
}

function requiredGeneratedCandidate(
  candidates: readonly WctStandardQuestionCandidate[],
  target: string
) {
  const candidate = candidates.find((item) => {
    const mutation = item.provenance.choiceEvidence.find((evidence) => (
      evidence.mutation
    ))?.mutation;
    return mutation?.changedFrom === target;
  });
  if (!candidate) {
    throw new Error(`WCT v2 reviewed generated candidate is missing: ${target}`);
  }
  return candidate;
}

function generatedTrueFalseO(
  entry: WctStandardSourceEntry,
  kind: "translation" | "pattern",
  reason: string
) {
  const candidate = buildTrueFalseCandidate(entry, "O", kind);
  if (!candidate) {
    throw new Error(`WCT v2 reviewed exact-O candidate is missing: ${entry.exampleId}`);
  }
  return {
    ...candidate,
    question: {
      ...candidate.question,
      explanation: reason,
      feedback: feedback(entry, reason)
    }
  };
}

function exactMeaningReason(correctText: string) {
  return `제시된 한국어 뜻과 문맥에 맞는 표현은 "${correctText}"입니다.`;
}

function correctExpressionReason(correctText: string, explanation: string) {
  return `${explanation} 정답 표현은 "${correctText}"입니다.`;
}

const goodForYouReason = "\"Good for you!\"는 상대의 좋은 소식에 긍정적으로 반응할 때 쓰는 표현입니다.";
const listeningReason = "\"I'm listening.\"에서는 be동사 뒤에 \"listening\"을 써서 지금 듣고 있다는 뜻을 나타냅니다.";
const luckyYouReason = "\"Lucky you!\"는 상대의 행운을 부러워하거나 축하할 때 쓰는 표현입니다.";
const tooBadReason = "\"That's too bad.\"는 안타까움이나 유감을 나타내는 고정 표현입니다.";
const shameReason = "아쉬움을 나타낼 때는 \"That's a shame.\" 형태로 말합니다.";

export const STANDARD_WCT_DAY_OVERRIDES = [{
  level: "prenovice",
  dayNumber: 3,
  expectedSourceHash: "08452da167730596f1cdb1695050be5c4cc95d183766455878e6add15909bac2",
  questions: [
    fixedMultipleChoice("pn3-mc-apple", pn3Apple, "translation", "an apple", ["a banana", "a sandwich", "some water"], exactMeaningReason("an apple")),
    fixedFill("pn3-fill-want-go", pn3GoHome, "pattern", "want to go home", ["want to eat lunch", "want to watch TV", "want to take a walk"], exactMeaningReason("want to go home")),
    fixedMultipleChoice("pn3-mc-want-beer", pn3Beer, "pattern", "want a glass of beer", ["want a glass of water", "want a cup of coffee", "want a bottle of juice"], exactMeaningReason("want a glass of beer")),
    fixedFill("pn3-fill-orange", pn3Orange, "translation", "an orange", ["an apple", "a cookie", "a banana"], exactMeaningReason("an orange")),
    fixedTrueFalseX("pn3-tf-listen", pn3Listen, "translation", "you", "him", exactMeaningReason("you"))
  ]
}, {
  level: "prenovice",
  dayNumber: 4,
  expectedSourceHash: "d16a761206c45ce7804e20e3d5bafed2b9d9f0387ffcf78f7c02d6dd1f0cbde7",
  questions: [
    fixedMultipleChoice("pn4-mc-disappeared", pn4Disappeared, "translation", "He", ["She", "My friend", "The dog"], exactMeaningReason("He")),
    fixedFill("pn4-fill-chose", pn4Chose, "pattern", "They chose", ["They agreed", "They waited", "They left"], exactMeaningReason("They chose")),
    fixedMultipleChoice("pn4-mc-didnt-drink", pn4DidntDrink, "pattern", "didn't drink", ["didn't eat", "didn't sleep", "didn't leave"], exactMeaningReason("didn't drink")),
    fixedFill("pn4-fill-close", pn4WerentClose, "translation", "close", ["ready", "happy", "tired"], exactMeaningReason("close")),
    fixedTrueFalseX("pn4-tf-fun", pn4WasntFun, "translation", "fun", "difficult", exactMeaningReason("fun"))
  ]
}, {
  level: "prenovice",
  dayNumber: 5,
  expectedSourceHash: "e94088e5680e3b3ef488628729e8ed0db489e8cd2ec9c07dddd0e0fc24fbb402",
  questions: [
    fixedMultipleChoice("pn5-mc-students", pn5Students, "translation", "students", ["teachers", "friends", "children"], correctExpressionReason("students", "학생들이었다는 뜻에는 해당 명사가 알맞습니다.")),
    fixedFill("pn5-fill-were-fool", pn5Fool, "pattern", "were", ["was", "are", "weren't"], correctExpressionReason("were", "주어가 \"You\"인 과거 긍정문에는 과거형 be동사가 필요합니다.")),
    fixedTrueFalseO("pn5-tf-wanted", pn5Wanted, "translation", correctExpressionReason("I wanted to be with you.", "제시된 문장은 함께 있고 싶었다는 뜻과 일치합니다.")),
    fixedMultipleChoice("pn5-mc-were-students", pn5Students, "pattern", "We were students.", ["We are students.", "We weren't students.", "Were we students?"], "\"was/were + 명사\" 패턴에서 주어 \"We\"의 긍정 과거 상태는 \"We were students.\"입니다."),
    fixedFill("pn5-fill-fool", pn5Fool, "translation", "a fool", ["a student", "a teacher", "my friend"], "과거에 바보였다는 뜻에 맞는 명사 표현은 \"a fool\"입니다. 정답 표현은 \"a fool\"입니다.")
  ]
}, {
  level: "prenovice",
  dayNumber: 7,
  expectedSourceHash: "ce43040d5a4e657de7b6567524244d6a15f0fbf347b4d81e1aff9cc20e53d449",
  questions: [
    fixedFill("pn7-fill-are-coffee", pn7Coffee, "pattern", "Are", ["Were", "Aren't", "Weren't"], correctExpressionReason("Are", "현재 진행 중인 행동을 묻는 긍정 의문문에는 현재형 be동사가 필요합니다.")),
    fixedMultipleChoice("pn7-mc-singing", pn7Singing, "translation", "singing", ["dancing", "running", "talking"], correctExpressionReason("singing", "노래하고 있다는 뜻에 맞는 동작을 골라야 합니다.")),
    fixedTrueFalseO("pn7-tf-not-running", pn7NotRunning, "pattern", correctExpressionReason("I'm not running.", "현재 진행형 부정문은 be동사 뒤에 not과 동사 -ing 형태를 둡니다.")),
    fixedFill("pn7-fill-cooking", pn7Cooking, "translation", "cooking", ["studying", "working", "eating"], correctExpressionReason("cooking", "요리하고 있다는 뜻에 맞는 동작을 골라야 합니다.")),
    fixedMultipleChoice("pn7-mc-going-home", pn7GoingHome, "translation", "going home", ["going to work", "staying here", "visiting a friend"], correctExpressionReason("going home", "집에 가고 있다는 뜻에 맞는 동작을 골라야 합니다."))
  ]
}, {
  level: "prenovice",
  dayNumber: 10,
  expectedSourceHash: "3705307cd378538ca409dd9c0f01425fff3a9b84dc5633f7b513233798a702cf",
  questions: [
    fixedMultipleChoice("pn10-mc-free-time", pn10WhatDid, "translation", "your free time", ["class", "the morning", "the office"], correctExpressionReason("your free time", "여가 시간을 묻는 뜻에 맞는 시간 표현을 골라야 합니다.")),
    fixedFill("pn10-fill-what-were", pn10WhatWere, "pattern", "were you doing", ["did you do", "are you doing", "have you done"], correctExpressionReason("were you doing", "과거에 진행 중이던 행동을 묻는 의문문에는 과거진행형을 씁니다.")),
    fixedMultipleChoice("pn10-mc-what-did", pn10WhatDid, "pattern", "did you do", ["do you do", "were you doing", "have you done"], correctExpressionReason("did you do", "과거에 한 행동을 묻는 의문문에는 과거 조동사와 동사원형을 씁니다.")),
    fixedFill("pn10-fill-doing", pn10WhatWere, "translation", "doing", ["reading", "watching", "studying"], correctExpressionReason("doing", "무엇을 하고 있었는지 넓게 묻는 뜻에는 해당 동사를 씁니다.")),
    fixedTrueFalseX("pn10-tf-did", pn10WhatDid, "translation", "did", "didn't", correctExpressionReason("did", "제시된 뜻은 과거의 긍정 의문문이며 부정 의문문이 아닙니다."))
  ]
}, {
  level: "prenovice",
  dayNumber: 12,
  expectedSourceHash: "70d4e40951ae430485665477da8bc8180ebedbca1d28f594a050951dc48462a4",
  questions: [
    fixedMultipleChoice("pn12-mc-english", pn12Learn, "translation", "English", ["Spanish", "French", "Japanese"], exactMeaningReason("English")),
    fixedFill("pn12-fill-wait", pn12Wait, "pattern", "will wait for her", ["will call her", "will look for her", "will write to her"], exactMeaningReason("will wait for her")),
    fixedMultipleChoice("pn12-mc-difficult", pn12Difficult, "pattern", "will be difficult", ["will be easy", "will be fun", "will be interesting"], exactMeaningReason("will be difficult")),
    fixedFill("pn12-fill-doctor", pn12WontSee, "translation", "a doctor", ["my friend", "my teacher", "my parents"], exactMeaningReason("a doctor")),
    fixedTrueFalseO("pn12-tf-happy", pn12Happy, "translation", "\"We will be happy.\"는 \"will be + 형용사\" 형태로 미래의 상태를 나타내므로 맞습니다.")
  ]
}, {
  level: "prenovice",
  dayNumber: 15,
  expectedSourceHash: "909d882fcef1e597d1b73c7f00817d30cd6ed5cdf7d6157812906179d45b2866",
  questions: [
    fixedMultipleChoice("pn15-mc-books", pn15Read, "translation", "books", ["newspapers", "magazines", "articles"], exactMeaningReason("books")),
    fixedFill("pn15-fill-call", pn15Call, "pattern", "Should I call him", ["Should I visit him", "Should I wait for him", "Should I write to him"], exactMeaningReason("Should I call him")),
    fixedMultipleChoice("pn15-mc-let-me", pn15LetMe, "pattern", "Let me think", ["Let me check", "Let me explain", "Let me decide"], exactMeaningReason("Let me think")),
    fixedFill("pn15-fill-fitness", pn15Fitness, "translation", "the fitness center", ["the library", "the park", "the office"], exactMeaningReason("the fitness center")),
    fixedTrueFalseX("pn15-tf-lets-not", pn15LetsNot, "translation", "drink", "drive", exactMeaningReason("drink"))
  ]
}, {
  level: "novice",
  dayNumber: 2,
  expectedSourceHash: "3105788c5a51f371f58631891de19ad85555006ddce2fdb1c22cb6e510b67c30",
  questions: [
    fixedMultipleChoice("n2-mc-has-to", n2HasTo, "translation", "has to", ["might", "must not", "doesn't have to"], "벌금을 낼 의무가 있다는 뜻이므로 \"has to\"가 맞습니다. \"might\"는 가능성, \"must not\"은 금지, \"doesn't have to\"는 의무가 없음을 나타냅니다."),
    fixedFill("n2-fill-must-not", n2MustNot, "pattern", "must not", ["shouldn't", "don't have to", "must"], correctExpressionReason("must not", "거짓말하면 안 된다는 강한 금지를 나타내야 합니다.")),
    fixedTrueFalseO("n2-tf-shouldnt", n2Shouldnt, "translation", correctExpressionReason("I shouldn't eat too much.", "너무 많이 먹지 않는 편이 좋다는 조언과 일치합니다.")),
    fixedMultipleChoice("n2-mc-must", n2Must, "pattern", "must", ["should", "don't have to", "must not"], correctExpressionReason("must", "반드시 투표해야 한다는 의무를 나타내야 합니다.")),
    fixedFill("n2-fill-doesnt-have-to", n2DoesntHaveTo, "translation", "doesn't have to", ["has to", "should", "must not"], correctExpressionReason("doesn't have to", "주말에 일할 필요가 없다는 뜻을 나타내야 합니다."))
  ]
}, {
  level: "novice",
  dayNumber: 3,
  expectedSourceHash: "7c3b74be1a8f1d29703ab501f9de4419fe0ab0bab137b8ec8dd7e4fd6a9dd552",
  questions: [
    fixedMultipleChoice("n3-mc-she", n3SheShopping, "translation", "She is", ["He is", "We are", "They are"], correctExpressionReason("She is", "쇼핑하러 갈 예정인 사람이 그녀라는 뜻에 맞아야 합니다.")),
    fixedFill("n3-fill-submit", n3Application, "pattern", "Were you going to submit", ["Are you going to submit", "Did you submit", "Were you able to submit"], correctExpressionReason("Were you going to submit", "과거에 하려고 했던 계획을 묻는 형태를 써야 합니다.")),
    fixedTrueFalseO("n3-tf-shopping", n3IShopping, "translation", correctExpressionReason("I am going to go shopping.", "쇼핑하러 갈 예정이라는 뜻과 일치합니다.")),
    fixedMultipleChoice("n3-mc-call", n3Call, "pattern", "was going to call", ["called", "was talking to", "forgot to call"], correctExpressionReason("was going to call", "어제 전화하려고 했던 계획을 나타내야 합니다.")),
    fixedFill("n3-fill-application", n3Application, "translation", "an application", ["the report", "your homework", "a complaint"], correctExpressionReason("an application", "제출하려던 대상이 지원서라는 뜻에 맞아야 합니다."))
  ]
}, {
  level: "novice",
  dayNumber: 4,
  expectedSourceHash: "2378612873e3c9bbe25885f4bf091b36c7df8270b94842f3e6b31a78efbaf38f",
  questions: [
    fixedMultipleChoice("n4-mc-go-home", n4GoingToGoHome, "pattern", "am going to go home", ["am going home", "am going to stay home", "was going to go home"], correctExpressionReason("am going to go home", "집에 갈 예정이라는 미래 계획을 나타내야 합니다.")),
    fixedFill("n4-fill-where", n4WhereGoing, "translation", "Where", ["When", "Why", "How"], correctExpressionReason("Where", "가는 장소를 묻는 의문사가 필요합니다.")),
    fixedTrueFalseX("n4-tf-home", n4GoingHome, "translation", "home", "to school", correctExpressionReason("home", "제시된 뜻은 학교가 아니라 집에 가는 중이라는 내용입니다.")),
    fixedMultipleChoice("n4-mc-going-to-do", n4GoingToDo, "pattern", "What are you going to do?", ["Where is she going?", "What are you doing?", "What did you decide to do?"], correctExpressionReason("What are you going to do?", "앞으로 무엇을 할 예정인지 묻는 형태를 써야 합니다.")),
    fixedFill("n4-fill-go-home", n4GoingToGoHome, "translation", "go home", ["stay home", "call her", "study tonight"], correctExpressionReason("go home", "집에 갈 예정이라는 뜻에 맞는 행동을 골라야 합니다."))
  ]
}, {
  level: "novice",
  dayNumber: 5,
  expectedSourceHash: "e92f36992b9b3358d6b8c58c8a72f2a803ed936c671051e92c3d34e6cb620de4",
  questions: [
    fixedMultipleChoice("n5-mc-class", n5Class, "translation", "The class", ["The movie", "The book", "The meeting"], correctExpressionReason("The class", "지루하게 만드는 대상이 수업이라는 뜻에 맞아야 합니다.")),
    fixedFill("n5-fill-depressing", n5Weather, "pattern", "depressing", ["depressed", "frustrating", "frustrated"], correctExpressionReason("depressing", "감정을 일으키는 원인인 날씨에는 -ing 형태의 감정 형용사를 씁니다.")),
    fixedMultipleChoice("n5-mc-frustrated", n5Frustrated, "pattern", "I was frustrated with English.", ["English was frustrating for beginners.", "The English class was depressing.", "I was satisfied with English."], correctExpressionReason("I was frustrated with English.", "감정을 느끼는 사람이 주어일 때는 -ed 형태의 감정 형용사를 씁니다.")),
    fixedTrueFalseX("n5-tf-tired", n5Tired, "translation", "you", "work", correctExpressionReason("you", "제시된 뜻은 일에 지친 것이 아니라 상대에게 지쳤다는 내용입니다.")),
    fixedFill("n5-fill-boring", n5Class, "translation", "boring", ["interesting", "exciting", "relaxing"], correctExpressionReason("boring", "수업이 지루하게 만든다는 뜻에 맞는 감정 형용사를 골라야 합니다."))
  ]
}, {
  level: "novice",
  dayNumber: 10,
  expectedSourceHash: "ccad203f1a42440cf251760f50b1bf52c7f3d9fadc299b991bca47416a5ab598",
  questions: [
    fixedMultipleChoice("n10-mc-nurse", n10Nurse, "pattern", "a nurse", ["nursing a patient", "very tired", "at the hospital"], correctExpressionReason("a nurse", "계속 유지된 직업 상태를 명사로 나타내야 합니다.")),
    fixedFill("n10-fill-studying", n10Studying, "translation", "studying English hard", ["working at the office", "drawing a picture", "waiting for the bus"], correctExpressionReason("studying English hard", "계속 영어를 열심히 공부해 왔다는 뜻에 맞아야 합니다.")),
    fixedTrueFalseX("n10-tf-tired", n10Tired, "translation", "tired", "busy", "\"busy\"는 \"바쁜\", \"tired\"는 \"피곤한\"이라는 뜻입니다. 제시된 문장은 \"줄곧 바빴다\"는 내용이므로 \"나는 줄곧 피곤했어요.\"와 다릅니다. 정답은 X입니다."),
    fixedMultipleChoice("n10-mc-drawing", n10Drawing, "pattern", "has been drawing", ["is drawing", "drew", "will draw"], correctExpressionReason("has been drawing", "과거부터 지금까지 계속 그림을 그려 온 동작을 나타내야 합니다.")),
    fixedFill("n10-fill-always", n10Tired, "translation", "always", ["often", "sometimes", "recently"], correctExpressionReason("always", "줄곧 피곤했다는 뜻에 맞는 빈도 부사를 골라야 합니다."))
  ]
}, {
  level: "novice",
  dayNumber: 14,
  expectedSourceHash: "2ecdfb7daa8b37f5b3c6d3938bd2813eed20db8fe06255258cb910c5332bcd21",
  questions: [
    fixedMultipleChoice("n14-mc-harder", n14Harder, "pattern", "harder", ["hard", "less", "the hardest"], correctExpressionReason("harder", "더 열심히 공부해야 한다는 비교급 부사를 써야 합니다.")),
    fixedTrueFalseO("n14-tf-more", n14More, "translation", correctExpressionReason("I like you more.", "상대를 더 좋아한다는 뜻과 일치합니다.")),
    fixedFill("n14-fill-fastest", n14Fastest, "translation", "the fastest", ["faster", "very fast", "much later"], correctExpressionReason("the fastest", "가장 빨리 도착한다는 최상급 뜻을 나타내야 합니다.")),
    fixedMultipleChoice("n14-mc-faster", n14Faster, "pattern", "faster", ["fast", "the fastest", "more slowly"], correctExpressionReason("faster", "더 빨리 달릴 수 있다는 비교급 부사를 써야 합니다.")),
    fixedFill("n14-fill-study", n14Harder, "translation", "study", ["work", "practice", "train"], correctExpressionReason("study", "더 열심히 해야 하는 행동이 공부라는 뜻에 맞아야 합니다."))
  ]
}, {
  level: "novice",
  dayNumber: 30,
  expectedSourceHash: "7a22029211199ab9be909f57d4a75f6b8a49efd67f14543e76bf1a473d7a4037",
  questions: [
    fixedMultipleChoice("n30-mc-badminton", n30Hobby, "translation", "badminton", ["tennis", "baseball", "chess"], correctExpressionReason("badminton", "취미로 하는 운동이 배드민턴이라는 뜻에 맞아야 합니다.")),
    fixedFill("n30-fill-stop-people", n30Job, "pattern", "to stop people", ["related to stopping people", "to help people", "important to many people"], "직업의 역할이나 내용을 \"to + 동사원형\"으로 설명하므로 \"to stop people\"이 맞습니다."),
    fixedMultipleChoice("n30-mc-rich", n30Rich, "pattern", "Being rich is good.", ["Being rich was difficult.", "Getting rich takes time.", "Rich people can be generous."], correctExpressionReason("Being rich is good.", "동명사구 \"Being rich\"를 주어로 두고 부자인 상태가 좋다고 설명해야 합니다.")),
    fixedTrueFalseX("n30-tf-future", n30Study, "translation", "your future", "your health", correctExpressionReason("your future", "제시된 뜻은 공부가 건강이 아니라 미래에 도움이 된다는 내용입니다.")),
    fixedFill("n30-fill-job", n30Job, "translation", "My job", ["Your job", "His job", "Their job"], correctExpressionReason("My job", "사람들을 제지하는 일이 내 직업이라는 뜻에 맞아야 합니다."))
  ]
}, {
  level: "novice",
  dayNumber: 6,
  expectedSourceHash: "f0d0405debf7ea5ce40dca2cef9b132df2d92492eaf432b0ac208f7de7121e86",
  questions: [
    fixedMultipleChoice("n6-mc-pretty", n6Pretty, "translation", "pretty", ["busy", "tired", "ready"], exactMeaningReason("pretty")),
    fixedFill("n6-fill-can-play", n6Piano, "pattern", "Can", ["Did", "Will", "Should"], "\"피아노를 칠 수 있나요?\"는 현재의 능력을 묻기 때문에 문두에 조동사 \"Can\"을 두고, 주어 \"you\" 뒤에는 동사원형 \"play\"를 씁니다. 정답 표현은 \"Can you play the piano?\"입니다."),
    fixedMultipleChoice("n6-mc-does-live", n6Live, "pattern", "Does he live in Suwon?", ["Is he living in Suwon?", "Did he live in Suwon?", "Does she live in Suwon?"], "현재의 거주 여부를 묻는 일반동사 의문문에서는 3인칭 단수 주어 \"he\" 앞에 \"Does\"를 두고, 본동사 \"live\"는 원형으로 씁니다. 정답 표현은 \"Does he live in Suwon?\"입니다."),
    fixedTrueFalseX("n6-tf-dinner", n6Dinner, "translation", "dinner", "breakfast", exactMeaningReason("dinner")),
    fixedFill("n6-fill-piano", n6Piano, "translation", "the piano", ["the guitar", "the violin", "the drums"], exactMeaningReason("the piano"))
  ]
}, {
  level: "novice",
  dayNumber: 8,
  expectedSourceHash: "87f2d6273f2d4d9b4f97f60d70f1e992b07248a94bba2f9a21a752b6eec6ec30",
  questions: [
    fixedMultipleChoice("n8-mc-fought", n8Fought, "translation", "fought", ["called", "waited", "left"], exactMeaningReason("fought")),
    fixedFill("n8-fill-made", n8Made, "translation", "What made you", ["Who taught you to", "When did you start to", "Where did you learn to"], "어떤 원인이 이것을 좋아하게 만들었는지 물을 때는 \"What made + 목적어 + 동사원형\"을 씁니다. 정답 표현은 \"What made you\"입니다."),
    fixedMultipleChoice("n8-mc-fought-subject", n8Fought, "pattern", "Who fought?", ["Who did they fight?", "What caused the fight?", "Why did they fight?"], "제시된 뜻은 싸운 대상·원인·이유가 아니라 싸운 사람이 누구인지 묻습니다. 의문사 \"Who\"가 주어이므로 \"did\"를 덧붙이지 않고 바로 과거동사 \"fought\"를 씁니다. 정답 표현은 \"Who fought?\"입니다."),
    fixedTrueFalseO("n8-tf-happened", n8Happened, "pattern", "\"What\"이 문장의 주어이고 과거동사 \"happened\"가 바로 뒤에 오는 의문사 주어 문장으로, \"무슨 일이 있었나요?\"라는 뜻과 일치합니다."),
    fixedFill("n8-fill-this", n8Made, "translation", "this", ["that", "the movie", "the song"], exactMeaningReason("this"))
  ]
}, {
  level: "novice",
  dayNumber: 19,
  expectedSourceHash: "03f8082b768596e4071a10ad4588907a54202a852b513f8773ba824af087ce49",
  questions: [
    fixedMultipleChoice("n19-mc-father", n19Argued, "translation", "my father", ["my mother", "my brother", "my friend"], exactMeaningReason("my father")),
    fixedFill("n19-fill-asked", n19Asked, "pattern", "asked me for help", ["asked him for advice", "asked us for directions", "asked them for money"], exactMeaningReason("asked me for help")),
    fixedMultipleChoice("n19-mc-believes", n19Believes, "pattern", "believes in ghosts", ["belongs to this club", "argues with his friend", "asks for help"], exactMeaningReason("believes in ghosts")),
    fixedTrueFalseO("n19-tf-clothes", n19GotRid, "translation", "\"get rid of\"는 \"~을 처분하다\"라는 뜻이고 \"old clothes\"는 \"낡은 옷\"을 나타내므로 제시된 문장이 맞습니다."),
    fixedFill("n19-fill-always", n19Think, "translation", "always", ["sometimes", "often", "rarely"], exactMeaningReason("always"))
  ]
}, {
  level: "novice",
  dayNumber: 20,
  expectedSourceHash: "4d1bfcdaed66d6e6f727b2c563a8fb81fd849597ed12e65210b662cc965aa692",
  questions: [
    fixedMultipleChoice("n20-mc-chair", n20Chair, "translation", "The chair", ["The table", "The box", "The sofa"], exactMeaningReason("The chair")),
    fixedFill("n20-fill-invented", n20Phone, "pattern", "was invented", ["was repaired", "was replaced", "was damaged"], exactMeaningReason("was invented")),
    fixedMultipleChoice("n20-mc-bitten", n20Bitten, "pattern", "was bitten", ["was chased", "was helped", "was found"], exactMeaningReason("was bitten")),
    fixedTrueFalseX("n20-tf-moved", n20Chair, "translation", "moved", "broken", exactMeaningReason("moved")),
    fixedFill("n20-fill-bell", n20Phone, "translation", "Bell", ["Edison", "Tesla", "Marconi"], exactMeaningReason("Bell"))
  ]
}, {
  level: "novice",
  dayNumber: 28,
  expectedSourceHash: "ff130b04dfa3957a021f6071a7ebf9724232ad11670f2aa70bc6bf87e09c158c",
  questions: [
    fixedMultipleChoice("n28-mc-coffee", n28Drink, "translation", "coffee", ["tea", "water", "juice"], exactMeaningReason("coffee")),
    fixedFill("n28-fill-decided", n28Decided, "pattern", "decided not to read", ["planned to read", "wanted to read", "forgot to read"], exactMeaningReason("decided not to read")),
    fixedMultipleChoice("n28-mc-want", n28Want, "pattern", "want you to be", ["need you to stay", "asked you to come", "would like you to wait"], exactMeaningReason("want you to be")),
    fixedTrueFalseX("n28-tf-bag", n28WouldLike, "translation", "a bag", "a book", exactMeaningReason("a bag")),
    fixedFill("n28-fill-drink", n28Drink, "translation", "drink", ["buy", "order", "make"], exactMeaningReason("drink"))
  ]
}, {
  level: "novice",
  dayNumber: 7,
  expectedSourceHash: "3d2524252d4506c505ac713059ee7b5fabb3481cda3ed2c655667552de59dfe0",
  questions: [
    fixedMultipleChoice("n7-mc-english", n7WhyStudy, "translation", "English", ["Korean", "French", "Spanish"], exactMeaningReason("English")),
    fixedFill("n7-fill-direct-wh", n7WhyStudy, "pattern", "Why do you", ["Do you", "Can you", "Would you like to"], "직접 Wh- 의문문은 의문사 뒤에 조동사와 주어를 둡니다. 정답은 \"Why do you\"입니다."),
    requiredGeneratedCandidate(buildMultipleChoiceCandidates(n7WhyStudy, "pattern"), "do"),
    fixedTrueFalseX("n7-tf-study", n7WhyStudy, "translation", "study", "teach", "바뀐 문장은 영어를 가르치는 이유를 묻기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다."),
    fixedFill("n7-fill-why", n7WhyStudy, "translation", "Why", ["When", "Where", "How"], exactMeaningReason("Why"))
  ]
}, {
  level: "novice",
  dayNumber: 9,
  expectedSourceHash: "1553505a6155126dda4dfe0cf5c4861cceb7463a0e7fa455f3fb1d3d93e21574",
  questions: [
    fixedMultipleChoice("n9-mc-france", n9France, "translation", "France", ["Italy", "Japan", "Canada"], exactMeaningReason("France")),
    fixedFill("n9-fill-have-been", n9France, "pattern", "have been", ["went", "was traveling", "used to go"], "현재완료는 have/has 뒤에 과거분사를 두는 형태입니다. 정답은 \"have been\"입니다."),
    fixedMultipleChoice("n9-mc-has-lived", n9Busan, "pattern", "has lived", ["lived", "will live", "used to live"], "현재완료는 주어 He 뒤에 has와 과거분사를 씁니다. 정답은 \"has lived\"입니다."),
    fixedTrueFalseO("n9-tf-met", n9Met, "translation", "현재완료 의문문 \"Have we met before?\"는 제시된 한국어 뜻과 일치합니다. 정답은 O입니다."),
    fixedFill("n9-fill-years", n9Busan, "translation", "10 years", ["two years", "five years", "20 years"], exactMeaningReason("10 years"))
  ]
}, {
  level: "novice",
  dayNumber: 11,
  expectedSourceHash: "2cdf1fbc7a6f7653842c0f594f875dbee7d55f6f56ec4bad669880f9a603e64b",
  questions: [
    fixedMultipleChoice("n11-mc-movie-question", n11Movie, "translation", "What kind of movie", ["Which movie", "Whose movie", "How many movies"], exactMeaningReason("What kind of movie")),
    fixedFill("n11-fill-how-many", n11HowMany, "pattern", "How many bottles of soju", ["How much soju", "Which kind of soju", "What brand of soju"], "셀 수 있는 수량을 물을 때는 how many와 복수 명사를 사용합니다. 정답은 \"How many bottles of soju\"입니다."),
    fixedMultipleChoice("n11-mc-whose", n11WhoseCar, "pattern", "Whose car is this?", ["Who owns this car?", "Is this your car?", "Does this car belong to you?"], "\"Who owns this car?\"도 소유자를 묻는 뜻은 비슷하지만, 요구된 \"whose + 명사\" 구조를 사용하지 않습니다. 따라서 정답은 \"Whose car is this?\"입니다. \"Does this car belong to you?\"와 \"Is this your car?\"는 차가 상대의 것인지 묻는 예/아니요 질문입니다."),
    fixedTrueFalseX("n11-tf-soju", n11HowMany, "translation", "soju", "beer", "바뀐 문장은 맥주의 양을 묻기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다."),
    fixedFill("n11-fill-movie", n11Movie, "translation", "movie", ["music", "books", "sports"], exactMeaningReason("movie"))
  ]
}, {
  level: "novice",
  dayNumber: 13,
  expectedSourceHash: "3e8cd3456d28d21e4db3de95a579510254640800f43798b5c6b4159b73f71e00",
  questions: [
    fixedMultipleChoice("n13-mc-you", n13Better, "translation", "you", ["him", "her", "them"], exactMeaningReason("you")),
    fixedFill("n13-fill-comparative", n13Difficult, "pattern", "more difficult than I expected", ["difficult for me", "too difficult to finish", "not difficult at all"], "비교급은 more + 형용사 + than 형태로 비교 대상을 나타냅니다. 정답은 \"more difficult than I expected\"입니다."),
    fixedMultipleChoice("n13-mc-superlative", n13Longest, "pattern", "the longest river in the world", ["the name of this river", "a famous river in Africa", "your favorite river"], "최상급은 the + 형용사-est 형태로 나타냅니다. 정답은 \"the longest river in the world\"입니다."),
    fixedTrueFalseX("n13-tf-movie", n13Interesting, "translation", "movie", "book", "바뀐 문장은 책을 가리키기 때문에 제시된 한국어 뜻과 다릅니다. 정답은 X입니다."),
    fixedFill("n13-fill-test", n13Difficult, "translation", "The test", ["The assignment", "The interview", "The project"], exactMeaningReason("The test"))
  ]
}, {
  level: "novice",
  dayNumber: 22,
  expectedSourceHash: "2b6639c1dd621c36833a19d87fa527aa8a3201ae1a614145c7b5aec9713b25c1",
  questions: [
    fixedMultipleChoice("n22-mc-date-him", n22You, "translation", "date him", ["call him", "marry him", "work with him"], "제시된 뜻은 그와 사귀지 않겠다는 내용이므로 \"wouldn't\" 뒤에는 \"date him\"이 와야 합니다."),
    fixedFill("n22-fill-if-clause", n22Lottery, "pattern", "If I won the lottery", ["Whenever I won the lottery", "After I won the lottery", "Because I had won the lottery"], "가정법 과거는 If + 과거형 절로 시작합니다. 정답은 \"If I won the lottery\"입니다."),
    fixedMultipleChoice("n22-mc-would", n22Lottery, "pattern", "would", ["might", "could", "should"], "가정한 결과는 주어 + would + 동사원형으로 나타냅니다. 정답은 \"would\"입니다."),
    fixedTrueFalseX("n22-tf-bird-action", n22Bird, "translation", "fly in the sky", "swim in the sea", "바뀐 문장은 하늘을 나는 것이 아니라 바다에서 헤엄친다는 뜻이므로 제시된 한국어 뜻과 다릅니다. 정답은 X입니다."),
    fixedFill("n22-fill-bird", n22Bird, "translation", "a bird", ["a pilot", "a superhero", "a dragon"], "제시된 뜻은 내가 새라고 가정하는 내용이므로 빈칸에는 \"a bird\"가 와야 합니다.")
  ]
}, {
  level: "novice",
  dayNumber: 23,
  expectedSourceHash: "aafd4b70be2cf41b0475ca691a36b3a321590ced68bbcd33580b0bb4d303dfc8",
  questions: [
    fixedMultipleChoice("n23-mc-house", n23Middle, "translation", "a house", ["a tree", "a car", "a person"], "그림 가운데에 있는 것이 집이라는 뜻에 맞는 표현은 \"a house\"입니다."),
    fixedFill("n23-fill-middle", n23Middle, "pattern", "in the middle of", ["on the edge of", "next to", "outside"], "가운데 위치를 나타내는 패턴의 정답은 \"in the middle of\"입니다."),
    fixedMultipleChoice("n23-mc-right", n23Right, "pattern", "on the right side of", ["on the left side of", "in front of", "behind"], "오른쪽 위치는 \"on the right side of\"로 나타냅니다."),
    fixedTrueFalseO("n23-tf-left", n23Left, "translation", "\"on the left side of\"가 \"~의 왼쪽에\"를 나타내므로 제시된 문장은 한국어 뜻과 일치합니다."),
    fixedFill("n23-fill-house", n23Right, "translation", "the house", ["the school", "the park", "the building"], exactMeaningReason("the house"))
  ]
}, {
  level: "novice",
  dayNumber: 29,
  expectedSourceHash: "f34a211fea5e8f30a0f30998a90e6e208851311154a56a9a90ee4ead29fcda25",
  questions: [
    fixedMultipleChoice("n29-mc-english", n29Enjoy, "translation", "in English", ["in Korean", "with my friends", "after class"], exactMeaningReason("in English")),
    fixedFill("n29-fill-keep-ing", n29Keep, "pattern", "keep studying", ["study", "want to study", "will study"], "keep + -ing 패턴의 정답은 \"keep studying\"입니다."),
    fixedMultipleChoice("n29-mc-heard-action", n29Heard, "pattern", "snoring", ["talking", "singing", "crying"], day29HeardReason),
    fixedTrueFalseO("n29-tf-running", n29SawRunning, "translation", "\"see + 목적어 + -ing\"는 목적어가 동작 중인 장면을 본 것을 나타내므로 \"saw him running\"이 \"그가 달리는 것을 봤어요\"에 맞습니다."),
    fixedFill("n29-fill-english", n29Keep, "translation", "English", ["Korean", "math", "science"], exactMeaningReason("English"))
  ]
}, {
  level: "novice",
  dayNumber: 15,
  expectedSourceHash: "acbae168a5069582b1e3681d4c9f69f4a994d11ab73b25d8133b6704c33797ad",
  questions: [
    fixedMultipleChoice("d15-mc-duration", d15Duration, "translation", "three hours", ["one hour", "two hours", "four hours"], exactMeaningReason("three hours")),
    fixedFill("d15-fill-think", d15Think, "pattern", "think of me", ["think about the plan", "know about the issue", "feel about the idea"], "\"나를 어떻게 생각하는지\" 묻는 표현에는 \"think of me\"가 맞습니다."),
    fixedMultipleChoice("d15-mc-duration-pattern", d15Duration, "pattern", "for three hours", ["with my friend", "by myself", "for the exam"], "기간을 나타낼 때는 \"for + 기간\"을 쓰므로 \"for three hours\"가 맞습니다."),
    fixedTrueFalseO("d15-tf-hear", d15Hear, "translation", "\"I've heard a lot about you.\"에서 \"a lot\"은 \"많이\", \"about you\"는 \"당신에 관해\"를 뜻하므로 제시된 한국어 뜻과 일치합니다."),
    fixedFill("d15-fill-me", d15Think, "translation", "me", ["him", "her", "them"], "\"나를\"에 해당하는 목적격 대명사는 \"me\"입니다.")
  ]
}, {
  level: "novice",
  dayNumber: 16,
  expectedSourceHash: "47d86198f32cb3930bd12e64cd315a4d4cddad0022f1264c8e49d20b08193a6d",
  questions: [
    fixedMultipleChoice("d16-mc-christmas", d16Christmas, "translation", "usually", ["sometimes", "always", "often"], exactMeaningReason("usually")),
    fixedFill("d16-fill-spring", d16Spring, "pattern", "in spring", ["on Friday", "at Christmas", "in July"], exactMeaningReason("in spring")),
    fixedMultipleChoice("d16-mc-family", d16Christmas, "pattern", "at Christmas", ["on Friday", "in spring", "at noon"], exactMeaningReason("at Christmas")),
    fixedTrueFalseX("d16-tf-spring", d16Spring, "translation", "on a picnic", "on a hike", "바뀐 문장은 봄에 소풍을 가는 것이 아니라 하이킹을 간다는 뜻이므로 제시된 한국어 뜻과 다릅니다."),
    fixedFill("d16-fill-dinner", d16Christmas, "translation", "dinner", ["breakfast", "lunch", "brunch"], exactMeaningReason("dinner"))
  ]
}, {
  level: "novice",
  dayNumber: 17,
  expectedSourceHash: "73aecaff8bfc8b21cee5843dc14b1f5fd4a57a5984bb7e6e94e9740903440060",
  questions: [
    fixedMultipleChoice("d17-mc-friend", d17Coffee, "translation", "my friend", ["my coworker", "my brother", "my teacher"], "함께 커피를 마신 사람이 친구라는 뜻에 맞는 표현은 \"my friend\"입니다."),
    fixedFill("d17-fill-friend", d17Coffee, "pattern", "at the coffee shop", ["in the park", "at the library", "on the beach"], exactMeaningReason("at the coffee shop")),
    fixedMultipleChoice("d17-mc-suwon-place", d17Suwon, "pattern", "in Suwon", ["at Suwon", "on Suwon", "near Suwon"], "도시 안에 거주한다는 뜻에는 \"in\"을 쓰므로 \"in Suwon\"이 맞습니다."),
    fixedTrueFalseO("d17-tf-desk", d17Desk, "translation", "책상 표면 위에 있다는 뜻에는 \"on the desk\"를 쓰므로 제시된 문장이 맞습니다."),
    fixedFill("d17-fill-suwon", d17Suwon, "translation", "Suwon", ["Seoul", "Busan", "Incheon"], "사는 도시가 수원이라는 뜻에 맞는 지명은 \"Suwon\"입니다.")
  ]
}, {
  level: "novice",
  dayNumber: 18,
  expectedSourceHash: "85b1252c341bbd938eab4de04c9cf9f0ad2e9a920d0c299552cf6b8f8802849e",
  questions: [
    fixedMultipleChoice("d18-mc-addicted", d18Addicted, "translation", "watching TV", ["playing games", "using social media", "shopping online"], exactMeaningReason("watching TV")),
    fixedFill("d18-fill-afraid", d18Afraid, "pattern", "afraid of speaking English", ["tired of working late", "interested in learning French", "used to speaking in public"], exactMeaningReason("afraid of speaking English")),
    fixedMultipleChoice("d18-mc-satisfied", d18Satisfied, "pattern", "satisfied with second place", ["interested in the result", "similar to his brother", "different from the winner"], exactMeaningReason("satisfied with second place")),
    fixedTrueFalseO("d18-tf-similar", d18Similar, "translation", "\"similar\"은 비교 대상을 \"to\"로 연결하므로 \"similar to your cell phone\"이 \"휴대전화와 비슷하다\"에 맞습니다."),
    fixedFill("d18-fill-different", d18Different, "translation", "yours", ["ours", "his", "hers"], exactMeaningReason("yours"))
  ]
}, {
  level: "novice",
  dayNumber: 24,
  expectedSourceHash: "fa7cacae424fa23927b4a8089ebecb6aee2b8105ce98ec0dd1a06421e9c8e5ac",
  questions: [
    fixedMultipleChoice("d24-mc-good", goodForYou, "translation", "Good for you!", ["That's too bad.", "I'm listening.", "That's a shame."], goodForYouReason),
    fixedFill("d24-fill-listen-pattern", imListening, "pattern", "listening", ["listen", "listened", "listens"], listeningReason),
    fixedMultipleChoice("d24-mc-lucky", luckyYou, "pattern", "Lucky you!", ["That's too bad.", "That's a shame.", "I'm listening."], luckyYouReason),
    fixedTrueFalseX("d24-tf-bad", thatsTooBad, "translation", "too", "very", tooBadReason),
    fixedFill("d24-fill-shame", thatsAShame, "translation", "a", ["an", "the", "some"], shameReason)
  ]
}, {
  level: "prenovice",
  dayNumber: 1,
  expectedSourceHash: "20a8519d9a9fb16a79e7abc197292a8cb0ca21707498a8559395d11e19f0875a",
  questions: [
    fixedTrueFalseO("pn1-tf-sports", pn1Sports, "pattern", "\"Do you like sports?\"는 주어 \"you\" 앞에 \"Do\"를 두고 뒤에 동사원형 \"like\"를 써서 묻는 현재형 의문문이므로 맞습니다."),
    fixedMultipleChoice("pn1-mc-he-likes", pn1HeLikes, "translation", "likes", ["liking", "liked", "like"], "이 문장에서는 \"likes\" 형태가 맞습니다."),
    fixedFill("pn1-fill-they-like", pn1TheyLike, "translation", "like", ["liked", "likes", "liking"], "이 문장에서는 \"like\" 형태가 맞습니다."),
    fixedMultipleChoice("pn1-mc-friend-you", pn1FriendLikes, "translation", "you", ["him", "her", "us"], "한국어의 목적어가 \"너\"이므로 목적격 대명사 \"you\"를 써야 합니다. 정답 표현은 \"you\"입니다."),
    fixedFill("pn1-fill-does", pn1DoesShe, "pattern", "Does", ["Doesn't", "Didn't", "Don't"], "이 문장은 긍정문이므로 부정형이 아니라 \"Does\" 형태를 씁니다.")
  ]
}, {
  level: "prenovice",
  dayNumber: 6,
  expectedSourceHash: "0cfda1b29f694d07fd0ada187a48b30605a73bb123756f270f399e94c1a3a006",
  questions: [
    fixedTrueFalseO("pn6-tf-sister", pn6Sister, "translation", "\"Do you have a sister?\"는 주어 \"you\" 앞에 \"Do\"를 두고 뒤에 동사원형 \"have\"를 써서 소유 여부를 물으므로 맞습니다."),
    fixedFill("pn6-fill-bank", pn6Bank, "translation", "is", ["wasn't", "isn't", "aren't"], "이 문장은 긍정문이므로 부정형이 아니라 \"is\" 형태를 씁니다."),
    fixedMultipleChoice("pn6-mc-wallet", pn6Wallet, "pattern", "have", ["hadn't", "hasn't", "haven't"], "이 문장은 긍정문이므로 부정형이 아니라 \"have\" 형태를 씁니다."),
    fixedFill("pn6-fill-cash", pn6Cash, "pattern", "Do", ["Don't", "Did", "Will"], "현재의 소유 여부를 긍정 의문문으로 물을 때는 주어 \"you\" 앞에 \"Do\"를 씁니다. 정답 표현은 \"Do\"입니다."),
    fixedMultipleChoice("pn6-mc-coins", pn6Coins, "translation", "Are", ["Isn't", "Aren't", "Weren't"], "이 문장은 긍정문이므로 부정형이 아니라 \"Are\" 형태를 씁니다.")
  ]
}, {
  level: "prenovice",
  dayNumber: 8,
  expectedSourceHash: "799cacd857a4656ed0f8ad2ccfea813dacf868dbc855750954595d4daa2a86f2",
  questions: [
    fixedMultipleChoice("pn8-mc-singing", pn8Singing, "translation", "singing", ["sang", "sings", "sing"], "이 문장의 정답은 \"-ing\" 형태인 \"singing\"입니다."),
    fixedTrueFalseX("pn8-tf-working", pn8Working, "pattern", "Were", "Weren't", "이 문장은 긍정문이므로 부정형이 아니라 \"Were\" 형태를 씁니다."),
    fixedFill("pn8-fill-lying", pn8Lying, "translation", "wasn't", ["were", "was", "is"], "이 문장은 부정문이므로 긍정형이 아니라 \"wasn't\" 형태를 씁니다."),
    fixedMultipleChoice("pn8-mc-reading", pn8Reading, "pattern", "was", ["wasn't", "weren't", "isn't"], "이 문장은 긍정문이므로 부정형이 아니라 \"was\" 형태를 씁니다."),
    fixedFill("pn8-fill-game", pn8Game, "translation", "a game", ["soccer", "the piano", "cards"], "그때 하고 있던 활동이 게임이라는 뜻이므로 \"a game\"이 맞습니다. 정답 표현은 \"a game\"입니다.")
  ]
}, {
  level: "prenovice",
  dayNumber: 13,
  expectedSourceHash: "14a18faf6f5f38f4f1a7a7372037ac96fbace1208ebe98622c348a1cd17a0fef",
  questions: [
    fixedFill("pn13-fill-use", pn13UsePen, "translation", "use", ["used", "uses", "using"], "조동사 \"Can\" 뒤의 정답은 동사원형 \"use\"입니다."),
    fixedMultipleChoice("pn13-mc-take-home", pn13TakeHome, "translation", "take you home", ["leave you here", "call you later", "visit you tomorrow"], "집에 데려다줘도 되는지를 묻는 뜻에는 \"take you home\"이 맞습니다. 정답 표현은 \"take you home\"입니다."),
    fixedTrueFalseO("pn13-tf-hear", pn13Hear, "pattern", "\"Can you hear me?\"는 \"Can + 주어 + 동사원형\" 순서로 가능 여부를 묻는 의문문이므로 맞습니다."),
    fixedFill("pn13-fill-drive", pn13CantDrive, "pattern", "drive", ["drove", "driving", "drives"], "조동사 \"can't\" 뒤의 정답은 동사원형 \"drive\"입니다."),
    fixedMultipleChoice("pn13-mc-piano", pn13Piano, "translation", "can", ["will", "should", "might"], "피아노를 칠 수 있다는 능력을 나타내므로 조동사 \"can\"이 맞습니다. 정답 표현은 \"can\"입니다.")
  ]
}, {
  level: "prenovice",
  dayNumber: 14,
  expectedSourceHash: "2d8cf56a37f03147c383bbff38afe4a81e3c3fcfd4ac605276df21170f10cdd4",
  questions: [
    fixedMultipleChoice("pn14-mc-tough", pn14Tough, "translation", "be", ["are", "is", "am"], "이 문장에서는 \"be\" 형태가 맞습니다."),
    fixedFill("pn14-fill-come", pn14ComeAtEight, "pattern", "come", ["came", "coming", "comes"], "조동사 \"May\" 뒤의 정답은 동사원형 \"come\"입니다."),
    fixedMultipleChoice("pn14-mc-talk-later", pn14TalkLater, "pattern", "talk to you later", ["talk to you now", "meet you later", "ask you later"], "나중에 이야기해도 되는지를 묻는 뜻에는 \"talk to you later\"가 맞습니다. 정답 표현은 \"talk to you later\"입니다."),
    fixedTrueFalseX("pn14-tf-might-not", pn14MightNotCome, "translation", "come", "comes", "조동사 \"might\" 뒤의 정답은 동사원형 \"come\"입니다."),
    fixedFill("pn14-fill-studying", pn14Studying, "translation", "studying", ["working", "sleeping", "driving"], "그때 하고 있을지도 모르는 행동이 공부라는 뜻이므로 \"studying\"이 맞습니다. 정답 표현은 \"studying\"입니다.")
  ]
}, {
  level: "prenovice",
  dayNumber: 16,
  expectedSourceHash: "8714e9ef97e0ccdc88275fb380622766b21afb6455ecea015df08ee6a0fe6fd9",
  questions: [
    fixedMultipleChoice("pn16-mc-will-kind", pn16WillKind, "pattern", "be", ["are", "am", "is"], "이 문장에서는 \"be\" 형태가 맞습니다."),
    fixedFill("pn16-fill-was-studying", pn16WasStudying, "translation", "was", ["wasn't", "weren't", "isn't"], "이 문장은 긍정문이므로 부정형이 아니라 \"was\" 형태를 씁니다."),
    fixedTrueFalseX("pn16-tf-might-study", pn16MightStudy, "pattern", "study", "studies", "조동사 \"might\" 뒤의 정답은 동사원형 \"study\"입니다."),
    fixedMultipleChoice("pn16-mc-can-kind", pn16CanKind, "translation", "can", ["will", "should", "might"], "친절할 수 있다는 가능성을 나타내므로 조동사 \"can\"이 맞습니다. 정답 표현은 \"can\"입니다."),
    fixedFill("pn16-fill-should", pn16ShouldStudy, "translation", "should", ["can", "will", "might"], "공부해야 한다는 조언·당위를 나타내므로 조동사 \"should\"가 맞습니다. 정답 표현은 \"should\"입니다.")
  ]
}, {
  level: "novice",
  dayNumber: 27,
  expectedSourceHash: "0286533b809881bd642a6c2a5f4c49ca7e41ec4eab6a7cf9e3d54d5eac0dd868",
  questions: [
    requiredGeneratedCandidate(buildFillBlankCandidates(n27Hard, "translation"), "study"),
    generatedTrueFalseO(n27Abroad, "translation", "\"to go abroad\"는 영어를 공부하는 목적을 나타내며, 목적의 to부정사는 \"to + 동사원형\" 형태이므로 제시된 문장이 맞습니다."),
    requiredGeneratedCandidate(buildMultipleChoiceCandidates(n27Pen, "translation"), "use"),
    requiredGeneratedCandidate(buildFillBlankCandidates(n27BusStop, "pattern"), "get"),
    requiredGeneratedCandidate(buildMultipleChoiceCandidates(n27Things, "pattern"), "do")
  ]
}, {
  level: "novice",
  dayNumber: 31,
  expectedSourceHash: "2bb74ba7f67b324cfab87652b529ffd105d5fe6ed94109802449d69c323b58b3",
  questions: [
    requiredGeneratedCandidate(buildFillBlankCandidates(n31Late, "translation"), "be"),
    fixedMultipleChoice("n31-mc-japanese", n31Japanese, "translation", "It's difficult for you to learn Japanese.", ["It's easy for you to learn Japanese.", "It's difficult for me to learn Japanese.", "It's difficult for you to learn Korean."], "어렵다는 뜻의 \"difficult\", 행동 주체인 \"for you\", 학습 대상인 \"Japanese\"가 모두 제시된 뜻과 일치해야 합니다."),
    requiredGeneratedCandidate(buildFillBlankCandidates(n31Japanese, "translation"), "learn"),
    fixedTrueFalseO("n31-tf-money", n31Money, "pattern", "\"for me\"는 행동 주체가 나임을 나타내고 \"to make money\"는 돈을 버는 행동을 나타내므로 제시된 뜻과 일치합니다."),
    requiredGeneratedCandidate(buildMultipleChoiceCandidates(n31Home, "pattern"), "go")
  ]
}] satisfies readonly WctStandardDayOverride[];
