# Marble Roulette - Product Requirements Document

**Version**: 1.0
**Last Updated**: 2025-12-25
**Product URL**: https://hyunflix.github.io/roulette/

---

## 1. 개요 (Overview)

Marble Roulette은 물리 엔진 기반의 웹 추첨 애플리케이션입니다. 참가자 이름을 입력하면 각각의 마블(구슬)이 생성되어 레이싱을 펼치고, 목표 지점에 도달하는 순서대로 순위가 결정됩니다.

### 1.1 핵심 가치

- **공정성**: Box2D 물리 엔진 기반의 예측 불가능한 결과
- **시각적 재미**: 3D 마블 렌더링, 파티클 효과, 승리 애니메이션
- **접근성**: 키보드 단축키, 다크/라이트 테마, 다국어 지원
- **공유 용이성**: 비디오 녹화, URL 파라미터 공유

### 1.2 기술 스택

| 영역 | 기술 |
|------|------|
| 물리 엔진 | Box2D (WebAssembly) |
| 렌더링 | Canvas 2D API |
| 애니메이션 | GSAP (GreenSock) |
| 오디오 | Web Audio API |
| 녹화 | MediaRecorder API |
| PWA | Service Worker, Web Manifest |

---

## 2. 핵심 게임플레이 (Core Gameplay)

### 2.1 물리 시뮬레이션

| 기능 | 설명 |
|------|------|
| 중력 기반 낙하 | 마블이 중력에 따라 자연스럽게 떨어짐 |
| 충돌 감지 | 벽, 장애물, 다른 마블과의 충돌 처리 |
| 반발 계수 | 충돌 시 튕김 효과 |
| 정체 감지 | 마블이 멈추면 자동으로 흔들어줌 |

### 2.2 참가자 관리

```
입력 형식 예시:
홍길동           # 기본 참가자
김철수*3         # 3개의 마블 생성
이영희/2         # 가중치 2 (더 큰 마블)
박민수*2/1.5     # 2개 마블, 가중치 1.5
```

| 기능 | 설명 |
|------|------|
| 이름 입력 | 쉼표 또는 줄바꿈으로 구분 |
| 복수 마블 | `이름*개수` 문법으로 동일 이름 마블 복수 생성 |
| 가중치 | `이름/가중치` 문법으로 마블 크기 조절 |
| 자동 정리 | 중복 제거 및 포맷 정리 |

### 2.3 승자 결정 모드

| 모드 | 설명 |
|------|------|
| 선착순 (First) | 첫 번째 도착자가 승자 |
| 꼴찌 (Last) | 마지막 도착자가 승자 |
| 커스텀 순위 | N번째 도착자를 승자로 지정 |

### 2.4 스킬 시스템

- **임팩트 스킬**: 주변 마블을 밀어내는 충격파
- **쿨타임**: 마블 가중치에 따라 1-5초 간격
- **시각 표시**: 마블 주위 링으로 쿨타임 표시
- **토글 가능**: 설정에서 스킬 시스템 on/off

---

## 3. 사용자 인터페이스 (User Interface)

### 3.1 사이드바 설정 패널

위치: 화면 왼쪽 사이드바 (320px 너비), 접기/펼치기 가능

| 섹션 | 구성 요소 |
|------|-----------|
| 헤더 | "Settings" 타이틀, 접기 버튼 |
| 액션 버튼 | Start Game (primary), Restart, Shuffle |
| 참가자 입력 | 텍스트 영역, 참가자 수 표시, Clear All 버튼 |
| Configuration | 맵 선택, Use Skills 토글, Winner Takes All 토글, Auto-Record 토글 |
| Audio | Master Volume 슬라이더, SFX 슬라이더 |
| 푸터 | 버전 정보, Help 버튼 |

### 3.2 게임 HUD

| 요소 | 위치 | 설명 |
|------|------|------|
| Status Badge | 좌상단 | "Ready to Race" / "Racing..." / "Winner!" 상태 표시 |
| Player Counter | 우상단 | 참가자 수 표시 (Material Icon + 숫자) |
| Rankings Panel | 우측 | 실시간 순위 목록, 완료/전체 수 표시 |
| Expand Button | 좌상단 | 사이드바 숨김 시 표시되는 확장 버튼 |

### 3.3 오버레이

| 오버레이 | 설명 |
|----------|------|
| 게임 완료 | 트로피 이모지 + "추첨 완료!" + 당첨자 이름 + 확인 버튼 |
| 도움말 | 이용방법 모달 (참가자 입력, 옵션 설정, 키보드 단축키 안내) |

### 3.4 디자인 시스템

**색상 팔레트 (Tailwind 기반)**

