## 작업 내용

백엔드의 단일 파일 구조(server.ts 253줄)를 실무 수준의 계층형 아키텍처로 리팩토링합니다.
기존에는 환경 변수 로딩, Express 앱 설정, 미들웨어, 라우트 핸들러, 서비스 로직, 에러 처리가 모두 하나의 파일에 있어서 테스트·유지보수·확장이 어려웠습니다.
이번 PR에서 Express 표준 구조(app/server 분리, routes/services/middlewares/utils 계층화)를 도입하고, 구조화 로깅(pino)과 외부 API 재시도(fetchWithRetry)를 추가합니다.

### 변경 사항

- **app.ts / server.ts 분리**: server.ts는 dotenv 로딩과 환경 변수 검증 후 app.ts를 dynamic import하여 listen만 수행. app.ts는 미들웨어 등록과 라우터 마운트만 담당 (30줄)
- **미들웨어 분리**: errorHandler(multer 에러, AppError, 일반 에러 분기), upload(multer 설정), requestLogger(pino-http), rateLimiter(4개 limiter 중앙 관리) 추출
- **라우터 분리**: healthRoutes, ocrRoutes, validateRoutes, aiRoutes를 Express Router로 분리. 각 라우트는 입력 검증과 서비스 호출만 담당
- **서비스 레이어 분리**: upstageService(OCR), ntsService(국세청 조회), geminiService(임베딩+텍스트 생성)를 독립 모듈로 추출. HTTP 관심사와 비즈니스 로직 분리
- **pino 구조화 로거 도입**: JSON 포맷 로그 출력, 로그 레벨 관리(LOG_LEVEL 환경 변수), 테스트 시 silent 모드. pino-http로 요청별 자동 로깅 (health check 제외)
- **console.log/error 전면 교체**: 백엔드 전체 11개 console 호출을 pino logger로 전환
- **fetchWithRetry 구현**: 지수 백오프(baseDelayMs × 2^(attempt-1)), AbortController 타임아웃, retryable 상태 코드(408, 429, 500, 502, 503, 504) 분류, 최종 실패 시 마지막 response 반환
- **서비스별 재시도 전략**: Upstage OCR 3회, NTS 국세청 3회, Gemini 재시도 없음 + 30초 타임아웃
- **AppError + asyncHandler 패턴**: 라우트 catch 블록 6개 중복 제거. asyncHandler가 async 에러를 자동 catch하여 next(error) → errorHandler 일괄 처리
- **API 응답 인터페이스 정의**: NtsValidationResponse, GeminiEmbeddingResponse, GeminiGenerateResponse 정의. `Promise<unknown>` 제거
- **rate limiter 중앙화**: 4개 limiter를 middlewares/rateLimiter.ts 한 파일에서 관리. 라우트에서 express-rate-limit 직접 import 제거
- **AsyncLocalStorage requestId 전파**: 요청 컨텍스트 미들웨어로 requestId를 생성하고, pino mixin으로 서비스 레이어 로그에 자동 포함
- **OCR 이미지 전용 upload 분리**: upload(문서용: JPEG/PNG/PDF)와 imageUpload(OCR용: JPEG/PNG)를 분리하여 MIME 타입 불일치 해결

### 커밋 목록

