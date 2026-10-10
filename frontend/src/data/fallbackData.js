export const fallbackStats = {
  total_leads: 1284,
  calls_made: 948,
  connected_calls: 812,
  qualified_leads: 426,
  workshop_registrations: 184,
  ai_handled_calls: 948,
  avg_call_duration: "3m 12s",
  qualification_rate: "84.2%",
  positive_response_rate: "91.8%",
  workshop_conversion: "43.2%"
};

export const fallbackLeads = [
  {
    id: 1,
    student_name: "Ananya Sharma",
    phone: "+91 98765 43210",
    degree: "B.Tech",
    year: "3rd Year",
    branch: "Computer Science",
    career_goal: "AI Engineer / Data Scientist",
    interest: "Data Science & AI",
    budget: "₹35,000",
    mode: "Online",
    lead_score: 92,
    score_label: "High",
    lead_status: "Qualified",
    last_contact: "2026-10-09 14:30",
    workshop_registered: true,
    call_summary: "Student expressed keen interest in AI/ML curriculum and placement assistance. Qualified for upcoming workshop."
  },
  {
    id: 2,
    student_name: "Rahul Verma",
    phone: "+91 98123 88765",
    degree: "B.Tech",
    year: "4th Year",
    branch: "ECE",
    career_goal: "Full Stack Developer",
    interest: "Full Stack Development",
    budget: "₹25,000",
    mode: "Online",
    lead_score: 78,
    score_label: "High",
    lead_status: "Interested",
    last_contact: "2026-10-09 11:15",
    workshop_registered: false,
    call_summary: "Wants web development bootcamp with live capstone projects. Requested callback on weekend."
  },
  {
    id: 3,
    student_name: "Priya Nair",
    phone: "+91 97654 11223",
    degree: "B.Sc",
    year: "Final Year",
    branch: "Data Analytics",
    career_goal: "Data Analyst",
    interest: "Data Science & AI",
    budget: "₹30,000",
    mode: "Online",
    lead_score: 85,
    score_label: "High",
    lead_status: "Converted",
    last_contact: "2026-10-08 16:45",
    workshop_registered: true,
    call_summary: "Enrolled after attending the career counseling session. Payment link sent."
  },
  {
    id: 4,
    student_name: "Karan Patel",
    phone: "+91 99887 66554",
    degree: "B.E.",
    year: "2nd Year",
    branch: "Mechanical",
    career_goal: "Cloud Architect",
    interest: "Cloud Computing",
    budget: "₹20,000",
    mode: "Online",
    lead_score: 62,
    score_label: "Medium",
    lead_status: "Contacted",
    last_contact: "2026-10-08 10:20",
    workshop_registered: false,
    call_summary: "Interested in AWS certification track. Discussing with parents."
  },
  {
    id: 5,
    student_name: "Sneha Reddy",
    phone: "+91 96543 22110",
    degree: "M.Tech",
    year: "1st Year",
    branch: "AI & Robotics",
    career_goal: "Generative AI Specialist",
    interest: "Generative AI",
    budget: "₹40,000",
    mode: "Online",
    lead_score: 95,
    score_label: "High",
    lead_status: "Qualified",
    last_contact: "2026-10-07 15:00",
    workshop_registered: true,
    call_summary: "Highly qualified. Registered for GenAI masterclass on Sunday."
  }
];

