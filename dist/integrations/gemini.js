"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuizQuestions = generateQuizQuestions;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
let genAI;
let model;
function getModel() {
    if (!model) {
        genAI = new generative_ai_1.GoogleGenerativeAI(env_1.env.gemini.apiKey);
        model = genAI.getGenerativeModel({
            model: env_1.env.gemini.model,
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.4,
                topP: 0.9,
            },
        });
    }
    return model;
}
const DIFFICULTY_INSTRUCTIONS = {
    easy: 'Questions should test basic understanding and direct recall of facts. Use simple language.',
    medium: 'Questions should test comprehension and application of concepts. Require some analysis.',
    hard: 'Questions should test deep understanding, synthesis, and critical analysis. Include complex scenarios.',
};
const TYPE_INSTRUCTIONS = {
    single_choice: 'ONE correct answer from 4 options (A, B, C, D). Options should be plausible.',
    multiple_choice: 'TWO OR MORE correct answers from 4-5 options. The student must select ALL correct ones.',
    true_false: 'A statement that is either True or False. correctAnswer must be exactly "true" or "false".',
    fill_in_blank: 'A sentence with a blank (___). correctAnswer is the word/phrase that fills the blank.',
    short_answer: 'An open question requiring a brief written answer (1-3 sentences). correctAnswer is a model answer.',
};
function buildPrompt(input) {
    const typesBreakdown = distributeQuestions(input.questionTypes, input.questionCount);
    const typeDetails = Object.entries(typesBreakdown)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => `  - ${type}: ${count} questions (${TYPE_INSTRUCTIONS[type]})`)
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
function distributeQuestions(types, total) {
    const distribution = {
        single_choice: 0,
        multiple_choice: 0,
        true_false: 0,
        fill_in_blank: 0,
        short_answer: 0,
    };
    if (types.length === 0)
        return distribution;
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
async function generateQuizQuestions(input) {
    const prompt = buildPrompt(input);
    logger_1.logger.debug(`Calling Gemini for quiz generation (${input.questionCount} questions)`);
    try {
        const m = getModel();
        const result = await m.generateContent(prompt);
        const text = result.response.text();
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch {
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
        logger_1.logger.info(`Gemini generated ${validated.length} valid questions`);
        return validated;
    }
    catch (error) {
        logger_1.logger.error('Gemini generation error:', error);
        throw new Error(`AI generation failed: ${error.message}`);
    }
}
function validateAndSanitizeQuestions(questions, allowedTypes) {
    const valid = [];
    for (const q of questions) {
        const question = q;
        if (!question.type ||
            !allowedTypes.includes(question.type) ||
            !question.text ||
            typeof question.text !== 'string' ||
            question.text.trim().length < 5) {
            continue;
        }
        if (!question.correctAnswer)
            continue;
        // Validate options for choice questions
        if ((question.type === 'single_choice' || question.type === 'multiple_choice') &&
            (!Array.isArray(question.options) || question.options.length < 2)) {
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
//# sourceMappingURL=gemini.js.map