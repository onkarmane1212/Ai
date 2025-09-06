// app/api/region-analysis/route.js
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const buildRegionAnalysisPrompt = (query, options = {}) => {
  const {
    region = 'all',
    timeRange = '1m',
    customStartDate = '',
    customEndDate = ''
  } = options;

  return `
You are a political analyst specializing in regional dynamics and electoral trends.

Generate a STRICTLY VALID JSON response for "${query}" using the following schema:

{
  "region_analysis": {
    "region_wise_sentiment": [
      {
        "region": string,
        "support_base_percentage": number,
        "sentiment_distribution": {
          "positive": number,
          "neutral": number,
          "negative": number
        },
        "confidence_level": "high" | "medium" | "low"
      }
    ],
    "parliamentary_constituencies": [
      {
        "constituency": string,
        "party_influence": string,
        "incumbent": string,
        "swing_factor": string,
        "key_issues": string[]
      }
    ],
    "assembly_constituencies": [
      {
        "constituency": string,
        "district": string,
        "support_trend": "increasing" | "decreasing" | "stable",
        "party_positioning": string,
        "demographic_insights": string[]
      }
    ],
    "district_level_insights": [
      {
        "district": string,
        "issues": string[],
        "sentiment": string,
        "turnout_projection": string
      }
    ],
    "taluka_level_insights": [
      {
        "taluka": string,
        "observations": string[],
        "strategic_importance": string
      }
    ],
    "urban_vs_rural_comparison": {
      "urban": {
        "support_distribution": {
          "party_a": number,
          "party_b": number,
          "others": number
        },
        "key_concerns": string[]
      },
      "rural": {
        "support_distribution": {
          "party_a": number,
          "party_b": number,
          "others": number
        },
        "key_concerns": string[]
      }
    }
  },
  "analysis_metadata": {
    "generated_at": "${new Date().toISOString()}",
    "parameters_used": ${JSON.stringify({
      region,
      timeRange,
      ...(timeRange === 'custom' && {
        custom_date_range: { start: customStartDate, end: customEndDate }
      })
    }, null, 2)},
    "version": "1.0.0",
    "generated_by": "AI Region Analysis System"
  }
}

Rules:
- Ensure valid JSON only, with no explanation or markdown.
- Do not use code blocks.
- Avoid trailing commas.
`;
};

export async function POST(req) {
  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { query, options = {} } = requestBody;
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const systemPrompt = buildRegionAnalysisPrompt(query, options);
    const userPrompt = `Generate a region-wise analysis for "${query}" including sentiment, constituency data, and urban-rural comparison. Return only valid JSON.`;

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
      return NextResponse.json({ error: 'Error calling Claude API', details: err.message }, { status: 502 });
    }

    const rawContent = completion?.content?.[0]?.text;
    if (!rawContent) {
      return NextResponse.json({ error: 'Empty response from Claude API' }, { status: 502 });
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
    return NextResponse.json({ error: 'Something went wrong', details: err.message }, { status: 500 });
  }
}
