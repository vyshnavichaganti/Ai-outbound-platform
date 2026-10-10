"""
counselor_service.py
Loads knowledge base (courses, FAQs, workshops) and generates
AI career counselor responses using Gemini.
"""
from dotenv import load_dotenv
load_dotenv()

import json
import logging
import os
from pathlib import Path
from typing import Optional

import google.generativeai as genai

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
PROMPT_DIR = BASE_DIR / "prompts"


class CounselorService:
    """
    Manages the AI career counselor knowledge base and Gemini interactions.
    Stateless per call — conversation history is passed in by the caller.
    """

    def __init__(self):
        self._courses: list[dict] = []
        self._faqs: list[dict] = []
        self._workshops: list[dict] = []
        self._prompt_template: str = ""
        self._model = None
        self._initialized: bool = False

    # ── Initialization ────────────────────────────────────────────────────────

    def initialize(self) -> None:
        """Load all data files and configure Gemini. Call once at app startup."""
        self._courses = self._load_json("courses.json").get("courses", [])
        self._faqs = self._load_json("faq.json").get("faqs", [])
        self._workshops = self._load_json("workshops.json").get("workshops", [])
        self._prompt_template = self._load_prompt("career_counselor.txt")

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable not set.")
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel("gemini-2.5-flash")

        self._initialized = True
        logger.info(
            "CounselorService initialized — %d courses, %d FAQs, %d workshops loaded.",
            len(self._courses),
            len(self._faqs),
            len(self._workshops),
        )

    def _ensure_initialized(self) -> None:
        if not self._initialized:
            self.initialize()

    # ── Data Loaders ──────────────────────────────────────────────────────────

    @staticmethod
    def _load_json(filename: str) -> dict:
        path = DATA_DIR / filename
        if not path.exists():
            raise FileNotFoundError(f"Knowledge base file not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def _load_prompt(filename: str) -> str:
        path = PROMPT_DIR / filename
        if not path.exists():
            raise FileNotFoundError(f"Prompt file not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    # ── Public Accessors ──────────────────────────────────────────────────────

    def get_courses(self) -> list[dict]:
        """Return all courses from the knowledge base."""
        self._ensure_initialized()
        return self._courses

    def get_faqs(self) -> list[dict]:
        """Return all FAQs from the knowledge base."""
        self._ensure_initialized()
        return self._faqs

    def get_workshops(self) -> list[dict]:
        """Return all workshops from the knowledge base."""
        self._ensure_initialized()
        return self._workshops

    def get_course_by_id(self, course_id: str) -> Optional[dict]:
        """Return a single course dict by ID, or None."""
        self._ensure_initialized()
        return next(
            (c for c in self._courses if c["id"].upper() == course_id.upper()), None
        )

    def search_faqs(self, keyword: str) -> list[dict]:
        """Return FAQs whose question or answer contains the keyword (case-insensitive)."""
        self._ensure_initialized()
        kw = keyword.lower()
        return [
            f
            for f in self._faqs
            if kw in f["question"].lower() or kw in f["answer"].lower()
        ]

    # ── Context Builder ───────────────────────────────────────────────────────

    def build_context(self) -> str:
        """
        Inject knowledge base data into the prompt template.
        Returns the fully populated system prompt string.
        """
        self._ensure_initialized()

        courses_context = json.dumps(self._courses, indent=2, ensure_ascii=False)
        faqs_context = json.dumps(self._faqs, indent=2, ensure_ascii=False)
        workshops_context = json.dumps(self._workshops, indent=2, ensure_ascii=False)

        return self._prompt_template.format(
            courses_context=courses_context,
            faqs_context=faqs_context,
            workshops_context=workshops_context,
        )

    # ── Response Generator ────────────────────────────────────────────────────

    def generate_counselor_response(
        self,
        user_message: str,
        conversation_history: Optional[list[dict]] = None,
    ) -> str:
        """
        Generate an AI counselor reply for the given user message.

        Args:
            user_message:          The student's latest utterance.
            conversation_history:  List of prior turns in the format:
                                   [{"role": "user"|"model", "parts": ["text"]}, ...]
                                   Pass None or [] for the first turn.

        Returns:
            The counselor's response as a plain string.
        """
        self._ensure_initialized()

        if conversation_history is None:
            conversation_history = []

        system_prompt = self.build_context()

        # Build turns: system context injected as first user→model exchange
        # so Gemini treats it as established background knowledge.
        turns = [
            {"role": "user", "parts": [system_prompt]},
            {
                "role": "model",
                "parts": [
                    "Understood. I am Priya, your career counselor. I will follow "
                    "all guidelines and use only the provided knowledge base to assist students."
                ],
            },
        ]

        # Append prior conversation turns
        for turn in conversation_history:
            turns.append(turn)

        # Append the current student message
        turns.append({"role": "user", "parts": [user_message]})

        try:
            chat = self._model.start_chat(history=turns[:-1])
            response = chat.send_message(user_message)
            return response.text.strip()
        except Exception as exc:
            logger.exception("Gemini API call failed: %s", exc)
            return (
                "I'm sorry, I'm having a brief technical difficulty. "
                "Could you please repeat your question? I want to make sure I help you properly."
            )

    # ── Utility ───────────────────────────────────────────────────────────────

    def get_opening_message(self) -> str:
        """Return the counselor's standard opening line."""
        return (
            "Hello! I'm Priya, your career counselor. "
            "Can you tell me a little about your education and your career goal?"
        )

    def format_course_summary(self, course: dict) -> str:
        """Return a human-readable summary of a course for quick reference."""
        return (
            f"{course['name']} — {course['duration']}, {course['fees']}. "
            f"Career paths: {', '.join(course['career_paths'][:3])}. "
            f"Placement rate: {course.get('placement_rate', 'N/A')}."
        )

    def analyze_transcript(self, transcript: str, student_name: str = "") -> dict:
        """
        Processes actual transcript using Gemini AI to extract:
        summary, intent (High/Medium/Low), sentiment (Positive/Neutral/Negative),
        key_topics, objections, and next_action.
        """
        if not transcript or not transcript.strip():
            return {
                "summary": "No transcript recorded for this call.",
                "intent": "Unknown",
                "sentiment": "Neutral",
                "key_topics": "N/A",
                "objections": "None",
                "next_action": "Follow-up Call"
            }
        try:
            self._ensure_initialized()
            prompt = (
                f"Analyze the following career counseling call transcript between AI Counselor Priya and student candidate '{student_name}':\n\n"
                f"TRANSCRIPT:\n{transcript}\n\n"
                f"Provide a JSON response with exactly these keys:\n"
                f"- summary: Concise 2-3 sentence summary of the call discussion\n"
                f"- intent: 'High', 'Medium', or 'Low'\n"
                f"- sentiment: 'Positive', 'Neutral', or 'Negative'\n"
                f"- key_topics: comma-separated key topics discussed\n"
                f"- objections: any concerns or objections raised (or 'None')\n"
                f"- next_action: recommended next step\n\n"
                f"Return ONLY valid JSON."
            )
            res = self._model.generate_content(prompt)
            raw = res.text.strip()
            if raw.startswith("```json"):
                raw = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(raw)
        except Exception as e:
            logger.warning(f"Transcript analysis error: {e}")
            return {
                "summary": f"Call completed with candidate {student_name or 'Student'}.",
                "intent": "Medium",
                "sentiment": "Neutral",
                "key_topics": "Career Opportunities",
                "objections": "None",
                "next_action": "Schedule Follow-up"
            }


# ── Module-level singleton ────────────────────────────────────────────────────
counselor_service = CounselorService()
