# 형식

모든 JSON 은 UTF-8, LF, 키 정렬, 들여쓰기 1칸이다. 좌표는 픽셀이고 원점은 시트의 왼쪽 위다.

게임마다 저장소가 하나이고 그 맨 위에 `2d/`(그림), `3d/`(미리보기 모델), `README.md`(안내)가 있다. 게임 목록 `games/index.json` 은 허브 저장소에 있다.

## 게임 목록 `games/index.json` (`boomhill-open-assets/site/v1`)

허브 저장소에 있고 뷰어가 처음 읽는다. 게임마다 자료 주소(`base`, `models.base`)가 그 게임 저장소의 사이트를 가리킨다.

| 키 | 뜻 |
|---|---|
| `games[].id` | 게임 id(`bnb`, `bnb-mobile`, `bubblefighter`, `bubblefighter-adventure`, `airrider`) |
| `games[].format` | `boomhill` 또는 `bnb`(크레이지아케이드, 아래 참고) |
| `games[].base` | 2D 묶음 폴더 주소(허브에서 본 게임 사이트의 `2d/`, 예: `../<게임 저장소>/2d/`). 묶음 색인은 `<base><묶음>/index.json` |
| `games[].groups[]` | 묶음 `id`, `title`, `count`(그림 수), `frames`(프레임 수) |
| `games[].totals` | 그림, 프레임, 바이트 합계 |
| `games[].pending` | 묶음이 아직 없으면 `true` |
| `games[].repo` | 게임 저장소 `name`(이름), `url`(저장소 주소), `site`(허브에서 본 사이트 주소) |

## 묶음 색인 `<base><묶음>/index.json` (`boomhill-open-assets/index/v1`)

| 키 | 뜻 |
|---|---|
| `assets[].id` | 그림 id. 파일 이름이 `<id>.png`, `<id>.json` 이다. 원래 경로의 폴더 구분을 `__` 로 바꾼 것이고, ASCII 로 옮길 수 없는 글자가 있으면 원래 경로 해시 8자가 붙는다 |
| `assets[].name` | 원래 파일 이름(확장자 제외, 폴더는 `/`) |
| `assets[].sheet` | 시트 크기 `{w, h}` |
| `assets[].frames` | 프레임 수 |
| `assets[].atlas` | `true` 면 아틀라스 `<id>.json` 이 있다(프레임이 둘 이상이거나 기준점이 있는 그림) |
| `assets[].first` | 첫 프레임 사각형 `{x, y, w, h}`(아틀라스가 있을 때, 목록 미리보기용) |

## 아틀라스 `<base><묶음>/<id>.json` (`boomhill-open-assets/atlas/v1`)

```json
{
 "schema": "boomhill-open-assets/atlas/v1",
 "game": "bubblefighter",
 "group": "010_ui",
 "name": "AllStage/LoadingBar/LoadingBar01",
 "sheet": {"file": "AllStage__LoadingBar__LoadingBar01.png", "w": 204, "h": 44},
 "frames": [{"index": 0, "x": 1, "y": 1, "w": 202, "h": 14, "origin": {"x": 2, "y": 2}}, "… 3개 더"],
 "animations": []
}
```

| 키 | 뜻 |
|---|---|
| `frames[].x, y, w, h` | 시트 안 프레임 사각형 |
| `frames[].origin` | 프레임 기준점 `{x, y}`(원본이 기록한 값 그대로. 게임마다 쓰임이 다를 수 있다) |
| `frames[].empty` | `true` 면 그림이 없는 빈 프레임(BnB) |
| `frames[].role` | 프레임 쓰임 표시(BnB, 없을 수 있다) |
| `animations[]` | `name`, `frames`(프레임 `index` 재생 순서), `frame_ms`(단계별 지연), `loop`. 원본에 지연 정보가 없으면 비어 있다 |

버블파이터의 여러 프레임 그림은 원본 시트를 그대로 싣고 원본 스프라이트 정의의 사각형을 옮겼다(버튼의 보통, 올림, 누름 상태 등).
크레이지아케이드(`bnb` 형식)는 별도 생성기가 프레임을 새 시트로 모은 것이며 필드 이름이 같다.

## 매니페스트 `2d/manifest.json`, `3d/manifest.json`(게임 저장소) (`boomhill-open-assets/manifest/v1`)

| 키 | 뜻 |
|---|---|
| `files[]` | 매니페스트가 있는 폴더(`2d/`, `3d/`) 기준 경로, 바이트, SHA-256 |
| `totals` | 파일, 바이트, 그림, 프레임 수 |

## 3D 모델

게임 목록의 게임 항목에 `models` 가 있으면 3D 모델이 있습니다.

