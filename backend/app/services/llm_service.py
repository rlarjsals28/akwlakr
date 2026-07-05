import json
import os
import re
import urllib.error
import urllib.request
from typing import Literal

from .. import models

GOAL_LABELS = {
    "weight_loss": "체중 감량",
    "maintenance": "체중 유지",
    "weight_gain": "근육/체중 증가",
}


def _goal_label(goal) -> str:
    value = goal.value if hasattr(goal, "value") else str(goal)
    return GOAL_LABELS.get(value, value)


def build_user_context(user: models.User) -> str:
    lines = [
        f"- 닉네임: {user.nickname or '사용자'}",
        f"- 성별: {user.gender}",
        f"- 나이: {user.age}세",
        f"- 키: {user.height_cm}cm, 몸무게: {user.weight_kg}kg",
        f"- 운동 목표: {_goal_label(user.goal)}",
    ]
    if user.skeletal_muscle_mass:
        lines.append(f"- 골격근량: {user.skeletal_muscle_mass}kg")
    if user.body_fat_percentage:
        lines.append(f"- 체지방률: {user.body_fat_percentage}%")
    if user.daily_calories:
        lines.append(f"- 권장 칼로리: {user.daily_calories}kcal")
    if user.protein_g:
        lines.append(f"- 단백질 목표: {user.protein_g}g")
    return "\n".join(lines)


def build_system_prompt(user: models.User) -> str:
    return f"""당신은 전문 피트니스 코치입니다. 사용자와 대화하며 맞춤 운동 루틴을 설계해 주세요.

사용자 프로필:
{build_user_context(user)}

지침:
- 한국어로 친절하고 명확하게 답변하세요.
- 운동 경험, 가능한 장비, 주당 운동 가능 일수, 부상 여부를 먼저 파악하세요.
- 루틴을 제안할 때는 요일별로 구체적인 운동, 세트/반복, 휴식 시간을 포함하세요.
- 사용자 목표({_goal_label(user.goal)})에 맞는 강도와 볼륨을 조절하세요.
- 의학적 진단이나 처방은 하지 마세요. 통증이 있으면 전문의 상담을 권하세요.
- 답변은 읽기 쉽게 짧은 문단과 목록을 사용하세요."""


def _detect_level(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ["초보", "입문", "처음", "시작"]):
        return "beginner"
    if any(word in lowered for word in ["고급", "숙련", "3년", "오래"]):
        return "advanced"
    if any(word in lowered for word in ["중급", "1년", "6개월"]):
        return "intermediate"
    return "beginner"


def _detect_focus(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ["상체", "가슴", "등", "어깨", "팔"]):
        return "upper"
    if any(word in lowered for word in ["하체", "다리", "엉덩이", "둔근", "허벅지"]):
        return "lower"
    if any(word in lowered for word in ["유산소", "러닝", "달리기", "걷기", "사이클"]):
        return "cardio"
    if any(word in lowered for word in ["전신", "풀바디", "full"]):
        return "full"
    if any(word in lowered for word in ["복근", "코어", "복부"]):
        return "core"
    return "full"


def _detect_days(text: str) -> int:
    match = re.search(r"(\d)\s*일", text)
    if match:
        return max(2, min(6, int(match.group(1))))
    if "매일" in text:
        return 6
    if "주 3" in text or "3일" in text:
        return 3
    if "주 4" in text or "4일" in text:
        return 4
    if "주 5" in text or "5일" in text:
        return 5
    return 3


def _detect_location(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ["헬스장", "짐", "gym"]):
        return "gym"
    if any(word in lowered for word in ["홈트", "집", "맨몸", "덤벨"]):
        return "home"
    return "gym"


