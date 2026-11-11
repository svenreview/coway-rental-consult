# 코웨이 Supabase 통합 — 실행 전 점검서 (2026-10-31)

> **상태: 사전 점검 / 미이전.** 이 문서는 데이터 복사·Vercel 설정 변경·프로젝트 일시정지·삭제를 자동으로 실행하지 않습니다.
> 고객 개인정보가 있는 운영 데이터베이스이므로, 백업·접속 권한·복원 검증 없이 원본을 중지하지 않습니다.

## 목적과 결정

- **유지할 운영 DB:** `sven` (Vercel Marketplace 관리) 조직의 `coway-rental-db`. 현재 고객용 웹은 `coway-rental-consult`, 백엔드 API는 `public.inquiries` 사용.
- **정리 후보:** `coway-water` Supabase 프로젝트. 기존 `coway-water.vercel.app` 은 운영하지 않는다고 사용자가 확인했으나, 다른 서비스 의존성은 별도 점검해야 함.
- **새로 확보할 자리:** 독립 `ocean-desk` Supabase Free 프로젝트. 프로젝트 간 조직 이동만으로는 무료 **활성 프로젝트 수가 줄지 않음**.
- **명칭 정리:** `sven` 는 Supabase 프로젝트가 아니라 Vercel 팀과 연결된 Supabase 조직. 이름 변경은 Vercel 연결/팀 설정을 먼저 확인해야 함. 프로젝트 ref, Vercel slug, 연결 키를 함부로 변경하지 말 것.

## 현재까지 직접 확인한 사실

### 기존 DB `coway-water` (연결 계정에서 읽기 권한 있음)

`public`의 운영 테이블 3개 및 정확한 행 수 (2026-10-31 확인):
| 테이블 | 행 수 | 비고 |
|---|---:|---|
| `coway_consultations` | 23 | 최신 기록 2026-10-21 UTC |
| `코웨이 예약 상담 DB` | 1 | 2026-09-23 UTC |
| `코웨이 생수 비교 추천 링크` | 0 | 빈 테이블, 스키마 보존 여부 확인 필요 |

그 밖에 `public.coway_consultations_admin` 뷰, `public.submit_consultation` / `public.purge_completed_consultation` 함수가 관찰됨. Supabase Security Advisor는 `coway_consultations_admin`에 **security_definer_view** 경고를 보고함. 이 뷰를 아무 검토 없이 새 프로젝트로 이전하지 말 것.

### 유지 대상 `coway-rental-db` (현 연결 권한 없음)

