import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, User } from "@prisma/client";
import { verify } from "jsonwebtoken";
import { parse as parseCookie } from "cookie";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===== Таксономия (53 метки) =====
// Коды короткие — экономим токены.
const TAGS_STYLE = ["fr","ac","hu","an","dr","su","el","st","mo","so"] as const;
const TAGS_FORMAT = ["tx","fm","vs","ex","tb","ps","cd","fl","qp","rq"] as const;
const TAGS_COGN = ["lg","mm","cr","pr","ap","ev","sy","cm","in","de"] as const;
const TAGS_DIFF  = ["ez","md","hd"] as const;
const TAGS_DOMAIN = [
  "ma","calc","linalg","disc","prob","stat","ph","chm","bio","cs","algo",
  "ds","db","net","os","ml","hist","lit","geo","econ"
] as const;

const ALL_TAGS = [
  ...TAGS_STYLE, ...TAGS_FORMAT, ...TAGS_COGN, ...TAGS_DIFF, ...TAGS_DOMAIN
];

const TAXONOMY_DEFS = `
Стиль:
- fr дружелюбный, разговорный
- ac академичный, строгий
- hu с юмором
- an аналогии и сравнения
- dr сухой, терминологический
- su кратко, по делу
- el развёрнуто
- st пошагово
- mo мотивационный
- so сократический (вопросами)

Формат:
- tx обычный текст
- fm формулы
- vs визуальный (описание схем/графиков)
- ex примеры из жизни
- tb таблицы/сравнения
- ps псевдокод
- cd код
- fl флэш-карточки/буллеты
- qp мини-вопросы/квиз
- rq ссылки/ресурсы

Когнитивный фокус:
- lg логика
- mm запоминание
- cr креативность
- pr процедура/алгоритм
- ap применение
- ev оценка/критика
- sy синтез
- cm понимание/пересказ
- in индукция
- de дедукция

Сложность:
- ez лёгкий
- md средний
- hd сложный

Домены:
- ma математика
- calc мат.анализ
- linalg лин.алгебра
- disc дискретная математика
- prob теория вероятностей
- stat статистика
- ph физика
- chm химия
- bio биология
- cs информатика/CS
- algo алгоритмы
- ds структуры данных
- db базы данных
- net сети
- os операционные системы
- ml машинное обучение
- hist история
- lit литература
- geo география
- econ экономика
`.trim();

// Быстрая эвристика маппинга профиля пользователя в набор "предпочтительных" тегов.
function derivePreferredTags(user: User | null) {
  const pref = new Set<string>();

  // learningStyle
  switch ((user?.learningStyle || "").toLowerCase()) {
    case "visual": pref.add("vs"); break;
    case "auditory": pref.add("qp"); break; // мини-вопросы как квазислушание
    case "reading/writing": pref.add("tx"); break;
    case "kinesthetic": pref.add("ap"); break; // применение/практика
  }

  // preferredFormat
  switch ((user?.preferredFormat || "").toLowerCase()) {
    case "text": pref.add("tx"); break;
    case "code": pref.add("cd"); break;
    case "examples": pref.add("ex"); break;
    case "formulas": pref.add("fm"); break;
    case "tables": pref.add("tb"); break;
  }

  // preferredTone
  const tone = (user?.preferredTone || "").toLowerCase();
  if (tone.includes("formal") || tone.includes("академ") || tone.includes("строг")) pref.add("ac");
  if (tone.includes("friendly") || tone.includes("друж") || tone.includes("простой")) pref.add("fr");
  if (tone.includes("humor") || tone.includes("юмор")) pref.add("hu");
  if (tone.includes("analog") || tone.includes("аналог")) pref.add("an");
  if (tone.includes("сух")) pref.add("dr");

  // detailLevel
  const det = (user?.detailLevel || "").toLowerCase();
  if (det.includes("short") || det.includes("крат")) pref.add("su");
  if (det.includes("detail") || det.includes("подроб")) pref.add("el");
  // шаги
  if (tone.includes("step") || tone.includes("шаг")) pref.add("st");

  // languageLevel (не тэг, но пусть влияет на стиль — ничего не добавляем)

  return Array.from(pref);
}

