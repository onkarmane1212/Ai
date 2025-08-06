// app/api/opposition-tracking/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 300;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = (region) => `
You are a political strategist specializing in digital campaigns, public sentiment analysis, and opposition tracking in Indian constituencies.

Generate a structured JSON report for opposition sentiment and activity tracking in "${region}" with the following schema:

{
  "region": "[Constituency or ${region}]",
  "timeframe_analyzed": "[e.g., Last 90 Days, June 2025, etc.]",
  "opposition_parties": [
    {
      "name": "[Opposition Party Name]",
      "key_leaders": ["[Leader 1]", "[Leader 2]"],
      "digital_campaigns": [
        {
          "platform": "[Twitter/Facebook/Instagram/YouTube]",
          "campaign_theme": "[Theme or Hashtag]",
          "engagement_metrics": {
            "likes": [number],
            "shares": [number],
            "comments": [number],
            "reach_estimate": [number]
          },
          "sentiment_polarity": "positive | neutral | negative",
          "observations": "[Brief insights on public reaction]"
        }
      ]
    }
  ],
  "overall_sentiment_towards_opposition": {
    "positive": "[% or estimate and description]",
    "neutral": "[% or estimate and description]",
    "negative": "[% or estimate and description]",
    "summary": "[Brief summary of public mood]"
  },
  "narrative_recommendations": {
    "content_strategy": "[Suggested messaging tone and focus]",
    "target_demographics": ["Youth", "Women", "SC/ST", "Farmers", etc.],
    "platform_priorities": ["Instagram", "YouTube", "WhatsApp", etc.],
    "recommended_counter_narratives": ["[Narrative suggestion 1]", "[Narrative suggestion 2]", "[Narrative suggestion 3]", "[Narrative suggestion 4]", "[Narrative suggestion 5]"]
  }
}

Guidelines:
- Include data from at least 2 opposition parties specific to ${region}..
- Ensure observations are realistic and recent.
- Minimum 2/3 Recent Campaigns every party.
- Use engaging language in narrative recommendations.
- Return ONLY valid and parsable JSON (no trailing commas).
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

    const region = `${name} region`;
    const userPrompt = `
Generate a digital opposition sentiment and activity tracking report for the region: ${region}.
Focus on opposition leaders’ recent online campaigns, sentiment polarity, and strategy recommendations.
${query ? `Additional context: ${query}` : ''}
Return ONLY the JSON output as per schema.
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
