"""
backend/services/conversation_manager.py

State machine for Career Counseling AI Agent — Priya.
Manages conversation flow, student profiling, and lead qualification.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime
import re
import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ConversationState(str, Enum):
    GREETING         = "GREETING"
    ASK_NAME         = "ASK_NAME"
    ASK_EDUCATION    = "ASK_EDUCATION"
    ASK_INTEREST     = "ASK_INTEREST"
    ANSWER_FAQ       = "ANSWER_FAQ"
    QUALIFY_LEAD     = "QUALIFY_LEAD"
    INVITE_WORKSHOP  = "INVITE_WORKSHOP"
    CALLBACK_REQUEST = "CALLBACK_REQUEST"
    END_CALL         = "END_CALL"


class LeadStatus(str, Enum):
    INTERESTED      = "interested"
    CALLBACK        = "callback"
    NOT_INTERESTED  = "not_interested"
    NO_RESPONSE     = "no_response"


# ---------------------------------------------------------------------------
# Student Profile
# ---------------------------------------------------------------------------

@dataclass
class StudentProfile:
    student_name:    Optional[str] = None
    education:       Optional[str] = None
    course_interest: Optional[str] = None
    callback_date:   Optional[str] = None
    callback_time:   Optional[str] = None
    lead_status:     LeadStatus    = LeadStatus.NO_RESPONSE

    def to_dict(self) -> dict:
        return {
            "student_name":    self.student_name,
            "education":       self.education,
            "course_interest": self.course_interest,
            "callback_date":   self.callback_date,
            "callback_time":   self.callback_time,
            "lead_status":     self.lead_status.value,
        }


# ---------------------------------------------------------------------------
# FAQ Knowledge Base
# ---------------------------------------------------------------------------

FAQ_RESPONSES: dict[str, str] = {
    "python": "Yes, Python is covered from beginner to advanced level.",
"react": "React is included in our Full Stack program.",
"javascript": "JavaScript is covered extensively in Full Stack Development.",
"salary": "Freshers typically start between 4-8 LPA depending on skills.",
"job": "We provide placement assistance and interview preparation.",
"internship": "Yes, internship opportunities are available.",
    "fee":        "Our courses are very affordable and we offer flexible EMI options. The fees depend on the specific course you choose. Would you like me to share the details for your chosen course?",
    "duration":   "Course durations range from 3 months to 1 year depending on the program. Most of our popular programs are 6 months with weekend batches available.",
    "placement":  "We have a dedicated placement cell with 200+ hiring partners. Over 85% of our students get placed within 3 months of completing the course.",
    "online":     "Yes! All our courses are available both online and offline. You can choose the mode that suits you best.",
    "certificate":"You'll receive an industry-recognized certificate upon completion, which is valued by top companies.",
    "syllabus":   "Our syllabus is designed with industry experts and updated every 6 months to stay current with market trends. I can send you the detailed syllabus on WhatsApp.",
}

NEGATIVE_SIGNALS  = {"no", "not interested", "nope", "nahi", "nahin", "busy", "later", "don't call", "dont call", "remove"}
POSITIVE_SIGNALS  = {"yes", "sure", "okay", "ok", "interested", "tell me", "haan", "ha", "register", "enroll"}
CALLBACK_TRIGGERS = {"call back", "callback", "later", "busy", "schedule", "another time", "baad mein"}


# ---------------------------------------------------------------------------
# Conversation Manager
# ---------------------------------------------------------------------------

class ConversationManager:
    """
    Finite state machine that drives the Priya career counseling agent.

    Usage:
        manager = ConversationManager(session_id="abc123")
        print(manager.start_conversation())

        while True:
            user_input = input("User: ")
            response   = manager.process_user_input(user_input)
            print(f"Priya: {response}")
            if manager.get_current_state() == ConversationState.END_CALL:
                break
    """

    def __init__(self, session_id: str = ""):
        self.session_id:   str               = session_id or datetime.utcnow().isoformat()
        self.state:        ConversationState = ConversationState.GREETING
        self.profile:      StudentProfile    = StudentProfile()
        self.faq_count:    int               = 0          # track how many FAQs answered
        self.turn_count:   int               = 0
        self.no_input_count: int             = 0          # track consecutive silence / no-input turns
        self._created_at:  datetime          = datetime.utcnow()

        logger.info("ConversationManager initialised | session=%s", self.session_id)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start_conversation(self) -> str:
        """Return the opening message and transition to ASK_NAME."""
        self.state = ConversationState.ASK_NAME
        return (
            "Hello! I'm Priya, your personal career counselor. "
            "I'm here to help you find the right course to boost your career. "
            "May I know your good name please?"
        )

    def process_user_input(self, user_input: str) -> str:
        """
        Accept raw user text, update the profile, transition state,
        and return the next agent message.
        """
        if not isinstance(user_input, str):
            raise TypeError("user_input must be a string")

        self.turn_count += 1
        cleaned = user_input.strip()

        logger.debug(
            "session=%s | state=%s | turn=%d | input=%r",
            self.session_id, self.state.value, self.turn_count, cleaned
        )

        # Route to the correct handler
        handler = self._state_handlers.get(self.state)
        if handler is None:
            return self._end_call_response()

        response = handler(self, cleaned)
        logger.debug("session=%s | new_state=%s | response=%r", self.session_id, self.state.value, response)
        return response

    def get_current_state(self) -> ConversationState:
        """Return the current FSM state."""
        return self.state

    def get_student_profile(self) -> dict:
        """Return a serialisable snapshot of the student profile."""
        return {
            **self.profile.to_dict(),
            "session_id": self.session_id,
            "turn_count": self.turn_count,
            "current_state": self.state.value,
        }

    # ------------------------------------------------------------------
    # State Handlers
    # ------------------------------------------------------------------

    def _handle_ask_name(self, user_input: str) -> str:
        name = self._extract_name(user_input)
        if not name:
            return "I didn't catch your name. Could you please tell me what I should call you?"

        self.profile.student_name = name
        self.state = ConversationState.ASK_EDUCATION
        return (
            f"Nice to meet you, {name}! 😊 "
            "Could you tell me about your current education? "
            "For example, are you in 10th, 12th, pursuing a degree, or already a graduate?"
        )

    def _handle_ask_education(self, user_input: str) -> str:
        if len(user_input) < 2:
            return "Could you share a bit more about your education background?"

        self.profile.education = user_input.title()
        self.state = ConversationState.ASK_INTEREST
        return (
            f"Great! We have excellent courses suited for {self.profile.education} students. "
            "Which field interests you most? For example: Data Science, Web Development, "
            "Digital Marketing, Graphic Design, or something else?"
        )

    def _handle_ask_interest(self, user_input: str) -> str:
        if len(user_input) < 2:
            return (
                "No worries! We have options in Tech, Design, Business, and more. "
                "Which broad area sounds interesting to you?"
            )

        self.profile.course_interest = user_input.title()
        self.state = ConversationState.ANSWER_FAQ
        return (
            f"Excellent choice! {self.profile.course_interest} is one of our most popular programs "
            f"and has great career prospects. 🚀\n"
            "Do you have any questions about the course — like fees, duration, or placements? "
            "Feel free to ask!"
        )

    def _handle_answer_faq(self, user_input: str) -> str:
        lower = user_input.lower()

        # Check for negative signals → qualify lead as not interested
        if self._matches_any(lower, NEGATIVE_SIGNALS):
            return self._transition_to_qualify(positive=False)

        # Check for positive / ready-to-proceed signals
        if self._matches_any(lower, POSITIVE_SIGNALS) and self.faq_count > 0:
            return self._transition_to_qualify(positive=True)

        # Try to match a FAQ keyword
        for keyword, answer in FAQ_RESPONSES.items():
            if keyword in lower:
                self.faq_count += 1
                follow_up = (
                    "\n\nDo you have any other questions, or shall I tell you about "
                    "our upcoming free workshop?"
                )
                return answer + follow_up

        # Generic fallback — still in FAQ state
        self.faq_count += 1
        return (
            "That's a great question! I'd recommend speaking with our senior counselor "
            "who can give you detailed information. "
            "Shall I tell you about our upcoming free workshop where you can learn more?"
        )

    def _handle_qualify_lead(self, user_input: str) -> str:
        lower = user_input.lower()

        if self._matches_any(lower, POSITIVE_SIGNALS):
            self.profile.lead_status = LeadStatus.INTERESTED
            self.state = ConversationState.INVITE_WORKSHOP
            return self._workshop_invite_message()

        if self._matches_any(lower, CALLBACK_TRIGGERS):
            self.profile.lead_status = LeadStatus.CALLBACK
            self.state = ConversationState.CALLBACK_REQUEST
            return (
                "Of course! I completely understand. "
                "What date would be convenient for a callback? "
                "(Please share in DD/MM/YYYY format or say something like 'tomorrow' or 'Saturday')"
            )

        if self._matches_any(lower, NEGATIVE_SIGNALS):
            self.profile.lead_status = LeadStatus.NOT_INTERESTED
            self.state = ConversationState.END_CALL
            return self._end_call_response(not_interested=True)

        # Ambiguous — re-prompt once
        return (
            f"I understand, {self.profile.student_name or 'there'}. "
            "Just to confirm — would you be interested in learning more about "
            f"{self.profile.course_interest or 'our courses'}, or would you prefer "
            "we call you back at a better time?"
        )

    def _handle_invite_workshop(self, user_input: str) -> str:
        lower = user_input.lower()

        if self._matches_any(lower, POSITIVE_SIGNALS):
            self.profile.lead_status = LeadStatus.INTERESTED
            self.state = ConversationState.END_CALL
            return (
                f"Wonderful! 🎉 We've registered your seat for the workshop, {self.profile.student_name}. "
                "You'll receive a confirmation SMS with the Zoom link shortly. "
                "Is there anything else I can help you with before we wrap up?"
            )

        if self._matches_any(lower, CALLBACK_TRIGGERS):
            self.profile.lead_status = LeadStatus.CALLBACK
            self.state = ConversationState.CALLBACK_REQUEST
            return (
                "No problem at all! I can arrange a callback instead. "
                "What date works best for you?"
            )

        # Not interested in workshop
        self.profile.lead_status = LeadStatus.NOT_INTERESTED
        self.state = ConversationState.END_CALL
        return self._end_call_response(not_interested=True)

    def _handle_callback_request(self, user_input: str) -> str:
        """Two-step: first capture date, then time."""
        if self.profile.callback_date is None:
            date = self._extract_date(user_input)
            self.profile.callback_date = date or user_input.strip().title()
            return (
                f"Perfect! And what time suits you on {self.profile.callback_date}? "
                "(Morning / Afternoon / Evening, or a specific time like 11 AM)"
            )

        # Date already captured — capture time now
        self.profile.callback_time = user_input.strip().title()
        self.profile.lead_status   = LeadStatus.CALLBACK
        self.state                 = ConversationState.END_CALL
        return (
            f"All set, {self.profile.student_name}! 📅 "
            f"Our counselor will call you on {self.profile.callback_date} "
            f"at {self.profile.callback_time}. "
            "Thank you for your time. Have a wonderful day!"
        )

    def _handle_end_call(self, user_input: str) -> str:  # noqa: ARG002
        return "Thank you for connecting with us. Have a great day! 😊"

    # Map states → handlers (defined after methods to keep class clean)
    _state_handlers: dict = {}   # populated below class definition

    # ------------------------------------------------------------------
    # Transition Helpers
    # ------------------------------------------------------------------

    def _transition_to_qualify(self, positive: bool) -> str:
        self.state = ConversationState.QUALIFY_LEAD
        name = self.profile.student_name or "there"
        course = self.profile.course_interest or "our courses"

        if positive:
            return (
                f"That's great to hear, {name}! "
                f"Based on your background in {self.profile.education or 'your field'}, "
                f"{course} is definitely a strong fit for you. "
                "Would you like to enroll, or would you prefer a callback from our senior counselor?"
            )
        else:
            return (
                f"No problem at all, {name}. "
                f"If you ever want to explore {course} further, we're always here. "
                "Would you like us to call you back at a more convenient time?"
            )

    def _workshop_invite_message(self) -> str:
        course = self.profile.course_interest or "your field"
        return (
            f"Amazing! We're hosting a *Free Online Workshop on {course}* this Saturday at 11 AM. "
            "You'll get live demos, Q&A with industry experts, and a career roadmap — all for free! "
            "Shall I reserve a spot for you? 🙌"
        )

    def _end_call_response(self, not_interested: bool = False) -> str:
        name = self.profile.student_name or "there"
        if not_interested:
            return (
                f"I completely understand, {name}. No pressure at all! "
                "If you ever change your mind, we're just a call away. "
                "Wishing you all the very best. Take care! 😊"
            )
        return (
            f"Thank you so much for your time, {name}! "
            "It was lovely speaking with you. Have a fantastic day ahead! 🌟"
        )

    # ------------------------------------------------------------------
    # Utility / Extraction Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_name(text: str) -> Optional[str]:
        """Pull a plausible name from user input."""
        if not text:
            return None

        # Capture the portion after a known introductory phrase, if present.
        match = re.search(
            r"(?i)\b(?:my name is|my name's|i am|i'm|call me|this is)\b\s*(.*)$",
            text,
        )
        candidate = match.group(1) if match else text

        # Normalize punctuation and whitespace, preserving alphabetic words.
        normalized = re.sub(r"[^\w\s]", " ", candidate).strip()
        tokens = [t for t in re.split(r"\s+", normalized) if t and t.isalpha()]

        if not tokens:
            return None

        stop_words = {
            "and", "we", "you", "they", "he", "she", "it", "for", "to",
            "with", "on", "of", "the", "a", "an", "my", "your", "our",
            "is", "am", "are", "was", "were", "been", "being", "do",
            "does", "did", "have", "has", "had", "if", "because", "that",
            "this", "these", "those", "me", "call", "nice", "good", "great",
            "glad", "pleasure", "meet", "meeting", "hi", "hello", "hey",
        }

        name_tokens: list[str] = []
        for token in tokens:
            if token.lower() in stop_words:
                break
            name_tokens.append(token)
            if len(name_tokens) == 3:
                break

        if not name_tokens:
            return None

        return " ".join(token.capitalize() for token in name_tokens)

    @staticmethod
    def _extract_date(text: str) -> Optional[str]:
        """Attempt to parse a simple date string."""
        patterns = [
            r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",   # DD/MM/YYYY or DD-MM-YY
            r"\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})\b",
        ]
        lower = text.lower()
        for pattern in patterns:
            match = re.search(pattern, lower)
            if match:
                return match.group(1)
        return None

    @staticmethod
    def _matches_any(text: str, signals: set[str]) -> bool:
        """Return True if any signal phrase appears in text."""
        return any(signal in text for signal in signals)


# ---------------------------------------------------------------------------
# Late-bind state handler map (after all methods are defined)
# ---------------------------------------------------------------------------

ConversationManager._state_handlers = {
    ConversationState.GREETING:         ConversationManager._handle_ask_name,   # GREETING falls through
    ConversationState.ASK_NAME:         ConversationManager._handle_ask_name,
    ConversationState.ASK_EDUCATION:    ConversationManager._handle_ask_education,
    ConversationState.ASK_INTEREST:     ConversationManager._handle_ask_interest,
    ConversationState.ANSWER_FAQ:       ConversationManager._handle_answer_faq,
    ConversationState.QUALIFY_LEAD:     ConversationManager._handle_qualify_lead,
    ConversationState.INVITE_WORKSHOP:  ConversationManager._handle_invite_workshop,
    ConversationState.CALLBACK_REQUEST: ConversationManager._handle_callback_request,
    ConversationState.END_CALL:         ConversationManager._handle_end_call,
}