| # | 커밋 | 설명 |
|---|------|------|
| 1 | `refactor: app.ts 분리 및 server.ts 경량화` | server.ts(253줄)에서 Express 앱 로직을 app.ts로 분리. server.ts는 env 검증 + listen만 (24줄) |
| 2 | `refactor: 에러 핸들러 미들웨어 분리` | multer 에러, 파일 형식 에러, 서버 에러 처리를 middlewares/errorHandler.ts로 추출 |
| 3 | `refactor: multer 업로드 미들웨어 분리` | multer 설정(memoryStorage, MIME 필터, 크기 제한)을 middlewares/upload.ts로 추출 |
| 4 | `refactor: 서비스 레이어 분리 및 에러 메시지 전달 개선` | upstageService, ntsService, geminiService 모듈화. catch 블록에서 서비스 에러 메시지를 클라이언트에 전달하도록 `error instanceof Error` 패턴 적용 |
| 5 | `refactor: 라우터 분리 및 app.ts 슬림화` | healthRoutes, ocrRoutes, validateRoutes, aiRoutes 4개 라우터 생성. app.ts는 미들웨어 + 라우터 등록만 담당 |
| 6 | `feat: pino 구조화 로거 및 requestId 미들웨어 추가` | pino 설치, logger.ts(테스트 silent), requestLogger.ts(pino-http, health 제외) |
| 7 | `refactor: console.log/error를 pino 구조화 로거로 전환` | 11개 console 호출을 logger.error/info/warn으로 교체. 구조화된 context 객체 전달 |
| 8 | `feat: fetchWithRetry 지수 백오프 유틸리티 구현` | retry.ts — 지수 백오프, 타임아웃, retryable 상태 코드, 마지막 response 반환 |
| 9 | `feat: 서비스 레이어에 fetchWithRetry 적용` | Upstage/NTS 3회 재시도, Gemini 1회 + 30초 타임아웃 |
| 10 | `test: fetchWithRetry 지수 백오프 단위 테스트 추가` | 7개 테스트 — 성공/실패/재시도/네트워크오류/maxAttempts=1/혼합 시나리오 |
| 11 | `feat: AppError 클래스 및 asyncHandler 유틸 추가` | AppError(statusCode, message), asyncHandler(.catch(next) 래퍼) |
| 12 | `refactor: errorHandler로 에러 처리 일원화 및 라우트 catch 블록 제거` | 라우트 6개 catch 블록 제거. AppError → statusCode 분기, 일반 Error → 500 |
| 13 | `refactor: NTS 및 Gemini API 응답 인터페이스 정의로 unknown 제거` | types.ts에 NtsValidationResponse, GeminiEmbeddingResponse, GeminiGenerateResponse 추가 |
| 14 | `refactor: rate limiter 설정을 middlewares로 중앙화` | middlewares/rateLimiter.ts에 4개 limiter 정의. 라우트에서 express-rate-limit import 제거 |
| 15 | `feat: AsyncLocalStorage로 requestId를 서비스 레이어까지 전파` | requestContext 미들웨어 + pino mixin으로 모든 로그에 requestId 자동 포함 |
| 16 | `fix: OCR 엔드포인트에 이미지 전용 upload 적용으로 MIME 타입 불일치 해결` | imageUpload(JPEG/PNG) 분리. OCR 라우트의 수동 MIME 체크 제거 |
| 17 | `refactor: 죽은 코드 제거 및 에러 처리 패턴 통일` | default export 삭제, 문자열 비교 에러 식별을 AppError instanceof로 교체, vi.hoisted 패턴 통일 |

---

## 상세 변경 내용

### 1. `refactor: app.ts 분리 및 server.ts 경량화`

**변경 파일**: `packages/backend/src/server.ts`, `packages/backend/src/app.ts` (신규), `packages/backend/src/server.test.ts`

기존 `server.ts` 253줄을 두 파일로 분리합니다. `server.ts`는 환경 설정(dotenv, 환경 변수 검증, listen)만, `app.ts`는 Express 앱(미들웨어, 라우트)만 담당합니다.

`dynamic import(await import('./app.js'))`를 사용하는 이유: dotenv가 `process.env`를 채운 후에 app.ts가 로드되어야 환경 변수를 참조하는 서비스 모듈이 올바른 값을 받습니다. 정적 import는 모듈 로딩 순서를 보장하지 않습니다.

테스트는 `app.ts`를 직접 import하여 `listen` 없이 supertest로 요청을 보냅니다. 서버 포트 충돌 없이 테스트가 가능합니다.

---

### 2. `refactor: 에러 핸들러 미들웨어 분리`

