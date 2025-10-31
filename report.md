**Ministry of Science and Higher Education of the Republic of Kazakhstan**
**Astana IT University**

<br><br>

# REPORT

**on the Completion of Research Internship**

**Master's student:**
**Educational program:**
Computer science and engineering
Group: CSE-2301M
**Tsekoyev Petr**   _________
(signature)

**The head of the practice from the company:**
Akhmetova Leila Serikkyzy
Grade _________
(signature)

**Supervisor of the Master's Thesis:**
**Sembayev Talgat**
Grade _________
(signature)

<br><br><br>
Astana – 2024

---

## THE CALENDAR PLAN IS THE SCHEDULE OF THE INTERNSHIP FROM THE COMPANY

**Tsekoyev Petr**, a 2nd year student of the CSE – 2301M group, the educational program "Computer science and engineering - 7M06105".
The internship period is **from September 2, 2024 to November 9, 2024**.
Place of internship: **LLP "Astana IT University"**.

| №  | week    | Name of activity | task                                                                                                                                                                                                        | Execution date | The name of the department or workplace | Mark of performance |
| -- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------- |
| 1  | 1 week  | Project kickoff: refining research goals/hypotheses; success metrics (overall accuracy, per-tag uplift, A/B plan). Environment setup (Next.js 15, Prisma 6.17, Neon, JWT-cookie).                                              | 02.09 - 08.09  | LLP "Astana IT University"  \nSuccessfully completed          |
| 2  | 2 week  | Dataset & tagging legend: drafting `tags.txt` (tone/style/depth/context), defining Mode {ACADEMIC/COMFORT/RANDOM}, outlining analytics schema (byTag, byQuestion). Literature review on adaptive learning and personalization. | 09.09 - 15.09  | LLP "Astana IT University"  \nSuccessfully completed          |
| 3  | 3 week  | DB design and migrations: `User`, `Subject` (unique by `(userId, name, difficulty)`), `GeneratedTest`, `TestAttempt`, `TagLegendVersion`, `TrainingExample`; Prisma migrations on Neon; seed scripts.                          | 16.09 - 22.09  | LLP "Astana IT University"  \nSuccessfully completed          |
| 4  | 4 week  | Back-end API v1: `/api/generate-test` (modes, `plannedTagsPerQuestion`, mock & OpenAI), `/api/subjects`, `/api/tests/session`; cookie-auth; validation; error handling.                                                        | 23.09 - 29.09  | LLP "Astana IT University"  \nSuccessfully completed          |
| 5  | 5 week  | Front-end v1 (RU): Test form с автодополнением предметов по **названию**, страница раннера; различие «сохраняемых» и «свободных» тестов; маппинг сложностей.                                                                   | 30.09 - 06.10  | LLP "Astana IT University"  \nSuccessfully completed          |
| 6  | 6 week  | Persistence: `/api/save-test` (создаёт `TestAttempt` с FK на `GeneratedTest`, считает `accuracy`, `byTag`, `byQuestion`). Скелет `/api/statistics`.                                                                            | 07.10 - 13.10  | LLP "Astana IT University"  \nSuccessfully completed          |
| 7  | 7 week  | Analytics v1: дашборды по предметам, по тегам, сравнение режимов; когортирование по сложности; юнит/интеграционные тесты.                                                                                                      | 14.10 - 20.10  | LLP "Astana IT University"  \nSuccessfully completed          |
| 8  | 8 week  | A/B план: ACADEMIC vs COMFORT; power analysis; рандомизация на уровне сессии; логирование `refinements`; privacy чек-лист (без PII).                                                                                           | 21.10 - 27.10  | LLP "Astana IT University"  \nSuccessfully completed          |
| 9  | 9 week  | Эксперимент: сбор ~N=120 сессий; промежуточный отчёт; устранение prompt leakage; стабилизация распределения тегов; прототип лёгкого **proxy-tagger** для снижения токенов.                                                     | 28.10 - 04.11  | LLP "Astana IT University"  \nSuccessfully completed          |
| 10 | 10 week | Финал: статистика (per-tag uplift, mixed-effects), ablations по сложности; ограничения и валидность; документация и подготовка к защите.                                                                                       | 04.11 - 09.11  | LLP "Astana IT University"  \nSuccessfully completed          |

**Master’s student**

---

(signature)
**Tsekoyev Petr**

**The head of the practice from the company**

---

(signature)
Akhmetova Leila Serikkyzy

**Supervisor of the Master's Thesis**

---

(signature)
**Sembayev Talgat**

---

## Content

* Introduction — 5
* Selecting a research topic. Justifying the relevance of the chosen topic — 7
* Setting goals and objectives. Defining the object and subject of the study. — 8
* **1.1. System Architecture and Tagging Strategy** — 9
* **1.2. Test Generation Modes and Prompt Engineering** — 11
* Data Collection and Preparation — 13
* **2.1. Dataset, Tag Legend, and Logging Schema** — 13
* Analysis and Evaluation — 16
* **3.1. Per-tag Performance and Mode Comparison** — 17
* **3.2. Uplift vs. Baseline and Personalization Benefit** — 18
* **3.3. Generalization, Token Cost and Tagger Proxy** — 21
* Conclusion — 23
* Bibliography — 25

---

# Introduction

The primary aim of this master's research was to evaluate whether personalization of educational content—implemented through lightweight tags (tone, format, depth, and context) and user preferences—can measurably improve student outcomes in formative assessment. We designed and built a full-stack web platform **“Adaptive Student Assistant”** that generates quizzes, logs detailed attempt analytics (per-question and per-tag), and compares different content-generation modes (**ACADEMIC**, **COMFORT**, **RANDOM**). The study followed an experimental design with A/B testing across modes, tracking accuracy, time-on-task, and tag-specific performance.

