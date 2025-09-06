// app/api/news/route.js
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Calculate dynamic date range
const today = new Date();
const past90Days = new Date();
past90Days.setDate(today.getDate() - 90);

const startDate = formatDate(past90Days);
const endDate = formatDate(today);

const buildNewsPrompt = (name) => {
  return `

You are a political news analyst. Generate a STRICTLY VALID JSON object using this schema:

{
  "news": {
    "positive": [ ...EXACTLY 10 news items... ],
    "negative": [ ...EXACTLY 10 news items... ],
    "neutral": [ ...EXACTLY 5 news items... ]
  }
}

Rules for each news item:
- Must be directly related to "${name}".
- Fields:
  - "headline": string (5–12 words)
  - "source": string (real publications only, e.g., "The Hindu", "Times of India")
  - "date": string (YYYY-MM-DD, between ${startDate} and ${endDate})
  - "summary": string (15–40 words)
  - "sentiment_score": number (-1 to 1)
  - "key_phrases": array of 2–3 strings (each 1–4 words)
  - "impact_analysis": REQUIRED only for negative items (1–2 sentences)
  - "resolution_suggestions": REQUIRED only for negative items (2–3 suggestions, each 5–15 words)

Constraints:
- "positive": exactly 10 items, sentiment_score > 0.3
- "negative": exactly 10 items, sentiment_score < -0.3
- "neutral": exactly 5 items, sentiment_score between -0.3 and 0.3
- No duplicates.
- No markdown.
- No extra commentary.
- Output only a valid JSON object.

Return only the JSON. Do not include explanations or formatting.
`;
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { name } = body;
    const userPrompt = `Please generate a political news sentiment dataset in the specified format. Only output valid JSON.`;
    const systemPrompt = buildNewsPrompt(name);

    let completion;
    try {
      completion = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ]
      });
    } catch (err) {
      return NextResponse.json({ error: 'Claude API error', details: err.message }, { status: 502 });
    }

    const rawContent = completion?.content?.[0]?.text;
    if (!rawContent) {
      return NextResponse.json({ error: 'Empty response from Claude' }, { status: 502 });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const jsonMatch = rawContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        const objectMatch = rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (objectMatch) {
          parsed = JSON.parse(objectMatch[0]);
        } else {
          throw new Error('No valid JSON found in Claude response');
        }
      }
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
