"use server";

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

interface MentorAnswer {
  id: string;
  author: string;
  text: string;
  source: string;
  confidence: string;
}

interface MentorQuestion {
  id: string;
  question: string;
  tags: string[];
  answers: MentorAnswer[];
}

const DATA_PATH = join(process.cwd(), "lib/mentor-data.json");

export async function addAnswer(
  questionId: string,
  text: string,
  author: string,
  source: string,
  confidence: string
) {
  const raw = await readFile(DATA_PATH, "utf-8");
  const questions: MentorQuestion[] = JSON.parse(raw);

  const question = questions.find((q) => q.id === questionId);
  if (!question) {
    return { error: "Question not found" };
  }

  const newAnswer: MentorAnswer = {
    id: `a${Date.now()}`,
    author: author || "Kevin",
    text,
    source: source || "",
    confidence: confidence || "medium",
  };

  question.answers.push(newAnswer);

  await writeFile(DATA_PATH, JSON.stringify(questions, null, 2) + "\n", "utf-8");

  return { success: true, answer: newAnswer };
}
