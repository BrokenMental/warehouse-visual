# 기술·데이터 설계

상태: 1단계 구현. 아래 전체 모델·저장·재고 정책은 후속 구현의 기준이며 현재 구현은 고정 샘플 Rack/Bin과 공통 선택 상태, 2D/3D 탐색이다.

## 적용 기술 스펙

| 영역 | 기술과 고정 버전 | 상태 |
| --- | --- | --- |
| 웹앱 | React/React DOM 19.3.1, TypeScript 7.0.2, Vite 8.3.7 | 적용 |
| 2D | Konva 10.9.1, react-konva 19.3.2 | 적용 |
| 3D | Three.js 0.187.0, React Three Fiber 9.8.2, Drei 10.7.9 | 적용 |
| 상태 | Zustand 5.1.0 | 적용 |
| 검증 | Vitest 5.1.0, Playwright 1.65.0, Microsoft Edge | 적용 |
| 재고 표·검증 | TanStack Table, Zod | 해당 기능 구현 시 도입 |
| 로컬 저장 | IndexedDB + Dexie | 저장 단계에서 도입 |
| 공동 사용 서버 | Node.js + TypeScript + Fastify, PostgreSQL + Prisma | 공동 사용 단계에서 도입 |

실제 전체 버전은 `package.json`과 `package-lock.json`으로 고정한다. Node.js 24.19.0에서 검증했다. npm peerDependencies와 [R3F 설치 문서](https://r3f.docs.pmnd.rs/getting-started/installation), [react-konva 공식 문서](https://konvajs.org/docs/react/index.html)에서 React 호환 조건을 확인했다.

### 현재 코드 구성

- `src/domain.ts`: mm 기반 Rack/Bin 샘플, 고유 칸 ID, 3D 좌표 변환
- `src/store.ts`: 유효한 랙·칸 선택과 랙 전환 시 이전 칸 선택 해제
- `src/FloorPlan.tsx`: Konva 평면도, 팬·줌·맞춤과 랙 선택
- `src/RackScene.tsx`: 공통 데이터에서 선반·기둥·선택 칸 생성, 카메라 조작
- `src/App.tsx`: 랙 목록·상세·단/행 필터·칸 목록과 3D 오류 대체 화면
- `src/domain.test.ts`, `e2e/explorer.spec.ts`: 좌표·선택 상태와 브라우저 상호작용 검증

실행: `npm run dev`. 검증: `npm run build`, `npm test`, `npm run test:e2e`. 3D 모듈은 지연 로드한다. Vite의 500kB 청크 경고와 Three.js 상위 라이브러리의 Clock 폐기 예정 경고가 남으며 실행 오류는 관찰되지 않았다. 대규모 성능 목표는 아직 측정하지 않았다.

## 1. 구조

도메인 데이터 → 공통 선택 상태 → 2D/3D/테이블 뷰로 분리한다. 뷰에는 저장소를 직접 수정하는 로직을 두지 않고 검증을 수행하는 도메인 명령을 사용한다.

- 도메인: 창고 외곽, 랙 구성, 칸, 재고, 이동 규칙
- 편집: 배치 초안, 유효성 검사, undo/redo, 저장
- 탐색: 검색 결과, 선택한 랙·칸·품목, 카메라 이동 요청
- 렌더링: 2D 배치, 3D 선택 랙, 테이블
- 저장 어댑터: 초기 로컬 저장과 이후 서버 저장의 경계

웹 구현에서 Canvas 기반 Konva 평면도와 WebGL 기반 Three.js 랙 상세를 사용한다. 저장·재고 관련 의존성은 해당 기능 착수 시 호환성을 확인하고 고정한다.

## 2. 좌표와 치수

- 길이는 정수 mm, 각도는 도 단위로 저장한다. 화면에서 m로 표시할 수 있다.
- 창고 원점은 평면도 왼쪽 위, X는 오른쪽, Y는 아래쪽, Z는 위쪽 높이다.
- 랙 인스턴스 원점은 회전 전 바닥 외접 영역의 왼쪽 위다. 랙의 로컬 x/y/z와 창고 좌표를 구분한다.
- 평면도 각도는 시계 방향 양수다. 로컬 점 `(u,v)`는 `X=x+u*cosθ-v*sinθ`, `Y=y+u*sinθ+v*cosθ`로 변환한다.
- 3D 엔진이 Y-up인 경우 창고 `(X,Y,Z)`를 `(X,Z,-Y)`로 변환한다. 실제 엔진의 단위 환산도 어댑터 한 곳에서 수행한다.
- 칸의 bounds는 랙 로컬 좌표의 최소점과 크기다. 모듈형은 모듈 변환 후 랙 변환을 적용한다.
- 앞면 방향과 칸 번호 기준은 데이터로 고정한다. 카메라 회전으로 번호를 다시 매기지 않는다.
- 화면 줌·팬은 뷰 상태이며 물리 좌표에 저장하지 않는다.

## 3. 데이터 모델

| 엔터티 | 핵심 필드 | 제약 |
| --- | --- | --- |
| Warehouse | id, name, outline, heightMm, revision | 외곽은 자기 교차 없는 다각형 |
| Zone | id, warehouseId, code, name, polygon | 창고 내부, 구역 코드 창고 내 고유 |
| Facility | id, warehouseId, kind, geometry, blocking | 기둥·벽·통로·출입구 |
| RackTemplate | id, version, type, structure | 버전별 불변 정의 |
| Rack | id, warehouseId, zoneId?, code, pose, structureSnapshot, revision | 코드 창고 내 고유, 템플릿 수정과 분리 |
| RackModule | id, rackId, transform, dimensions, members | 조합형을 구성하는 모듈 |
| Bin | id, rackId, moduleId, face, column, row, level, bounds, active | 영구 ID, 위치 인덱스 조합 랙 내 고유 |
| Item | id, sku, name, barcode?, unit, precision | SKU 고유, 단위·소수 자릿수 명시 |
| StockBalance | itemId, binId 또는 미지정 bucket, quantity, revision | 품목·보관처 조합 고유, 수량 음수 금지 |
| StockTransaction | id, kind, itemId, source?, destination?, quantity, reason, timestamp, actor?, requestId | 불변 이력, 재시도 중복 반영 방지 |

수량은 품목 precision에 따른 최소 단위 정수로 저장한다. 예: 0.001kg 단위 품목의 1.250kg는 1250으로 저장한다. 위치 코드와 이름은 표시용이며 외래키로 사용하지 않는다.

예시: 랙 `rack-01`은 A구역의 표시 코드 R03, 위치 (4000,6000), 회전 90도다. 칸 `bin-017`은 앞면 2열·1행·4단이다. 품목 `item-001`의 수량 12는 `bin-017`을 참조한다. 랙을 옮겨도 이 참조는 변하지 않는다.

## 4. 저장과 변경 흐름

단일 사용자 저장 단계에서는 IndexedDB + Dexie 어댑터와 버전이 있는 JSON 내보내기/가져오기를 구현할 계획이다. 현재 탐색 시제품은 메모리 상태만 사용하며 새로고침하면 초기화된다. 로컬 저장은 다른 기기와 자동 공유되지 않으며 브라우저 데이터 삭제 시 유실될 수 있어 내보내기를 제공한다.

가져오기는 schemaVersion, 필수 필드, 치수 범위, ID 중복, 외래키, 좌표·수량 유효성을 먼저 검증한다. 미리보기 후 하나의 원자적 변경으로 반영하고 실패하면 기존 데이터를 유지한다. 알 수 없는 상위 버전은 조용히 변환하지 않고 거부한다.

배치 저장: 초안 수정 → 구조·충돌·재고 영향 검사 → revision 확인 → 원자적 저장 → 저장 완료 상태 갱신. 저장 실패 시 초안을 버리지 않는다.

재고 이동: 출발 잔고 확인 → 목적 칸 활성·단위 확인 → 양쪽 잔고와 이력을 하나의 트랜잭션으로 저장. requestId로 중복 요청을 방지한다. 구조 변경과 재고 변경이 서로 오래된 revision을 참조하면 다시 검토하게 한다.

다중 사용자로 확장할 때 서버를 최종 데이터 권한으로 두고 인증·역할·창고별 접근 권한·감사 이력·낙관적 동시성 검사를 추가한다. 초기 로컬 시제품을 실시간 공동 작업 시스템으로 설명하지 않는다.

## 5. 렌더링과 상태

선택 상태는 warehouseId, rackId, binId, itemId, searchResultIds로 관리한다. 한 번의 검색 결과 선택으로 평면도와 3D에 같은 ID를 전달한다. 비동기 모델 준비 중 다른 랙을 선택하면 오래된 결과가 최신 선택을 덮지 않도록 요청 세대를 확인한다.

3D는 선택한 랙만 생성하고 해제할 때 자원을 정리한다. 같은 구조물은 재사용한다. 2D는 현재 화면에 필요한 라벨을 우선 표시한다. 축소 시 칸 전체나 물품명을 그리지 않는다. 색 외에 윤곽·아이콘·위치 텍스트를 함께 사용한다.

초기 검증 데이터 목표는 랙 100개, 랙당 최대 200칸, 품목 5,000개로 제안한다. 이는 지원 보장이 아니라 성능 측정 출발점이다. 테스트 장치·브라우저·데이터 규모와 검색/렌더링 시간을 함께 기록해 지원 규모를 확정한다.

## 6. 검증 전략

- 좌표: 0/90/180/270도 변환, 역변환, 확대·축소 후 위치 불변
- 구조: 다른 단 높이·열 너비, 양면 번호, 조합형 실제 바닥 영역, 외곽 경계·충돌
- 무결성: 이동·이름 변경 후 동일 칸 ID, 재고 있는 칸 삭제 거부, 템플릿 버전 분리
- 재고: 부족 출고 거부, 이동 중 실패 시 양쪽 복원, 중복 요청 방지, 단위 소수 정밀도
- 사용자 흐름: 테이블/검색 → 정확한 랙 → 정확한 3D 칸, 여러 위치·미지정·결과 없음
- 저장: 새로고침 복원, 잘못된 가져오기 거부, 저장 실패 시 초안 보존
- 시각 검수: 가려진 칸, 클릭 대상, 앞뒤 방향, 좁은 화면, 3D 사용 불가 대체 보기

실행 테스트와 수동 시각 검수를 구분해 기록한다. 첫 단계의 테스트 결과는 `todo.md`에 기록하며 나머지 검증은 해당 기능 구현 시 수행한다.