def _build_routine(user: models.User, text: str) -> str:
    level = _detect_level(text)
    focus = _detect_focus(text)
    days = _detect_days(text)
    location = _detect_location(text)
    goal = user.goal.value if hasattr(user.goal, "value") else str(user.goal)

    sets_reps = {
        "beginner": "3세트 × 10~12회, 세트 간 60~90초 휴식",
        "intermediate": "4세트 × 8~12회, 세트 간 60초 휴식",
        "advanced": "4~5세트 × 6~10회, 세트 간 45~75초 휴식",
    }[level]

    exercises = {
        "upper": {
            "gym": ["벤치프레스", "랫풀다운", "덤벨 숄더프레스", "케이블 로우", "딥스/푸시다운"],
            "home": ["푸시업", "덤벨 로우", "숄더 프레스", "딥스(의자)", "팔굽혀펴기 변형"],
        },
        "lower": {
            "gym": ["스쿼트", "루마니안 데드리프트", "레그프레스", "런지", "레그 컬"],
            "home": ["스쿼트", "런지", "글루트 브릿지", "불가리안 스플릿 스쿼트", "카프 레이즈"],
        },
        "core": {
            "gym": ["플랭크", "케이블 크런치", "행잉 레그레이즈", "데드버그", "사이드 플랭크"],
            "home": ["플랭크", "데드버그", "러시안 트위스트", "마운틴 클라이머", "사이드 플랭크"],
        },
        "cardio": {
            "gym": ["트레드밀 인터벌 20분", "사이클 25분", "로잉 15분", "스텝퍼 15분"],
            "home": ["빠른 걷기 30분", "점프 로프 15분", "버피 5분 × 3라운드", "계단 오르기 20분"],
        },
        "full": {
            "gym": ["스쿼트", "벤치프레스", "랫풀다운", "오버헤드 프레스", "플랭크"],
            "home": ["스쿼트", "푸시업", "런지", "글루트 브릿지", "플랭크"],
        },
    }

    day_templates = {
        3: ["전신 A", "유산소 + 코어", "전신 B"],
        4: ["상체", "하체", "유산소 + 코어", "전신"],
        5: ["상체", "하체", "유산소", "상체", "하체"],
        6: ["상체", "하체", "유산소", "상체", "하체", "코어 + 유산소"],
    }
    schedule = day_templates.get(days, day_templates[3])

    if focus != "full" and focus != "cardio":
        for index, label in enumerate(schedule):
            if "전신" in label:
                schedule[index] = {"upper": "상체", "lower": "하체", "core": "코어"}[focus]

    lines = [
        f"{user.nickname or '회원'}님을 위한 주 {days}일 {_goal_label(user.goal)} 루틴입니다.",
        f"수준: {level} / 장소: {'헬스장' if location == 'gym' else '홈트'} / 초점: {focus}",
        "",
    ]

    for index, day_label in enumerate(schedule, start=1):
        if "유산소" in day_label:
            picked = exercises["cardio"][location]
        elif "코어" in day_label:
            picked = exercises["core"][location]
        elif "상체" in day_label:
            picked = exercises["upper"][location]
        elif "하체" in day_label:
            picked = exercises["lower"][location]
        else:
            picked = exercises["full"][location]

        lines.append(f"**Day {index} — {day_label}**")
        for exercise in picked:
            lines.append(f"- {exercise}: {sets_reps}")
        lines.append("")

    if goal == "weight_loss":
        lines.append("💡 체중 감량 팁: 각 세션 끝에 15~20분 저강도 유산소를 추가하고, 세트 간 휴식을 짧게 유지하세요.")
    elif goal == "weight_gain":
        lines.append("💡 근비대 팁: 점진적 과부하(무게/반복 증가)를 적용하고, 세트 간 충분한 휴식과 단백질 섭취를 챙기세요.")
    else:
        lines.append("💡 유지 팁: 주 2~3회 근력 + 주 2회 유산소로 균형을 맞추세요.")

    lines.append("")
    lines.append("원하시면 운동 난이도, 특정 부위, 또는 홈트/헬스장 버전으로 다시 조정해 드릴게요.")
    return "\n".join(lines)


def _build_welcome_message(user: models.User) -> str:
    goal = _goal_label(user.goal)
    return (
        f"안녕하세요, {user.nickname or '회원'}님! 💪\n\n"
        f"저는 AI 운동 코치입니다. 현재 목표는 **{goal}**이시네요.\n"
        f"맞춤 운동 루틴을 함께 만들어 볼까요?\n\n"
        "아래 정보를 알려주시면 더 정확한 루틴을 짜드릴 수 있어요:\n"
        "- 운동 경험 (초보/중급/고급)\n"
        "- 주당 운동 가능 일수 (예: 주 3일)\n"
        "- 헬스장 또는 홈트레이닝\n"
        "- 집중하고 싶은 부위 (상체/하체/전신)\n\n"
        "예: \"초보자인데 주 3일 헬스장에서 다이어트 루틴 짜줘\""
    )