**변경 파일**: `packages/backend/src/middlewares/errorHandler.ts` (신규)

Express의 에러 처리 미들웨어(4개 인자: err, req, res, next)를 독립 파일로 추출합니다.

3단계 분기 처리:
1. `multer.MulterError` → 파일 크기 초과(400) / 기타 업로드 오류(400)
2. 파일 형식 오류(multer fileFilter에서 throw) → 400
3. 기타 → 500 + pino 로깅

---

### 3. `refactor: multer 업로드 미들웨어 분리`

**변경 파일**: `packages/backend/src/middlewares/upload.ts` (신규)

multer 설정(memoryStorage, 5MB 제한, JPEG/PNG/PDF 허용)을 독립 모듈로 추출합니다. 라우트에서는 `upload.single('file')`만 호출합니다.

---

### 4. `refactor: 서비스 레이어 분리 및 에러 메시지 전달 개선`

**변경 파일**: `packages/backend/src/services/upstageService.ts` (신규), `services/ntsService.ts` (신규), `services/geminiService.ts` (신규), `app.ts`

서비스 레이어를 분리하면 라우트는 HTTP 관심사(요청 파싱, 응답 포맷)만, 서비스는 외부 API 호출 로직만 담당합니다. 서비스를 독립적으로 mock/test할 수 있고, 다른 라우트에서 재사용할 수 있습니다.

catch 블록에서 `error instanceof Error ? error.message : '기본 메시지'` 패턴을 적용하여 서비스가 throw한 구체적 에러 메시지("OCR 처리 실패", "국세청 조회 실패")가 클라이언트까지 전달됩니다.

---

### 5. `refactor: 라우터 분리 및 app.ts 슬림화`

**변경 파일**: `packages/backend/src/routes/healthRoutes.ts` (신규), `routes/ocrRoutes.ts` (신규), `routes/validateRoutes.ts` (신규), `routes/aiRoutes.ts` (신규), `app.ts`

Express `Router()`를 사용하여 도메인별 라우트를 분리합니다. `app.use('/api', healthRoutes)`처럼 prefix를 마운트하므로, 라우터 내부에서는 `/health`, `/ocr` 등 상대 경로만 정의합니다.

app.ts는 미들웨어 등록(helmet, cors, json, requestLogger) + 라우터 마운트 + errorHandler 등록만 담당하여 30줄로 축소되었습니다.

---

### 6. `feat: pino 구조화 로거 및 requestId 미들웨어 추가`

**변경 파일**: `packages/backend/src/utils/logger.ts` (신규), `middlewares/requestLogger.ts` (신규), `app.ts`, `package.json`

pino는 Node.js에서 가장 빠른 구조화 로거입니다. JSON 포맷으로 출력하여 DataDog, ELK 등 모니터링 도구와 직접 연동할 수 있습니다.

`LOG_LEVEL` 환경 변수로 로그 레벨을 조절합니다 (기본 info). 테스트 환경(`NODE_ENV=test`)에서는 `silent`로 설정하여 테스트 출력을 깨끗하게 유지합니다.

`pino-http` 미들웨어는 모든 HTTP 요청에 고유한 requestId를 자동 부여하고, 요청/응답을 JSON으로 기록합니다. health check 엔드포인트는 `autoLogging.ignore`로 제외합니다.

---

### 7. `refactor: console.log/error를 pino 구조화 로거로 전환`

**변경 파일**: 8개 파일 (server.ts, errorHandler.ts, 3개 services, 3개 routes)

백엔드 전체 11개 `console.log/error` 호출을 `logger.info/error/warn`으로 교체합니다.

pino의 구조화 로깅 패턴: `logger.error({ status: response.status, body: errorBody }, 'UPSTAGE API 오류')` — 첫 번째 인자는 검색 가능한 JSON 필드, 두 번째 인자는 사람이 읽는 메시지입니다. `console.error`의 문자열 보간과 달리 필드별 검색/필터링이 가능합니다.

