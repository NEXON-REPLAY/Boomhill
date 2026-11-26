<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/replay-logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/brand/replay-logo-light.png">
  <img alt="REPLAY" src="assets/brand/replay-logo-light.png" width="240">
</picture>

# Boomhill Open Assets

크레이지아케이드, 크레이지아케이드 BnB M, 버블파이터, 버블파이터 어드벤처, 에어라이더의 **2D 그림**과 **3D 모델**을 모아 보여 주는 곳입니다. 참가 승인을 받은 창작자는 여기서 받아 쓸 수 있습니다.
게임마다 저장소가 따로 있고, 이 저장소(허브)에는 다섯 게임을 한 화면에서 보는 **뷰어**, 다오와 배찌의 **세계관**, **자료 안내**가 있습니다.

> **경고: Lab Track 참가 승인을 받은 창작자만 이용할 수 있습니다.** 승인받지 않은 사내 제작, 학습, 연구, 개인 공부, 상업 등 목적과 관계없이 모든 이용을 제한합니다.

> 이용 조건은 [LICENSE](LICENSE) 와 [NOTICE](NOTICE) 를 따릅니다.

## 게임 저장소

그림과 모델 파일은 게임 저장소에 있습니다. 게임 저장소의 사이트 첫 화면은 이 허브 뷰어의 그 게임으로 이어집니다.

| 게임 | 저장소 | 사이트(뷰어로 보기) | 2D 그림 | 3D 모델 |
|---|---|---|---:|---:|
| 크레이지아케이드 | [Boomhill-BnB](https://github.com/NEXON-REPLAY/Boomhill-BnB) | [nexon-replay.github.io/Boomhill-BnB/](https://nexon-replay.github.io/Boomhill-BnB/) | 18,085 | - |
| 크레이지아케이드 BnB M | [Boomhill-BnBM](https://github.com/NEXON-REPLAY/Boomhill-BnBM) | [nexon-replay.github.io/Boomhill-BnBM/](https://nexon-replay.github.io/Boomhill-BnBM/) | 5,572 | 820 |
| 버블파이터 | [Boomhill-BubbleFighter](https://github.com/NEXON-REPLAY/Boomhill-BubbleFighter) | [nexon-replay.github.io/Boomhill-BubbleFighter/](https://nexon-replay.github.io/Boomhill-BubbleFighter/) | 7,040 | 1,750 |
| 버블파이터 어드벤처 | [Boomhill-BubbleFighterAdventure](https://github.com/NEXON-REPLAY/Boomhill-BubbleFighterAdventure) | [nexon-replay.github.io/Boomhill-BubbleFighterAdventure/](https://nexon-replay.github.io/Boomhill-BubbleFighterAdventure/) | 709 | 600 |
| 에어라이더 | [Boomhill-AirRider](https://github.com/NEXON-REPLAY/Boomhill-AirRider) | [nexon-replay.github.io/Boomhill-AirRider/](https://nexon-replay.github.io/Boomhill-AirRider/) | 3,425 | 728 |

## 보기

| 페이지 | 내용 |
|---|---|
| `index.html` | 뷰어: 다섯 게임의 2D 그림(프레임, 재생, 내려받기)과 3D 모델(돌려 보기, 동작 재생)을 한 화면에서 |
| `lore/` | 세계관: REPLAY-Boomhill 이 정리한 다오와 배찌 통합 세계관(붐힐마을, 인물과 관계, 이야기) |
| `guide.html` | 자료 안내(원문 `docs/usage-guide.md`) |
| `demo.html` | 기술 예시: 버튼 스프라이트, 프레임 넘기기, 엔진용 아틀라스 변환 |

뷰어는 게임 목록(`games/index.json`)에 적힌 게임 사이트 주소(`../<게임 저장소>/`)에서 그림과 모델을 읽습니다.
GitHub Pages 의 저장소 사이트는 모두 같은 주소(`nexon-replay.github.io/<저장소>/`) 아래에 있어 그대로 읽힙니다.

## 저장소 구성

```
허브(이 저장소)
├─ index.html, guide.html, demo.html
├─ games/index.json              게임 목록(게임마다 사이트 주소, 묶음, 합계)
├─ lore/                         세계관 페이지(index.html, lore.js, lore.css), 데이터 lore.json, 인물 얼굴 faces/
├─ docs/                         자료 안내, 파일 형식
└─ viewer/                       뷰어 코드(viewer/vendor/three/ 는 three.js 와 meshoptimizer 디코더, MIT)

게임 저장소(게임마다 하나)
├─ README.md                     이 게임에 무엇이 몇 개 있는지, 원본 zip 받는 곳
├─ 2d/
│  ├─ 010_ui/                    묶음 하나 = 폴더 하나
│  │  ├─ index.json              묶음 안 그림 목록
│  │  ├─ <id>.png                그림(여러 프레임이면 스프라이트 시트)
│  │  └─ <id>.json               아틀라스(프레임, 애니메이션)
│  └─ index.json, manifest.json
└─ 3d/                           3D 가 있는 게임만
   ├─ 010_character/             분류 하나 = 폴더 하나
   │  ├─ index.json              분류 안 모델 목록
   │  ├─ <id>.glb                미리보기 모델
   │  ├─ <id>.webp               썸네일
   │  └─ <id>.json               부가 정보(표정, 맵 마커 등, 있는 모델만)
   ├─ _shared/                   여러 모델이 나눠 쓰는 텍스처, 표정 그림, 파츠
   └─ index.json, manifest.json
```

## 3D 미리보기와 원본

| | 어디에 | 내용 |
|---|---|---|
| 미리보기 | 게임 저장소의 `3d/` | 압축한 GLB(메시와 동작 데이터 압축, 동작은 초당 30프레임으로 다시 샘플링), 텍스처 긴 변 512px, 버블파이터 캐릭터와 크레이지아케이드 BnB M 모델은 기본 동작만. 브라우저에서 바로 봅니다 |
| 원본 | 게임 저장소의 **Releases** | 분류마다 zip 하나. 압축하지 않은 GLB, 원래 해상도 PNG 텍스처, 전체 동작. 게임 제작, 편집용입니다 |

Releases 는 저장소에 딸린 내려받기 칸이라 저장소 용량과 Pages 사이트에 들지 않습니다.
그림과 미리보기 모델은 Git LFS 없이 일반 Git 객체로 들어 있습니다(GitHub Pages 는 LFS 포인터를 그대로 내보내기 때문입니다).

## 내 컴퓨터에서 보기

Lab Track 참가 승인을 받은 창작자를 위한 안내입니다. 허브와 보고 싶은 게임 저장소를 한 폴더에 나란히 받고, 그 폴더를 정적 서버로 엽니다.

```bash
git clone https://github.com/NEXON-REPLAY/Boomhill.git
git clone https://github.com/NEXON-REPLAY/Boomhill-BnB.git        # 보고 싶은 게임 저장소
python -m http.server 8090
```

브라우저에서 `http://localhost:8090/Boomhill/` 을 엽니다. 받지 않은 게임은 뷰어에서 읽지 못한다고 나옵니다.