```json
"models": { "base": "../<게임 저장소>/3d/",
            "categories": [{ "id": "3d_character", "dir": "010_character", "title": "캐릭터", "count": 167 }],
            "totals": { "models": 1795, "bytes": 0 } }
```

`base` 는 3D 폴더(게임 사이트의 `3d/`)입니다. 분류 폴더는 `dir`(010 부터 10 씩), `id` 는 뷰어 주소, 목록에서 쓰는 이름입니다. `originals` 가 있으면 원본 zip 목록입니다.

```json
"originals": { "base": "https://github.com/NEXON-REPLAY/<게임 저장소>/releases/download/3d-originals-v1/",
               "files": { "3d_map": [{ "name": "bubblefighter-3d-map.zip", "bytes": 0, "count": 0 }] } }
```

원본 zip 은 압축하지 않은 GLB(텍스처 PNG 안에)와 부가 파일을 분류마다 묶은 것입니다. GitHub Releases 의 파일 한도(2GB) 때문에 큰 분류는 `-2`, `-3` 으로 나눕니다.

### 분류 목록 `<base>index.json` (`boomhill-open-assets/models/v1`)

| 키 | 뜻 |
|---|---|
| `categories[]` | `id`, `dir`(분류 폴더), `title`, `count`, `list`(`<dir>/index.json`) |
| `plugin` | 뷰어가 쓰는 게임별 보정(`viewer/plugins/<plugin>.js`). 없으면 기본 보기 |
| `render` | 기본 배경, 반구광, 방향광 |

### 분류 안 모델 `<base><dir>/index.json` (`boomhill-open-assets/model-list/v1`)

모델 하나의 파일은 분류 폴더에 나란히 있습니다: `<id>.glb`(모델), `<id>.webp`(썸네일), `<id>.json`(부가 정보, 있는 모델만).
여러 모델이 나눠 쓰는 파일은 `<base>_shared/` 아래 `textures/`, `faces/`, `parts/` 에 '원래 이름_짧은 해시' 이름으로 있습니다.

| 키 | 뜻 |
|---|---|
| `id`, `name`, `label` | 파일 이름에 쓰는 id, 원래 이름, 표시 이름 |
| `file`, `bytes` | GLB 경로(`<base>` 기준, 예: `010_character/<id>.glb`), 크기 |
| `stats` | `triangles`, `bones`, `animations`, `textures`, `vertices`, `duration`, `channels` 중 아는 것 |
| `view` | `front`(`-Z` 면 정면이 −Z), `bounds{min,max}`(프레이밍 상자), `hide`/`hideLabel`(기본으로 숨기는 노드 이름 정규식, 예: 하늘), `clipAutoplay`(처음 재생할 동작 정규식), `clipLabelTrim` |
| `thumb` | 목록 썸네일(WebP) |
| `markers` | 버블파이터 무기, NPC: 뼈 이름 → 바인드 포즈 좌표(발사 지점, 쥐는 위치 등) |
| `mapMarkers` | 버블파이터 맵: `file`(게임 마커 JSON: `helpers[{group,pos}]`, `spawn_count`, `navi`), `scale`, `flipZ` |
| `detail` | 부가 정보 JSON. 버블파이터 캐릭터는 표정(`face.frames` 이름 → PNG, `face.timelines` 동작 → `[[초, 표정]]`), 어드벤처 맵, 씬은 조립 정보 |
| `assembly` | 어드벤처 조립: `type`(character, weapon, map, scene, anim), `parts[{glb, mats, scale, pos, rot, sub, collision, sky, active}]`, `materials[{tex, ramp, toon, color, tint, outline, outlineColor, alpha}]`, `maps`(씬의 맵 id), `sizeRef`(크기 대조 캐릭터 id), `base`(애니메이션을 입힐 캐릭터 id) |

### GLB

- glTF 2.0 바이너리. 쓰는 확장: `EXT_meshopt_compression`, `KHR_mesh_quantization`, `EXT_texture_webp`, `KHR_materials_unlit`.
- 노드, 메시, 재질, 동작 이름은 원래 이름입니다(뷰어 보정이 이름으로 찾습니다). `extras` 와 생성기 정보는 싣지 않습니다.
- 안의 이미지는 메타데이터 없는 PNG, 밖의 이미지는 `_shared/textures/<원래 이름>_<해시>.webp`(미리보기용 긴 변 512px, 메타데이터 없음)입니다.
- 미리보기에서 버블파이터 캐릭터는 동작을 기본 세트만 담습니다. `stats.animations` 는 담은 수, `stats.animationsOriginal` 은 원본의 수입니다.
- 모델 폴더마다 `manifest.json`(파일별 크기, SHA-256)이 있습니다.
