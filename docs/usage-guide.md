# 자료 안내

크레이지아케이드, 크레이지아케이드 BnB M, 버블파이터, 버블파이터 어드벤처, 에어라이더의 2D 이미지와 3D 모델을 열람할 수 있도록 정리한 자료입니다.
이 문서는 무엇이 들어 있고 어떤 조건으로 공개되어 있는지, Lab Track 참가 승인을 받은 창작자가 제공 리소스를 어떻게 받고 쓰는지를 정리합니다.

> 공개되어 있다고 해서 이용이 허락된 것은 아닙니다. 이용 조건은 저장소의 [LICENSE](../terms.html#license) 와 [NOTICE](../terms.html#notice) 를 따릅니다.

## 1. 무엇이 들어 있나

| 게임 | 장르, 플랫폼 | 들어 있는 그림 | 3D 모델 |
|---|---|---|---|
| 크레이지아케이드 | PC 온라인 액션 | 캐릭터, 아바타와 이모션, 맵 타일과 장식, 아이템, 효과, 몬스터, UI | 없음(2D 게임) |
| 크레이지아케이드 BnB M | 모바일 액션(Unity) | UI, 아이템 아이콘, 맵, 몬스터 모드, 효과 | 캐릭터, 코스튬, 탈것, 펫, 몬스터, 액세서리 |
| 버블파이터 | PC 온라인 3인칭 슈팅 | UI, 인게임 HUD와 조준선, 상점 아이템 아이콘, 맵 미리보기와 미니맵 | 캐릭터(동작, 표정), 무기, 장비, NPC, 맵(게임 마커), 연출 장면 |
| 버블파이터 어드벤처 | 모바일 액션(Unity) | UI 낱장 스프라이트, 아이템과 무기 아이콘, 맵 배경, 효과 텍스처, 캐릭터와 맵 텍스처 | 캐릭터, 무기, 맵, 애니메이션 |
| 에어라이더 | PC 온라인 비행 레이싱 | HUD와 게이지, 화면 UI, 대화 상자, 캐릭터와 에어모빌 텍스처, 아이템, 효과, 수집 카드 | 에어모빌, 캐릭터, 트랙, NPC, 보스, 부품 |

2D 는 그림과 그 그림을 쓰는 데 필요한 프레임 정보로 이루어져 있습니다. 모든 그림은 PNG 입니다.
여러 프레임으로 된 그림(버튼 상태, 캐릭터 동작 등)은 한 장의 스프라이트 시트와, 시트 안 프레임 위치를 적은 아틀라스 JSON 이 짝을 이룹니다.

3D 는 두 가지로 냅니다.

| 구분 | 어디에 | 내용 |
|---|---|---|
| 미리보기 | 이 사이트(뷰어) | 압축한 GLB(메시와 동작 데이터 압축, 동작은 초당 30프레임으로 다시 샘플링), 텍스처 긴 변 512px, 버블파이터 캐릭터와 BnB M 모델은 기본 동작만. 브라우저에서 바로 돌려 봅니다 |
| 원본 | 게임 저장소 Releases 의 zip(분류마다) | 압축하지 않은 GLB, 원래 해상도 PNG 텍스처, 전체 동작. 편집용 파일입니다 |

## 2. 이용 조건

이 저장소의 제공 리소스는 열람을 위해 공개되어 있습니다. 공개되어 있다고 해서 이용이 허락된 것은 아닙니다.
복제, 수정, 재배포, 2차적 저작물 작성, 기계 학습을 포함한 모든 이용을 상업적이든 비상업적이든 허락하지 않습니다.
제공 리소스는 NEXON REPLAY Lab Track 이용약관에 동의하고 참가 승인을 받은 창작자만, 이용약관과 IP 활용 가이드가 정한 범위 안에서 이용할 수 있습니다.

아래 3장과 4장은 Lab Track 참가 승인을 받은 창작자를 위한 기술 안내입니다.

## 3. 받는 법

Lab Track 참가 승인을 받은 창작자를 위한 안내입니다. 게임마다 저장소와 사이트가 따로 있습니다.
뷰어, 세계관, 이 안내가 있는 허브 저장소는 [Boomhill](https://github.com/NEXON-REPLAY/Boomhill), 사이트는 [nexon-replay.github.io/Boomhill/](https://nexon-replay.github.io/Boomhill/) 입니다.

| 게임 | 게임 저장소 | 게임 사이트 |
|---|---|---|
| 크레이지아케이드 | [Boomhill-BnB](https://github.com/NEXON-REPLAY/Boomhill-BnB) | [nexon-replay.github.io/Boomhill-BnB/](https://nexon-replay.github.io/Boomhill-BnB/) |
| 크레이지아케이드 BnB M | [Boomhill-BnBM](https://github.com/NEXON-REPLAY/Boomhill-BnBM) | [nexon-replay.github.io/Boomhill-BnBM/](https://nexon-replay.github.io/Boomhill-BnBM/) |
| 버블파이터 | [Boomhill-BubbleFighter](https://github.com/NEXON-REPLAY/Boomhill-BubbleFighter) | [nexon-replay.github.io/Boomhill-BubbleFighter/](https://nexon-replay.github.io/Boomhill-BubbleFighter/) |
| 버블파이터 어드벤처 | [Boomhill-BubbleFighterAdventure](https://github.com/NEXON-REPLAY/Boomhill-BubbleFighterAdventure) | [nexon-replay.github.io/Boomhill-BubbleFighterAdventure/](https://nexon-replay.github.io/Boomhill-BubbleFighterAdventure/) |
| 에어라이더 | [Boomhill-AirRider](https://github.com/NEXON-REPLAY/Boomhill-AirRider) | [nexon-replay.github.io/Boomhill-AirRider/](https://nexon-replay.github.io/Boomhill-AirRider/) |

아래에서 `<게임 사이트>` 는 위 표의 게임 사이트 주소(예: `https://nexon-replay.github.io/Boomhill-BnB/`)입니다.

| 방법 | 언제 | 어떻게 |
|---|---|---|
| 뷰어에서 하나씩 | 그림 몇 장만 필요할 때 | 뷰어에서 그림을 고르고 'PNG 내려받기', '아틀라스 JSON'. 3D 는 '미리보기 GLB', 편집용은 '원본 zip' |
| 3D 원본 묶음 | 모델을 게임, 편집 도구에서 쓸 때 | 게임 저장소의 Releases 에서 `<게임>-3d-<분류>.zip` 을 받는다(분류마다 하나, 큰 분류는 여러 부) |
| 주소로 바로 | 웹 페이지, 코드에서 바로 쓸 때 | `<게임 사이트>2d/<묶음>/<id>.png` |
| 한 게임 통째로 | 그 게임이 전부 필요할 때 | 게임 저장소를 `git clone` (그림은 Git LFS 없이 일반 파일로 들어 있다) |
| 내 컴퓨터에서 뷰어로 | 받은 것을 뷰어로 볼 때 | 허브와 게임 저장소를 한 폴더에 나란히 받고, 그 폴더를 정적 서버로 연다 |

```bash
git clone https://github.com/NEXON-REPLAY/Boomhill.git
git clone https://github.com/NEXON-REPLAY/Boomhill-BnB.git        # 보고 싶은 게임 저장소
python -m http.server 8090      # http://localhost:8090/Boomhill/
```

## 4. 코드에서 쓰는 법

### 웹 Canvas

아틀라스 JSON 의 `frames` 를 읽어 시트에서 잘라 그립니다. `animations` 가 있으면 그 순서와 지연(`frame_ms`)대로 넘깁니다.

```js
const base = 'https://nexon-replay.github.io/Boomhill-BnB/2d/060_effect/';
const atlas = await (await fetch(base + 'Bomb__Bomb00.json')).json();
const sheet = new Image();
sheet.src = base + atlas.sheet.file;
await sheet.decode();
const ctx = document.querySelector('canvas').getContext('2d');
ctx.imageSmoothingEnabled = false;            // 픽셀 그림은 보간하지 않는다
const anim = atlas.animations[0];
let step = 0;
(function draw() {
  const f = atlas.frames[anim.frames[step]];
  ctx.clearRect(0, 0, 256, 256);
  ctx.drawImage(sheet, f.x, f.y, f.w, f.h, 0, 0, f.w * 2, f.h * 2);
  setTimeout(draw, anim.frame_ms[step]);       // 원본 지연대로
  step = (step + 1) % anim.frames.length;
})();
```

움직이는 예는 [기술 예시](../demo.html)에서 바로 볼 수 있습니다.

### Phaser, PixiJS

두 엔진이 읽는 'JSON Hash' 아틀라스로 바꾸면 그대로 씁니다.

```js
function toJsonHash(atlas) {
  const frames = {};
  for (const f of atlas.frames) {
    if (!f.w) continue;                          // 빈 프레임은 건너뛴다
    frames[`${atlas.name}#${f.index}`] = { frame: { x: f.x, y: f.y, w: f.w, h: f.h } };
  }
  return { frames, meta: { image: atlas.sheet.file, size: { w: atlas.sheet.w, h: atlas.sheet.h }, scale: 1 } };
}
// Phaser: this.load.atlas('key', sheetUrl, toJsonHash(atlas))
```

### 3D 모델(GLB)

사이트의 미리보기 모델은 용량을 줄이려고 glTF 확장 네 가지를 씁니다. 웹에서는 three.js 의 GLTFLoader 에 meshopt 디코더만 붙이면 그대로 읽힙니다.
게임 엔진, 편집 도구(Unity, Godot, Blender 등)에서는 원본 zip 의 GLB 를 쓰세요. 원본은 이 확장을 쓰지 않는 평범한 glTF 2.0 이고 텍스처는 PNG 입니다.

| 확장 | 하는 일 |
|---|---|
| `EXT_meshopt_compression`, `KHR_mesh_quantization` | 정점, 인덱스, 동작 자료 압축(디코더가 필요하다) |
| `EXT_texture_webp` | 맵, 트랙처럼 텍스처를 많이 나눠 쓰는 모델은 텍스처를 `_shared/textures/` 의 WebP(미리보기, 긴 변 512px)로 두고 GLB 가 상대 경로로 가리킨다 |
| `KHR_materials_unlit` | 에어라이더 모델은 원작처럼 조명을 받지 않는다 |

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const gltf = await loader.loadAsync('https://nexon-replay.github.io/Boomhill-BubbleFighter/3d/010_character/<id>.glb');
scene.add(gltf.scene);
const mixer = new THREE.AnimationMixer(gltf.scene);
mixer.clipAction(gltf.animations[0]).play();    // 캐릭터는 동작 클립이 함께 들어 있다
```

- 원본 zip 구성은 게임 사이트의 `3d/` 와 같습니다: `<번호_분류>/<id>.glb`, `<id>.json`(버블파이터 캐릭터는 전체 동작의 표정 시간표, 맵은 게임 마커), `_shared/faces/`(표정 그림).
- 미리보기 GLB 를 따로 받을 때: 텍스처를 밖에 두는 모델(맵 등)은 GLB 와 `_shared/textures/` 를 사이트와 같은 구조로 받아야 텍스처가 붙습니다.
- 버블파이터 어드벤처는 원작(Unity)처럼 '조립'입니다. 파츠 GLB 와, 파츠마다 입힐 재질(텍스처, 툰 램프, 틴트, 외곽선), 배치(위치, 회전, 배율)를 적은 조립 정보가 따로 있습니다. 조립 규칙은 뷰어의 `viewer/plugins/bubblefighter-adventure.js` 에 있습니다.

### Unity, Godot

- Unity: PNG 를 Sprite(Multiple)로 가져온 뒤, 아틀라스의 사각형으로 Sprite Editor 의 칸을 만듭니다. 시트 좌표는 왼쪽 위가 원점이고 Unity 는 왼쪽 아래가 원점이므로 `y` 를 `시트 높이 - y - h` 로 바꿉니다.
- Godot: `AtlasTexture` 의 `region` 에 프레임 사각형을 그대로 넣습니다(왼쪽 위 원점이 같습니다).
- 픽셀 그림은 필터를 끕니다(Unity Filter Mode: Point, Godot: Nearest).

## 5. 형식

| 파일 | 어디에 | 내용 |
|---|---|---|
| `games/index.json` | 허브 | 게임 목록, 게임마다 사이트 주소(`base`, `models.base`), 묶음, 합계 |
| `README.md` | 게임 저장소 | 그 게임에 무엇이 몇 개 있는지, 원본 zip 받는 곳 |
| `2d/<묶음>/index.json` | 게임 저장소 | 묶음 안 그림 목록(id, 원래 이름, 시트 크기, 프레임 수) |
| `2d/<묶음>/<id>.png` | 게임 저장소 | 그림(여러 프레임이면 스프라이트 시트) |
| `2d/<묶음>/<id>.json` | 게임 저장소 | 아틀라스(프레임 사각형, 기준점, 애니메이션). 프레임이 하나뿐인 그림에는 없습니다 |
| `2d/manifest.json`, `3d/manifest.json` | 게임 저장소 | 파일마다 크기와 SHA-256 |
| `3d/index.json` | 게임 저장소 | 3D 분류 목록 |
| `3d/<번호_분류>/index.json` | 게임 저장소 | 분류 안 모델 목록(id, 원래 이름, 파일, 통계, 보기 힌트, 썸네일) |
| `3d/<번호_분류>/<id>.glb`, `.webp`, `.json` | 게임 저장소 | 미리보기 모델, 썸네일, 부가 정보(표정, 맵 마커, 조립) |
| `3d/_shared/` | 게임 저장소 | 여러 모델이 나눠 쓰는 텍스처, 표정 그림, 조립 파츠 |

크레이지아케이드(`bnb` 형식)는 모든 그림에 아틀라스가 있고, 매니페스트 이름이 `2d/bundle-manifest.json` 입니다. 필드 이름은 같습니다.
3D 폴더는 게임 목록의 `models.base`, 원본 zip 목록은 `models.originals` 입니다.
자세한 형식은 허브 저장소의 `docs/format.md` 에 있습니다.

## 6. 갱신

- 묶음은 생성기로만 만들며 같은 원천이면 같은 바이트가 나옵니다. 갱신하면 `manifest.json` 의 해시가 바뀝니다.
- 그림에 문제가 있으면 그 게임 저장소의 이슈로 알려 주세요.
