// src/lib/personalization.ts
import { prisma } from "@/lib/prisma";

type Prefs = {
  age?: number | null;
  educationLevel?: string | null;
  learningGoal?: string | null;
  learningStyle?: string | null;
  preferredFormat?: string | null;
  preferredTone?: string | null;
  detailLevel?: string | null;
  priorKnowledge?: string | null;
  languageLevel?: string | null;
  darkMode?: boolean | null;
  accessibleMode?: boolean | null;
  fontSize?: string | null;
};

export async function loadUserPrefs(userId: number): Promise<Prefs> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      age: true,
      educationLevel: true,
      learningGoal: true,
      learningStyle: true,
      preferredFormat: true,
      preferredTone: true,
      detailLevel: true,
      priorKnowledge: true,
      languageLevel: true,
      darkMode: true,
      accessibleMode: true,
      fontSize: true,
    },
  });
  return user ?? {};
}

/** Формирует «скрытый подзапрос» — system-промпт с персонализацией. */
export function buildPersonalizationSystemPrompt(prefs: Prefs): string {
  // Нормализуем и собираем правила только из заполненных полей
  const lines: string[] = [
    "You are an adaptive study assistant. Always personalize responses using the following user profile if relevant.",
  ];

  const kv = (k: string, v: any) =>
    v === null || v === undefined || String(v).trim() === "" ? null : `- ${k}: ${v}`;

  const mapped = [
    kv("Age", prefs.age),
    kv("Education level", prefs.educationLevel),
    kv("Learning goal", prefs.learningGoal),
    kv("Learning style", prefs.learningStyle),
    kv("Preferred format", prefs.preferredFormat),
    kv("Preferred tone", prefs.preferredTone),
    kv("Detail level", prefs.detailLevel),
    kv("Prior knowledge", prefs.priorKnowledge),
    kv("Language level", prefs.languageLevel),
    kv("Dark mode", prefs.darkMode ? "true" : null),
    kv("Accessible mode", prefs.accessibleMode ? "true" : null),
    kv("Font size", prefs.fontSize),
  ].filter(Boolean) as string[];

  if (mapped.length > 0) {
    lines.push("User profile:");
    lines.push(...mapped);
  }

  // Мягкие правила выдачи
  lines.push(
    "Personalization policy:",
    "- Match the preferred tone and format when possible.",
    "- Adapt explanations to the education level and language level.",
    "- Respect learning style (e.g., examples vs. theory, step-by-step vs. concise).",
    "- If prior knowledge is low, briefly recap fundamentals first.",
    "- If a learning goal is set, bias examples and exercises toward that goal.",
    "- Keep accessibility in mind (clear headings, short paragraphs, avoid heavy tables unless necessary)."
  );

  return lines.join("\n");
}
