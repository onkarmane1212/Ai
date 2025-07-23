// app/api/local-issues/route.js

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 300; // Optional for serverless limit

// Initialize OpenAI
let openai;
try {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 300000, // 5 minutes
  });

  console.log('OpenAI client initialized successfully');
} catch (err) {
  console.error('OpenAI init error:', err.message);
  throw new Error('OpenAI API initialization failed');
}

const systemPrompt = (name) => `
You are a data analyst for ${name} constituency governance. Generate a concise JSON report with local and hyperlocal issues.

${name ? `Focus on issues related to ${name}.` : 'Focus on current issues.'}

Guidelines:
- Return exactly 10 local_issues and 10 hyperlocal_issues
- Mention real-sounding towns and villages in ${name} constituency
- Keep issues specific and relevant to ${name} constituency
- Suggested interventions should be specific and actionable (e.g., "install solar-powered streetlights", "deploy mobile health clinics")
- Sentiment and impact_level must vary
- Ensure the JSON is valid and parsable

Respond ONLY with valid JSON matching this structure:
{
  "local_hyperlocal_issues": {
    "local_issues": [
      {
        "region": "City/Town Name",
        "issue": "Brief issue description",
        "sentiment": "positive/negative/neutral",
        "impact_level": "high/moderate/low",
        "public_opinion_summary": "Brief summary",
        "suggested_interventions": ["Action 1", "Action 2"]
      }
    ],
    "hyperlocal_issues": [
      {
        "location": "Ward/Village/Street",
        "issue": "Brief issue description",
        "sentiment": "positive/negative/neutral",
        "impact_level": "high/moderate/low",
        "public_opinion_summary": "Brief summary",
        "suggested_interventions": ["Action 1", "Action 2"]
      }
    ]
  }
}
`;

export async function POST(req) {
//   console.log('Received request to localAndHyperlocal API');

  try {
    const body = await req.json();
    const { query = '', name = '' } = body;

    if (!query && !name) {
      return NextResponse.json({ error: 'Either query or name must be provided' }, { status: 400 });
    }

    const searchQuery = name ? `Name: ${name}${query ? `\nAdditional context: ${query}` : ''}` : query;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

    // console.log('Calling OpenAI API...');
    const completion = await openai.chat.completions.create(
      {
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt(name) },
          { role: 'user', content: `Generate a report for: ${searchQuery}` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const rawContent = completion.choices?.[0]?.message?.content;
    // console.log('OpenAI response (first 200 chars):', rawContent?.slice(0, 200));

    if (!rawContent || typeof rawContent !== 'string') {
      return NextResponse.json({ error: 'Invalid or empty response from OpenAI' }, { status: 502 });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const matchCode = rawContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
      const matchInline = rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

      try {
        if (matchCode) parsed = JSON.parse(matchCode[1]);
        else if (matchInline) parsed = JSON.parse(matchInline[0]);
        else throw new Error('No valid JSON found');
      } catch (jsonErr) {
        return NextResponse.json(
          {
            error: 'Failed to parse JSON',
            details: jsonErr.message,
            rawContent: rawContent.slice(0, 500)
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(parsed, { status: 200 });

  } catch (err) {
    if (err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'OpenAI request timed out after 5 minutes' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
