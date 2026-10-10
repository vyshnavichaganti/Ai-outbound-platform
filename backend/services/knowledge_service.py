import json


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_all_knowledge():

    company = load_json("backend/data/company.json")
    courses = load_json("backend/data/courses.json")
    faq = load_json("backend/data/faq.json")
    workshops = load_json("backend/data/workshops.json")

    context = f"""
Company Information:
{company}

Courses:
{courses}

FAQs:
{faq}

Workshops:
{workshops}
"""

    return context