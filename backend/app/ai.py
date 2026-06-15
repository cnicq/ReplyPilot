import json

import httpx

from app.config import settings as app_settings


async def call_ai(*, api_key: str, base_url: str, model: str, prompt: str) -> list[dict]:
    key = api_key or app_settings.ai_api_key
    if not key:
        raise ValueError("请在后端 .env 中配置 AI_API_KEY")

    url = (base_url or app_settings.ai_base_url).rstrip("/")
    model_name = model or app_settings.ai_model

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{url}/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
            },
            json={
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.8,
                "response_format": {"type": "json_object"},
            },
        )

    if response.status_code != 200:
        raise ValueError(f"AI API 请求失败 ({response.status_code}): {response.text}")

    data = response.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not content:
        raise ValueError("AI API 返回内容为空")

    parsed = json.loads(content)
    replies = parsed.get("replies")
    if not isinstance(replies, list):
        raise ValueError("AI API 返回格式不正确")

    return replies
