[![CI](https://github.com/snslim/billo-billo-web/actions/workflows/ci.yml/badge.svg)](https://github.com/snslim/billo-billo-web/actions/workflows/ci.yml)

<p align="center">
  <img width="640" height="400" alt="Image" src="https://github.com/user-attachments/assets/ba32e141-536e-462b-88d6-f3c2c5e734bb" />
</p>

<br>

<p align="center">
  세금계산서의 유효성을 검증하고 실제 법률 조항 기반으로 매입세액 공제 여부 및 신고 가이드를 제공하는 AI 세무 자문 서비스입니다.
</p>

<br>

# 📖 CONTENTS

- [💥 Motivation](#-motivation)
- [🛠 Tech Stacks](#-tech-stacks)
- [🎯 Features](#-features)
- [🏔 Challenges](#-challenges)
  - [1. 세금계산서 이미지에서 필요적 기재사항 추출](#1-세금계산서-이미지에서-필요적-기재사항-추출)
    - [1) 문제 정의: 왜 세금계산서 OCR이 어려운가?](#1-문제-정의-왜-세금계산서-ocr이-어려운가)
    - [2) 해결 전략: 텍스트 기반 파싱](#2-해결-전략-텍스트-기반-파싱)
    - [3) 정규식 로직 최적화](#3-정규식-로직-최적화)
  - [2. RAG 기반 법률 자문 시스템 구축](#2-rag-기반-법률-자문-시스템-구축)
    - [1) 세법 지식 베이스 구축](#1-세법-지식-베이스-구축)
    - [2) 벡터 검색 시스템 구현](#2-벡터-검색-시스템-구현)
    - [3) 역할 기반 가중치 시스템](#3-역할-기반-가중치-시스템)
    - [4) 동적 쿼리 생성](#4-동적-쿼리-생성)
    - [5) AI 프롬프트에 법률 근거 통합](#5-ai-프롬프트에-법률-근거-통합)
    - [6) 향후 개선 방향](#6-향후-개선-방향)
  - [3. 성능 최적화 및 확장성 개선](#3-성능-최적화-및-확장성-개선)
- [🗓 Schedule](#-schedule)
- [👥 Memoir](#-memoir)

<br>

# **💥 Motivation**

요즘은 홈택스로 전자세금계산서를 발행하고 신고합니다. 클릭 몇 번이면 끝입니다. 하지만 진짜 어려운 건 그 다음입니다.

공급자는 불안합니다. "공급받는자 번호 제대로 입력했나? 폐업자는 아닐까? 언제 신고하지?" 매입자는 더 큰 고민에 빠집니다. "이게 매입세액 공제 되나? 접대비라던데? 잘못하면 가산세 나온다던데..."

세법 지식이 없는 소상공인에게는 너무 어렵습니다. 세무사는 부담스럽고, ChatGPT는 내 세금계산서를 정확히 분석해주지 못합니다.

이 프로젝트는 홈택스와 다른 역할을 합니다. 홈택스는 발행과 신고를 담당하고, 우리는 세무 조언을 제공합니다. 세금계산서와 간단한 체크리스트를 입력하면, AI가 즉시 국세청 데이터베이스를 조회하고 법률 조항을 검색하여 명확하게 답합니다.

"공급자는 정상 사업자입니다", "신고 기한은 4월 25일까지입니다", "이 세금계산서는 접대비 관련 지출로 매입세액 공제가 불가능합니다 (부가가치세법 제39조)", "합계표 제출 시 불공제로 표시하세요. 가산세는 10%입니다".

세법 지식이 없어도, 세무사가 없어도, 더 나은 세무 판단을 내릴 수 있도록 돕습니다. 이것이 이 프로젝트의 목표입니다.

<br>

# **🛠 Tech Stacks**

### Frontend

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Backend

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Pino](https://img.shields.io/badge/pino-%23687634.svg?style=for-the-badge&logo=pino&logoColor=white) ![Helmet](https://img.shields.io/badge/helmet-%23FFFFFF.svg?style=for-the-badge&logo=helmet&logoColor=black)

### Testing

![Vitest](https://img.shields.io/badge/vitest-%236E9F18.svg?style=for-the-badge&logo=vitest&logoColor=white) ![Testing Library](https://img.shields.io/badge/testing%20library-%23E33332.svg?style=for-the-badge&logo=testinglibrary&logoColor=white) ![Supertest](https://img.shields.io/badge/supertest-%23E34F26.svg?style=for-the-badge)

### CI & Code Quality

![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white) ![ESLint](https://img.shields.io/badge/eslint-%234B32C3.svg?style=for-the-badge&logo=eslint&logoColor=white) ![Prettier](https://img.shields.io/badge/prettier-%23F7B93E.svg?style=for-the-badge&logo=prettier&logoColor=black) ![Husky](https://img.shields.io/badge/husky-%23161717.svg?style=for-the-badge)

### AI & External APIs

![Google Gemini](https://img.shields.io/badge/google%20gemini-%238E75B2.svg?style=for-the-badge&logo=googlegemini&logoColor=white) ![UPSTAGE](https://img.shields.io/badge/UPSTAGE%20Document%20AI-%23512BD4.svg?style=for-the-badge) ![국세청 API](https://img.shields.io/badge/국세청%20오픈%20API-%230066CC.svg?style=for-the-badge)

<br>

# **🎯 Features**

### 1. 역할 선택

<img width="1280" height="800" alt="Image" src="https://github.com/user-attachments/assets/6abfa1bf-42f9-4acd-a4d5-8fbeac0045e1" />

공급자 또는 공급받는자 역할을 선택하여 맞춤형 세무 조언을 받을 수 있습니다.

### 2. 세금계산서 업로드

<img width="1280" height="800" alt="Image" src="https://github.com/user-attachments/assets/7db37c6c-46c8-469c-a73f-af7935c02178" />

세금계산서 이미지를 업로드하여 검증 및 분석을 시작합니다.

### 3. 정보 추출 및 확인

<img width="1280" height="800" alt="Image" src="https://github.com/user-attachments/assets/ba494c4e-2784-467e-b66f-4af7fef5f337" />

세금계산서에서 필요적 기재사항을 자동으로 추출하고, 사용자가 확인 및 수정할 수 있습니다.

### 4. 국세청 DB 검증 및 체크리스트

추출된 정보를 검증합니다:
- 필요적 기재사항 5가지 항목 확인
- 상대방 사업자의 휴폐업 상태 조회

역할별 맞춤 체크리스트를 제공합니다 (공급자: 전송 기한, 매입자: 공제 요건 등).

### 5. RAG 기반 AI 세무 조언

실제 법률 조항을 검색하여 세무 조언을 제공합니다:
- 매입세액 공제 가능 여부 판단 (매입자)
- 신고 시 주의사항 안내 (공급자/매입자)
- 법률 근거와 함께 명확한 가이드 제시

<br>

# **🏔 Challenges**

<br>

## 1. 세금계산서 이미지에서 필요적 기재사항 추출

<br>

### 1) 문제 정의: 왜 세금계산서 OCR이 어려운가?

세금계산서는 단순한 문서가 아닙니다:

- **공급자/공급받는자 영역 구분**: 각 영역에 등록번호, 상호, 주소 등이 중첩되어 표시됨
- **암묵적인 항목 구조**: "등록번호: XXXXXXX" 형식이 아닌, 박스 안에 여러 항목이 혼재
- **세액 구분의 모호성**: 전체 세액 vs 항목별 세액이 명시 없이 표시됨
- **양식 다양성**: 구형/신형, 공급자 보관용/공급받는자 보관용에 따라 레이아웃 상이
- **수기 작성 케이스**: 전자 발행이 아닌 수기 작성 세금계산서 존재

**목표**: 15개 샘플에서 90% 이상 정확도

<br>

### 2) 해결 전략: 텍스트 기반 파싱

**OCR 엔진 기술 검증**

세금계산서 OCR을 위해 여러 엔진을 비교 검토했습니다:

| OCR 엔진 | 접근 방식 | 정확도 | 판정 | 사유 |
|---------|---------|--------|------|------|
| Tesseract | 오픈소스 OCR | 0% (0/15) | ✗ | 한국어/숫자 인식률 낮음 |
| Clova 템플릿 | 템플릿 기반 | 60% (9/15) | ✗ | 양식 고정 필요, 다양성 대응 불가 |
| Clova OCR + 정규식 | 좌표 기반 파싱 | 70% (10.5/15) | ✗ | 양식별 좌우 위치 상이 |
| Gemini Vision | LLM 직접 분석 | 97% (14.5/15) | ✗ | **개인정보 보안 리스크** |
| **UPSTAGE + 정규식** | **텍스트 기반 파싱** | **90% (13.5/15)** | **✓** | **양식 독립적, 보안 확보** |

**Gemini Vision API 포기 결정**

Gemini Vision API는 97%의 압도적인 정확도를 보였으나, 세금계산서에는 사업자번호, 상호, 주소 등 민감한 개인정보가 포함되어 있습니다. LLM 학습 데이터 사용 정책의 불투명성을 고려하여, 높은 정확도에도 불구하고 보안을 우선시하여 제외했습니다.

**좌표 기반 vs 텍스트 기반 파싱**

**좌표 기반 접근 (Clova OCR)**:
- 공급자(왼쪽)/공급받는자(오른쪽) 영역을 좌표로 구분
- 공급받는자 보관용 양식은 좌우 위치가 반대
- 구형/신형 양식은 레이아웃이 완전히 다름
- **결과**: 양식 다양성 대응 불가, 70% 정확도

**텍스트 기반 접근 (UPSTAGE)**:
- 양식 레이아웃에 의존하지 않고, 전체 텍스트에서 키워드와 패턴으로 추출
- 전체 텍스트를 하나의 문자열로 제공 → 정규식 기반 파싱에 최적
- **결과**: 같은 정규식 로직인데도 90% 정확도 달성

**UPSTAGE 선택의 트레이드오프**

| 요소 | 장점 | 단점 |
|------|------|------|
| 정확도 | 90% (목표 달성) | Gemini 97%보다는 낮음 |
| 보안 | 기업용 보안 정책 명확 | - |
| 비용 | 월 1,000건 무료 | 이후 유료 (프로토타입 충분) |
| 확장성 | API 안정적 | 대규모 사용 시 비용 증가 |

**결정**: 프로토타입 단계에서는 보안과 정확도의 균형을 우선, 향후 대규모 사용 시 비용 최적화 검토

<br>

### 3) 정규식 로직 최적화

텍스트 기반 파싱으로 전환 후에도, 각 필드별 특성에 맞는 정교한 정규식 로직이 필요했습니다.

**사업자등록번호 추출**

**문제**: OCR이 공백을 포함하여 인식하는 경우 발생
```
등록번호 1 2 3 - 4 5 - 6 7 8 9 0
```

**해결**:
- "등록번호" 키워드 뒤의 모든 숫자 추출
- 공백 제거 후 `XXX-XX-XXXXX` 형식 검증
- 체크섬(checksum) 알고리즘으로 유효성 재확인

**결과**: **100% 정확도**

**날짜 추출**

**문제**:
- 다양한 형식: `2015년 3월 3일`, `2015 3 3`, `2015.03.03`
- OCR 오인식: `2015 3 I` (숫자 1을 알파벳 I로 인식)

**해결**:
- 여러 날짜 패턴을 모두 매칭하는 정규식
- 알파벳 I, l, O를 숫자 1, 0으로 치환 후 검증
- `yyyy-MM-dd` 형식으로 정규화

**결과**: **100% 정확도**

**금액 추출**

**문제**: 세금계산서에 여러 금액 존재
- 품목별 금액
- 공급가액
- 세액
- 합계금액

**해결**:
- 콤마 포함 금액 패턴으로 모든 숫자 추출
- 내림차순 정렬하여 상위 3개 선택
- `합계 = 공급가액 + 세액` 공식으로 검증

**결과**: **100% 정확도**

**상호명 추출 (현재 한계)**

**시도한 방법**:
- 법인 형태 패턴 (`(주)`, `㈜`, `주식회사`)
- 비즈니스 키워드 기반 (`자동차`, `부품`, `기업`)

**한계**:
- 공급자 vs 공급받는자 구분 어려움
- 개인사업자 추출 실패 케이스 존재

**현재**: **83% 정확도** (향후 좌표 정보 활용 검토 중)

<br>

## 2. RAG 기반 법률 자문 시스템 구축

단순히 AI에게 세법을 물어보는 것이 아니라, 실제 법률 조항을 검색하여 정확한 근거를 제시하는 시스템을 구축하는 과정에서 여러 도전 과제가 있었습니다.

<br>

### 1) 세법 지식 베이스 구축

**초기 문제**

Gemini API에 단순히 "매입세액 공제 가능 여부를 알려줘"라고 요청하면 다음과 같은 문제가 발생했습니다:

| 문제 유형 | 구체적인 증상 | 영향 |
|-----------|--------------|------|
| **근거 부족** | "공제 가능합니다"라고만 답변 | 사용자가 신뢰하기 어려움 |
| **일반적 답변** | 상황별 세부 규정 누락 | 실질적 도움 부족 |
| **할루시네이션** | 존재하지 않는 법률 조항 인용 | 잘못된 정보 제공 위험 |

**해결: 법률 조항 데이터베이스 구축**

부가가치세법의 핵심 조항 9개를 직접 데이터베이스화했습니다. 각 조항은 ID, 출처, 내용을 포함하며, 필요적 기재사항(제32조), 공제 가능/불가능 매입세액(제38조, 제39조), 합계표 제출 의무(제54조), 가산세(제60조) 등을 포함합니다.

<br>

### 2) 벡터 검색 시스템 구현

**RAG 아키텍처**

모든 법률 조항을 AI에게 제공하면 응답 품질이 저하되고 토큰 비용이 증가합니다. 따라서 **상황에 맞는 법률 조항만 검색**하는 시스템을 구현했습니다.

```
사용자 질의 → 임베딩 변환 → 코사인 유사도 계산 → 상위 3개 법률 조항 선택 → AI 프롬프트에 포함
```

**구현 방식**

1. 쿼리와 모든 법률 조항을 Gemini Embedding API로 벡터화
2. 코사인 유사도를 계산하여 쿼리와 가장 관련 높은 법률 조항 선택
3. 유사도 순으로 정렬하여 상위 3개를 AI 프롬프트에 포함

<br>

### 3) 역할 기반 가중치 시스템

**문제 발견**

공급자와 공급받는자는 관심사가 다릅니다:
- **공급자**: 세금계산서 발급 시기, 발급 가산세
- **공급받는자**: 매입세액 공제 요건, 합계표 제출 의무

순수한 벡터 유사도만으로는 역할별로 중요한 법률 조항이 선택되지 않을 수 있습니다.

**해결: 역할 기반 가중치 부여**

매입자에게는 제38조(공제하는 매입세액), 제39조(공제받지 못하는 매입세액), 제54조(합계표 제출 의무)에 가중치를 추가했습니다. 공급자에게는 제32조(필요적 기재사항), 제60조(공급자 가산세)에 가중치를 부여했습니다.

<br>

### 4) 동적 쿼리 생성

**배경**

사용자의 상황에 따라 필요한 법률 조항이 달라집니다:
- 사업자 등록 전 매입 → 시행령 제75조 예외 규정
- 접대비 관련 지출 → 제39조 불공제 규정
- 합계표 제출 → 제54조 의무 규정

**구현: 상황별 쿼리 확장**

사용자의 체크리스트 응답과 검증 결과를 기반으로 쿼리를 동적으로 생성합니다. 예를 들어, 매입자가 "사업자 등록 전 매입"을 체크하면 "사업자 등록 전 매입세액 공제 예외 20일 이내 역산"을 쿼리에 추가하여, 관련 법률 조항을 검색합니다.

<br>

### 5) AI 프롬프트에 법률 근거 통합

**최종 프롬프트 구조**

검색된 법률 조항, 세금계산서 데이터, 시스템 검증 결과, 사용자 체크리스트 응답을 모두 AI 프롬프트에 포함시켰습니다. 특히 "RAG Context에 있는 법률 조항을 명시적으로 인용하라"는 제약 조건을 추가하여, AI가 법률 근거를 명확히 제시하도록 했습니다.

**결과**

AI는 검색된 법률 조항을 기반으로 정확한 조언을 제공하며, 조항 번호를 명시하여 신뢰성을 높입니다.

**응답 예시**

> "부가가치세법 제39조에 따라 접대비 관련 매입세액은 공제받을 수 없습니다. 또한 제54조에 따라 매입처별 세금계산서 합계표를 제출하지 않으면 매입세액 공제가 불가능하며, 공급가액의 0.5% 가산세가 부과됩니다."

<br>

### 6) 향후 개선 방향

현재 핵심 법률 조항 9개로 RAG 시스템을 구축했으나, 실무에서는 더욱 광범위한 법률 지식이 필요합니다. 향후 법률 조항 대량 확장(50~100개 이상, 시행령/시행규칙/예규 포함), PostgreSQL + pgvector 기반 벡터 DB 구축, Hybrid Search(벡터 + 키워드) 적용 등을 통해 검색 정확도를 개선할 계획입니다.

<br>

## 3. 성능 최적화 및 확장성 개선

프로토타입 단계에서 기능 구현에 집중하면서 발생한 성능 이슈를 파악했습니다. 향후 OCR 처리 속도 개선, AI 응답 시간 단축, 다수 사용자 동시 처리 등의 최적화를 통해 실제 서비스 수준으로 개선할 계획입니다.

<br>

# **🗓 Schedule**

**프로젝트 기간**: 2026.01.26 ~

<details>
<summary><b>1주차 (1/26 ~ 2/1): 기획 및 설계</b></summary>

- 아이디어 구체화 및 기능 정의
- 기술 스택 선정 (React, Express, TypeScript)
- UI/UX 설계 (5단계 워크플로우)
- API 명세서 작성

</details>

<details>
<summary><b>2주차 (2/2 ~ 2/8): MVP 구현</b></summary>

- 모노레포 구조 설정 (npm workspaces)
- Frontend 5단계 컴포넌트 구현 (역할 선택 → 업로드 → 추출 → 검증 → AI 자문)
- Backend REST API 구현 (OCR, 국세청 조회, AI 자문 엔드포인트)
- UPSTAGE OCR 연동 및 정규식 기반 세금계산서 파싱
- Gemini Embedding + RAG 기반 법률 자문 시스템 구축
- Vitest + Testing Library / Supertest 기반 테스트 작성

</details>

<details>
<summary><b>3주차 (3/5 ~ 3/11): 고도화</b></summary>

- 백엔드 아키텍처 재설계 (서비스 레이어, 미들웨어, 에러 핸들링 분리)
- 프론트엔드 상태 관리 전환 (useReducer + Context)
- RAG 시스템 강화 (법조문 9개→25개, 키워드 + RRF 하이브리드 검색, 임베딩 캐싱)
- 보안 강화 (Helmet, CORS, Rate Limiting, 개인정보 마스킹)
- CI 및 코드 품질 (GitHub Actions, ESLint, Prettier, Husky)
- 구조화 로깅 (Pino + AsyncLocalStorage 기반 요청 추적)
- 외부 API 리질리언스 (fetchWithRetry 지수 백오프)
- 데모 모드 구현 (4개 시나리오)
- Feature 기반 디렉토리 구조 전환

</details>

<br>

# **👥 Memoir**

7년간 회계사 시험을 준비하며 쌓은 도메인 지식을 기술로 풀어내고 싶어 개발자로 전환했습니다.

첫 프로젝트로 세무 자동화를 선택했습니다. 다양한 세금계산서 양식에서 정확한 항목을 추출하는 OCR 파싱과 RAG 기반 법률 자문 시스템을 구축하며, 도메인 지식이 강력한 무기가 될 수 있음을 경험했습니다. 법률 자문의 민감성을 고려해 매 단계를 신중하게 설계했지만, 복잡한 문제를 기술로 풀어가는 여정은 즐거웠습니다.

MVP 완성 이후에도 백엔드 아키텍처 재설계, 테스트 작성, CI/CD 구축 등 실무 수준의 코드 품질을 갖추기 위한 개선을 계속했습니다. "돌아가는 코드"를 넘어 "유지보수할 수 있는 코드"를 고민하는 과정에서 엔지니어로서의 기초 체력을 쌓을 수 있었습니다.

앞으로는 도메인 전문성과 기술을 결합하여, 다양한 분야에서 실질적인 문제를 해결하는 개발자로 성장하고 싶습니다.