- 사용자가 직접 공유한 Supabase 대시보드에서 프로젝트는 활성 상태로 확인.
- 연결된 Supabase 도구로 해당 프로젝트의 테이블을 읽으면 permission error 발생. **운영 DB의 실제 스키마, 데이터 수, RLS, 충돌 여부를 아직 검증하지 못했음**.
- GitHub `svenreview/coway-rental-consult`의 `api/inquiry.js`와 `api/admin.js`는 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_SECRET_KEY` 서버 환경 변수를 이용해 `public.inquiries`에 접근하도록 작성됨. 이 소스는 실제 Vercel Production 환경변수 값을 증명하지 못하므로 연동 관계는 확인 필요.
- `svenreview/coway-water` GitHub 앱 API에서는 `public.consultations`를 호출하지만 실제 `coway-water` 목록에는 이 이름의 테이블이 보이지 않음. **GitHub 코드, Vercel 실제 배포, DB 연결이 일치하는지 조사 필요**.

## 진행 게이트 (단계 순서 지킬 것)

### G1. 대상 DB 및 Vercel 연결 검증 — 미완료
1. Vercel `coway-rental-consult` 프로젝트의 **Production** 환경변수 `SUPABASE_URL`이 어느 프로젝트 ref를 가리키는지 확인. 값/키 자체를 채팅, 스크린샷, GitHub에 올리지 않음.
2. 대상 `coway-rental-db` Table Editor / SQL Editor에서 `public.inquiries` 유무와 행 수, 고객 접수 API 접근 여부, RLS 확인.
3. `preflight.sql`을 원본·대상 각각의 SQL Editor에서 실행하여 **테이블 이름, 함수, 뷰, 권한**을 고객 개인정보 없이 점검.
4. 다른 Vercel 앱이 `coway-water`에 아직 쓰기/읽기 요청하는지 Vercel 환경변수(키 값은 비공개), 로그, 실제 사용 기능으로 조사.

### G2. 백업 및 복원 가능성 검증 — 미완료
1. Supabase 공식 지침에 따라 **양쪽 프로젝트의 schema/roles/data 백업**을 프로젝트 외부의 암호화된 개인 저장소에 보관.
2. 파일에 이름/연락처가 들어갈 수 있으므로 GitHub, 공개 Drive, 채팅에 올리지 않음. 암호나 DB 연결 URL도 공유하지 않음.
3. 샘플 데이터 또는 별도 로컬 Postgres에서 백업 복구 시험을 마친 뒤 실제 이동 진행.
4. 백업 직후부터 전환까지 신규 접수가 발생하면 누락될 수 있으므로, 점검 창구를 정하거나 최종 동기화(델타 복사) 계획 수립.

공식 지침: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

### G3. 기존 데이터 **선별 이관** — 미완료
1. 대상 `public.inquiries`는 수정·삭제하지 않음.
2. 소스의 세 테이블을 **원래 테이블명과 ID를 유지한 채 별도 테이블로** 복원하되, 대상에 같은 이름이 이미 있으면 즉시 중단하여 충돌 검토.
3. 스키마/자료 이관 방법은 `pg_dump`의 **table 단위** 백업과 `pg_restore`를 고려. 전체 source `public` 스키마를 통째로 대상에 덮어쓰지 말 것.
4. `public.coway_consultations_admin` 뷰 및 함수를 이전해야 하는지는 실제 의존성 확인 후 별도 결정. 문제 있는 보안 뷰는 그대로 복제하지 않음.
5. 대상의 RLS, API GRANT, Unique 제약, 트리거, created_at, 원본 PK를 점검. 서비스에서 접근하지 않는 아카이브 테이블은 공개 API 권한을 주지 않는 편이 안전함.

### G4. 무중단 확인 — 미완료
1. 원본/대상 각각 세 테이블의 건수 검증: 기준 **23 / 1 / 0** (이관 직전 다시 확인 필요).
2. 무작위 1~2건을 **대시보드 내부에서만** 비교해 필드·날짜·동의값·ID 동일성 확인 (고객정보 외부 전송 금지).
3. 현행 `coway-rental-consult` 실제 상담 신청 → 저장 → /admin 조회 → 상담 상태 변경 테스트.
4. 기존 데이터가 남아 있는지와 Vercel Production 배포/로그에 오류가 없는지 확인. 원본과 신규 접수 건이 동시에 발생한 경우 최종 동기화.
5. 연결 중인 앱이 있다면 모든 연결이 대상 DB로 이동했는지 확인.

### G5. 원본 **Pause만** — 미완료
- G1–G4 모두 통과한 뒤 `coway-water`를 **Pause**하여 무료 활성 프로젝트 자리를 확보. 프로젝트 삭제는 범위에서 제외.
- 며칠간 상담 접수/기존 데이터/로그 확인 후 OCEAN DESK 전용 프로젝트 생성.
- Pause 직후 장애가 발생하면 즉시 Restore + Vercel 설정 롤백.

## 변경 금지 대상

- 코웨이 렌탈 메인 홈페이지 UI, 운영 코드, API, DB 비밀키
- 현재 대상 `public.inquiries`의 고객 기록
- 기존 `coway-water` 원본 상담 기록, 뷰, 함수 (준비 단계에서 수정하지 않음)

## 현재 막힌 요소

**Vercel Marketplace를 통해 만든 `sven / coway-rental-db`가 현재 ChatGPT Supabase 연결에 보이지 않습니다.** 해당 프로젝트를 관리할 수 있는 권한으로 Supabase 또는 Vercel을 연결해야 실제 이관·검증까지 수행할 수 있습니다. 고객 데이터 및 DB 비밀값을 채팅으로 전달하지 마세요.

---
작업 착수 체크: [x] 프로젝트 구조 확인 · [x] 원본 3개 테이블 건수 확인 · [x] GitHub API 구조 확인 · [ ] 대상 DB 확인 · [ ] 양쪽 백업 · [ ] 검증된 자료 이전 · [ ] 접수 테스트 · [ ] 원본 Pause
