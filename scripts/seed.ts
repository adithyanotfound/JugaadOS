// scripts/seed.ts
// Run with: npx tsx scripts/seed.ts

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;

// ─── Schemas (inline for script) ───────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  role: String,
  fullName: String,
  email: String,
  username: String,
  grade: String,
  passwordHash: String,
  createdAt: { type: Date, default: Date.now },
});

const ClassroomSchema = new mongoose.Schema({
  name: String,
  subject: String,
  teacherId: mongoose.Schema.Types.ObjectId,
  joinCode: String,
  studentIds: [mongoose.Schema.Types.ObjectId],
  createdAt: { type: Date, default: Date.now },
});

const AnnouncementSchema = new mongoose.Schema({
  classroomId: mongoose.Schema.Types.ObjectId,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const QuizSchema = new mongoose.Schema({
  classroomId: mongoose.Schema.Types.ObjectId,
  teacherId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  timeLimitMin: Number,
  startAt: Date,
  endAt: Date,
  published: Boolean,
  questions: Array,
  createdAt: { type: Date, default: Date.now },
});

const SubmissionSchema = new mongoose.Schema({
  quizId: mongoose.Schema.Types.ObjectId,
  classroomId: mongoose.Schema.Types.ObjectId,
  studentId: mongoose.Schema.Types.ObjectId,
  answers: Array,
  score: Number,
  totalMarks: Number,
  timeTakenSec: Number,
  submittedAt: { type: Date, default: Date.now },
});

const QuestionBankSchema = new mongoose.Schema({
  teacherId: mongoose.Schema.Types.ObjectId,
  subject: String,
  topic: String,
  question: Object,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Classroom = mongoose.models.Classroom || mongoose.model("Classroom", ClassroomSchema);
const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
const Quiz = mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);
const Submission = mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema);
const QuestionBank = mongoose.models.QuestionBank || mongoose.model("QuestionBank", QuestionBankSchema);

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Student Names (realistic Indian school names) ───────────────────────

const STUDENTS: Array<{ fullName: string; username: string }> = [
  { fullName: "Aarav Sharma", username: "aarav.sharma" },
  { fullName: "Diya Patel", username: "diya.patel" },
  { fullName: "Rohan Mehta", username: "rohan.mehta" },
  { fullName: "Ananya Singh", username: "ananya.singh" },
  { fullName: "Vihaan Kumar", username: "vihaan.kumar" },
  { fullName: "Kavya Nair", username: "kavya.nair" },
  { fullName: "Arjun Reddy", username: "arjun.reddy" },
  { fullName: "Ishita Gupta", username: "ishita.gupta" },
  { fullName: "Reyansh Joshi", username: "reyansh.joshi" },
  { fullName: "Anika Bose", username: "anika.bose" },
  { fullName: "Advait Rao", username: "advait.rao" },
  { fullName: "Priya Iyer", username: "priya.iyer" },
  { fullName: "Kabir Malhotra", username: "kabir.malhotra" },
  { fullName: "Saanvi Choudhary", username: "saanvi.choudhary" },
  { fullName: "Vivaan Kapoor", username: "vivaan.kapoor" },
  { fullName: "Tanya Mishra", username: "tanya.mishra" },
  { fullName: "Arnav Saxena", username: "arnav.saxena" },
  { fullName: "Riya Verma", username: "riya.verma" },
  { fullName: "Dhruv Pandey", username: "dhruv.pandey" },
  { fullName: "Meera Agarwal", username: "meera.agarwal" },
  { fullName: "Shaurya Tiwari", username: "shaurya.tiwari" },
  { fullName: "Nisha Pillai", username: "nisha.pillai" },
  { fullName: "Krish Bansal", username: "krish.bansal" },
  { fullName: "Avni Desai", username: "avni.desai" },
  { fullName: "Ranveer Bhatt", username: "ranveer.bhatt" },
  { fullName: "Pooja Srivastava", username: "pooja.srivastava" },
  { fullName: "Atharva Shah", username: "atharva.shah" },
  { fullName: "Simran Khanna", username: "simran.khanna" },
  { fullName: "Yuvraj Chauhan", username: "yuvraj.chauhan" },
  { fullName: "Zara Hussain", username: "zara.hussain" },
  { fullName: "Parth Trivedi", username: "parth.trivedi" },
  { fullName: "Ira Chatterjee", username: "ira.chatterjee" },
  { fullName: "Laksh Goswami", username: "laksh.goswami" },
  { fullName: "Myra Das", username: "myra.das" },
  { fullName: "Siddharth Bhatt", username: "siddharth.bhatt" },
  { fullName: "Riddhi Jain", username: "riddhi.jain" },
  { fullName: "Mihir Kulkarni", username: "mihir.kulkarni" },
  { fullName: "Aditi Menon", username: "aditi.menon" },
  { fullName: "Chirag Thakur", username: "chirag.thakur" },
  { fullName: "Prerna Sinha", username: "prerna.sinha" },
  { fullName: "Aditya Dubey", username: "aditya.dubey" },
  { fullName: "Aarohi Chaudhary", username: "aarohi.chaudhary" },
  { fullName: "Sarvesh Nambiar", username: "sarvesh.nambiar" },
  { fullName: "Tanvi Rastogi", username: "tanvi.rastogi" },
];

// ─── Quiz Data ──────────────────────────────────────────────────────────────

const MATH_QUIZ_1 = {
  title: "Algebra — Mid-Term Assessment",
  description: "Covers linear equations, quadratic expressions, and polynomials. Calculator not permitted.",
  timeLimitMin: 45,
  questions: [
    {
      type: "mcq", topic: "Linear Equations", stem: "Solve for x: 3x - 7 = 2x + 5",
      options: ["x = 12", "x = -2", "x = 2", "x = -12"],
      correctAnswer: "A", marks: 2,
    },
    {
      type: "mcq", topic: "Quadratic Equations", stem: "Which of the following is a root of x² - 5x + 6 = 0?",
      options: ["x = 1", "x = 2", "x = 4", "x = -6"],
      correctAnswer: "B", marks: 2,
    },
    {
      type: "mcq", topic: "Polynomials", stem: "The degree of the polynomial 4x³ - 2x² + x - 7 is:",
      options: ["1", "2", "3", "4"],
      correctAnswer: "C", marks: 1,
    },
    {
      type: "truefalse", topic: "Linear Equations", stem: "The equation 2(x + 3) = 2x + 6 has infinitely many solutions.",
      correctAnswer: "True", marks: 1,
    },
    {
      type: "mcq", topic: "Quadratic Equations", stem: "For the equation x² + bx + c = 0, if the sum of roots is -5 and product is 6, then b and c are:",
      options: ["b = 5, c = 6", "b = -5, c = 6", "b = 5, c = -6", "b = -5, c = -6"],
      correctAnswer: "A", marks: 2,
    },
    {
      type: "msq", topic: "Polynomials", stem: "Which of the following are factors of x² - 4?",
      options: ["(x + 2)", "(x - 2)", "(x + 4)", "(x² + 4)"],
      correctAnswer: ["A", "B"], marks: 2,
    },
    {
      type: "fillblank", topic: "Linear Equations", stem: "If 5x + 15 = 0, then x = ___",
      correctAnswer: ["-3", "−3"], marks: 1,
    },
    {
      type: "mcq", topic: "Quadratic Equations", stem: "The discriminant of 3x² + 2x - 1 = 0 is:",
      options: ["4", "16", "8", "-8"],
      correctAnswer: "B", marks: 2,
    },
    {
      type: "truefalse", topic: "Polynomials", stem: "Every linear polynomial has exactly one zero.",
      correctAnswer: "True", marks: 1,
    },
    {
      type: "mcq", topic: "Quadratic Equations", stem: "If one root of x² - 3x + k = 0 is 1, the value of k is:",
      options: ["1", "2", "3", "-2"],
      correctAnswer: "B", marks: 2,
    },
  ],
};

const MATH_QUIZ_2 = {
  title: "Trigonometry — Unit Test",
  description: "Covers trigonometric ratios, identities, and applications. Reference sheet provided.",
  timeLimitMin: 30,
  questions: [
    {
      type: "mcq", topic: "Trigonometric Ratios", stem: "The value of sin 30° is:",
      options: ["1/√2", "1/2", "√3/2", "1"],
      correctAnswer: "B", marks: 1,
    },
    {
      type: "mcq", topic: "Trigonometric Identities", stem: "Which identity is correct?",
      options: ["sin²θ - cos²θ = 1", "sin²θ + cos²θ = 1", "tan²θ + 1 = sin²θ", "cos²θ - sin²θ = 1"],
      correctAnswer: "B", marks: 2,
    },
    {
      type: "truefalse", topic: "Trigonometric Ratios", stem: "tan 45° = 1",
      correctAnswer: "True", marks: 1,
    },
    {
      type: "fillblank", topic: "Trigonometric Ratios", stem: "cos 0° = ___",
      correctAnswer: ["1"], marks: 1,
    },
    {
      type: "mcq", topic: "Applications", stem: "A tower casts a shadow of 30m when the angle of elevation of the sun is 60°. The height of the tower is:",
      options: ["10√3 m", "30√3 m", "15√3 m", "10 m"],
      correctAnswer: "A", marks: 3,
    },
    {
      type: "mcq", topic: "Trigonometric Identities", stem: "Simplify: (1 - sin²θ)/cos²θ",
      options: ["sin²θ", "cos²θ", "1", "0"],
      correctAnswer: "C", marks: 2,
    },
  ],
};

const PHYSICS_QUIZ_1 = {
  title: "Newton's Laws of Motion — Chapter Test",
  description: "Covers all three laws of motion, friction, and applications. Formulae sheet allowed.",
  timeLimitMin: 40,
  questions: [
    {
      type: "mcq", topic: "Newton's First Law", stem: "A body at rest continues to remain at rest unless acted upon by an external force. This is Newton's:",
      options: ["Second Law", "Third Law", "First Law", "Law of Gravitation"],
      correctAnswer: "C", marks: 1,
    },
    {
      type: "mcq", topic: "Newton's Second Law", stem: "A 5 kg object is accelerated at 3 m/s². The net force acting on it is:",
      options: ["1.67 N", "15 N", "8 N", "0 N"],
      correctAnswer: "B", marks: 2,
    },
    {
      type: "truefalse", topic: "Newton's Third Law", stem: "Action and reaction forces act on the same object.",
      correctAnswer: "False", marks: 1,
    },
    {
      type: "mcq", topic: "Friction", stem: "The frictional force between two surfaces is independent of:",
      options: ["The normal force", "The nature of surfaces", "The area of contact", "Both A and B"],
      correctAnswer: "C", marks: 2,
    },
    {
      type: "msq", topic: "Newton's First Law", stem: "Which of the following are examples of inertia?",
      options: [
        "A passenger lurches forward when a bus brakes suddenly",
        "A coin placed on a card falls into a glass when the card is flicked",
        "A rocket propels forward when gas is ejected backward",
        "A ball continues rolling on a frictionless surface",
      ],
      correctAnswer: ["A", "B", "D"], marks: 3,
    },
    {
      type: "fillblank", topic: "Newton's Second Law", stem: "F = m × ___ (fill in the missing quantity)",
      correctAnswer: ["a", "acceleration"], marks: 1,
    },
    {
      type: "mcq", topic: "Newton's Third Law", stem: "When a gun is fired, the gun recoils backward. This demonstrates Newton's:",
      options: ["First Law", "Second Law", "Third Law", "Law of Conservation"],
      correctAnswer: "C", marks: 2,
    },
    {
      type: "mcq", topic: "Friction", stem: "Static friction is generally ___ kinetic friction.",
      options: ["less than", "equal to", "greater than", "unrelated to"],
      correctAnswer: "C", marks: 1,
    },
  ],
};

const PHYSICS_QUIZ_2 = {
  title: "Optics — Light and Reflection",
  description: "Chapter 10 — Reflection of light, mirrors, and ray diagrams.",
  timeLimitMin: 35,
  questions: [
    {
      type: "mcq", topic: "Reflection", stem: "The angle of incidence is always equal to the angle of reflection. This is the:",
      options: ["Law of refraction", "First law of reflection", "Snell's Law", "Law of dispersion"],
      correctAnswer: "B", marks: 1,
    },
    {
      type: "truefalse", topic: "Mirrors", stem: "A concave mirror always forms a virtual image.",
      correctAnswer: "False", marks: 1,
    },
    {
      type: "mcq", topic: "Mirrors", stem: "The focal length of a concave mirror is 10 cm. Its radius of curvature is:",
      options: ["5 cm", "10 cm", "20 cm", "40 cm"],
      correctAnswer: "C", marks: 2,
    },
    {
      type: "mcq", topic: "Reflection", stem: "Which type of mirror is used in solar furnaces?",
      options: ["Plane mirror", "Convex mirror", "Concave mirror", "Cylindrical mirror"],
      correctAnswer: "C", marks: 1,
    },
    {
      type: "fillblank", topic: "Mirrors", stem: "The mirror formula is: 1/f = 1/v + ___",
      correctAnswer: ["1/u", "1/v"], marks: 2,
    },
    {
      type: "msq", topic: "Mirrors", stem: "Which mirrors always produce a virtual, erect and diminished image?",
      options: ["Concave mirror", "Convex mirror", "Plane mirror", "All of the above"],
      correctAnswer: ["B"], marks: 2,
    },
  ],
};

const CHEM_QUIZ_1 = {
  title: "Periodic Table — Elements and Trends",
  description: "Covers groups, periods, atomic number, and periodic trends. First 20 elements must be memorised.",
  timeLimitMin: 30,
  questions: [
    {
      type: "mcq", topic: "Periodic Table", stem: "The element with atomic number 11 is:",
      options: ["Magnesium", "Sodium", "Potassium", "Chlorine"],
      correctAnswer: "B", marks: 1,
    },
    {
      type: "mcq", topic: "Periodic Trends", stem: "Atomic radius generally ___ across a period from left to right.",
      options: ["Increases", "Decreases", "Remains constant", "First increases then decreases"],
      correctAnswer: "B", marks: 2,
    },
    {
      type: "truefalse", topic: "Periodic Table", stem: "Noble gases are placed in Group 18 of the modern periodic table.",
      correctAnswer: "True", marks: 1,
    },
    {
      type: "msq", topic: "Periodic Trends", stem: "Which of the following properties generally increase as you move down a group?",
      options: ["Atomic size", "Metallic character", "Electronegativity", "Ionisation energy"],
      correctAnswer: ["A", "B"], marks: 2,
    },
    {
      type: "mcq", topic: "Periodic Table", stem: "Dobereiner's Law of Triads states that the atomic weight of the middle element of a triad is approximately the ___ of the other two.",
      options: ["Sum", "Difference", "Arithmetic mean", "Geometric mean"],
      correctAnswer: "C", marks: 2,
    },
    {
      type: "fillblank", topic: "Periodic Table", stem: "The horizontal rows in the periodic table are called ___.",
      correctAnswer: ["periods", "Periods"], marks: 1,
    },
    {
      type: "mcq", topic: "Periodic Trends", stem: "Which has the highest electronegativity?",
      options: ["Oxygen", "Nitrogen", "Fluorine", "Chlorine"],
      correctAnswer: "C", marks: 2,
    },
    {
      type: "truefalse", topic: "Periodic Table", stem: "Mendeleev left gaps in his periodic table for elements not yet discovered.",
      correctAnswer: "True", marks: 1,
    },
  ],
};

const CHEM_QUIZ_2 = {
  title: "Chemical Bonding — Ionic and Covalent",
  description: "Covers ionic bonds, covalent bonds, Lewis structures, and properties. Chapter 4.",
  timeLimitMin: 40,
  questions: [
    {
      type: "mcq", topic: "Ionic Bonds", stem: "Ionic bonds are formed by:",
      options: ["Sharing of electrons", "Transfer of electrons", "Sharing of protons", "Transfer of neutrons"],
      correctAnswer: "B", marks: 1,
    },
    {
      type: "mcq", topic: "Covalent Bonds", stem: "The number of covalent bonds in a molecule of water (H₂O) is:",
      options: ["1", "2", "3", "4"],
      correctAnswer: "B", marks: 1,
    },
    {
      type: "truefalse", topic: "Ionic Bonds", stem: "Ionic compounds generally have high melting and boiling points.",
      correctAnswer: "True", marks: 1,
    },
    {
      type: "mcq", topic: "Covalent Bonds", stem: "Which of the following has a triple bond?",
      options: ["O₂", "N₂", "H₂O", "CO₂"],
      correctAnswer: "B", marks: 2,
    },
    {
      type: "msq", topic: "Ionic Bonds", stem: "Which of the following are properties of ionic compounds?",
      options: [
        "Conduct electricity in molten state",
        "Are generally soluble in polar solvents",
        "Have low melting points",
        "Exist as crystalline solids at room temperature",
      ],
      correctAnswer: ["A", "B", "D"], marks: 3,
    },
    {
      type: "fillblank", topic: "Covalent Bonds", stem: "A bond formed by sharing of two pairs of electrons is called a ___ bond.",
      correctAnswer: ["double", "Double covalent"], marks: 2,
    },
    {
      type: "mcq", topic: "Ionic Bonds", stem: "The formula of calcium chloride is:",
      options: ["CaCl", "CaCl₂", "Ca₂Cl", "CaCl₃"],
      correctAnswer: "B", marks: 2,
    },
  ],
};

// ─── Grading Logic ─────────────────────────────────────────────────────────

function gradeSubmission(questions: any[], studentSkill: number) {
  const answers = questions.map((q: any) => {
    const correct = Math.random() < studentSkill;
    let answer: string | string[];

    if (q.type === "mcq") {
      answer = correct ? q.correctAnswer : pickRandom(["A", "B", "C", "D"].filter((x: string) => x !== q.correctAnswer));
    } else if (q.type === "msq") {
      answer = correct ? q.correctAnswer : [pickRandom(["A", "B", "C", "D"])];
    } else if (q.type === "truefalse") {
      answer = correct ? q.correctAnswer : (q.correctAnswer === "True" ? "False" : "True");
    } else {
      answer = correct ? q.correctAnswer[0] : "wrong answer";
    }

    const isCorrect = (() => {
      if (q.type === "mcq" || q.type === "truefalse") return answer === q.correctAnswer;
      if (q.type === "msq") {
        const a = Array.isArray(answer) ? [...answer].sort() : [answer];
        const c = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [q.correctAnswer];
        return JSON.stringify(a) === JSON.stringify(c);
      }
      if (q.type === "fillblank") {
        const arr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        const given = Array.isArray(answer) ? answer[0] : answer;
        return arr.some((a: string) => a.toLowerCase() === given.toLowerCase());
      }
      return false;
    })();

    return {
      questionId: q._id || new mongoose.Types.ObjectId(),
      answer,
      isCorrect,
      marksEarned: isCorrect ? q.marks : 0,
    };
  });

  const score = answers.reduce((s: number, a: any) => s + a.marksEarned, 0);
  const totalMarks = questions.reduce((s: number, q: any) => s + q.marks, 0);
  const timeTakenSec = randomBetween(Math.floor(0.4 * 60 * questions.length / 10 * 60), Math.floor(0.9 * 60 * questions.length / 10 * 60));

  return { answers, score, totalMarks, timeTakenSec };
}

// ─── Main Seed ─────────────────────────────────────────────────────────────

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  // Clear all collections
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Classroom.deleteMany({}),
    Announcement.deleteMany({}),
    Quiz.deleteMany({}),
    Submission.deleteMany({}),
    QuestionBank.deleteMany({}),
  ]);
  console.log("Cleared.");

  // ── Teacher ──────────────────────────────────────────────────────────────
  const pwHash = await bcrypt.hash("teacher123", 10);
  const teacher = await User.create({
    role: "teacher",
    fullName: "Priya Sharma",
    email: "priya.sharma@school.edu",
    passwordHash: pwHash,
    createdAt: daysAgo(90),
  });
  console.log(`Teacher created: priya.sharma@school.edu / teacher123`);

  // ── Students ─────────────────────────────────────────────────────────────
  const studentPw = await bcrypt.hash("student123", 10);
  const grades = ["10-A", "10-B", "11-A", "11-B", "12-A", "12-B"];
  const studentsData = STUDENTS.map((s, i) => ({
    role: "student",
    fullName: s.fullName,
    username: s.username,
    grade: grades[i % grades.length],
    passwordHash: studentPw,
    createdAt: daysAgo(randomBetween(30, 80)),
  }));
  const students = await User.insertMany(studentsData);
  console.log(`Created ${students.length} students (all password: student123)`);

  // ── Classrooms ───────────────────────────────────────────────────────────
  const mathStudents = students.slice(0, 18).map((s: any) => s._id);
  const physicsStudents = students.slice(8, 30).map((s: any) => s._id);
  const chemStudents = students.slice(20, 44).map((s: any) => s._id);

  const mathClass = await Classroom.create({
    name: "Mathematics — Grade 10",
    subject: "Mathematics",
    teacherId: teacher._id,
    joinCode: "MATH10",
    studentIds: mathStudents,
    createdAt: daysAgo(60),
  });

  const physicsClass = await Classroom.create({
    name: "Physics — Grade 11",
    subject: "Physics",
    teacherId: teacher._id,
    joinCode: "PHY11A",
    studentIds: physicsStudents,
    createdAt: daysAgo(55),
  });

  const chemClass = await Classroom.create({
    name: "Chemistry — Grade 12",
    subject: "Chemistry",
    teacherId: teacher._id,
    joinCode: "CHEM12",
    studentIds: chemStudents,
    createdAt: daysAgo(50),
  });

  console.log("Created 3 classrooms");

  // ── Announcements ─────────────────────────────────────────────────────────
  await Announcement.insertMany([
    {
      classroomId: mathClass._id,
      content: "Dear students, the Mid-Term Algebra test is scheduled for next week. Please revise chapters 2 through 5. Focus especially on quadratic equations and factorization. Office hours are available on Tuesday and Thursday from 4–5 PM.",
      createdAt: daysAgo(14),
    },
    {
      classroomId: mathClass._id,
      content: "Reminder: Chapter 6 worksheet (Trigonometry) is due this Friday. Submit softcopy on the portal and hardcopy in class. Late submissions will receive a deduction.",
      createdAt: daysAgo(5),
    },
    {
      classroomId: mathClass._id,
      content: "Great performance overall on the Algebra assessment! I've uploaded individual feedback on the portal. Those who scored below 60% — please meet me during office hours. We will schedule a revision session on Monday.",
      createdAt: daysAgo(2),
    },
    {
      classroomId: physicsClass._id,
      content: "Lab practical on Newton's Laws is scheduled for Thursday. Please bring your lab coat and complete the pre-lab questions in your manual before attending. Groups have been assigned on the notice board.",
      createdAt: daysAgo(18),
    },
    {
      classroomId: physicsClass._id,
      content: "Chapter 10 (Light — Reflection and Refraction) notes have been uploaded to the class drive. We will begin this chapter next week. Please read pages 160–180 before the first lecture.",
      createdAt: daysAgo(7),
    },
    {
      classroomId: chemClass._id,
      content: "The Periodic Table quiz will be open for 48 hours starting today. Ensure you complete it within the window. The quiz covers all elements up to atomic number 20 and periodic trends from Chapter 3.",
      createdAt: daysAgo(20),
    },
    {
      classroomId: chemClass._id,
      content: "Important: CBSE board syllabus update — Unit 4 (Chemical Bonding) has been included in the Term 1 examination pattern. We will cover this chapter entirely before the end of October.",
      createdAt: daysAgo(10),
    },
    {
      classroomId: chemClass._id,
      content: "Revision session for Chemical Bonding quiz is scheduled for Saturday 10 AM in Room 204. Attendance is strongly encouraged for students who scored below 70% in the Periodic Table quiz.",
      createdAt: daysAgo(3),
    },
  ]);
  console.log("Created announcements");

  // ── Quizzes & Submissions ─────────────────────────────────────────────────

  async function createQuiz(
    classroomId: mongoose.Types.ObjectId,
    studentIds: mongoose.Types.ObjectId[],
    quizData: typeof MATH_QUIZ_1,
    startOffsetDays: number,
    endOffsetDays: number,
    participationRate = 0.85,
  ) {
    const qs = quizData.questions.map((q, i) => ({ ...q, _id: new mongoose.Types.ObjectId(), order: i }));
    const quiz = await Quiz.create({
      classroomId,
      teacherId: teacher._id,
      title: quizData.title,
      description: quizData.description,
      timeLimitMin: quizData.timeLimitMin,
      startAt: daysAgo(startOffsetDays + 1),
      endAt: daysAgo(endOffsetDays),
      published: true,
      questions: qs,
      createdAt: daysAgo(startOffsetDays + 3),
    });

    // Skill distribution: top students 80-95%, middle 55-79%, struggling 30-54%
    const submissions: Record<string, unknown>[] = [];
    for (let i = 0; i < studentIds.length; i++) {
      if (Math.random() > participationRate) continue;
      const tier = i / studentIds.length;
      const skill = tier < 0.25 ? randomBetween(80, 95) / 100
        : tier < 0.65 ? randomBetween(55, 79) / 100
        : randomBetween(30, 54) / 100;

      const { answers, score, totalMarks, timeTakenSec } = gradeSubmission(qs, skill);
      submissions.push({
        quizId: quiz._id,
        classroomId,
        studentId: studentIds[i],
        answers,
        score,
        totalMarks,
        timeTakenSec,
        submittedAt: new Date(daysAgo(endOffsetDays).getTime() - randomBetween(1000, 3600000)),
      });
    }
    await Submission.insertMany(submissions);
    console.log(`  Quiz "${quizData.title}" — ${submissions.length} submissions`);
    return quiz;
  }

  console.log("\nCreating Math quizzes...");
  await createQuiz(mathClass._id, mathStudents, MATH_QUIZ_1, 21, 8);
  await createQuiz(mathClass._id, mathStudents, MATH_QUIZ_2, 7, 1, 0.7);

  console.log("Creating Physics quizzes...");
  await createQuiz(physicsClass._id, physicsStudents, PHYSICS_QUIZ_1, 18, 5);
  await createQuiz(physicsClass._id, physicsStudents, PHYSICS_QUIZ_2, 4, 0, 0.65);

  console.log("Creating Chemistry quizzes...");
  await createQuiz(chemClass._id, chemStudents, CHEM_QUIZ_1, 22, 9);
  await createQuiz(chemClass._id, chemStudents, CHEM_QUIZ_2, 6, 2);

  console.log("\n========================================");
  console.log("Seed complete!");
  console.log("========================================");
  console.log("Teacher login:  priya.sharma@school.edu / teacher123");
  console.log("Student login:  aarav.sharma / student123 (any student)");
  console.log("Classrooms:     MATH10 | PHY11A | CHEM12");
  console.log("========================================\n");

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