---

### 8. `feat: fetchWithRetry 지수 백오프 유틸리티 구현`

**변경 파일**: `packages/backend/src/utils/retry.ts` (신규)

외부 API 호출이 일시적 오류(네트워크 끊김, 503 등)로 실패할 때 자동으로 재시도하는 유틸리티입니다.

지수 백오프: `delay = baseDelayMs × 2^(attempt-1)` — 1초 → 2초 → 4초로 간격이 늘어납니다. 서버 과부하 상황에서 모든 클라이언트가 동시에 재시도하는 thundering herd 문제를 완화합니다.

`RETRYABLE_STATUS_CODES` Set으로 재시도 가능한 상태 코드(408, 429, 500, 502, 503, 504)를 정의합니다. 400, 401, 403 등 클라이언트 에러는 재시도해도 결과가 같으므로 즉시 반환합니다.

모든 재시도가 소진되면 마지막 response를 반환합니다(throw하지 않음). 이유: 서비스 레이어의 `if (!response.ok)` 분기가 에러 상세(status, body)를 읽고 적절한 에러 메시지를 생성할 수 있게 합니다.

AbortController로 타임아웃을 구현합니다. 지정 시간 초과 시 요청을 중단하여 무한 대기를 방지합니다.

---

### 9. `feat: 서비스 레이어에 fetchWithRetry 적용`

**변경 파일**: `services/upstageService.ts`, `services/ntsService.ts`, `services/geminiService.ts`, `utils/retry.ts`

서비스별 재시도 전략:
- **Upstage OCR**: `maxAttempts: 3` — 네트워크 불안정 시 재시도
- **NTS 국세청**: `maxAttempts: 3` — 공공 API 불안정 대비
- **Gemini**: `maxAttempts: 1, timeoutMs: 30_000` — LLM 응답은 동일 입력에도 결과가 달라질 수 있고, 응답 시간이 길어 재시도 시 사용자 대기가 과도해짐

---

### 10. `test: fetchWithRetry 지수 백오프 단위 테스트 추가`

**변경 파일**: `packages/backend/src/utils/retry.test.ts` (신규)

7개 테스트로 fetchWithRetry의 핵심 시나리오를 커버합니다:

- 성공 응답 즉시 반환 (재시도 없음)
- 비-retryable 상태(400)는 재시도 없이 반환
- retryable 상태(503)에서 지수 백오프 재시도 후 성공
- 모든 재시도 실패 시 마지막 response 반환
- 네트워크 오류 시 재시도 후 throw
- maxAttempts=1이면 재시도 없음
- 첫 시도 네트워크 오류 → 두 번째 시도 성공

`vi.useFakeTimers()`로 지수 백오프 대기를 건너뛰어 테스트 속도를 확보합니다. 네트워크 오류 테스트만 real timer + 짧은 delay(10ms)를 사용합니다 (fake timer와 rejected promise의 타이밍 이슈 회피).

---

### 11. `feat: AppError 클래스 및 asyncHandler 유틸 추가`

**변경 파일**: `packages/backend/src/utils/AppError.ts` (신규), `utils/asyncHandler.ts` (신규)

**AppError**: 에러에 HTTP 상태 코드를 부착하는 클래스입니다. `throw new AppError(400, '사업자등록번호가 필요합니다')`처럼 사용하면 errorHandler가 `err.statusCode`로 적절한 HTTP 상태를 반환합니다.

**asyncHandler**: Express 4는 async 핸들러에서 throw된 에러를 자동으로 next(error)에 전달하지 않습니다. 이 래퍼가 `.catch(next)`를 추가하여 에러가 Express 에러 처리 파이프라인에 진입하도록 합니다. Express 5에서는 네이티브 지원 예정이지만 아직 stable이 아닙니다.

---

### 12. `refactor: errorHandler로 에러 처리 일원화 및 라우트 catch 블록 제거`

