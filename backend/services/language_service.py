def detect_language(text: str) -> str:
    text = text.lower()

    telugu_chars = any("\u0c00" <= c <= "\u0c7f" for c in text)
    hindi_chars = any("\u0900" <= c <= "\u097f" for c in text)

    if telugu_chars:
        return "telugu"

    if hindi_chars:
        return "hindi"

    if any(word in text for word in ["namaskaram", "telugu"]):
        return "telugu"

    if any(word in text for word in ["namaste", "hindi"]):
        return "hindi"

    return "english"