export const fallbackCalls = [
  {
    id: 101,
    student_name: "Ananya Sharma",
    phone: "+91 98765 43210",
    date: "2026-10-09 14:30",
    duration: "4m 15s",
    status: "Completed",
    interest: "Data Science & AI",
    ai_outcome: "Qualified & Invited to Workshop",
    transcript: [
      { speaker: "Priya (AI)", text: "Hello Ananya! I'm Priya, your AI career counselor. I noticed your interest in tech careers. Could you tell me about your educational background?" },
      { speaker: "Ananya", text: "Hi Priya! I'm currently in my 3rd year of B.Tech CSE. I want to build a career in Artificial Intelligence." },
      { speaker: "Priya (AI)", text: "That's wonderful! CSE 3rd year is the perfect time to specialize. Our AI & Machine Learning program covers Deep Learning, PyTorch, and LLMs with hands-on capstone projects." },
      { speaker: "Ananya", text: "Are there live workshops where I can preview the teaching style?" },
      { speaker: "Priya (AI)", text: "Yes! We have an exclusive AI Career Masterclass on June 20th at 7:00 PM. Would you like me to reserve a free seat for you?" },
      { speaker: "Ananya", text: "Yes please, register me!" }
    ],
    summary: "Student is a B.Tech 3rd year CSE student interested in AI & ML. Confirmed workshop registration."
  },
  {
    id: 102,
    student_name: "Rahul Verma",
    phone: "+91 98123 88765",
    date: "2026-10-09 11:15",
    duration: "3m 40s",
    status: "Completed",
    interest: "Full Stack Development",
    ai_outcome: "Callback Requested",
    transcript: [
      { speaker: "Priya (AI)", text: "Hi Rahul! I'm Priya, your career counselor. How can I help you choose your career path today?" },
      { speaker: "Rahul", text: "I'm looking for a MERN stack course with placement assistance." },
      { speaker: "Priya (AI)", text: "Great! Our Full Stack Development program includes React, Node.js, and 5 industry projects plus dedicated placement support." }
    ],
    summary: "Requested detailed course brochure and weekend callback."
  }
];

export const fallbackCourses = [
  {
    id: "ds-ai",
    name: "Data Science & AI",
    duration: "6 months",
    fees: "₹35,000",
    mode: "Online Live",
    target: "CSE & IT Students",
    description: "Master Machine Learning, Deep Learning, Python, SQL, and Generative AI models with 6+ real-world industry capstones.",
    career_paths: ["Data Scientist", "AI Engineer", "ML Practitioner"],
    placement_rate: "94%",
    students_interested: 482,
    workshop_available: true
  },
  {
    id: "fullstack",
    name: "Full Stack Web Development",
    duration: "5 months",
    fees: "₹30,000",
    mode: "Online Live",
    target: "Beginners & Undergrads",
    description: "Build scalable web applications with React, Node.js, Express, MongoDB, and modern DevOps tools.",
    career_paths: ["Full Stack Developer", "Frontend Engineer", "Backend Engineer"],
    placement_rate: "91%",
    students_interested: 350,
    workshop_available: true
  },
  {
    id: "gen-ai",
    name: "Generative AI & LLMs",
    duration: "3 months",
    fees: "₹25,000",
    mode: "Online",
    target: "Developers & Engineers",
    description: "Learn LangChain, OpenAI APIs, Vector DBs, Fine-Tuning, and AI Agent Architectures.",
    career_paths: ["GenAI Architect", "Prompt Engineer", "AI Solutions Developer"],
    placement_rate: "96%",
    students_interested: 290,
    workshop_available: true
  },
  {
    id: "cloud-devops",
    name: "Cloud Computing & DevOps",
    duration: "4 months",
    fees: "₹28,000",
    mode: "Online",
    target: "Engineering Students",
    description: "AWS, Docker, Kubernetes, CI/CD pipelines, and Cloud Infrastructure automation.",
    career_paths: ["Cloud Engineer", "DevOps Consultant", "SRE"],
    placement_rate: "89%",
    students_interested: 195,
    workshop_available: false
  }
];

export const fallbackWorkshops = [
  {
    id: 1,
    name: "Data Science & AI Career Masterclass",
    course: "Data Science & AI",
    date: "2026-06-15",
    time: "6:00 PM IST",
    mode: "Online Live",
    seats: 100,
    registered: 84,
    status: "Filling Fast"
  },
  {
    id: 2,
    name: "Build Your First LLM Agent Workshop",
    course: "Generative AI & LLMs",
    date: "2026-06-20",
    time: "7:00 PM IST",
    mode: "Online Live",
    seats: 100,
    registered: 92,
    status: "Almost Full"
  }
];
