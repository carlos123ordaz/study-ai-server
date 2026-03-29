import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { QuestionType, DifficultyLevel } from '../models/Question';

let genAI: GoogleGenerativeAI;
let model: GenerativeModel;

function getModel(): GenerativeModel {
  if (!model) {
    genAI = new GoogleGenerativeAI(env.gemini.apiKey);
    model = genAI.getGenerativeModel({
      model: env.gemini.model,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
        topP: 0.9,
      },
    });
  }
  return model;
}

export interface GeneratedQuestion {
  type: QuestionType;
  text: string;
  options?: { id: string; text: string }[];
  correctAnswer: string | string[];
  explanation?: string;
}

export interface QuizGenerationInput {
  content: string;
  questionTypes: QuestionType[];
  questionCount: number;
  difficulty: DifficultyLevel;
  includeExplanations: boolean;
}

const DIFFICULTY_INSTRUCTIONS: Record<DifficultyLevel, string> = {
  easy:
    'Questions should test basic understanding and direct recall of facts. Use simple language.',
  medium:
    'Questions should test comprehension and application of concepts. Require some analysis.',
  hard:
    'Questions should test deep understanding, synthesis, and critical analysis. Include complex scenarios.',
};

const TYPE_INSTRUCTIONS: Record<QuestionType, string> = {
  single_choice:
    'ONE correct answer from 4 options (A, B, C, D). Options should be plausible.',
  multiple_choice:
    'TWO OR MORE correct answers from 4-5 options. The student must select ALL correct ones.',
  true_false:
    'A statement that is either True or False. correctAnswer must be exactly "true" or "false".',
  fill_in_blank:
    'A sentence with a blank (___). correctAnswer is the word/phrase that fills the blank.',
  short_answer:
    'An open question requiring a brief written answer (1-3 sentences). correctAnswer is a model answer.',
};

function buildPrompt(input: QuizGenerationInput): string {
  const typesBreakdown = distributeQuestions(input.questionTypes, input.questionCount);
  const typeDetails = Object.entries(typesBreakdown)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `  - ${type}: ${count} questions (${TYPE_INSTRUCTIONS[type as QuestionType]})`)
    .join('\n');

  return `You are an expert educator tasked with generating quiz questions EXCLUSIVELY based on the provided study material.

STRICT RULES:
1. Generate questions ONLY from the content below. Do NOT use external knowledge.
2. Every question must be directly answerable from the provided text.
3. Avoid duplicate or very similar questions.
4. Questions must be clear, unambiguous, and grammatically correct.
5. Difficulty: ${input.difficulty.toUpperCase()} - ${DIFFICULTY_INSTRUCTIONS[input.difficulty]}

QUESTION DISTRIBUTION (total: ${input.questionCount}):
${typeDetails}

QUESTION FORMAT REQUIREMENTS:
- single_choice/multiple_choice: include "options" array with id ("a","b","c","d") and text. correctAnswer is the option id(s).
- true_false: no options needed. correctAnswer is "true" or "false" (lowercase string).
- fill_in_blank: question text contains "___". correctAnswer is the missing word/phrase.
- short_answer: correctAnswer is a complete model answer sentence.
${input.includeExplanations ? '- Include a brief "explanation" (1-2 sentences) for each answer.' : '- Do NOT include explanations.'}

RETURN FORMAT - Return ONLY valid JSON with this exact structure:
{
  "questions": [
    {
      "type": "single_choice",
      "text": "Question text here?",
      "options": [{"id": "a", "text": "Option A"}, {"id": "b", "text": "Option B"}, {"id": "c", "text": "Option C"}, {"id": "d", "text": "Option D"}],
      "correctAnswer": "a",
      "explanation": "Because..."
    }
  ]
}

STUDY MATERIAL:
---
${input.content}
---

Generate exactly ${input.questionCount} questions now:`;
}

function distributeQuestions(
  types: QuestionType[],
  total: number
): Record<QuestionType, number> {
  const distribution: Record<QuestionType, number> = {
    single_choice: 0,
    multiple_choice: 0,
    true_false: 0,
    fill_in_blank: 0,
    short_answer: 0,
  };

  if (types.length === 0) return distribution;

  const perType = Math.floor(total / types.length);
  let remainder = total % types.length;

  for (const type of types) {
    distribution[type] = perType;
  }

  // Distribute remainder to first types
  for (let i = 0; i < remainder; i++) {
    distribution[types[i % types.length]]++;
  }

  return distribution;
}