**변경 파일**: `middlewares/errorHandler.ts`, `routes/ocrRoutes.ts`, `routes/validateRoutes.ts`, `routes/aiRoutes.ts`

**Before**: 4개 라우트 파일에 동일한 try/catch + logger.error + res.status(500) 패턴이 6회 반복.
**After**: asyncHandler가 에러를 자동 catch → next(error) → errorHandler에서 일괄 처리.

errorHandler에 AppError 분기를 추가합니다:
1. `multer.MulterError` → 400
2. 파일 형식 에러 → 400
3. `AppError` → `err.statusCode` (400, 502 등)
4. 기타 Error → 500

라우트에서 입력 검증은 `throw new AppError(400, '...')`로, 서비스 에러는 asyncHandler가 자동 전파합니다. 코드 줄수가 48 추가 / 52 삭제 = -4줄로 중복 제거 효과가 나타났습니다.

---

### 13. `refactor: NTS 및 Gemini API 응답 인터페이스 정의로 unknown 제거`

**변경 파일**: `packages/backend/src/types.ts`, `services/ntsService.ts`, `services/geminiService.ts`

기존 `validateBusiness(): Promise<unknown>`을 `Promise<NtsValidationResponse>`로 변경합니다.

국세청 API 응답 구조를 `NtsBusinessStatus` + `NtsValidationResponse` 인터페이스로 정의했습니다. Gemini API 응답도 `GeminiEmbeddingResponse`, `GeminiGenerateResponse`로 정의하여 인라인 `as` 캐스팅의 타입 정보를 한곳에서 관리합니다.

`unknown` 반환의 문제: 호출하는 쪽에서 응답 구조를 알 수 없어 IDE 자동완성이 불가하고, 런타임 에러 발생 시 원인 추적이 어렵습니다.

---

### 14. `refactor: rate limiter 설정을 middlewares로 중앙화`

**변경 파일**: `packages/backend/src/middlewares/rateLimiter.ts` (신규), `routes/ocrRoutes.ts`, `routes/validateRoutes.ts`, `routes/aiRoutes.ts`

4개 rate limiter(uploadLimiter, ocrLimiter, validateLimiter, aiLimiter)를 `middlewares/rateLimiter.ts` 한 파일에서 정의하고 export합니다.

**Before**: rate limit 정책을 파악하려면 3개 라우트 파일을 각각 열어야 했고, express-rate-limit를 라우트마다 직접 import했습니다.
**After**: rateLimiter.ts 한 파일에서 전체 정책을 한눈에 볼 수 있고, 라우트는 import만 합니다. 라우트에서 `express-rate-limit` 직접 import가 완전히 제거되었습니다.

---

### 15. `feat: AsyncLocalStorage로 requestId를 서비스 레이어까지 전파`

**변경 파일**: `packages/backend/src/middlewares/requestContext.ts` (신규), `utils/logger.ts`, `app.ts`

Node.js 내장 `AsyncLocalStorage`를 사용하여 HTTP 요청의 requestId를 비동기 호출 체인 전체에 전파합니다.

`requestContext` 미들웨어가 요청마다 `crypto.randomUUID()`로 고유 ID를 생성하고 `AsyncLocalStorage`에 저장합니다. 클라이언트가 `x-request-id` 헤더를 보내면 해당 값을 사용합니다.

pino의 `mixin` 옵션으로 매 로그 출력 시 `requestStore.getStore()`에서 requestId를 읽어 자동 삽입합니다. 서비스 레이어에서 `logger.error({...}, '...')`를 호출하면 별도 코드 없이 requestId가 포함됩니다.

---

### 16. `fix: OCR 엔드포인트에 이미지 전용 upload 적용으로 MIME 타입 불일치 해결`

**변경 파일**: `middlewares/upload.ts`, `routes/ocrRoutes.ts`, `server.test.ts`

기존 문제: `upload.ts`는 PDF를 허용(JPEG/PNG/PDF)하지만, OCR 라우트는 `image/*` 체크로 PDF를 거부. 두 곳에서 이중 검증하는 불일치.