// Считаем «редкие» теги у пользователя по его истории QuestionTagResult
async function getUnderExploredTags(userId: number) {
  const results = await prisma.questionTagResult.findMany({
    where: { userId },
    select: { tags: true },
  });

  const counts: Record<string, number> = {};
  for (const r of results) {
    try {
      const tags: string[] = JSON.parse(r.tags || "[]");
      for (const t of tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    } catch {
      // ignore malformed
    }
  }

  // Возьмём только теги, которые вообще встречались:
  const seen = Object.values(counts);
  if (seen.length === 0) {
    // Ничего не встречалось — вернём несколько доменных и форматных тегов для исследования
    return ["vs","ex","fm","cd","algo","prob","stat"].filter((t) => ALL_TAGS.includes(t as any)).slice(0, 5);
  }

  const avg = seen.reduce((a, b) => a + b, 0) / seen.length;

  // Редким считаем < 50% от среднего встречаемости среди "виденных" тегов
  const threshold = avg * 0.5;

  // Кандидаты: либо редкие виденные, либо вообще не виденные
  const unseen = ALL_TAGS.filter((t) => counts[t] === undefined);
  const rareSeen = Object.entries(counts)
    .filter(([, c]) => c < threshold)
    .map(([t]) => t);

  // Отсортируем: сначала unseen (чтобы расширять пространство), затем редкие виденные
  const underExplored = [...unseen, ...rareSeen];

  // Ограничим длину набора, чтобы не раздувать промпт:
  return underExplored.slice(0, 8);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ——— аутентификация
  const cookies = req.headers.cookie ? parseCookie(req.headers.cookie) : {};
  const token = cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let userId: number;
  try {
    const decoded = verify(token, process.env.JWT_SECRET || "dev_secret") as { userId: number };
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  // ——— параметры генерации
  const { topic, difficulty, numQuestions, numOptions, mode } = req.body as {
    topic: string;
    difficulty?: string;
    numQuestions: number;
    numOptions: number;
    mode?: "normal" | "comfort" | "random"; // обычный | комфортный | случайный
  };

  if (!topic || !numQuestions || !numOptions) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const preferredTags = derivePreferredTags(user);

    // «Обычный» базовый профиль для реалистичных тестов: академичный, сухой, текст, логика, средняя сложность
    const defaultCoreTags = ["ac","dr","tx","lg","md"];

    // Разбивка на доли в зависимости от режима
    const m = mode || "normal";
    let coreCount = 0;
    let exploreCount = 0;

    if (m === "comfort") {
      coreCount = numQuestions;
      exploreCount = 0;
    } else if (m === "random") {
      coreCount = 0;
      exploreCount = numQuestions;
    } else {
      // normal: 80% ядро, 20% исследование
      coreCount = Math.max(0, Math.round(numQuestions * 0.8));
      exploreCount = numQuestions - coreCount;
    }

    // Для исследования — найдём недоисследованные (under-explored) теги
    const underExplored = await getUnderExploredTags(userId);

    // Подготовим персонализацию (в компактном виде, дешево)
    const personalization =
      [
        user?.learningStyle ? `Style:${user.learningStyle}` : "",
        user?.preferredFormat ? `Format:${user.preferredFormat}` : "",
        user?.preferredTone ? `Tone:${user.preferredTone}` : "",
        user?.detailLevel ? `Detail:${user.detailLevel}` : "",
        user?.languageLevel ? `Lang:${user.languageLevel}` : "",
      ]
        .filter(Boolean)
        .join("; ");

    // Инструкция по составу набора вопросов:
    // - Генерируем ОДИН массив на все вопросы.
    // - "core" и "explore" — две подзадачи с точным количеством.
    // - Для comfort ядро = 100% и теги = предпочтения пользователя (но не запрещаем другие).
    // - Для random все вопросы делаем случайными, но в части "explore" добавим редкие теги.
    // - Для normal 80/20, причём в 20% стараемся использовать underExplored.
    const compositionInstruction = `
Сгенерируй ОДИН общий массив из ${numQuestions} вопросов для темы "${topic}".
Каждый элемент: {"q":"...","o":["..."],"c":"...","t":["код","код",...]}.
Количество вариантов в "o": ровно ${numOptions}.
Сложность в целом: ${difficulty || "md"}.

Состав:
- CORE (${coreCount}): 
  ${
    m === "comfort"
      ? `ориентируйся на предпочтения пользователя (теги из них должны быть обязательно: ${preferredTags.join(", ") || "нет"}), но фактически другие теги не запрещены.`
      : `ориентируйся на реалистичный академичный тест (рекомендуемые теги: ${defaultCoreTags.join(", ")}).`
  }

- EXPLORE (${exploreCount}):
  ${
    exploreCount > 0
      ? `случайные вопросы; используй как можно больше "недоисследованных" тегов: [${underExplored.join(", ")}].`
      : `нет.`
  }

Правила:
- Итог: один JSON-массив длины ${numQuestions}, minified, без пояснений.
- Каждый вопрос имеет осмысленные "t" — коды из списка ниже.
- Вопросы в целом должны соответствовать теме.
    `.trim();

    // Краткая таксономия — в system; экономим токены.
    const systemMsg = `
Ты генерируешь тестовые вопросы. Соблюдай персонализацию и таксономию.
Персонализация: ${personalization || "нет"}.
Таксономия (коды):
${TAXONOMY_DEFS}

Формат ответа: СТРОГО ОДИН minified JSON-массив вопросов.
Без текста, без комментариев, без markdown.
Каждый вопрос: {"q":"...","o":["..."],"c":"...","t":["код","код",...]}.
`.trim();

    const userMsg = compositionInstruction;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_TEST_MODEL || "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "";

    // Надёжный парсинг: вырезаем первый JSON-массив
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[generate-test] No JSON array in response:", raw);
      return res.status(500).json({ error: "Failed to parse GPT response (no JSON array)" });
    }

    let questions: Array<{ q: string; o: string[]; c: string; t: string[] }> = [];
    try {
      questions = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("[generate-test] JSON.parse error:", e);
      return res.status(500).json({ error: "Failed to parse GPT response (invalid JSON)" });
    }

    // Мини-валидация
    questions = questions.filter(
      (x) =>
        x &&
        typeof x.q === "string" &&
        Array.isArray(x.o) &&
        typeof x.c === "string" &&
        Array.isArray(x.t)
    );

    // Сохранение «разметки для обучения» локально (JSONL)
    try {
      const trainingDir = path.join(process.cwd(), "training");
      await fs.mkdir(trainingDir, { recursive: true });
      const trainingFile = path.join(trainingDir, "tagged_questions.jsonl");
      const lines = questions.map((x) => JSON.stringify({ q: x.q, t: x.t }));
      await fs.appendFile(trainingFile, lines.join("\n") + "\n", "utf8");
    } catch (e) {
      console.error("[generate-test] Failed to write training file:", e);
    }

    // Отдаём фронту привычный формат
    const out = questions.slice(0, numQuestions).map((x) => ({
      question: x.q,
      options: x.o.slice(0, numOptions),
      correct: x.c,
      tags: x.t,
    }));

    return res.status(200).json({ questions: out });
  } catch (err: any) {
    console.error("[generate-test] Error:", err);
    return res.status(500).json({ error: err.message || "Test generation failed" });
  }
}