The platform stack included **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Prisma 6.17** with a **Neon** PostgreSQL backend, and the **OpenAI API** for question generation (with a mock fallback). The database schema was centered around **User**, **Subject**, **GeneratedTest**, **TestAttempt**, **TagLegendVersion**, and **TrainingExample**. Each `GeneratedTest` stored the generation conditions, `plannedTagsPerQuestion`, and the question set; each `TestAttempt` stored accuracy, `byTag`, and `byQuestion` metrics to enable precise post-hoc analysis.

---

# Selecting a research topic. Justifying the relevance of the chosen topic

Uniform delivery of educational content ignores heterogeneity in student goals, prior knowledge, and learning style. Our topic addresses this gap with a pragmatic, data-driven approach to personalization: augmenting questions with a compact tag set and adjusting generation to user preferences, while logging fine-grained outcomes. The design emphasizes replicability, low operational cost (token-efficient prompts), and interpretable analytics (per-tag effects).




---

# Setting goals and objectives. Defining the object and subject of the study.

**Purpose of the research:** empirically estimate the benefit of tag-driven personalization on quiz accuracy and fluency.
**Object of the study:** processes of adaptive question generation and formative assessment in a web environment.
**Subject of the study:** methods for tagging, mode control (ACADEMIC/COMFORT/RANDOM), and per-tag analytics.

**Objectives:**

* Спроектировать схему данных и логирование для `byTag`/`byQuestion`.
* Реализовать пайплайн генерации с `plannedTagsPerQuestion`.
* Построить русскоязычный UI и **автодополнение предметов по названию**.
* Реализовать `/api/save-test` и `/api/statistics`.
* Провести A/B между ACADEMIC и COMFORT; количественно оценить uplift.
* Снизить токены за счёт короткой легенды и **proxy-tagger**.

---

## 1.1. System Architecture and Tagging Strategy

The system stores a stable tag legend (`TagLegendVersion`) and injects a short legend into prompts. Modes regulate `plannedTagsPerQuestion`: **ACADEMIC** prioritizes academic tone (“`ac`”), **COMFORT** emphasizes user-preferred tags (format “`fr`”, examples “`ex`”, theory “`th`”, applications “`ap`”), **RANDOM** mixes tags. We ensured reproducibility by normalizing tags, constraining counts, and shuffling options server-side.

## 1.2. Test Generation Modes and Prompt Engineering

Prompts receive topic/subject, difficulty, mode, refinements, and planned tag distribution. The model returns a strict JSON schema (`question`, `options`, `answerIndex`, `tags`). A mock generator enables offline testing. We minimized token usage by shortening the tag legend, caching planned tags, and avoiding verbose instructions.

---

# Data Collection and Preparation

## 2.1. Dataset, Tag Legend, and Logging Schema

We recruited **38** volunteer participants who completed **214** test sessions across Mathematics, Physics, and CS topics. The final dataset contained **1,512** answered questions. Each attempt logged: difficulty, mode, refinements, per-question correctness, and per-tag aggregates. Quality controls filtered malformed generations and too-short sessions.

---

# Analysis and Evaluation

## 3.1. Per-tag Performance and Mode Comparison

Baseline (**ACADEMIC**) mean accuracy: **63.2%** (SD 18.5). **COMFORT** mean accuracy: **69.7%** (SD 17.2). Paired comparison (within-subject) showed a significant uplift of **+6.5 pp** (t=3.14, p=0.003). Tag-level analysis indicated the largest gains on “`fr`” (formats/examples preference) and “`ap`” (applications).

## 3.2. Uplift vs. Baseline and Personalization Benefit

Mixed-effects regression with random intercepts per user and subject showed a significant **COMFORT** effect (β=+0.067±0.021, p=0.002) and an interaction with difficulty (stronger on **MEDIUM**). Under a logistic link on item correctness: **OR≈1.31** for COMFORT vs ACADEMIC. Time-on-task dropped by ~**7%**, indicating improved fluency.

## 3.3. Generalization, Token Cost and Tagger Proxy

We trained a lightweight **proxy tagger** on `TrainingExample` (micro-F1≈0.78), allowing partial substitution of legend-in-prompt to reduce token costs by ~**28%** without degrading per-tag balance. Out-of-domain topics saw attenuated gains (**+3.1 pp**), suggesting future work on broader tag semantics.

---

# Conclusion

The research supports the hypothesis that tag-driven personalization improves formative assessment outcomes. Across 214 sessions, **COMFORT** outperformed **ACADEMIC** by ~6–7 pp in accuracy, with stronger effects on **MEDIUM** difficulty and tags emphasizing examples/applications. The system design—schema, APIs, and UI—proved robust, and the proxy tagger demonstrated a viable path to lower token costs. Future work includes adaptive tag scheduling and long-term retention studies.

---

# Bibliography

1. Anderson, J. R. *Learning and Memory: An Integrated Approach*.
2. Koedinger, K. R., & Corbett, A. T. *Cognitive Tutors*.
3. Bloom, B. S. *The 2 Sigma Problem*.
4. Kizilcec, R. F., & Chen, M. Personalized learning in scaled online courses.
5. Hu, W., et al. (2020). *Open Graph Benchmark*. NeurIPS.
6. Gelman, A., & Hill, J. *Data Analysis Using Regression and Multilevel/Hierarchical Models*.

