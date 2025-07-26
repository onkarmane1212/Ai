// app/api/castewise-details/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 300;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = (name) => `
You are a social demographics analyst specializing in caste-wise distribution and political influence across Indian Assembly Constituencies.

Generate a structured JSON report for ${name} Assembly Constituency with the following schema:

{
  "constituency": "[Constituency Name]",
  "total_population_estimate": [Estimated total population],
  "caste_distribution": [
    {
      "caste": "[Caste Name]",
      "approx_population": [number],
      "percentage": [float],
      "dominant_surnames": ["[Surname1]", "[Surname2]", ...],
      "political_influence": "[Brief description of their political leanings or party preference]",
      "key_issues": ["[Issue1]", "[Issue2]"]
    }
    ...
  ],
  "surname_to_caste_map": {
    "[Surname1]": "[Caste]",
    "[Surname2]": "[Caste]",
    ...
  }
}

Guidelines:
- Include at least 6–10 caste entries.
- Population must be realistic for a typical urban or semi-urban Maharashtra constituency.
- Surnames must be relevant to castes and unique enough to assist in surname-caste mapping for memory enrichment.
- Ensure valid and parsable JSON with no trailing commas.
`;

export async function POST(req) {
  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { query, name } = requestBody;

    if (!query && !name) {
      return NextResponse.json({ error: 'Either query or name must be provided' }, { status: 400 });
    }

    const region = `${name} constituency`;
    const userPrompt = `
Generate a caste-wise demographic report for the Assembly Constituency: ${region}.
Return ONLY the valid JSON output as per the schema provided.
${query ? `Additional context: ${query}` : ''}
`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt(name) },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
    } catch (openaiError) {
      return NextResponse.json(
        { error: 'Error calling OpenAI API', details: openaiError.message },
        { status: 502 }
      );
    }

    const rawContent = completion.choices?.[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: 'Empty response from OpenAI API' },
        { status: 502 }
      );
    }

    let parsed;
    try {
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
            throw new Error('No valid JSON found in response');
          }
        }
      }

      return NextResponse.json(parsed, { status: 200 });
    } catch (parseError) {
      return NextResponse.json(
        {
          error: 'Failed to parse response from OpenAI',
          details: parseError.message,
          rawContent: rawContent.substring(0, 500) + (rawContent.length > 500 ? '...' : '')
        },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong', details: err.message }, { status: 500 });
  }
}