// ─── Flashcards ──────────────────────────────────────────────────────────────

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export async function generateFlashcards(
  content: string,
  cardCount: number
): Promise<GeneratedFlashcard[]> {
  const prompt = `You are an expert educator. Generate exactly ${cardCount} flashcards from the study material below.

RULES:
1. Each flashcard must be based EXCLUSIVELY on the provided content.
2. Front: a concise question, term, or concept (max 15 words).
3. Back: a clear, complete answer or definition (max 60 words).
4. Cover the most important concepts, definitions, and key ideas.
5. Avoid duplicates and trivial cards.
6. Use the same language as the study material.

RETURN FORMAT — Return ONLY valid JSON:
{
  "flashcards": [
    { "front": "Question or term", "back": "Answer or definition" }
  ]
}

STUDY MATERIAL:
---
${content}
---

Generate exactly ${cardCount} flashcards now:`;

  try {
    const m = getModel();
    const result = await m.generateContent(prompt);
    const text = result.response.text();

    let parsed: { flashcards: GeneratedFlashcard[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Gemini returned invalid JSON for flashcards');
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (!Array.isArray(parsed.flashcards)) {
      throw new Error('Gemini response missing flashcards array');
    }

    const valid = parsed.flashcards.filter(
      (c) =>
        typeof c.front === 'string' &&
        c.front.trim().length > 0 &&
        typeof c.back === 'string' &&
        c.back.trim().length > 0
    );

    logger.info(`Gemini generated ${valid.length} flashcards`);
    return valid;
  } catch (error) {
    logger.error('Gemini flashcard generation error:', error);
    throw new Error(`AI generation failed: ${(error as Error).message}`);
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export interface GeneratedSummary {
  overview: string;
  sections: { heading: string; body: string }[];
  keyTerms: { term: string; definition: string }[];
}

export async function generateSummary(content: string): Promise<GeneratedSummary> {
  const prompt = `You are an expert educator. Create a structured summary of the study material below.

RULES:
1. Base the summary EXCLUSIVELY on the provided content.
2. Overview: 2-4 sentences covering what the material is about.
3. Sections: 3-8 sections, each with a clear heading and a concise body paragraph (3-6 sentences).
4. Key terms: 5-15 important terms/concepts with their definitions (max 30 words each).
5. Use the same language as the study material.
6. Be concise but complete — prioritize what a student needs to know for an exam.

RETURN FORMAT — Return ONLY valid JSON:
{
  "overview": "Short overview of the material.",
  "sections": [
    { "heading": "Section title", "body": "Section content paragraph." }
  ],
  "keyTerms": [
    { "term": "Term name", "definition": "Clear definition." }
  ]
}

STUDY MATERIAL:
---
${content}
---

Generate the structured summary now:`;

  try {
    const m = getModel();
    const result = await m.generateContent(prompt);
    const text = result.response.text();

    let parsed: GeneratedSummary;
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Gemini returned invalid JSON for summary');
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (!parsed.overview || !Array.isArray(parsed.sections) || !Array.isArray(parsed.keyTerms)) {
      throw new Error('Gemini response has invalid summary structure');
    }

    logger.info(`Gemini generated summary with ${parsed.sections.length} sections`);
    return parsed;
  } catch (error) {
    logger.error('Gemini summary generation error:', error);
    throw new Error(`AI generation failed: ${(error as Error).message}`);
  }
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export async function generateQuizQuestions(
  input: QuizGenerationInput
): Promise<GeneratedQuestion[]> {
  const prompt = buildPrompt(input);
  logger.debug(`Calling Gemini for quiz generation (${input.questionCount} questions)`);

  try {
    const m = getModel();
    const result = await m.generateContent(prompt);
    const text = result.response.text();

    let parsed: { questions: GeneratedQuestion[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini returned invalid JSON');
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (!Array.isArray(parsed.questions)) {
      throw new Error('Gemini response missing questions array');
    }

    const validated = validateAndSanitizeQuestions(parsed.questions, input.questionTypes);
    logger.info(`Gemini generated ${validated.length} valid questions`);
    return validated;
  } catch (error) {
    logger.error('Gemini generation error:', error);
    throw new Error(`AI generation failed: ${(error as Error).message}`);
  }
}

function validateAndSanitizeQuestions(
  questions: unknown[],
  allowedTypes: QuestionType[]
): GeneratedQuestion[] {
  const valid: GeneratedQuestion[] = [];

  for (const q of questions) {
    const question = q as Partial<GeneratedQuestion>;

    if (
      !question.type ||
      !allowedTypes.includes(question.type) ||
      !question.text ||
      typeof question.text !== 'string' ||
      question.text.trim().length < 5
    ) {
      continue;
    }

    if (!question.correctAnswer) continue;

    // Validate options for choice questions
    if (
      (question.type === 'single_choice' || question.type === 'multiple_choice') &&
      (!Array.isArray(question.options) || question.options.length < 2)
    ) {
      continue;
    }

    valid.push({
      type: question.type,
      text: question.text.trim(),
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
  }

  return valid;
}
