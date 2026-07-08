from openai import OpenAI

from app.config import (
    LLM_PROVIDER,
    ARK_API_KEY,
    ARK_BASE_URL,
    ARK_MODEL,
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL,
    ZHIPU_API_KEY,
    ZHIPU_BASE_URL,
    ZHIPU_MODEL,
)


class LLMClient:
    def __init__(self, provider: str | None = None):
        provider = provider or LLM_PROVIDER
        if provider == "volcano":
            if not ARK_API_KEY:
                raise ValueError("ARK_API_KEY 未配置")
            if not ARK_MODEL:
                raise ValueError("ARK_MODEL 未配置（填火山方舟推理接入点 ID，形如 ep-xxxxxxxx）")
            self.client = OpenAI(api_key=ARK_API_KEY, base_url=ARK_BASE_URL)
            self.model = ARK_MODEL
        elif provider == "deepseek":
            self.client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
            self.model = DEEPSEEK_MODEL
        elif provider == "zhipu":
            self.client = OpenAI(api_key=ZHIPU_API_KEY, base_url=ZHIPU_BASE_URL)
            self.model = ZHIPU_MODEL
        else:
            raise ValueError(f"unknown provider: {provider}")

    def chat(self, messages: list[dict], stream: bool = False):
        return self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=stream,
        )


_default: LLMClient | None = None


def get_llm() -> LLMClient:
    global _default
    if _default is None:
        _default = LLMClient()
    return _default
