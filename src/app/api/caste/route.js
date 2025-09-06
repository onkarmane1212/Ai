// app/api/caste-analysis/route.js
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Build the system prompt for caste + sentiment analysis
const systemPrompt = (query, options = {}) => {
  const {
    region = 'all',
    timeRange = '1m',
    sentimentThreshold = 0.6,
    includeSentimentBreakdown = true,
    customStartDate = '',
    customEndDate = '',
  } = options;

  return `
You are a political data analyst specializing in caste demographics, subcaste sentiment tracking, and constituency-wise public opinion.

Generate a strictly valid JSON caste analysis for "${query}" using the following schema:

{
  "caste_distribution": {
    "General": {
      "percentage": number (0-100),
      "subcastes": { "subcaste_name": number (0-100) }
    },
    "OBC": {
      "percentage": number (0-100),
      "subcastes": { "subcaste_name": number (0-100) }
    },
    "SC": {
      "percentage": number (0-100),
      "subcastes": { "subcaste_name": number (0-100) }
    },
    "ST": {
      "percentage": number (0-100),
      "subcastes": { "subcaste_name": number (0-100) }
    },
    "Others": {
      "percentage": number (0-100),
      "subcastes": { "subcaste_name": number (0-100) }
    },
    "total": 100
  },
  "sentiment_by_caste": {
    "General": { "positive": number, "negative": number, "neutral": number,
      "subcastes": { "subcaste_name": { "positive": number, "negative": number, "neutral": number } }
    },
    "OBC": { "positive": number, "negative": number, "neutral": number,
      "subcastes": { "subcaste_name": { "positive": number, "negative": number, "neutral": number } }
    },
    "SC": { "positive": number, "negative": number, "neutral": number,
      "subcastes": { "subcaste_name": { "positive": number, "negative": number, "neutral": number } }
    },
    "ST": { "positive": number, "negative": number, "neutral": number,
      "subcastes": { "subcaste_name": { "positive": number, "negative": number, "neutral": number } }
    },
    "Others": { "positive": number, "negative": number, "neutral": number,
      "subcastes": { "subcaste_name": { "positive": number, "negative": number, "neutral": number } }
    }
  },
  "key_insights": [
    { "insight": string, "impact": string, "recommendation": string }
  ],
  "region_wise_analysis": {
    "state_level": { "state_name": { "positive": number, "negative": number, "neutral": number } },
    "parliamentary_constituency": { "constituency_name": { "positive": number, "negative": number, "neutral": number } },
    "assembly_constituency": { "constituency_name": { "positive": number, "negative": number, "neutral": number } },
    "district": { "district_name": { "positive": number, "negative": number, "neutral": number } },
    "taluka": { "taluka_name": { "positive": number, "negative": number, "neutral": number } }
  },
  "analysis_metadata": {
    "generated_at": "${new Date().toISOString()}",
    "parameters_used": ${JSON.stringify({
      region,
      timeRange,
      ...(timeRange === 'custom' && { custom_date_range: { start: customStartDate, end: customEndDate } }),
      sentiment_threshold: sentimentThreshold,
      include_sentiment_breakdown: includeSentimentBreakdown
    }, null, 2)}
  }
}

Rules:
- Percentages of subcastes must sum to their main caste percentage.
- Sentiment totals for subcastes must align with the main caste's sentiment totals.
- Ensure valid JSON with no trailing commas.
- Avoid markdown formatting.
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

    const userPrompt = `Generate caste and sentiment analysis for: ${query}. Only return valid JSON.`;

    let completion;
    try {
      completion = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: `${systemPrompt(query, options)}\n\n${userPrompt}` }]
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