수정: `createUpload` 팩토리 함수로 `upload`(문서용: JPEG/PNG/PDF)와 `imageUpload`(OCR용: JPEG/PNG)를 분리. OCR 라우트에서 수동 MIME 체크를 제거하고 `imageUpload`를 사용하여 multer 단계에서 일관되게 필터링합니다.

---

### 17. `refactor: 죽은 코드 제거 및 에러 처리 패턴 통일`

**변경 파일**: `app.ts`, `middlewares/upload.ts`, `middlewares/errorHandler.ts`, `server.test.ts`

코드 리뷰에서 발견된 3가지 문제를 일괄 수정합니다.

1. **`app.ts` — `export default app` 삭제**: named export `{ app }`만 사용되고 default export는 어디에서도 import하지 않는 죽은 코드
2. **`upload.ts` → `errorHandler.ts` — 문자열 비교 에러 식별 제거**: multer fileFilter에서 `new Error()` 대신 `new AppError(400, ...)`를 throw하여, errorHandler가 `instanceof AppError`로 처리. `err.message === '지원하지 않는 파일 형식입니다'` 문자열 비교 분기 삭제. 에러 메시지 변경 시 errorHandler가 깨지는 결합도 제거
3. **`server.test.ts` — `vi.hoisted` 패턴 통일**: `retry.test.ts`는 `vi.hoisted()`를 사용하지만 `server.test.ts`는 사용하지 않는 불일치. `vi.mock`은 파일 최상단으로 호이스팅되므로 `vi.hoisted`로 mock 변수를 명시적으로 호이스팅하는 것이 안전

---

## 최종 백엔드 구조

```
packages/backend/src/
├── app.ts                 ← Express 앱 (미들웨어 + 라우터 등록, 30줄)
├── server.ts              ← 부트스트랩 (dotenv + env 검증 + listen, 24줄)
├── types.ts               ← 전체 타입 정의
├── upstageParsing.ts      ← OCR 응답 파싱 로직
├── middlewares/
│   ├── errorHandler.ts    ← AppError/multer/일반 에러 분기 처리
│   ├── rateLimiter.ts     ← 4개 rate limiter 중앙 관리
│   ├── requestContext.ts  ← AsyncLocalStorage requestId 전파
│   ├── requestLogger.ts   ← pino-http 요청 로깅
│   └── upload.ts          ← multer 파일 업로드 (upload + imageUpload)
├── routes/
│   ├── healthRoutes.ts    ← GET /api/health
│   ├── ocrRoutes.ts       ← POST /api/upload, /api/ocr
│   ├── validateRoutes.ts  ← POST /api/validate-business
│   └── aiRoutes.ts        ← POST /api/embeddings, /api/advisory
├── services/
│   ├── upstageService.ts  ← Upstage OCR API (3회 재시도)
│   ├── ntsService.ts      ← 국세청 사업자 조회 (3회 재시도)
│   └── geminiService.ts   ← Gemini 임베딩/생성 (30초 타임아웃)
└── utils/
    ├── logger.ts          ← pino 로거 (테스트 silent)
    ├── retry.ts           ← fetchWithRetry 지수 백오프
    ├── AppError.ts        ← HTTP 상태코드 에러 클래스
    └── asyncHandler.ts    ← Express async 에러 래퍼
```

## Test Plan

- [x] `packages/backend`: `npx vitest run` — 92개 테스트 통과 (기존 85개 + 신규 retry 7개)
- [x] ESLint + Prettier pre-commit hook 통과
- [x] TypeScript 컴파일 에러 없음
- [x] console.log/error 호출 0개 확인 (Grep 검증)
- [ ] 서비스 재시도 수동 테스트: 외부 API 장애 시 재시도 동작 확인
- [ ] pino 로그 출력 확인: 개발 환경에서 JSON 로그 형식 확인
