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
- [🏗 Architecture](#-architecture)
- [🎯 Features](#-features)
- [🏔 Challenges](#-challenges)
  - [1. 세금계산서 이미지에서 필요적 기재사항 추출](#1-세금계산서-이미지에서-필요적-기재사항-추출)
    - [1) 문제 정의](#1-문제-정의)
    - [2) OCR 엔진 선택](#2-ocr-엔진-선택)
    - [3) 필드별 추출 로직](#3-필드별-추출-로직)
  - [2. RAG 기반 법률 자문 시스템 구축](#2-rag-기반-법률-자문-시스템-구축)
    - [1) 세법 지식 베이스 구축](#1-세법-지식-베이스-구축)
    - [2) 검색 시스템 설계: 벡터에서 하이브리드로](#2-검색-시스템-설계-벡터에서-하이브리드로)
    - [3) 역할 기반 가중치](#3-역할-기반-가중치)
    - [4) 동적 쿼리 생성](#4-동적-쿼리-생성)
    - [5) 프롬프트 설계](#5-프롬프트-설계)
    - [6) 향후 개선 방향](#6-향후-개선-방향)
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

# **🏗 Architecture**

<br>

### 모노레포 구조

npm workspaces 기반 모노레포로 Frontend와 Backend를 단일 저장소에서 관리합니다.

```
billo-billo-web/
├── packages/
│   ├── frontend/                  # React 19 + TypeScript
│   │   └── src/
│   │       ├── features/          # 기능별 모듈
│   │       │   ├── advisory/      #   AI 세무 자문
│   │       │   ├── extraction/    #   OCR 결과 확인
│   │       │   ├── role-selection/#   역할 선택
│   │       │   ├── upload/        #   파일 업로드 + 데모
│   │       │   └── validation/    #   검증 + 체크리스트
│   │       ├── store/             # useReducer 상태 관리
│   │       ├── components/        # 공통 UI 컴포넌트
│   │       └── utils/             # 포맷팅 유틸리티
│   └── backend/                   # Express + TypeScript
│       └── src/
│           ├── routes/            # API 엔드포인트 (OCR, 검증, AI, 헬스체크)
│           ├── services/          # 외부 API 연동 (Gemini, NTS, Upstage)
│           ├── middlewares/       # 보안, 로깅, 에러 처리, Rate Limiting
│           └── utils/             # AppError, 재시도, 로거
├── .github/workflows/             # CI 파이프라인
└── package.json                   # 워크스페이스 루트
```

<br>

### 시스템 흐름

Frontend에서 5단계 워크플로우를 진행하며, 각 단계에서 Backend API를 호출합니다.

| 단계 | Frontend | Backend API | External API |
|------|----------|-------------|--------------|
| 1. 역할 선택 | 공급자/매입자 선택 | — | — |
| 2. 업로드 | 이미지 업로드 + 미리보기 | `/api/ocr` | UPSTAGE Document AI |
| 3. 추출 확인 | 신뢰도 표시 + 수동 수정 | — | — |
| 4. 검증 | 결과 표시 + 체크리스트 | `/api/validate` | 국세청 사업자 조회 |
| 5. AI 자문 | 법률 근거 기반 조언 표시 | `/api/ai` | Gemini Embedding + LLM |

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

### 1) 문제 정의

세금계산서는 공급자/공급받는자 영역이 중첩되고, 양식(구형/신형, 보관용 구분)마다 레이아웃이 다르며, 라벨 없이 박스 안에 값이 혼재합니다. **목표는 15개 샘플에서 90% 이상 정확도**입니다.

<br>

### 2) OCR 엔진 선택

5개 엔진을 15개 샘플로 비교했습니다.

| OCR 엔진 | 접근 방식 | 정확도 | 판정 | 사유 |
|---------|---------|--------|------|------|
| Tesseract | 오픈소스 OCR | 0% (0/15) | ✗ | 한국어/숫자 인식률 낮음 |
| Clova 템플릿 | 템플릿 기반 | 60% (9/15) | ✗ | 양식 고정 필요, 다양성 대응 불가 |
| Clova OCR + 정규식 | 좌표 기반 파싱 | 70% (10.5/15) | ✗ | 양식별 좌우 위치 상이 |
| Gemini Vision | LLM 직접 분석 | 97% (14.5/15) | ✗ | **개인정보 보안 리스크** |
| **UPSTAGE + 정규식** | **텍스트 기반 파싱** | **90% (13.5/15)** | **✓** | **양식 독립적, 보안 확보** |

Gemini Vision이 97%로 가장 높았지만, 세금계산서에는 사업자번호·상호·주소 등 민감 정보가 포함되어 있어 보안을 우선시했습니다. 좌표 기반 파싱(Clova OCR)은 양식마다 공급자/공급받는자 좌우 위치가 달라 70%에 그쳤습니다. UPSTAGE는 전체 텍스트를 하나의 문자열로 제공하므로 레이아웃에 의존하지 않는 텍스트 기반 파싱이 가능했고, 동일 정규식으로 90% 정확도를 달성했습니다.

<br>

### 3) 필드별 추출 로직

세금계산서에서 5개 필드를 추출합니다. 각 필드는 OCR 특성에 맞는 개별 전략이 필요했습니다.

**등록번호·날짜·금액** — 패턴이 명확한 필드입니다.

| 필드 | 전략 | 핵심 로직 |
|------|------|----------|
| 사업자등록번호 | 표준 형식 우선 → 키워드 폴백 | `XXX-XX-XXXXX` 직접 매칭, 실패 시 "등록번호" 뒤 숫자 추출·공백 제거 후 포매팅 |
| 작성일자 | 다중 패턴 순차 매칭 | `YYYY년 MM월 DD일`, `YYYY.MM.DD` 등 4개 패턴, OCR 오인식 치환(`I`→`1`) |
| 금액 | 교차 검증 + 역산 | 콤마 포함 금액 전부 추출 → `합계 = 공급가액 + 세액` 검증, 부족 시 10% 세율 역산 |

**상호명** — 가장 난도가 높은 필드입니다. 세금계산서에는 상호를 식별할 수 있는 일관된 패턴이 없습니다. 3단계 폴백을 적용했습니다:

1. "상호:" 레이블이 있으면 같은 줄 또는 다음 줄에서 값을 추출
2. 법인 형태 패턴(`(주)`, `㈜`, `주식회사`)으로 매칭
3. 비즈니스 키워드(`상사`, `산업`, `무역` 등)로 탐색

공급자/공급받는자 구분과 개인사업자 케이스에서 한계가 있어 향후 좌표 정보 활용을 검토 중입니다.

**문서 유형** — 텍스트에서 키워드를 탐지하여 일반·영세율·면세 계산서를 자동 분류합니다.

**신뢰도 시스템** — 각 필드에는 추출 방식에 따라 **신뢰도(high/medium/low/missing)** 를 부여합니다. 예를 들어, `XXX-XX-XXXXX` 형식으로 직접 매칭된 등록번호는 high, "등록번호" 키워드 기반 추출은 medium입니다. 사용자는 신뢰도가 낮은 항목을 즉시 파악하고 수동으로 확인·수정할 수 있습니다.

<br>

## 2. RAG 기반 법률 자문 시스템 구축

AI가 법률 근거 없이 답변하면 신뢰할 수 없습니다. 실제 법률 조항을 검색하여 근거와 함께 제시하는 RAG 시스템을 구축했습니다.

<br>

### 1) 세법 지식 베이스 구축

**문제** — Gemini API에 직접 질의하면 근거 없이 답변하거나, 존재하지 않는 조항을 인용합니다. AI에게 참조할 "정답지"를 제공해야 했습니다.

**해결** — 핵심 조항 9개로 시작했으나, 테스트에서 시행령 세부 규정이 필요한 질의를 커버하지 못했습니다. 시행령(제68조 전송기한, 제75조 등록 전 매입 예외), 세부 가산세 규정, 영세율·겸업·대손까지 **25개 조항으로 확장**하고, 각 조항에 키워드 태그·역할별 가중치·카테고리를 부여했습니다.

<br>

### 2) 검색 시스템 설계: 벡터에서 하이브리드로

25개 조항을 모두 프롬프트에 넣으면 노이즈가 됩니다. 질의에 맞는 조항만 선별하는 검색이 필요했습니다.

**벡터 검색**으로 시작했습니다. Gemini Embedding API로 벡터화 후 코사인 유사도로 상위 3개를 선택합니다. 의미적 유사도는 잘 잡지만, "제39조 불공제"처럼 특정 조항을 직접 참조하는 질의에서 다른 조항이 먼저 올라오는 한계가 있었습니다.

**키워드 검색**을 추가하여 태그·출처·내용에 대한 정확 매칭으로 보완했습니다. 두 결과의 점수 스케일이 다르므로 단순 합산 대신 순위 기반 **RRF(Reciprocal Rank Fusion)** 로 통합했습니다. 임베딩 API 장애 시에는 키워드 검색만으로 fallback합니다.

법률 조항은 변경되지 않으므로 임베딩을 **캐싱**하여, 이후 요청에서는 쿼리 임베딩만 새로 생성합니다.

<br>

### 3) 역할 기반 가중치

공급자는 발급 시기·가산세에, 매입자는 공제 요건·합계표 제출에 관심이 있습니다. 동일한 질의라도 역할에 따라 우선적으로 검색되어야 하는 조항이 다릅니다. 각 조항에 역할별 가중치를 부여하여, 매입자 질의 시 제38조(공제 매입세액)·제39조(불공제 매입세액)·제54조(합계표 제출)가, 공급자 질의 시 제32조(기재사항)·제60조(발급 가산세)가 상위에 올라오도록 했습니다.

<br>

### 4) 동적 쿼리 생성

사용자의 체크리스트 응답과 검증 결과를 기반으로 쿼리를 동적으로 확장합니다. 매입자가 "사업자 등록 전 매입"을 체크하면 시행령 제75조 관련 키워드가, "접대비 관련 지출"을 체크하면 제39조 불공제 키워드가 추가됩니다. 검증 단계에서 발견된 오류(기재사항 불일치, 휴폐업 등)도 쿼리에 반영되어, 사용자의 구체적 상황에 맞는 법률 조항이 검색됩니다.

<br>

### 5) 프롬프트 설계

검색된 법률 조항, 세금계산서 데이터, 검증 결과, 체크리스트 응답을 프롬프트에 통합했습니다. 세금계산서에 포함된 사업자번호·상호 등 개인정보는 마스킹 처리 후 전달합니다.

핵심 제약 조건으로 "RAG Context의 조항을 조문 번호와 함께 명시적으로 인용하라"를 부여했습니다. 또한 역할별로 반드시 포함해야 하는 경고 사항(매입자: 합계표 제출 의무, 공급자: 전자세금계산서 전송 기한)을 지정하여, AI가 실무적으로 중요한 항목을 누락하지 않도록 설계했습니다.

<br>

### 6) 향후 개선 방향

현재 25개 조항과 하이브리드 검색으로 핵심 시나리오를 커버합니다. 시행규칙·예규·판례까지 확장 시 PostgreSQL + pgvector 기반 벡터 DB 전환을 계획하고 있습니다.

<br>

# **🗓 Schedule**

**프로젝트 기간**: 2026.01.26 ~ (진행중)

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
