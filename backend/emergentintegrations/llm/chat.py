class LlmChat:
    def __init__(self, api_key: str = "", session_id: str = "", system_message: str = ""):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.model_provider = ""
        self.model_name = ""

    def with_model(self, provider: str, model_name: str):
        self.model_provider = provider
        self.model_name = model_name
        return self

    async def stream_message(self, user_msg):
        # Raise an exception to force the application to use its predefined fallbacks
        raise NotImplementedError("LLM streaming not available in local mock")

    async def send_message(self, user_msg):
        raise NotImplementedError("LLM message sending not available in local mock")

class UserMessage:
    def __init__(self, text: str = "", file_contents = None):
        self.text = text
        self.file_contents = file_contents or []

class ImageContent:
    def __init__(self, image_base64: str = ""):
        self.image_base64 = image_base64
