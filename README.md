# AI Nutrition Coach

AI 기반 맞춤형 식단 관리 웹 앱입니다. 회원가입/로그인 없이 바로 사용할 수 있으며, 웹과 모바일 브라우저 모두에서 앱 형태로 동작합니다.

## 주요 기능

- **간편 시작**: 기기 ID 기반으로 별도 회원가입 없이 신체 정보 입력 후 바로 이용
- **맞춤 영양 목표**: 성별, 나이, 키, 몸무게, 운동 목표, 인바디 수치 기반 BMR·칼로리·탄단지 자동 계산
- **음식 사진 분석**: 아침/점심/저녁/간식별 사진 업로드 → ResNet18 기반 Food-101 분류 모델로 음식 인식
- **영양소 자동 계산**: 분류된 음식에 대한 칼로리·탄수화물·단백질·지방 자동 산출
- **대시보드**: 일별 섭취량, 목표 대비 진행률 바 차트·링 차트
- **AI 식단 추천**: 부족/과다 영양소 분석 후 다음 식사 메뉴 제안

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Python FastAPI, SQLAlchemy, SQLite |
| AI | PyTorch, torchvision ResNet18 (Food-101) |

## 실행 방법

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> 스키마가 변경된 경우 `backend/test.db` 파일을 삭제한 후 서버를 재시작하세요.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 사용 흐름

1. 첫 접속 시 **신체 정보 입력** (온보딩)
2. 자동 계산된 영양 목표 확인
3. **음식 사진 업로드** → AI 분석
4. **대시보드**에서 섭취 현황·차트·추천 식단 확인

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/users/profile/status` | 프로필 존재 여부 |
| POST | `/api/users/setup` | 신체 정보 등록/수정 |
| GET | `/api/users/profile` | 프로필 조회 |
| POST | `/api/meals/upload` | 음식 이미지 업로드·분석 |
| GET | `/api/meals/summary` | 일별 영양 요약 |
| GET | `/api/recommendations/dashboard` | 대시보드 통합 데이터 |

모든 API는 `X-Device-Id` 헤더로 사용자를 식별합니다.

## AI 모델

- `backend/app/ml/food101_resnet18.pth` 가중치 파일이 있으면 실제 Food-101 모델로 분류
- 없으면 데모 모드로 동작 (랜덤 음식 + 영양 DB 기반 추정)
- `nutrition_db.json`에 100+ 음식 영양 정보 포함

## 확장 포인트

- Food-101 사전학습 가중치 추가
- PostgreSQL 프로덕션 DB 연동
- 클라우드 이미지 스토리지 (S3 등)
- 한국 음식 전용 분류 모델 학습
