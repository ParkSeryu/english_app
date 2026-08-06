import { describe, expect, it } from "vitest";

import {
  auditStandardQuestionCandidate,
  buildTrueFalseCandidate
} from "@/lib/wct/quiz/standard/candidates";
import { hasUniqueStandardLearningTargets } from "@/lib/wct/quiz/standard/diversity";
import { STANDARD_WCT_DAY_OVERRIDES } from "@/lib/wct/quiz/standard/overrides";
import type {
  WctStandardLevel,
  WctStandardQuestionCandidate,
  WctStandardSourceEntry
} from "@/lib/wct/quiz/standard/types";

type Pair = readonly [patternId: string, exampleId: string];

const layoutContracts = {
  "prenovice:1": {
    sourceHash: "20a8519d9a9fb16a79e7abc197292a8cb0ca21707498a8559395d11e19f0875a",
    pairs: [
      ["f1e60da8-2d86-468a-8223-ac71ddd1ac80", "458bd0be-1eb8-4e9b-a688-c5ccc9cf9a4a"],
      ["4ed20075-7e76-4b3f-92ee-74d70bdf2b38", "978cdf2b-6731-45cb-877f-8d2742be1ad9"],
      ["61e93054-d36f-4417-9e91-326e1d55d2b4", "19d15135-4539-4e62-83e7-35d5f23aec34"],
      ["4ed20075-7e76-4b3f-92ee-74d70bdf2b38", "d796e9b1-e878-4a9a-8311-47ee49b6628e"],
      ["f1e60da8-2d86-468a-8223-ac71ddd1ac80", "7d3881c5-fa26-4cd7-a709-c0312d1fe8ea"]
    ],
    formats: ["true_false", "multiple_choice", "fill_blank", "multiple_choice", "fill_blank"],
    kinds: ["pattern", "translation", "translation", "translation", "pattern"],
    state: "O"
  },
  "prenovice:5": {
    sourceHash: "e94088e5680e3b3ef488628729e8ed0db489e8cd2ec9c07dddd0e0fc24fbb402",
    pairs: [
      ["1879befe-3ee5-44b5-b8ef-0e7aee2411cd", "d0b529a9-c93a-48fa-94d0-aa29de941871"],
      ["1879befe-3ee5-44b5-b8ef-0e7aee2411cd", "15900358-0be1-4a95-a8c7-f0034ffa1a5e"],
      ["e68178d4-6bfc-4417-8082-8598607a0c0a", "18a8b998-e515-4136-b1ed-cdf330cc6623"],
      ["1879befe-3ee5-44b5-b8ef-0e7aee2411cd", "d0b529a9-c93a-48fa-94d0-aa29de941871"],
      ["1879befe-3ee5-44b5-b8ef-0e7aee2411cd", "15900358-0be1-4a95-a8c7-f0034ffa1a5e"]
    ],
    formats: ["multiple_choice", "fill_blank", "true_false", "multiple_choice", "fill_blank"],
    kinds: ["translation", "pattern", "translation", "pattern", "translation"],
    state: "O"
  },
  "prenovice:6": {
    sourceHash: "0cfda1b29f694d07fd0ada187a48b30605a73bb123756f270f399e94c1a3a006",
    pairs: [
      ["a57dfad6-658d-4f4b-be7f-21f42b81ab17", "745cad43-8753-47f0-bd86-f69cd6e4ac84"],
      ["30813764-a79d-4a4d-b725-dd36135dec35", "28a9eb18-b765-4ee9-af43-bf0c5d76c192"],
      ["51f12379-6dc0-4de3-805b-58d86890945f", "afbc0304-00f3-4a33-905b-ab0674b75cc1"],
      ["a57dfad6-658d-4f4b-be7f-21f42b81ab17", "fbcf1c87-1d2b-4e75-a07a-0adb9b502685"],
      ["30813764-a79d-4a4d-b725-dd36135dec35", "bda5b0ef-c632-4833-8c73-621aad72942c"]
    ],
    formats: ["true_false", "fill_blank", "multiple_choice", "fill_blank", "multiple_choice"],
    kinds: ["translation", "translation", "pattern", "pattern", "translation"],
    state: "O"
  },
  "prenovice:8": {
    sourceHash: "799cacd857a4656ed0f8ad2ccfea813dacf868dbc855750954595d4daa2a86f2",
    pairs: [
      ["12594eb3-b804-47e0-872a-1721425be24c", "08f555d0-52df-4b9a-92b4-a1a887a8c91e"],
      ["486f2ae6-1f1a-46d2-ac0b-7d978daccfd9", "2429e381-b344-46fb-aecb-602cfe8f5e5f"],
      ["0d8ae6f7-3cee-4103-8d3a-6190f4a6477b", "95876e8e-fada-4442-9c1d-9961925bcb8c"],
      ["12594eb3-b804-47e0-872a-1721425be24c", "3c5f7a9c-4841-4f05-aada-3c558cd62421"],
      ["486f2ae6-1f1a-46d2-ac0b-7d978daccfd9", "464bfbf0-6223-45d4-91fd-0600397ad6ef"]
    ],
    formats: ["multiple_choice", "true_false", "fill_blank", "multiple_choice", "fill_blank"],
    kinds: ["translation", "pattern", "translation", "pattern", "translation"],
    state: "X"
  },
  "prenovice:12": {
    sourceHash: "70d4e40951ae430485665477da8bc8180ebedbca1d28f594a050951dc48462a4",
    pairs: [
      ["28a96934-5b21-40db-a9eb-ab7873f2f9f0", "54410b53-68ba-45cb-b0f8-73484469fd7b"],
      ["28a96934-5b21-40db-a9eb-ab7873f2f9f0", "c23fdfc4-4e59-4750-be5b-5a7a4cdd9805"],
      ["5dee51b9-9b6f-44ae-b905-7ea6f9b1969d", "f1702241-ea37-47b3-9db4-58ec9b45da24"],
      ["7a6e4126-306c-41fa-a904-d732141c7e70", "9eb6a8fa-945a-4173-b789-f1b713dc7d47"],
      ["5dee51b9-9b6f-44ae-b905-7ea6f9b1969d", "aba61663-1e37-48cc-91ef-12e83ab11fe5"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "fill_blank", "true_false"],
    kinds: ["translation", "pattern", "pattern", "translation", "translation"],
    state: "O"
  },
  "prenovice:13": {
    sourceHash: "14a18faf6f5f38f4f1a7a7372037ac96fbace1208ebe98622c348a1cd17a0fef",
    pairs: [
      ["a1940b2f-5966-4df7-b74f-19c902a7c8ef", "99094b2c-1ab6-45b3-a583-5d33eac42556"],
      ["a1940b2f-5966-4df7-b74f-19c902a7c8ef", "b76fbdc4-3569-4c80-b9dd-567f77e137b4"],
      ["2ff0da88-7228-4fcd-a1f9-51d69cd600a3", "7d1890bf-4bea-4fa8-9718-ac4fcc4dd5b8"],
      ["707a8dec-520f-4e13-a9c9-2a888563c1ac", "9e33c4ce-3c01-4648-a6cb-aa808fa489f3"],
      ["707a8dec-520f-4e13-a9c9-2a888563c1ac", "4d356056-3fb3-41f0-b72b-1f490f2a6d80"]
    ],
    formats: ["fill_blank", "multiple_choice", "true_false", "fill_blank", "multiple_choice"],
    kinds: ["translation", "translation", "pattern", "pattern", "translation"],
    state: "O"
  },
  "prenovice:14": {
    sourceHash: "2d8cf56a37f03147c383bbff38afe4a81e3c3fcfd4ac605276df21170f10cdd4",
    pairs: [
      ["a26f53b4-0b35-464c-a58d-bf57f85b1609", "e3cfe3ce-b9fb-46b2-a533-35ea17a59700"],
      ["3550431e-1300-429e-81ed-e5d1fd3b8cbd", "a79fd569-c9e2-4654-b249-016a6fe42ee9"],
      ["3550431e-1300-429e-81ed-e5d1fd3b8cbd", "23e00836-1dd6-48d3-810f-ec30400f1faa"],
      ["658ef897-7546-4c5e-8ce0-907cdcf9c035", "bd37351e-20c7-495d-810e-42ce5aac7572"],
      ["a26f53b4-0b35-464c-a58d-bf57f85b1609", "5e821d8d-eb4d-40c1-96f1-e8f6b4fb949f"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
    kinds: ["translation", "pattern", "pattern", "translation", "translation"],
    state: "X"
  },
  "prenovice:16": {
    sourceHash: "8714e9ef97e0ccdc88275fb380622766b21afb6455ecea015df08ee6a0fe6fd9",
    pairs: [
      ["08445842-cd37-474d-abeb-7358a98fb6b2", "9ae30f16-e7bf-4147-a808-cdacd280caf9"],
      ["270c8e8c-0fa1-45d9-a6b0-d62f1c9c1d44", "4efc2fb9-ab55-471f-b922-a47bea29ebf7"],
      ["1c076e02-a070-4881-8ef5-795442185a20", "eb6dc27b-983c-4a4b-80f8-dccae98ecd7c"],
      ["08445842-cd37-474d-abeb-7358a98fb6b2", "e057cac5-5fd5-4b66-a697-35ae1007abce"],
      ["1c076e02-a070-4881-8ef5-795442185a20", "03d9057b-cf77-429c-816f-81396f88f7aa"]
    ],
    formats: ["multiple_choice", "fill_blank", "true_false", "multiple_choice", "fill_blank"],
    kinds: ["pattern", "translation", "pattern", "translation", "translation"],
    state: "X"
  },
  "novice:6": {
    sourceHash: "f0d0405debf7ea5ce40dca2cef9b132df2d92492eaf432b0ac208f7de7121e86",
    pairs: [
      ["e04e84e4-7f70-4f44-a9ae-638fdce2d1e9", "ddae13b4-6fd8-4604-a882-b575487110d2"],
      ["e04e84e4-7f70-4f44-a9ae-638fdce2d1e9", "b09f0cc7-1e2b-41bc-9cf6-ab6eafbb4a90"],
      ["89786c1c-b457-4e90-85d0-923a4ac865cb", "3e53c4cb-3831-4963-8575-795814203eb4"],
      ["89786c1c-b457-4e90-85d0-923a4ac865cb", "62c99b78-0e97-4fec-95fc-86a7fccc584b"],
      ["e04e84e4-7f70-4f44-a9ae-638fdce2d1e9", "b09f0cc7-1e2b-41bc-9cf6-ab6eafbb4a90"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
    kinds: ["translation", "pattern", "pattern", "translation", "translation"],
    state: "X"
  },
  "novice:8": {
    sourceHash: "87f2d6273f2d4d9b4f97f60d70f1e992b07248a94bba2f9a21a752b6eec6ec30",
    pairs: [
      ["aa20cf36-a8ee-4683-b841-014c31a8c7d4", "b82d7c24-8937-4b12-830f-05bc19ede618"],
      ["aa20cf36-a8ee-4683-b841-014c31a8c7d4", "d9187f9a-d912-45f0-aa22-05aeff236d27"],
      ["aa20cf36-a8ee-4683-b841-014c31a8c7d4", "b82d7c24-8937-4b12-830f-05bc19ede618"],
      ["aa20cf36-a8ee-4683-b841-014c31a8c7d4", "0ee23aac-5d44-4239-ab9d-79612ade9795"],
      ["aa20cf36-a8ee-4683-b841-014c31a8c7d4", "d9187f9a-d912-45f0-aa22-05aeff236d27"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
    kinds: ["translation", "translation", "pattern", "pattern", "translation"],
    state: "O"
  },
  "novice:15": {
    sourceHash: "acbae168a5069582b1e3681d4c9f69f4a994d11ab73b25d8133b6704c33797ad",
    pairs: [
      ["67ee0ad6-c7ca-4599-b98a-28e6820b7c43", "1d1baf64-346a-4f87-a78e-4563fdd1e58d"],
      ["9b5e0d86-b351-4273-90e3-05feb8962a88", "85fa5142-ae97-473b-8728-78c69c9381fb"],
      ["67ee0ad6-c7ca-4599-b98a-28e6820b7c43", "1d1baf64-346a-4f87-a78e-4563fdd1e58d"],
      ["9b5e0d86-b351-4273-90e3-05feb8962a88", "5aebbaaa-e258-4139-b4dd-7cfc1211cec0"],
      ["9b5e0d86-b351-4273-90e3-05feb8962a88", "85fa5142-ae97-473b-8728-78c69c9381fb"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
    kinds: ["translation", "pattern", "pattern", "translation", "translation"],
    state: "O"
  },
  "novice:16": {
    sourceHash: "47d86198f32cb3930bd12e64cd315a4d4cddad0022f1264c8e49d20b08193a6d",
    pairs: [
      ["59ca0c76-000a-4a96-923d-b6410982962d", "e2bb996b-ae60-4e21-aebd-ee1fa7066cd9"],
      ["b4377bbe-d08e-4d93-bae7-d6a9cd1b1abd", "61d8c02c-1981-4c38-ba6f-d1f24a9e1b8b"],
      ["59ca0c76-000a-4a96-923d-b6410982962d", "e2bb996b-ae60-4e21-aebd-ee1fa7066cd9"],
      ["b4377bbe-d08e-4d93-bae7-d6a9cd1b1abd", "61d8c02c-1981-4c38-ba6f-d1f24a9e1b8b"],
      ["59ca0c76-000a-4a96-923d-b6410982962d", "e2bb996b-ae60-4e21-aebd-ee1fa7066cd9"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
    kinds: ["translation", "pattern", "pattern", "translation", "translation"],
    state: "X"
  },
  "novice:19": {
    sourceHash: "03f8082b768596e4071a10ad4588907a54202a852b513f8773ba824af087ce49",
    pairs: [
      ["82801998-9d99-43f4-ba87-5d90be2f2a70", "625d50f3-e6c6-428f-ab9f-d3feee706ae9"],
      ["82801998-9d99-43f4-ba87-5d90be2f2a70", "b8d03b73-8937-4047-821e-931737739f7a"],
      ["82801998-9d99-43f4-ba87-5d90be2f2a70", "528134f3-cf7a-44e4-b799-04604fd82c2a"],
      ["f1d47746-f26e-418a-82d7-8ca073e21c49", "7d28ae9a-40a0-4e29-a32d-5332c43683c8"],
      ["f1d47746-f26e-418a-82d7-8ca073e21c49", "37d2b1eb-f2f2-468f-a6a2-e010d9402057"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
    kinds: ["translation", "pattern", "pattern", "translation", "translation"],
    state: "O"
  },
  "novice:17": {
    sourceHash: "73aecaff8bfc8b21cee5843dc14b1f5fd4a57a5984bb7e6e94e9740903440060",
    pairs: [
      ["5d1c6eb4-f0ae-4b09-afa9-653901820779", "6e856eaf-8636-45a0-847a-176cfc27df8b"],
      ["5d1c6eb4-f0ae-4b09-afa9-653901820779", "6e856eaf-8636-45a0-847a-176cfc27df8b"],
      ["5d1c6eb4-f0ae-4b09-afa9-653901820779", "dc050e31-1e4f-436c-95a2-3b65b3e1ed4a"],
      ["5d1c6eb4-f0ae-4b09-afa9-653901820779", "b34c7941-5127-4727-83e0-bd027923c852"],
      ["5d1c6eb4-f0ae-4b09-afa9-653901820779", "dc050e31-1e4f-436c-95a2-3b65b3e1ed4a"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
    kinds: ["translation", "pattern", "pattern", "translation", "translation"],
    state: "O"
  },
  "novice:18": {
    sourceHash: "85b1252c341bbd938eab4de04c9cf9f0ad2e9a920d0c299552cf6b8f8802849e",
    pairs: [
      ["8bef4631-7d8d-4110-ac27-a6776a9820ba", "e5ac67e6-cfe3-4196-95e1-4831ec5a21f8"],
      ["8bef4631-7d8d-4110-ac27-a6776a9820ba", "dd043a39-5d0e-422e-aab0-5b89b9391a04"],
      ["c4031c1c-1c0f-46b8-929d-28c362a088d0", "ffcf413c-98f9-49ce-b790-6178125277bf"],
      ["c4031c1c-1c0f-46b8-929d-28c362a088d0", "f11bda80-a43d-4b1d-902e-0be75b5ef655"],
      ["c4031c1c-1c0f-46b8-929d-28c362a088d0", "8242db01-e146-4849-aa1d-3922e98045a8"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
    kinds: ["translation", "pattern", "pattern", "translation", "translation"],
    state: "O"
  },
  "novice:23": {
    sourceHash: "aafd4b70be2cf41b0475ca691a36b3a321590ced68bbcd33580b0bb4d303dfc8",
    pairs: [
      ["86656cd9-be99-4566-8abe-9283082f7e66", "72372809-ee2b-47e0-a5d0-576b9cd752ad"],
      ["86656cd9-be99-4566-8abe-9283082f7e66", "72372809-ee2b-47e0-a5d0-576b9cd752ad"],
      ["384e773c-d04b-43ad-beaa-55bdda9e7c7c", "94df2fb0-3de6-4d0e-85c3-84e71f221473"],
      ["384e773c-d04b-43ad-beaa-55bdda9e7c7c", "9ed4a838-e66d-43af-b9d0-e866d16a38db"],
      ["384e773c-d04b-43ad-beaa-55bdda9e7c7c", "94df2fb0-3de6-4d0e-85c3-84e71f221473"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
    kinds: ["translation", "pattern", "pattern", "translation", "translation"],
    state: "O"
  },
  "novice:27": {
    sourceHash: "0286533b809881bd642a6c2a5f4c49ca7e41ec4eab6a7cf9e3d54d5eac0dd868",
    pairs: [
      ["be43a301-a0d8-40aa-86ce-87938799c465", "88fc90d1-54cc-4529-8323-60480e00d353"],
      ["a0cbec44-dceb-430b-bb63-6f1fa76979ff", "57d3a214-01a9-4169-b03e-3bc840b929a1"],
      ["75cf3a78-4cf2-4e4c-bc85-ffea5eecb99d", "52175474-440b-4812-849d-f03b20d3648e"],
      ["a0cbec44-dceb-430b-bb63-6f1fa76979ff", "407f4fa0-3bce-45b3-8448-6c9957127d99"],
      ["75cf3a78-4cf2-4e4c-bc85-ffea5eecb99d", "480fa6ae-2bf1-476e-a69f-5d942c25d5ca"]
    ],
    formats: ["fill_blank", "true_false", "multiple_choice", "fill_blank", "multiple_choice"],
    kinds: ["translation", "translation", "translation", "pattern", "pattern"],
    state: "O"
  },
  "novice:29": {
    sourceHash: "f34a211fea5e8f30a0f30998a90e6e208851311154a56a9a90ee4ead29fcda25",
    pairs: [
      ["07972de5-3d42-445a-aed4-7d55d925bd8f", "10472aeb-5dfd-40a5-a0ef-753516707baa"],
      ["07972de5-3d42-445a-aed4-7d55d925bd8f", "285796ea-5f3e-466a-b4d2-6506914e521c"],
      ["417ba2b4-d5c9-4036-9ec3-f26f7f243ffa", "05089a8b-66da-429f-a01f-2cf82560230e"],
      ["417ba2b4-d5c9-4036-9ec3-f26f7f243ffa", "09e83dd1-322b-45c3-ac7d-bb642f5e3445"],
      ["07972de5-3d42-445a-aed4-7d55d925bd8f", "285796ea-5f3e-466a-b4d2-6506914e521c"]
    ],
    formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
    kinds: ["translation", "pattern", "pattern", "translation", "translation"],
    state: "O"
  },
  "novice:31": {
    sourceHash: "2bb74ba7f67b324cfab87652b529ffd105d5fe6ed94109802449d69c323b58b3",
    pairs: [
      ["8332c6dc-62f4-4c70-850d-87c53cfbbb0a", "8cc63128-8e47-4700-be64-b9fe890554fd"],
      ["30409927-3c74-4306-b9bb-0743acdf7e55", "d15e6862-9896-4910-88d9-fffdb207a22a"],
      ["30409927-3c74-4306-b9bb-0743acdf7e55", "d15e6862-9896-4910-88d9-fffdb207a22a"],
      ["30409927-3c74-4306-b9bb-0743acdf7e55", "caa4aabe-77a7-47b5-8b4f-6b9c2b049490"],
      ["8332c6dc-62f4-4c70-850d-87c53cfbbb0a", "593ecaab-170e-4d76-962e-544101744a7e"]
    ],
    formats: ["fill_blank", "multiple_choice", "fill_blank", "true_false", "multiple_choice"],
    kinds: ["translation", "translation", "translation", "pattern", "pattern"],
    state: "O"
  }
} as const satisfies Record<string, {
  sourceHash: string;
  pairs: readonly Pair[];
  formats: readonly string[];
  kinds: readonly string[];
  state: "O" | "X";
}>;

const changedQuestionContracts = {
  "prenovice:1:0": {
    source: "Do you like sports?",
    choices: ["O", "X"],
    reason: "\"Do you like sports?\"는 주어 \"you\" 앞에 \"Do\"를 두고 뒤에 동사원형 \"like\"를 써서 묻는 현재형 의문문이므로 맞습니다."
  },
  "prenovice:1:3": {
    source: "My friend likes you.",
    choices: [
      "My friend likes you.", "My friend likes him.",
      "My friend likes her.", "My friend likes us."
    ],
    reason: "한국어의 목적어가 \"너\"이므로 목적격 대명사 \"you\"를 써야 합니다. 정답 표현은 \"you\"입니다."
  },
  "prenovice:5:3": {
    source: "We were students.",
    choices: ["We were students.", "We are students.", "We weren't students.", "Were we students?"],
    reason: "\"was/were + 명사\" 패턴에서 주어 \"We\"의 긍정 과거 상태는 \"We were students.\"입니다."
  },
  "prenovice:5:4": {
    source: "You were a fool.",
    choices: ["You were a fool.", "You were a student.", "You were a teacher.", "You were my friend."],
    reason: "과거에 바보였다는 뜻에 맞는 명사 표현은 \"a fool\"입니다. 정답 표현은 \"a fool\"입니다."
  },
  "prenovice:6:0": {
    source: "Do you have a sister?",
    choices: ["O", "X"],
    reason: "\"Do you have a sister?\"는 주어 \"you\" 앞에 \"Do\"를 두고 뒤에 동사원형 \"have\"를 써서 소유 여부를 물으므로 맞습니다."
  },
  "prenovice:6:3": {
    source: "Do you have cash?",
    choices: ["Do you have cash?", "Don't you have cash?", "Did you have cash?", "Will you have cash?"],
    reason: "현재의 소유 여부를 긍정 의문문으로 물을 때는 주어 \"you\" 앞에 \"Do\"를 씁니다. 정답 표현은 \"Do\"입니다."
  },
  "prenovice:8:4": {
    source: "Were you playing a game at that time?",
    choices: [
      "Were you playing a game at that time?", "Were you playing soccer at that time?",
      "Were you playing the piano at that time?", "Were you playing cards at that time?"
    ],
    reason: "그때 하고 있던 활동이 게임이라는 뜻이므로 \"a game\"이 맞습니다. 정답 표현은 \"a game\"입니다."
  },
  "prenovice:12:4": {
    source: "We will be happy.",
    choices: ["O", "X"],
    reason: "\"We will be happy.\"는 \"will be + 형용사\" 형태로 미래의 상태를 나타내므로 맞습니다."
  },
  "prenovice:13:1": {
    source: "Can I take you home?",
    choices: [
      "Can I take you home?", "Can I leave you here?",
      "Can I call you later?", "Can I visit you tomorrow?"
    ],
    reason: "집에 데려다줘도 되는지를 묻는 뜻에는 \"take you home\"이 맞습니다. 정답 표현은 \"take you home\"입니다."
  },
  "prenovice:13:2": {
    source: "Can you hear me?",
    choices: ["O", "X"],
    reason: "\"Can you hear me?\"는 \"Can + 주어 + 동사원형\" 순서로 가능 여부를 묻는 의문문이므로 맞습니다."
  },
  "prenovice:13:4": {
    source: "I can play the piano.",
    choices: ["I can play the piano.", "I will play the piano.", "I should play the piano.", "I might play the piano."],
    reason: "피아노를 칠 수 있다는 능력을 나타내므로 조동사 \"can\"이 맞습니다. 정답 표현은 \"can\"입니다."
  },
  "prenovice:14:2": {
    source: "May I talk to you later?",
    choices: [
      "May I talk to you later?", "May I talk to you now?",
      "May I meet you later?", "May I ask you later?"
    ],
    reason: "나중에 이야기해도 되는지를 묻는 뜻에는 \"talk to you later\"가 맞습니다. 정답 표현은 \"talk to you later\"입니다."
  },
  "prenovice:14:4": {
    source: "I might be studying at that time.",
    choices: [
      "I might be studying at that time.", "I might be working at that time.",
      "I might be sleeping at that time.", "I might be driving at that time."
    ],
    reason: "그때 하고 있을지도 모르는 행동이 공부라는 뜻이므로 \"studying\"이 맞습니다. 정답 표현은 \"studying\"입니다."
  },
  "prenovice:16:3": {
    source: "We can be kind.",
    choices: ["We can be kind.", "We will be kind.", "We should be kind.", "We might be kind."],
    reason: "친절할 수 있다는 가능성을 나타내므로 조동사 \"can\"이 맞습니다. 정답 표현은 \"can\"입니다."
  },
  "prenovice:16:4": {
    source: "You should study.",
    choices: ["You should study.", "You can study.", "You will study.", "You might study."],
    reason: "공부해야 한다는 조언·당위를 나타내므로 조동사 \"should\"가 맞습니다. 정답 표현은 \"should\"입니다."
  },
  "novice:6:1": {
    source: "Can you play the piano?",
    choices: [
      "Can you play the piano?", "Did you play the piano?",
      "Will you play the piano?", "Should you play the piano?"
    ],
    reason: "\"피아노를 칠 수 있나요?\"는 현재의 능력을 묻기 때문에 문두에 조동사 \"Can\"을 두고, 주어 \"you\" 뒤에는 동사원형 \"play\"를 씁니다. 정답 표현은 \"Can you play the piano?\"입니다."
  },
  "novice:6:2": {
    source: "Does he live in Suwon?",
    choices: [
      "Does he live in Suwon?", "Is he living in Suwon?",
      "Did he live in Suwon?", "Does she live in Suwon?"
    ],
    reason: "현재의 거주 여부를 묻는 일반동사 의문문에서는 3인칭 단수 주어 \"he\" 앞에 \"Does\"를 두고, 본동사 \"live\"는 원형으로 씁니다. 정답 표현은 \"Does he live in Suwon?\"입니다."
  },
  "novice:8:1": {
    source: "What made you like this?",
    choices: [
      "What made you like this?", "Who taught you to like this?",
      "When did you start to like this?", "Where did you learn to like this?"
    ],
    reason: "어떤 원인이 이것을 좋아하게 만들었는지 물을 때는 \"What made + 목적어 + 동사원형\"을 씁니다. 정답 표현은 \"What made you\"입니다."
  },
  "novice:8:2": {
    source: "Who fought?",
    choices: ["Who fought?", "Who did they fight?", "What caused the fight?", "Why did they fight?"],
    reason: "제시된 뜻은 싸운 대상·원인·이유가 아니라 싸운 사람이 누구인지 묻습니다. 의문사 \"Who\"가 주어이므로 \"did\"를 덧붙이지 않고 바로 과거동사 \"fought\"를 씁니다. 정답 표현은 \"Who fought?\"입니다."
  },
  "novice:8:3": {
    source: "What happened?",
    choices: ["O", "X"],
    reason: "\"What\"이 문장의 주어이고 과거동사 \"happened\"가 바로 뒤에 오는 의문사 주어 문장으로, \"무슨 일이 있었나요?\"라는 뜻과 일치합니다."
  },
  "novice:15:1": {
    source: "What do you think of me?",
    choices: [
      "What do you think of me?", "What do you think about the plan?",
      "What do you know about the issue?", "What do you feel about the idea?"
    ],
    reason: "\"나를 어떻게 생각하는지\" 묻는 표현에는 \"think of me\"가 맞습니다."
  },
  "novice:15:2": {
    source: "I will study for three hours today.",
    choices: [
      "I will study for three hours today.", "I will study with my friend today.",
      "I will study by myself today.", "I will study for the exam today."
    ],
    reason: "기간을 나타낼 때는 \"for + 기간\"을 쓰므로 \"for three hours\"가 맞습니다."
  },
  "novice:15:3": {
    source: "I've heard a lot about you.",
    choices: ["O", "X"],
    reason: "\"I've heard a lot about you.\"에서 \"a lot\"은 \"많이\", \"about you\"는 \"당신에 관해\"를 뜻하므로 제시된 한국어 뜻과 일치합니다."
  },
  "novice:15:4": {
    source: "What do you think of me?",
    choices: [
      "What do you think of me?", "What do you think of him?",
      "What do you think of her?", "What do you think of them?"
    ],
    reason: "\"나를\"에 해당하는 목적격 대명사는 \"me\"입니다."
  },
  "novice:16:3": {
    source: "I go on a picnic in spring.",
    choices: ["O", "X"],
    statement: "I go on a hike in spring.",
    reason: "바뀐 문장은 봄에 소풍을 가는 것이 아니라 하이킹을 간다는 뜻이므로 제시된 한국어 뜻과 다릅니다."
  },
  "novice:19:3": {
    source: "He got rid of his old clothes.",
    choices: ["O", "X"],
    reason: "\"get rid of\"는 \"~을 처분하다\"라는 뜻이고 \"old clothes\"는 \"낡은 옷\"을 나타내므로 제시된 문장이 맞습니다."
  },
  "novice:17:0": {
    source: "I had coffee with my friend at the coffee shop.",
    choices: [
      "I had coffee with my friend at the coffee shop.",
      "I had coffee with my coworker at the coffee shop.",
      "I had coffee with my brother at the coffee shop.",
      "I had coffee with my teacher at the coffee shop."
    ],
    reason: "함께 커피를 마신 사람이 친구라는 뜻에 맞는 표현은 \"my friend\"입니다."
  },
  "novice:17:2": {
    source: "I live in Suwon.",
    choices: ["I live in Suwon.", "I live at Suwon.", "I live on Suwon.", "I live near Suwon."],
    reason: "도시 안에 거주한다는 뜻에는 \"in\"을 쓰므로 \"in Suwon\"이 맞습니다."
  },
  "novice:17:3": {
    source: "The cup is on the desk.",
    choices: ["O", "X"],
    reason: "책상 표면 위에 있다는 뜻에는 \"on the desk\"를 쓰므로 제시된 문장이 맞습니다."
  },
  "novice:17:4": {
    source: "I live in Suwon.",
    choices: ["I live in Suwon.", "I live in Seoul.", "I live in Busan.", "I live in Incheon."],
    reason: "사는 도시가 수원이라는 뜻에 맞는 지명은 \"Suwon\"입니다."
  },
  "novice:18:3": {
    source: "This is similar to your cell phone.",
    choices: ["O", "X"],
    reason: "\"similar\"은 비교 대상을 \"to\"로 연결하므로 \"similar to your cell phone\"이 \"휴대전화와 비슷하다\"에 맞습니다."
  },
  "novice:23:0": {
    source: "There is a house in the middle of the picture.",
    choices: [
      "There is a house in the middle of the picture.",
      "There is a tree in the middle of the picture.",
      "There is a car in the middle of the picture.",
      "There is a person in the middle of the picture."
    ],
    reason: "그림 가운데에 있는 것이 집이라는 뜻에 맞는 표현은 \"a house\"입니다."
  },
  "novice:23:2": {
    source: "A tree is on the right side of the house.",
    choices: [
      "A tree is on the right side of the house.",
      "A tree is on the left side of the house.",
      "A tree is in front of the house.",
      "A tree is behind the house."
    ],
    reason: "오른쪽 위치는 \"on the right side of\"로 나타냅니다."
  },
  "novice:23:3": {
    source: "The chair is on the left side of the desk.",
    choices: ["O", "X"],
    reason: "\"on the left side of\"가 \"~의 왼쪽에\"를 나타내므로 제시된 문장은 한국어 뜻과 일치합니다."
  },
  "novice:27:1": {
    source: "I study English to go abroad.",
    choices: ["O", "X"],
    reason: "\"to go abroad\"는 영어를 공부하는 목적을 나타내며, 목적의 to부정사는 \"to + 동사원형\" 형태이므로 제시된 문장이 맞습니다."
  },
  "novice:27:0": {
    source: "To study is hard.",
    choices: ["To study is hard.", "To studied is hard.", "To studying is hard.", "To studies is hard."],
    reason: "to 뒤의 정답은 동사원형 \"study\"입니다."
  },
  "novice:27:2": {
    source: "Do you have a pen to use?",
    choices: [
      "Do you have a pen to use?", "Do you have a pen to using?",
      "Do you have a pen to used?", "Do you have a pen to uses?"
    ],
    reason: "to 뒤의 정답은 동사원형 \"use\"입니다."
  },
  "novice:27:3": {
    source: "He is at the bus stop to get on the bus.",
    choices: [
      "He is at the bus stop to get on the bus.",
      "He is at the bus stop to got on the bus.",
      "He is at the bus stop to gets on the bus.",
      "He is at the bus stop to getting on the bus."
    ],
    reason: "to 뒤의 정답은 동사원형 \"get\"입니다."
  },
  "novice:27:4": {
    source: "I have many things to do.",
    choices: [
      "I have many things to do.", "I have many things to doing.",
      "I have many things to did.", "I have many things to does."
    ],
    reason: "to 뒤의 정답은 동사원형 \"do\"입니다."
  },
  "novice:29:3": {
    source: "I saw him running.",
    choices: ["O", "X"],
    reason: "\"see + 목적어 + -ing\"는 목적어가 동작 중인 장면을 본 것을 나타내므로 \"saw him running\"이 \"그가 달리는 것을 봤어요\"에 맞습니다."
  },
  "novice:29:2": {
    source: "I heard you snoring.",
    choices: [
      "I heard you snoring.", "I heard you talking.",
      "I heard you singing.", "I heard you crying."
    ],
    reason: "\"see/hear + 목적어 + -ing\"에서 -ing형은 목적어가 하는 동작을 나타냅니다. 여기서는 \"코를 고는 것\"을 들었으므로 \"talking\", \"singing\", \"crying\"이 아니라 \"snoring\"이 맞습니다."
  },
  "novice:29:4": {
    source: "I keep studying English.",
    choices: [
      "I keep studying English.", "I keep studying Korean.",
      "I keep studying math.", "I keep studying science."
    ],
    reason: "제시된 한국어 뜻과 문맥에 맞는 표현은 \"English\"입니다."
  },
  "novice:31:1": {
    source: "It's difficult for you to learn Japanese.",
    choices: [
      "It's difficult for you to learn Japanese.",
      "It's easy for you to learn Japanese.",
      "It's difficult for me to learn Japanese.",
      "It's difficult for you to learn Korean."
    ],
    reason: "어렵다는 뜻의 \"difficult\", 행동 주체인 \"for you\", 학습 대상인 \"Japanese\"가 모두 제시된 뜻과 일치해야 합니다."
  },
  "novice:31:3": {
    source: "It's important for me to make money.",
    choices: ["O", "X"],
    reason: "\"for me\"는 행동 주체가 나임을 나타내고 \"to make money\"는 돈을 버는 행동을 나타내므로 제시된 뜻과 일치합니다."
  },
  "novice:31:0": {
    source: "It's difficult not to be late.",
    choices: [
      "It's difficult not to be late.", "It's difficult not to am late.",
      "It's difficult not to is late.", "It's difficult not to being late."
    ],
    reason: "to 뒤의 정답은 동사원형 \"be\"입니다."
  },
  "novice:31:2": {
    source: "It's difficult for you to learn Japanese.",
    choices: [
      "It's difficult for you to learn Japanese.",
      "It's difficult for you to learned Japanese.",
      "It's difficult for you to learns Japanese.",
      "It's difficult for you to learning Japanese."
    ],
    reason: "to 뒤의 정답은 동사원형 \"learn\"입니다."
  },
  "novice:31:4": {
    source: "It's nice to go home.",
    choices: [
      "It's nice to go home.", "It's nice to going home.",
      "It's nice to went home.", "It's nice to goes home."
    ],
    reason: "to 뒤의 정답은 동사원형 \"go\"입니다."
  }
} as const;

function getOverride(key: string) {
  const [level, day] = key.split(":") as [WctStandardLevel, string];
  const found = STANDARD_WCT_DAY_OVERRIDES.find((override) => (
    override.level === level && override.dayNumber === Number(day)
  ));
  if (!found) throw new Error(`Missing editorial override: ${key}`);
  return found;
}

function pair(candidate: WctStandardQuestionCandidate): Pair {
  return [candidate.provenance.patternId, candidate.provenance.exampleId];
}

function answer(candidate: WctStandardQuestionCandidate) {
  return candidate.question.choices.find((choice) => (
    choice.id === candidate.question.correctChoiceId
  ))?.text;
}

function reconstructedChoices(candidate: WctStandardQuestionCandidate) {
  const blank = candidate.provenance.blankSpan;
  return candidate.question.choices.map((choice) => blank
    ? `${candidate.provenance.sourceSentence.slice(0, blank.start)}${choice.text}${candidate.provenance.sourceSentence.slice(blank.end)}`
    : choice.text);
}

function target(candidate: WctStandardQuestionCandidate) {
  return (candidate.provenance.statementMutation
    ?? candidate.provenance.choiceEvidence.find((evidence) => evidence.mutation)?.mutation
  )?.changedFrom ?? "<exact-source>";
}

function sourceEntry(
  [patternId, exampleId]: Pair,
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

describe("WCT v2 round-six editorial contracts", () => {
  it("pins every changed full Day to the reviewed source pairs, layout, kind mix, and truth state", () => {
    for (const [key, contract] of Object.entries(layoutContracts)) {
      const override = getOverride(key);
      const trueFalse = override.questions.find((candidate) => (
        candidate.question.format === "true_false"
      ));

      expect(override.expectedSourceHash, key).toBe(contract.sourceHash);
      expect(override.questions.map(pair), key).toEqual(contract.pairs);
      expect(override.questions.map((candidate) => candidate.question.format), key)
        .toEqual(contract.formats);
      expect(override.questions.map((candidate) => candidate.question.kind), key)
        .toEqual(contract.kinds);
      expect(trueFalse && answer(trueFalse), key).toBe(contract.state);
      expect(override.questions.every(auditStandardQuestionCandidate), key).toBe(true);
      expect(hasUniqueStandardLearningTargets(override.questions), key).toBe(true);
    }
  });

  it("pins every changed question to the reviewed source, choices, and concrete feedback", () => {
    for (const [key, contract] of Object.entries(changedQuestionContracts)) {
      const [level, day, slot] = key.split(":");
      const candidate = getOverride(`${level}:${day}`).questions[Number(slot)];

      expect(candidate.provenance.sourceSentence, key).toBe(contract.source);
      expect([...reconstructedChoices(candidate)].sort(), key)
        .toEqual([...contract.choices].sort());
      expect(candidate.question.explanation, key).toBe(contract.reason);
      expect(candidate.question.feedback.reason, key).toBe(contract.reason);
      if ("statement" in contract) {
        expect(candidate.provenance.statementMutation?.text, key).toBe(contract.statement);
      }
      const mutations = [
        ...(candidate.provenance.statementMutation
          ? [candidate.provenance.statementMutation]
          : []),
        ...candidate.provenance.choiceEvidence.flatMap((evidence) => (
          evidence.mutation ? [evidence.mutation] : []
        ))
      ];
      expect(mutations.every((mutation) => mutation.reason === contract.reason), key)
        .toBe(true);
    }
  });

  it("uses exact source-pair feedback overrides only for the three generated O questions", () => {
    const contracts = [{
      entry: sourceEntry(
        ["4ef3d83d-d1c6-4e41-9a77-643c0197d4b3", "f7649c55-5003-4c62-a68e-261c8fa1b273"],
        "주어 + am/is/are not ... / Am/Is/Are + 주어 ...?",
        "상태의 부정문과 의문문",
        "Is it important?",
        "그것은 중요한가요?"
      ),
      kind: "translation" as const,
      reason: "\"Is it important?\"는 be동사 \"Is\"를 주어 \"it\" 앞에 둔 현재형 의문문이므로 맞습니다."
    }, {
      entry: sourceEntry(
        ["df68ffde-c8da-4d4b-8a02-7f7544d95f9a", "58976272-95cf-4afe-be36-9d54318f5336"],
        "동사원형 / Don't + 동사원형",
        "명령문과 부정 명령문",
        "Work.",
        "일해."
      ),
      kind: "pattern" as const,
      reason: "\"Work.\"는 주어 없이 동사원형 \"Work\"로 시작한 긍정 명령문이므로 맞습니다."
    }, {
      entry: sourceEntry(
        ["8f09acbf-d7ab-4766-a272-cbdf0df7b749", "d227f812-0231-4093-aaf3-7c366ab4729b"],
        "be + -ing",
        "현재·과거 진행형",
        "Were you walking?",
        "걷고 있었나요?"
      ),
      kind: "translation" as const,
      reason: "\"Were you walking?\"은 \"Were + 주어 + -ing\" 형태의 과거진행 의문문이며, \"걷고 있었나요?\"라는 뜻과 일치합니다."
    }];

    for (const contract of contracts) {
      const candidate = buildTrueFalseCandidate(contract.entry, "O", contract.kind);
      expect(candidate?.question.explanation).toBe(contract.reason);
      expect(candidate?.question.feedback.reason).toBe(contract.reason);

      const sibling = buildTrueFalseCandidate({
        ...contract.entry,
        exampleId: `${contract.entry.exampleId}-sibling`
      }, "O", contract.kind);
      expect(sibling?.question.explanation).toBe("문장이 학습한 패턴과 예문에 맞습니다.");
    }
  });

  it("preserves the reviewed automatic mutation evidence in the newly pinned late Days", () => {
    const expected = {
      "novice:27:0": ["infinitive_form", 3, 8, "study"],
      "novice:27:2": ["infinitive_form", 21, 24, "use"],
      "novice:27:3": ["infinitive_form", 25, 28, "get"],
      "novice:27:4": ["infinitive_form", 22, 24, "do"],
      "novice:31:0": ["infinitive_form", 22, 24, "be"],
      "novice:31:2": ["infinitive_form", 26, 31, "learn"],
      "novice:31:4": ["infinitive_form", 13, 15, "go"]
    } as const;

    for (const [key, contract] of Object.entries(expected)) {
      const [level, day, slot] = key.split(":");
      const candidate = getOverride(`${level}:${day}`).questions[Number(slot)];
      const mutations = candidate.provenance.choiceEvidence.flatMap((evidence) => (
        evidence.mutation ? [evidence.mutation] : []
      ));
      expect(mutations, key).toHaveLength(3);
      expect(mutations.map((mutation) => [
        mutation.ruleFamily,
        mutation.start,
        mutation.end,
        mutation.changedFrom
      ]), key).toEqual([contract, contract, contract]);
    }
  });

  it("keeps every reviewed exact-O source identity unique within its Day", () => {
    for (const [key, contract] of Object.entries(layoutContracts)) {
      if (contract.state !== "O") continue;
      const override = getOverride(key);
      const exactO = override.questions.find((candidate) => (
        candidate.question.format === "true_false"
      ));
      if (!exactO) throw new Error(`Missing true-false question: ${key}`);
      expect(override.questions.filter((candidate) => (
        candidate.provenance.patternId === exactO.provenance.patternId
        && candidate.provenance.exampleId === exactO.provenance.exampleId
      )), key).toHaveLength(1);
    }
  });

  it("removes the rejected duplicate source-target contracts", () => {
    const rejected = [
      ["prenovice:1", "61e93054-d36f-4417-9e91-326e1d55d2b4", "ed041f33-cdbf-4dda-81bf-effea3518007", "like"],
      ["prenovice:5", "1879befe-3ee5-44b5-b8ef-0e7aee2411cd", "15900358-0be1-4a95-a8c7-f0034ffa1a5e", "You were a fool."],
      ["prenovice:5", "1879befe-3ee5-44b5-b8ef-0e7aee2411cd", "d0b529a9-c93a-48fa-94d0-aa29de941871", "were"],
      ["prenovice:6", "51f12379-6dc0-4de3-805b-58d86890945f", "b4170d7f-d403-4b0a-8b4e-ab2bf09046a9", "have"],
      ["prenovice:8", "0d8ae6f7-3cee-4103-8d3a-6190f4a6477b", "963d48fa-62c1-4565-a4e5-33b41e9039e8", "wasn't"],
      ["prenovice:13", "a1940b2f-5966-4df7-b74f-19c902a7c8ef", "b76fbdc4-3569-4c80-b9dd-567f77e137b4", "take"],
      ["prenovice:13", "2ff0da88-7228-4fcd-a1f9-51d69cd600a3", "8cb0fe19-b124-4e93-9bfa-aa3b0d5a1d77", "help"],
      ["prenovice:14", "3550431e-1300-429e-81ed-e5d1fd3b8cbd", "23e00836-1dd6-48d3-810f-ec30400f1faa", "talk"],
      ["prenovice:14", "a26f53b4-0b35-464c-a58d-bf57f85b1609", "5e821d8d-eb4d-40c1-96f1-e8f6b4fb949f", "be"],
      ["prenovice:16", "08445842-cd37-474d-abeb-7358a98fb6b2", "e1e05f24-05e2-41ef-a77c-b931f2acddf2", "be"],
      ["prenovice:16", "1c076e02-a070-4881-8ef5-795442185a20", "03d9057b-cf77-429c-816f-81396f88f7aa", "study"],
      ["novice:8", "aa20cf36-a8ee-4683-b841-014c31a8c7d4", "0ee23aac-5d44-4239-ab9d-79612ade9795", "happened"],
      ["novice:8", "aa20cf36-a8ee-4683-b841-014c31a8c7d4", "b82d7c24-8937-4b12-830f-05bc19ede618", "<exact-source>"],
      ["novice:15", "9b5e0d86-b351-4273-90e3-05feb8962a88", "85fa5142-ae97-473b-8728-78c69c9381fb", "<exact-source>"],
      ["novice:16", "b4377bbe-d08e-4d93-bae7-d6a9cd1b1abd", "61d8c02c-1981-4c38-ba6f-d1f24a9e1b8b", "<exact-source>"],
      ["novice:19", "f1d47746-f26e-418a-82d7-8ca073e21c49", "7d28ae9a-40a0-4e29-a32d-5332c43683c8", "clothes"],
      ["novice:17", "5d1c6eb4-f0ae-4b09-afa9-653901820779", "dc050e31-1e4f-436c-95a2-3b65b3e1ed4a", "<exact-source>"],
      ["novice:17", "5d1c6eb4-f0ae-4b09-afa9-653901820779", "b34c7941-5127-4727-83e0-bd027923c852", "on the desk"],
      ["novice:17", "5d1c6eb4-f0ae-4b09-afa9-653901820779", "6e856eaf-8636-45a0-847a-176cfc27df8b", "had coffee"],
      ["novice:23", "384e773c-d04b-43ad-beaa-55bdda9e7c7c", "94df2fb0-3de6-4d0e-85c3-84e71f221473", "A tree"],
      ["novice:23", "384e773c-d04b-43ad-beaa-55bdda9e7c7c", "9ed4a838-e66d-43af-b9d0-e866d16a38db", "on the left side of"],
      ["novice:23", "86656cd9-be99-4566-8abe-9283082f7e66", "72372809-ee2b-47e0-a5d0-576b9cd752ad", "<exact-source>"],
      ["novice:29", "07972de5-3d42-445a-aed4-7d55d925bd8f", "285796ea-5f3e-466a-b4d2-6506914e521c", "<exact-source>"],
      ["novice:31", "30409927-3c74-4306-b9bb-0743acdf7e55", "caa4aabe-77a7-47b5-8b4f-6b9c2b049490", "make"],
      ["novice:31", "30409927-3c74-4306-b9bb-0743acdf7e55", "d15e6862-9896-4910-88d9-fffdb207a22a", "<exact-source>"]
    ] as const;

    for (const [key, patternId, exampleId, oldTarget] of rejected) {
      const remains = getOverride(key).questions.some((candidate) => (
        candidate.provenance.patternId === patternId
        && candidate.provenance.exampleId === exampleId
        && target(candidate) === oldTarget
      ));
      expect(remains, `${key}:${patternId}:${exampleId}:${oldTarget}`).toBe(false);
    }
  });
});
