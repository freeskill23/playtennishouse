# 코코스퍼니쳐 | COCOS FURNITURE

맞춤형 반려동물 가구 플랫폼 — 자작나무 합판으로 만드는 코코스핏 하우스.

## 사이트 주소

**https://freeskill23.github.io/cocos/**

## 관리자 페이지

- 주소: **https://freeskill23.github.io/cocos/#/admin**
- 이메일: `admin@cocosfurniture.kr`
- 비밀번호: `cocos2024!`

> 배포 후 첫 로그인 시 비밀번호를 반드시 변경하세요.

## GitHub Pages 배포 방법

### 1. 환경 변수(시크릿) 등록

GitHub 저장소 **Settings** → **Secrets and variables** → **Actions** → **New repository secret** 에서 다음 두 값을 등록:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `.env` 파일에 있는 `VITE_SUPABASE_URL` 값 |
| `VITE_SUPABASE_ANON_KEY` | `.env` 파일에 있는 `VITE_SUPABASE_ANON_KEY` 값 |

### 2. GitHub Pages 활성화

**Settings** → **Pages** → **Source**를 **GitHub Actions**로 설정

### 3. 자동 배포 확인

`main` 브랜치에 push 하면 자동으로 배포됩니다. **Actions** 탭에서 진행 상황을 확인할 수 있습니다.

## 로컬 개발

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

빌드 결과는 `dist/` 폴더에 생성됩니다.
