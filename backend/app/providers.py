from typing import Literal, TypedDict

AIProvider = Literal["openai", "deepseek", "mimo", "qwen", "custom"]

PROVIDER_LABELS: dict[AIProvider, str] = {
    "openai": "OpenAI",
    "deepseek": "DeepSeek",
    "mimo": "MiMo",
    "qwen": "Qwen",
    "custom": "Custom",
}


class ProviderDefaults(TypedDict):
    base_url: str
    model: str


PROVIDER_DEFAULTS: dict[AIProvider, ProviderDefaults] = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
    },
    "mimo": {
        "base_url": "https://api.xiaomimimo.com/v1",
        "model": "mimo-v2.5-pro",
    },
    "qwen": {
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen-plus",
    },
    "custom": {
        "base_url": "",
        "model": "",
    },
}


def get_provider_defaults(provider: str) -> ProviderDefaults:
    return PROVIDER_DEFAULTS.get(provider, PROVIDER_DEFAULTS["custom"])  # type: ignore[arg-type]