| 변수명 | 색상값 | 용도 |
|--------|--------|------|
| `primary` | #2badee | 강조 색상, 버튼, 링크 |
| `primary-hover` | #45b8f0 | 호버 상태 |
| `background-dark` | #101c22 | 페이지 배경 |
| `surface-dark` | #192b33 | 카드, 패널 배경 |
| `border-dark` | #233c48 | 테두리, 구분선 |
| `text-subtle` | #92b7c9 | 보조 텍스트 |

**타이포그래피**
- 기본 폰트: Noto Sans KR, sans-serif
- 아이콘: Material Symbols Outlined
- 제목: 20px / 16px / 14px
- 본문: 14px / 13px / 12px

**UI 컴포넌트**
- 토글 스위치: 커스텀 CSS (40px × 24px)
- 레인지 슬라이더: 커스텀 CSS (트랙 4px, 썸 16px)
- 버튼: rounded-lg, 호버 트랜지션
- 입력 필드: focus:ring-2 focus:ring-primary/50

---

## 4. 키보드 단축키 (Keyboard Shortcuts)

| 키 | 동작 |
|----|------|
| `Space` / `Enter` | 게임 시작 |
| `R` | 참가자 순서 랜덤 셔플 |
| `F` | 전체 화면 토글 |
| `S` | 설정 패널 토글 |
| `Escape` | 모달 닫기 / 설정 패널 토글 |

---

## 5. 사운드 효과 (Sound Effects)

Web Audio API로 합성된 효과음 (외부 파일 없음)

| 효과음 | 설명 | 재생 시점 |
|--------|------|-----------|
| 시작음 | C5→E5→G5→C6 아르페지오 | 게임 시작 시 |
| 충돌음 | 노이즈 버스트, 강도에 따라 볼륨/피치 변화 | 벽/장애물 충돌 시 |
| 골인음 | C5-E5-G5 메이저 코드 | 마블 골인 시 |
| 완료음 | 4음 팡파레 | 모든 마블 완료 시 |
| 클릭음 | 1kHz 짧은 톤 | UI 클릭 시 |

---

## 6. 시각 효과 (Visual Effects)

### 6.1 마블 렌더링

3D 구체 효과 (Radial Gradient 기반)

| 레이어 | 설명 |
|--------|------|
| 메인 그라디언트 | HSL 색상, 상단-밝음 / 하단-어두움 |
| 스펙큘러 하이라이트 | 좌상단 흰색 반사광 |
| 림 라이트 | 가장자리 미세한 빛 |
| 충격 효과 | 충돌 시 밝기 증가 |

### 6.2 카메라 시스템

| 기능 | 설명 |
|------|------|
| 자동 추적 | 선두 마블 자동 팔로우 |
| 줌 | 골 라인 접근 시 최대 4배 확대 |
| 슬로우 모션 | 골 근처에서 시간 스케일 감소 |
| 수동 조작 | 미니맵 드래그로 시점 이동 |

### 6.3 승리 애니메이션 (GSAP)

| 요소 | 애니메이션 |
|------|------------|
| 오버레이 | 0.4초 페이드 인 |
| 트로피 | 0.6초 바운스 + 떠다니는 효과 |
| 타이틀 | 0.3초 슬라이드 인 |
| 승자 이름 | 0.4초 슬라이드 업 + 하이라이트 |
| 컨페티 | 50개 파티클, 1.5초 분사 |

---

## 7. 맵 (Maps)

### 7.1 사용 가능한 맵

| 맵 이름 | 설명 |
|---------|------|
| Wheel of Fortune | 기본 맵, 복잡한 장애물 배치 |
| Pot of Greed | 대안 레이아웃 |
| Yoru ni Kakeru | item4 곡 이름에서 유래 |

### 7.2 맵 구성 요소

- **폴리라인 장애물**: 벽면, 경사로
- **회전 장애물**: 지속적으로 회전하는 막대
- **목표선 (Goal)**: 완주 판정 라인
- **줌 트리거**: 카메라 확대가 시작되는 위치

---

## 8. 녹화 및 공유 (Recording & Sharing)

### 8.1 비디오 녹화

| 항목 | 사양 |
|------|------|
| 포맷 | MP4 (video/mp4) |
| 비트레이트 | 6 Mbps |
| 트리거 | 게임 시작 시 자동 시작 (설정 시) |
| 종료 | 승자 결정 1초 후 자동 종료 |
| 파일명 | `marble_roulette_YYYYMMDDHHmmss.mp4` |

### 8.2 URL 공유

```
https://hyunflix.github.io/roulette/?names=홍길동,김철수,이영희
```

- `names` 파라미터로 참가자 목록 전달
- 쉼표로 구분된 이름 목록