def _local_response(user: models.User, history: list[dict], user_message: str) -> str:
    lowered = user_message.lower()

    if any(word in lowered for word in ["안녕", "hello", "hi", "시작"]):
        return _build_welcome_message(user)

    if any(word in lowered for word in ["루틴", "운동", "추천", "짜", "계획", "프로그램", "schedule"]):
        return _build_routine(user, user_message)

    if any(word in lowered for word in ["상체", "하체", "전신", "유산소", "복근", "코어"]):
        return _build_routine(user, user_message)

    if any(word in lowered for word in ["스트레칭", "warm", "워밍"]):
        return (
            "운동 전 워밍업 추천 (5~8분):\n"
            "- 팔 돌리기 30초\n"
            "- 고관절 서클 30초\n"
            "- 월드 그레이티스트 스트레치 각쪽 30초\n"
            "- 가벼운 스쿼트 15회\n"
            "- 점프잭 또는 제자리 걷기 1분\n\n"
            "운동 후 쿨다운은 정적 스트레칭 5분을 권장합니다."
        )

    if any(word in lowered for word in ["부상", "아프", "통증", "다쳤"]):
        return (
            "통증이 있다면 무리한 운동은 피하시고 전문의 상담을 먼저 받으시는 것이 좋습니다.\n\n"
            "가벼운 재활 단계로는 통증 부위를 자극하지 않는 범위의 가동성 운동, "
            "저강도 유산소, 코어 안정화 운동을 고려할 수 있습니다. "
            "어떤 부위가 불편한지 알려주시면 대체 운동을 제안해 드릴게요."
        )

    if any(word in lowered for word in ["단백질", "식단", "영양", "칼로리", "먹"]):
        protein = user.protein_g or round(user.weight_kg * 1.8, 1)
        calories = user.daily_calories or "목표"
        return (
            f"운동과 함께 영양도 중요합니다!\n\n"
            f"현재 설정된 권장 칼로리는 **{calories}kcal**, 단백질 목표는 **{protein}g**입니다.\n"
            "- 운동 전: 탄수화물 위주 가벼운 식사\n"
            "- 운동 후 30분 이내: 단백질 + 탄수화물 섭취\n"
            "- 수분: 하루 2L 이상\n\n"
            "대시보드에서 오늘 식단 기록도 함께 확인해 보세요."
        )

    # Default: offer to build routine
    return (
        "말씀해 주신 내용을 바탕으로 도와드릴게요.\n\n"
        "맞춤 루틴을 바로 만들어 드릴 수 있습니다. 아래처럼 요청해 보세요:\n"
        '- "초보자 주 3일 헬스장 다이어트 루틴"\n'
        '- "홈트로 상체 운동 4일 루틴"\n'
        '- "하체 집중 근력 루틴"\n\n'
        "운동 경험, 가능한 일수, 장소를 알려주시면 더 정확하게 설계해 드립니다."
    )


def _call_openai(system_prompt: str, messages: list[dict]) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}, *messages],
        "temperature": 0.7,
        "max_tokens": 1200,
    }

    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"].strip()
    except (urllib.error.URLError, KeyError, json.JSONDecodeError, TimeoutError):
        return None


def generate_workout_reply(
    user: models.User,
    history: list[models.WorkoutChatMessage],
    user_message: str,
) -> tuple[str, Literal["openai", "local"]]:
    system_prompt = build_system_prompt(user)
    chat_messages = [{"role": msg.role, "content": msg.content} for msg in history]
    chat_messages.append({"role": "user", "content": user_message})

    openai_reply = _call_openai(system_prompt, chat_messages)
    if openai_reply:
        return openai_reply, "openai"

    return _local_response(user, chat_messages, user_message), "local"


def get_welcome_message(user: models.User) -> str:
    return _build_welcome_message(user)
