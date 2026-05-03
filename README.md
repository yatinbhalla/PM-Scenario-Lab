# PM Scenario Lab

A real-world PM case study simulator for aspiring Product Managers — practice structured product thinking through hands-on scenarios with AI-powered feedback on your reasoning.

Most PM prep is passive: read frameworks, watch videos, hope you remember under pressure. This is active. It puts you in actual PM situations — prioritization under constraints, metrics investigation, feature trade-offs, go-to-market execution — and AI feedback tells you exactly where your thinking breaks down.

Built for PM candidates preparing for interviews at FAANG, startups, and growth-stage companies. Also used by hiring teams and recruiters as a screening tool to identify candidates with strong product fundamentals.

---

## Table of Contents

- [Features](#-features)
- [How It Works](#how-it-works)
- [Scenario Types](#scenario-types)
- [PM Frameworks Covered](#pm-frameworks-covered)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Use Cases](#use-cases)
- [Author](#author)

---

## 🎯 Why PM Scenario Lab?

**The Problem:** Traditional PM interview prep relies on passive learning. You read about frameworks, memorize case study structures, but when you're in an actual interview, the pressure and ambiguity overwhelm your preparation.

**The Solution:** PM Scenario Lab puts you in realistic PM situations with:
- ✅ Concrete constraints (team size, budget, timeline)
- ✅ Ambiguous problems that require clarification
- ✅ AI-powered feedback that surfaces gaps in your reasoning
- ✅ Measurable progress tracking across multiple attempts

---

## 🚀 Features

* **Scenario Library:** Real-world PM case studies across product design, feature prioritization, metrics diagnosis, and go-to-market planning
* **Structured Response Framework:** Guides you through a PM thinking approach — clarify scope → segment users → prioritize → define success metrics → measure
* **AI Feedback Engine:** Gemini evaluates your response against PM best practices and surfaces gaps in your reasoning — not just right/wrong
* **Difficulty Levels:** Beginner (framework practice), Intermediate (trade-offs), Advanced (ambiguous, open-ended)
* **Built-in Framework Reference:** RICE, ICE, HEART, North Star, Jobs-to-be-Done, AARRR, MoSCoW — available in-context while you work
* **Weakness Tracking:** Surfaces your recurring gaps across sessions so you know exactly what to improve
* **Interview-Ready Output:** Export your responses and AI feedback as a portfolio piece for interviews

---

## How It Works

1. **Select a Scenario** — Choose from product design, prioritization, metrics, or GTM challenges
2. **Work Through the Framework** — Answer guided prompts that mirror real PM interview questions
3. **Get AI Feedback** — Receive detailed evaluation on your reasoning, trade-offs, and strategic thinking
4. **Track Progress** — See trends in your strengths and gaps over time
5. **Interview Confidently** — Use your practice scenarios and feedback as real-world examples in interviews

---

## Scenario Types

* **Product Design** — Design a feature, improve a metric, or redesign a flow
  * *Example: "Redesign Pinterest's search experience to reduce churn among new users"*
* **Prioritization** — Rank a backlog with constrained engineering capacity
  * *Example: "Your team has 2 sprints. Prioritize these 10 feature requests with limited context"*
* **Metrics & Diagnosis** — DAU dropped 15%, figure out why and respond
  * *Example: "Spotify's DAU dropped 25% in the US market. What caused it? How do you respond?"*
* **Go-to-Market** — Launch a product in a new market with a defined budget
  * *Example: "Launch a new product category with a $500K budget and 6-month timeline"*
* **Trade-offs** — Speed vs. quality, growth vs. monetization, build vs. buy
  * *Example: "Your CEO demands profitability in 90 days. Growth is at risk. What do you do?"*

---

## PM Frameworks Covered

This tool includes real PM frameworks you'll encounter in interviews and real PM work:

| Framework | Use Case | Scenario Types |
|-----------|----------|-----------------|
| **RICE** | Prioritization scoring | Prioritization, Trade-offs |
| **ICE** | Feature ranking | Product Design, Prioritization |
| **HEART** | Metrics definition | Metrics & Diagnosis |
| **North Star** | Strategic vision | Product Design, GTM |
| **Jobs-to-be-Done** | User research | Product Design |
| **AARRR (Pirate Metrics)** | Growth funnel | Metrics & Diagnosis, GTM |
| **MoSCoW** | Scope management | Prioritization, Go-to-Market |

---

## Tech Stack

- **AI Engine:** Google Gemini for scenario generation and response evaluation
- **Frontend:** TypeScript + React for the interface
- **Styling:** Tailwind CSS for responsive, modern UI
- **Deployment Ready:** Production-optimized architecture

---

## Setup

```bash
git clone https://github.com/yatinbhalla/PM-Scenario-Lab.git
cd PM-Scenario-Lab
npm install
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run dev
```

The app will run on `http://localhost:3000`

---

## Use Cases

### 👤 For PM Candidates
- Practice for PM interviews at FAANG and high-growth startups
- Build a portfolio of well-reasoned case study responses
- Identify and close gaps in your PM thinking before interviews

### 💼 For Hiring Teams & Recruiters
- Screen PM candidates on structured thinking, not just background
- Identify candidates with strong fundamentals in prioritization, metrics, and strategy
- Use scenario responses as interview discussion starters

### 🎓 For PM Mentors & Coaches
- Train aspiring PMs with real-world scenarios and frameworks
- Track mentee progress and identify learning gaps
- Use AI feedback to augment 1-on-1 coaching

---

## Author

Yatin Bhalla · Product Manager & AI Builder
<br>
🔗 [linkedin.com/in/yatin-bhalla-834632238](https://linkedin.com/in/yatin-bhalla-834632238) · yatinbhalla42@gmail.com