### 8.3 로컬 저장

| 키 | 저장 내용 |
|----|-----------|
| `mbr_names` | 참가자 이름 목록 |
| `mbr_theme` | 테마 설정 (dark/light) |
| `mbr_sound` | 사운드 활성화 여부 |

---

## 9. 접근성 (Accessibility)

### 9.1 키보드 접근성

- 모든 컨트롤 키보드 접근 가능
- `focus-visible` 스타일링 (시안색 링)
- 논리적 탭 순서

### 9.2 시각적 접근성

- 고대비 다크/라이트 테마
- 큰 클릭 타겟 (최소 44px)
- 명확한 포커스 표시
- 읽기 쉬운 폰트 크기

### 9.3 시스템 연동

- `prefers-color-scheme` 자동 감지
- 시스템 언어 자동 감지

---

## 10. 다국어 지원 (Localization)

### 10.1 지원 언어

| 언어 | 코드 |
|------|------|
| 한국어 | ko |
| English | en |

### 10.2 번역 시스템

- `data-trans` 속성으로 번역 대상 지정
- `navigator.language` 기반 자동 감지
- 영어 폴백

---

## 11. PWA 기능 (Progressive Web App)

### 11.1 설치 가능성

| 항목 | 값 |
|------|-----|
| 앱 이름 | Marble roulette |
| 짧은 이름 | MR |
| 표시 모드 | fullscreen / minimal-ui / standalone |
| 시작 URL | /roulette/ |

### 11.2 아이콘

- 36x36, 48x48, 72x72, 96x96, 144x144, 192x192 px
- Android / iOS / Windows 대응

### 11.3 오프라인 지원

- Service Worker 등록
- 정적 리소스 캐싱

---

## 12. 미니맵 (Minimap)

| 기능 | 설명 |
|------|------|
| 위치 | 좌측 상단 |
| 스케일 | 1/4 축소 |
| 표시 내용 | 스테이지 전체, 마블 위치, 뷰포트 영역 |
| 상호작용 | 드래그로 카메라 이동 |

---

## 13. 고속 재생 (Fast Forward)

| 기능 | 설명 |
|------|------|
| 활성화 | 마우스 홀드 |
| 배속 | 2배 |
| 표시 | 화면에 오버레이 표시 |

---

## 14. 설정 옵션 (Configuration)

### 14.1 게임 설정

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| useSkills | true | 스킬 시스템 활성화 |
| winningRank | 0 | 승자 순위 (0 = 1등) |
| autoRecording | true | 자동 녹화 |
| showCanvasRankList | false | 캔버스에 순위 표시 |
| showCanvasWinner | true | 캔버스에 승자 표시 |

### 14.2 성능 설정

| 항목 | 값 |
|------|-----|
| 업데이트 간격 | 10ms |
| 물리 스텝 | 6 velocity / 2 position iterations |
| 초기 줌 | 30x |

---

## 15. 브라우저 호환성 (Browser Compatibility)

### 15.1 필수 API

- Canvas 2D Context
- Web Audio API
- MediaRecorder API
- Service Worker
- LocalStorage
- WebAssembly (Box2D)

### 15.2 권장 브라우저

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

---

## 16. 분석 (Analytics)

- Google Analytics 4 연동
- 추적 이벤트:
  - 게임 시작 (참가자 수 포함)
  - 카테고리: "roulette"

---

## 부록 A: 파일 구조

```
roulette/
├── index.html              # 메인 HTML
├── assets/
│   ├── style.scss          # 스타일시트
│   └── images/             # 아이콘 SVG
├── src/
│   ├── roulette.ts         # 메인 게임 로직
│   ├── marble.ts           # 마블 클래스
│   ├── camera.ts           # 카메라 시스템
│   ├── physics-box2d.ts    # Box2D 물리 엔진
│   ├── audio/
│   │   └── SoundManager.ts # 사운드 관리
│   ├── animation/
│   │   └── VictoryAnimation.ts # 승리 애니메이션
│   ├── data/
│   │   ├── maps.ts         # 맵 데이터
│   │   └── constants.ts    # 상수 정의
│   └── utils/
│       └── videoRecorder.ts # 비디오 녹화
└── dist/                   # 빌드 결과물
```

---

## 부록 B: 이벤트 시스템

| 이벤트 | 발생 시점 | 데이터 |
|--------|-----------|--------|
| `goal` | 승자 마블 골인 | `{ winner: string }` |
| `finish` | 모든 마블 완료 | `{ winner: string }` |
| `message` | 토스트 메시지 | `string` |

---

## 변경 이력 (Changelog)

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-25 | 초기 PRD 작성 |
