# PM Scenario Lab

A real-world PM case study simulator for aspiring Product Managers — practice structured product thinking through hands-on scenarios with AI-powered feedback on your reasoning.

Most PM prep is passive: read frameworks, watch videos, hope you remember under pressure. This is active. It puts you in actual PM situations — prioritization under constraints, metrics investigation, product design — and evaluates your thinking.

We use the following tech stack:
- Google Gemini for scenario generation and response evaluation
- TypeScript + React for the interface
- Tailwind CSS for styling

## 🚀 Features

* **Scenario Library:** Real-world PM case studies across product design, feature prioritization, metrics diagnosis, and go-to-market planning
* **Structured Response Framework:** Guides you through a PM thinking approach — clarify scope → segment users → prioritize → define success metrics → measure
* **AI Feedback Engine:** Gemini evaluates your response against PM best practices and surfaces gaps in your reasoning — not just right/wrong
* **Difficulty Levels:** Beginner (framework practice), Intermediate (trade-offs), Advanced (ambiguous, open-ended)
* **Built-in Framework Reference:** RICE, ICE, HEART, North Star, Jobs-to-be-Done, AARRR, MoSCoW — available in-context while you work
* **Weakness Tracking:** Surfaces your recurring gaps across sessions so you know exactly what to improve

## Scenario Types

* **Product Design** — Design a feature, improve a metric, or redesign a flow
* **Prioritization** — Rank a backlog with constrained engineering capacity
* **Metrics & Diagnosis** — DAU dropped 15%, figure out why and respond
* **Go-to-Market** — Launch a product in a new market with a defined budget
* **Trade-offs** — Speed vs. quality, growth vs. monetization, build vs. buy

## Setup

```bash
git clone https://github.com/yatinbhalla/PM-Scenario-Lab.git
cd PM-Scenario-Lab
npm install
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run dev
```

## Author

Yatin Bhalla · Product Manager & AI Builder
<br>
🔗 [linkedin.com/in/yatin-bhalla-834632238](https://linkedin.com/in/yatin-bhalla-834632238) · yatinbhalla42@gmail.com
