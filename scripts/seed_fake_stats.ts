/* scripts/seed_fake_stats.ts
 * Фейковые данные для статистики:
 * - 25 Users (реалистичные логины/почты, возраст 15–25, уровни от highschool до doctorate, пароли — ХЭШ scrypt)
 * - 24 Subjects (>=20 уникальных)
 * - 100 Attempts (GeneratedTest + TestQuestion[] + byTag)
 */
import { PrismaClient, Prisma, Difficulty, Mode } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// ========= Хэширование паролей (scrypt) =========
function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16);
  const N = 16384, r = 8, p = 1;
  const keyLen = 64;
  const hash = crypto.scryptSync(plain, salt, keyLen, { N, r, p });
  // человекочитаемый формат хранения
  return `scrypt$N=${N},r=${r},p=${p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

// ========= Параметры генерации =========
const NUM_USERS = 25;
const NUM_SUBJECTS = 24;
const NUM_ATTEMPTS = 100;

const TAG_POOL = [
  "algebra","calculus","geometry","probability","statistics",
  "logic","discrete_math","graphs","combinatorics","number_theory",
  "physics","mechanics","optics","electrodynamics","thermo",
  "chemistry","biology","cs","algorithms","data_structures",
  "theory","practice","fundamentals","advanced","tricky",
  "multi_step","proof","definition","example_based","real_world",
  "concise","step_by_step","visual","mnemonics","exam_prep",
  "spaced_repetition","conceptual","procedural"
];

const SUBJECT_NAMES = [
  "Algebra I","Algebra II","Geometry","Trigonometry",
  "Calculus I","Calculus II","Discrete Math","Probability Basics",
  "Statistics","Number Theory","Graph Theory","Combinatorics",
  "Physics: Mechanics","Physics: Optics","Physics: Thermodynamics","CS Basics",
  "Algorithms","Data Structures","Linear Algebra","Mathematical Logic",
  "Biology Basics","Chemistry Basics","Econometrics","Machine Learning Intro",
];

const DIFFS: Difficulty[] = ["EASY","MEDIUM","HARD"];
const MODES: Mode[] = ["ACADEMIC","COMFORT","RANDOM"];

// реалистичные логины/почты (25 штук)
const USER_HANDLES = [
  { login: "arman.nurlybay",  email: "arman.nurlybay@example.com" },
  { login: "aigerim.bektas",  email: "aigerim.bektas@example.com" },
  { login: "timur.ospanov",   email: "timur.ospanov@example.com" },
  { login: "diana.kim",       email: "diana.kim@example.com" },
  { login: "nazar.bolat",     email: "nazar.bolat@example.com" },
  { login: "dana.smagul",     email: "dana.smagul@example.com" },
  { login: "madina.sattar",   email: "madina.sattar@example.com" },
  { login: "ruslan.ivanov",   email: "ruslan.ivanov@example.com" },
  { login: "darya.petrova",   email: "darya.petrova@example.com" },
  { login: "alexei.smirnov",  email: "alexei.smirnov@example.com" },
  { login: "egor.kuznetsov",  email: "egor.kuznetsov@example.com" },
  { login: "sofia.morozova",  email: "sofia.morozova@example.com" },
  { login: "alina.karim",     email: "alina.karim@example.com" },
  { login: "yerlan.tuleu",    email: "yerlan.tuleu@example.com" },
  { login: "zhanar.toktar",   email: "zhanar.toktar@example.com" },
  { login: "askar.rahim",     email: "askar.rahim@example.com" },
  { login: "adil.sagyn",      email: "adil.sagyn@example.com" },
  { login: "kamila.zhan",     email: "kamila.zhan@example.com" },
  { login: "aliya.serik",     email: "aliya.serik@example.com" },
  { login: "bekzat.nabi",     email: "bekzat.nabi@example.com" },
  { login: "ilya.sokolov",    email: "ilya.sokolov@example.com" },
  { login: "maria.lebedeva",  email: "maria.lebedeva@example.com" },
  { login: "kirill.orlov",    email: "kirill.orlov@example.com" },
  { login: "elena.efimova",   email: "elena.efimova@example.com" },
  { login: "savely.barinov",  email: "savely.barinov@example.com" },
];

// уровни образования от школы до докторантуры
const EDU_LEVELS = ["highschool", "bachelor", "master", "doctorate"] as const;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[] | T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function sample<T>(arr: T[], k: number): T[] {
  const a = [...arr];
  const out: T[] = [];
  for (let i = 0; i < k && a.length; i++) {
    const idx = randInt(0, a.length - 1);
    out.push(a[idx]);
    a.splice(idx, 1);
  }
  return out;
}
function coin(p = 0.5) { return Math.random() < p; }

async function main() {
  console.log("Seeding fake stats…");

  // ===== 1) Users (25 шт.) =====
  const users = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const handle = USER_HANDLES[i % USER_HANDLES.length];
    // логин/почта уникальны, но на всякий случай добавим небольшой шум, если выйдем за 25
    const login = i < USER_HANDLES.length ? handle.login : `${handle.login}${i}`;
    const email = i < USER_HANDLES.length ? handle.email : handle.email.replace("@", `+${i}@`);

    const u = await prisma.user.create({
      data: {
        login,
        // безопасный хэш вместо plain
        password: hashPassword("changeme-" + login),
        email,
        age: randInt(15, 25),                             // 15–25
        educationLevel: pick(EDU_LEVELS),                 // от школы до докторантуры
        learningGoal: pick(["exam","refresh","deep_understanding","assignment"]),
        learningStyle: pick(["visual","verbal","example_based","step_by_step","concise"]),
        preferredFormat: pick(["bullets","paragraphs","qa","code"]),
        preferredTone: pick(["neutral","friendly","formal"]),
        detailLevel: pick(["brief","balanced","in_depth"]),
        priorKnowledge: pick(["low","medium","high"]),
        languageLevel: pick(["B1","B2","C1"]),
        darkMode: coin(0.6),
        accessibleMode: coin(0.2),
        fontSize: pick(["sm","base","lg"]),
      },
    });
    users.push(u);
  }
  console.log(`Users: ${users.length}`);

  // ===== 2) Subjects (24 шт.) =====
  const subjects = [];
  const subjectAuthors = users.slice(0, Math.min(10, users.length));
  for (let i = 0; i < NUM_SUBJECTS; i++) {
    const name = SUBJECT_NAMES[i % SUBJECT_NAMES.length];
    const owner = pick(subjectAuthors);
    const diff = pick(DIFFS);

    const s = await prisma.subject.create({
      data: {
        userId: owner.id,
        name,
        difficulty: diff,
        description: coin(0.5) ? `Auto subject: ${name}, ${diff}` : null,
      },
    });
    subjects.push(s);
  }
  console.log(`Subjects: ${subjects.length}`);

  // ===== 3) Attempts (100 шт.) =====
  let attempts = 0;
  for (let i = 0; i < NUM_ATTEMPTS; i++) {
    const taker = pick(users);
    const subject = pick(subjects);

    const topic = subject.name;
    const difficulty = pick(DIFFS);
    const mode = pick(MODES);
    const tagsVersion = "v1";
    const numQuestions = randInt(6, 12);

    const plannedTagsPerQuestion: string[][] = Array.from({ length: numQuestions }, () =>
      sample(TAG_POOL, randInt(2, 4))
    );

    const refinementsAll = [
      "avoid_jargon","use_examples","short_paragraphs",
      "highlight_key_points","step_by_step","add_challenges",
    ];
    const refinements = sample(refinementsAll, randInt(1, 3));
    const tagStrategy = pick([
      "balanced: fundamentals+examples",
      "theory_first then practice",
      "exam_prep focus",
      "visual+real_world",
    ]);

    const gtest = await prisma.generatedTest.create({
      data: {
        userId: taker.id,
        subjectId: subject.id,
        topic,
        difficulty,
        mode,
        savable: true,
        tagsVersion,
        refinements,
        numQuestions,
        experimentArm: coin(0.5) ? pick(["A","B","C","ACADEMIC","COMFORT","RANDOM"]) : null,
        tagStrategy,
        plannedTagsPerQuestion: plannedTagsPerQuestion as unknown as Prisma.InputJsonValue,
      },
    });

    type TagStat = { total: number; correct: number; accuracy?: number };
    const byTag: Record<string, TagStat> = {};
    let total = numQuestions;
    let correct = 0;

    for (let q = 0; q < numQuestions; q++) {
      const opts = ["A","B","C","D"].map(o => `${o}) ${topic} item ${q + 1}`);
      const answerIndex = randInt(0, opts.length - 1);
      const qTags = plannedTagsPerQuestion[q] ?? sample(TAG_POOL, randInt(2, 4));

      const baseP = difficulty === "EASY" ? 0.75 : difficulty === "MEDIUM" ? 0.58 : 0.45;
      const gotItRight = Math.random() < baseP;
      if (gotItRight) correct++;

      for (const t of qTags) {
        const s = (byTag[t] ||= { total: 0, correct: 0 });
        s.total += 1;
        if (gotItRight) s.correct += 1;
      }

      await prisma.testQuestion.create({
        data: {
          generatedTestId: gtest.id,
          subjectId: subject.id,
          qIndex: q,
          prompt: `Q${q + 1}. ${topic}: pick the correct statement`,
          options: opts,
          answerIndex,
          tags: qTags,
        },
      });
    }

    const accuracy = total ? correct / total : 0;
    for (const t in byTag) {
      const s = byTag[t];
      s.accuracy = s.total ? s.correct / s.total : 0;
    }

    await prisma.testAttempt.create({
      data: {
        userId: taker.id,
        generatedTestId: gtest.id,
        subjectId: subject.id,
        topic,
        difficulty,
        mode,
        tagsVersion,
        total,
        correct,
        accuracy,
        byTag: byTag as unknown as Prisma.InputJsonValue,
      },
    });

    attempts++;
    if (attempts % 20 === 0) console.log(`  Attempts created: ${attempts}`);
  }

  console.log(`Done. Attempts: ${attempts}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeding finished.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
