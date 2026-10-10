import pytest

from backend.services.conversation_manager import ConversationManager


@pytest.mark.parametrize(
    "input_text,expected_name",
    [
        ("My name is Rahul", "Rahul"),
        ("My name is Priya", "Priya"),
        ("My name is Mohammed Arif", "Mohammed Arif"),
        ("My name is Sai Kiran", "Sai Kiran"),
        ("My name is Lakshmi Devi", "Lakshmi Devi"),
        ("I am John", "John"),
        ("Call me Akash Kumar", "Akash Kumar"),
        ("This is Maya", "Maya"),
        ("My name is Rahul.", "Rahul"),
        ("My name is Priya!", "Priya"),
        ("My name is Mohammed Arif?", "Mohammed Arif"),
        ("I am John, and I live in Delhi", "John"),
        ("Call me Akash Kumar.", "Akash Kumar"),
        ("This is Maya, nice to meet you", "Maya"),
        ("My name is Sai Kiran and I am happy", "Sai Kiran"),
        ("My name is Lakshmi Devi and we love each other", "Lakshmi Devi"),
        ("My name is Rahul, and we love each other", "Rahul"),
        ("I am Sonia", "Sonia"),
        ("I am Rohan Sharma", "Rohan Sharma"),
        ("Call me Priya", "Priya"),
    ],
)
def test_extract_name(input_text, expected_name):
    manager = ConversationManager(session_id="test")
    assert manager._extract_name(input_text) == expected_name
