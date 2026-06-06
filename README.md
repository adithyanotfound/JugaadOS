# VidyaSetu — Classroom & Quiz Platform

A **mobile-first, progressive web app (PWA)** for schools. Teachers create classrooms, build quizzes with AI assistance, and get deep analytics. Students join classrooms, take timed quizzes, and track their performance over time.

Built with **Next.js 16**, **MongoDB**, and **Gemini AI**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Authentication](#authentication)
- [AI Features](#ai-features)
- [Seed Data](#seed-data)

---

## Features

### Teacher
- **Classroom management** — Create classrooms with auto-generated 6-character join codes
- **Quiz builder** — Build quizzes with 4 question types: MCQ, MSQ (multi-select), True/False, Fill-in-the-blank
- **Drag-and-drop** — Reorder questions with dnd-kit
- **AI question generation** — Generate questions from any topic using Gemini 2.5 Flash
- **Question bank** — Save and reuse questions across quizzes
- **Announcements** — Post class-wide announcements
- **Student management** — View enrolled students, remove if needed
- **Analytics dashboard** — 5 visualisations:
  - Quiz completion rate (progress rings)
  - Score distribution (bar chart)
  - Per-student score table (sortable)
  - Topic weakness heatmap
  - Question difficulty ranking
- **AI insights** — Gemini-powered analysis: at-risk students, revision focus, teaching strategies

### Student
- **Join classrooms** with a 6-character code
- **Take quizzes** — One-way flow, countdown timer, auto-submit on timeout
- **Results page** — Colour-coded score ring, marks-by-topic breakdown
- **Review answers** — See correct vs incorrect answers after submission
- **My Performance tab** — Score trends (line chart), topic accuracy (bar chart), strengths & weaknesses

### Platform
- **PWA** — Installable on mobile with manifest and icons
- **JWT auth** — Secure httpOnly cookies, bcrypt password hashing
- **Role-based routing** — Separate teacher and student dashboards with middleware protection
- **Input validation** — Zod schemas on all API routes
- **Toast notifications** — Sonner toasts for all actions and errors

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + Vanilla CSS |
| UI Components | shadcn/ui (Base UI) |
| Icons | Lucide React |
| Charts | Recharts |
| Database | MongoDB via Mongoose |
| Auth | JWT + bcryptjs + httpOnly cookies |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Drag & Drop | dnd-kit |
| Validation | Zod |
| Toasts | Sonner |
| Font | Poppins (Google Fonts) |
| PWA | next-pwa |

---

## Project Structure

```
vidyasetu/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icon-192.png           # PWA icon (192x192)
│   └── icon-512.png           # PWA icon (512x512)
├── scripts/
│   └── seed.ts                # Database seed script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── generate-questions/route.ts   # Gemini question generation
│   │   │   │   └── insights/route.ts             # Gemini analytics insights
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── me/route.ts
│   │   │   │   └── signup/route.ts
│   │   │   ├── classrooms/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── analytics/route.ts
│   │   │   │   │   ├── announcements/route.ts
│   │   │   │   │   ├── my-performance/route.ts
│   │   │   │   │   ├── quizzes/route.ts
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── students/
│   │   │   │   │       ├── [studentId]/route.ts
│   │   │   │   │       └── route.ts
│   │   │   │   ├── join/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── question-bank/route.ts
│   │   │   └── quizzes/
│   │   │       └── [quizId]/
│   │   │           ├── my-submission/route.ts
│   │   │           ├── route.ts
│   │   │           ├── submissions/route.ts
│   │   │           └── submit/route.ts
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/
│   │   │   ├── student/
│   │   │   │   ├── page.tsx
│   │   │   │   └── classroom/[id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── quiz/[quizId]/
│   │   │   │           ├── attempt/page.tsx
│   │   │   │           ├── result/page.tsx
│   │   │   │           └── review/page.tsx
│   │   │   └── teacher/
│   │   │       ├── page.tsx
│   │   │       └── classroom/[id]/
│   │   │           ├── page.tsx
│   │   │           └── quiz/[quizId]/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # Root redirect to /auth/login
│   ├── components/
│   │   ├── student/
│   │   │   ├── MyPerformanceTab.tsx
│   │   │   └── StudentQuizzesTab.tsx
│   │   ├── teacher/
│   │   │   ├── AnalyticsTab.tsx
│   │   │   ├── AnnouncementsTab.tsx
│   │   │   ├── QuestionBankDrawer.tsx
│   │   │   ├── QuizzesTab.tsx
│   │   │   ├── StudentsTab.tsx
│   │   │   └── SubmissionsPanel.tsx
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts            # JWT helpers (sign, verify, getSession)
│   │   └── db.ts              # Mongoose connection singleton
│   ├── models/
│   │   ├── Announcement.ts
│   │   ├── Classroom.ts
│   │   ├── QuestionBank.ts
│   │   ├── Quiz.ts
│   │   ├── Submission.ts
│   │   └── User.ts
│   └── proxy.ts               # Next.js 16 middleware (route protection)
├── .env.local                 # Environment variables (not committed)
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **MongoDB** (local or Atlas)
- **Google Gemini API key** — [Get one free](https://aistudio.google.com/app/apikey)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-org/vidyasetu.git
cd vidyasetu

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Then fill in your values (see Environment Variables below)

# 4. Seed the database with demo data
npm run seed

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB connection string
# Local (no auth):
MONGODB_URI=mongodb://localhost:27017/vidyasetu
# Local (with auth):
MONGODB_URI=mongodb://username:password@localhost:27017/vidyasetu?authSource=admin
# MongoDB Atlas:
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/vidyasetu

# JWT secret — use a long random string in production
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Google Gemini API key
GEMINI_API_KEY=AIza...
```

> **Never commit `.env.local` to version control.**

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on `localhost:3000` |
| `npm run build` | Create optimised production build |
| `npm run start` | Start production server |
| `npm run seed` | Wipe DB and populate with demo data |
| `npm run lint` | Run ESLint |

### Seed script details

`npm run seed` does the following every time:

1. Drops all existing data (users, classrooms, quizzes, submissions, announcements, question bank)
2. Creates **1 teacher** and **44 students** with realistic Indian school names
3. Creates **3 classrooms** — Mathematics Grade 10, Physics Grade 11, Chemistry Grade 12
4. Creates **6 quizzes** (2 per classroom) with real curriculum questions
5. Simulates **100+ quiz submissions** with a realistic skill distribution

**Demo credentials after seeding:**

| Role | Login | Password |
|---|---|---|
| Teacher | `priya.sharma@school.edu` | `teacher123` |
| Student | `aarav.sharma` | `student123` |
| Student | `diya.patel` | `student123` |

Join codes: `MATH10` · `PHY11A` · `CHEM12`

---

## API Reference

All API routes are under `/api/`. Authentication is via httpOnly JWT cookie.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | — | Create teacher or student account |
| `POST` | `/api/auth/login` | — | Sign in, sets JWT cookie |
| `POST` | `/api/auth/logout` | Any | Clears JWT cookie |
| `GET` | `/api/auth/me` | Any | Returns current user info |

**Signup body (teacher):**
```json
{ "role": "teacher", "fullName": "...", "email": "...", "password": "..." }
```

**Signup body (student):**
```json
{ "role": "student", "fullName": "...", "username": "...", "grade": "10-A", "password": "..." }
```

---

### Classrooms

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/classrooms` | Teacher | List teacher's classrooms |
| `POST` | `/api/classrooms` | Teacher | Create classroom |
| `GET` | `/api/classrooms/[id]` | Any | Get classroom details |
| `GET` | `/api/classrooms/join` | Student | List student's enrolled classrooms |
| `POST` | `/api/classrooms/join` | Student | Join classroom with 6-char code |
| `GET` | `/api/classrooms/[id]/students` | Teacher | List enrolled students |
| `DELETE` | `/api/classrooms/[id]/students/[studentId]` | Teacher | Remove student |
| `GET` | `/api/classrooms/[id]/announcements` | Any | List announcements |
| `POST` | `/api/classrooms/[id]/announcements` | Teacher | Post announcement |
| `GET` | `/api/classrooms/[id]/quizzes` | Any | List quizzes in classroom |
| `POST` | `/api/classrooms/[id]/quizzes` | Teacher | Create quiz |
| `GET` | `/api/classrooms/[id]/analytics` | Teacher | Full analytics data |
| `GET` | `/api/classrooms/[id]/my-performance` | Student | Student's own performance data |

---

### Quizzes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/quizzes/[quizId]` | Any | Get quiz (students don't see correct answers) |
| `PUT` | `/api/quizzes/[quizId]` | Teacher | Update quiz (questions, settings, publish) |
| `GET` | `/api/quizzes/[quizId]/submissions` | Teacher | All submissions for a quiz |
| `GET` | `/api/quizzes/[quizId]/my-submission` | Student | Student's own submission |
| `POST` | `/api/quizzes/[quizId]/submit` | Student | Submit quiz answers |

---

### Question Bank

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/question-bank` | Teacher | List saved questions (filterable by subject/topic) |
| `POST` | `/api/question-bank` | Teacher | Save question to bank |
| `DELETE` | `/api/question-bank` | Teacher | Delete a question |

---

### AI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/generate-questions` | Teacher | Generate questions via Gemini |
| `POST` | `/api/ai/insights` | Teacher | Generate class analytics insights |

**Generate questions body:**
```json
{
  "topic": "Newton's Laws of Motion",
  "subject": "Physics",
  "questionTypes": ["mcq", "truefalse"],
  "count": 5
}
```

---

## Data Models

### User
```ts
{
  role: "teacher" | "student",
  fullName: string,
  email?: string,          // teachers only
  username?: string,       // students only
  grade?: string,          // students only (e.g. "10-A")
  passwordHash: string,
  createdAt: Date
}
```

### Classroom
```ts
{
  name: string,
  subject: string,
  teacherId: ObjectId,
  joinCode: string,        // 6-char uppercase
  studentIds: ObjectId[],
  createdAt: Date
}
```

### Quiz
```ts
{
  classroomId: ObjectId,
  teacherId: ObjectId,
  title: string,
  description?: string,
  timeLimitMin: number,
  startAt: Date,
  endAt: Date,
  published: boolean,
  questions: Question[],
  createdAt: Date
}
```

### Question (embedded in Quiz)
```ts
{
  type: "mcq" | "msq" | "truefalse" | "fillblank",
  stem: string,
  topic: string,
  marks: number,
  order: number,
  options?: string[],         // MCQ and MSQ only
  correctAnswer: string | string[]
}
```

### Submission
```ts
{
  quizId: ObjectId,
  classroomId: ObjectId,
  studentId: ObjectId,
  answers: AnsweredQuestion[],
  score: number,
  totalMarks: number,
  timeTakenSec: number,
  submittedAt: Date
}
```

---

## Authentication

- Passwords hashed with **bcrypt** (10 rounds)
- JWT tokens signed with `JWT_SECRET`, stored in **httpOnly cookies** (inaccessible to JavaScript)
- Cookie expires in **7 days**
- Route protection handled in `src/proxy.ts` (Next.js 16 middleware)

**Protected routes:**

| Path | Required role |
|---|---|
| `/dashboard/teacher/*` | `teacher` |
| `/dashboard/student/*` | `student` |
| `/api/classrooms` (POST) | `teacher` |
| `/api/classrooms/[id]/students` (DELETE) | `teacher` |
| `/api/quizzes/[id]/submit` | `student` |
| All AI routes | `teacher` |

Unauthenticated requests to protected routes are redirected to `/auth/login`.

---

## AI Features

VidyaSetu uses **Google Gemini 2.5 Flash** for two features:

### 1. AI Question Generation

Located in the Quiz Builder. Teachers specify:
- **Topic** — e.g. "Quadratic Equations"
- **Question types** — any combination of MCQ, MSQ, True/False, Fill-in-blank
- **Number of questions** — 1–20

Gemini returns fully structured questions with correct answers and marks, which are inserted directly into the quiz.

### 2. AI Insights

Located in the Analytics tab. After analytics data is loaded, teachers click **Generate Insights**. Gemini analyses:
- Which students are at risk (low average, specific weak topics)
- Which topics need urgent class revision
- Specific teaching strategies for struggling topics

Insights are broken into three sections: **Students Needing Attention**, **Revision Focus**, and **Teaching Strategies**.

---

## Seed Data

The seed script at `scripts/seed.ts` is idempotent — safe to run multiple times. It uses the same `MONGODB_URI` from `.env.local`.

**What gets seeded:**

| Entity | Count | Details |
|---|---|---|
| Teacher | 1 | Priya Sharma |
| Students | 44 | Realistic Indian school names across grades 10–12 |
| Classrooms | 3 | Math, Physics, Chemistry |
| Announcements | 8 | Realistic school notices |
| Quizzes | 6 | Real CBSE-aligned questions |
| Submissions | ~100 | Tiered skill distribution (top/middle/struggling) |

**Student skill tiers simulated:**
- Top 25% students: 80–95% accuracy
- Middle 40%: 55–79% accuracy
- Bottom 35%: 30–54% accuracy

This gives realistic analytics data to explore the dashboard without needing real students.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT © iqoo Foundation
