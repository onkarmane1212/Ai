// app/api/platform-sentiment/route.js
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const buildPlatformSentimentPrompt = (query, options = {}) => {
  const {
    region = 'all',
    timeRange = '1m',
    sentimentThreshold = 0.6,
    customStartDate = '',
    customEndDate = ''
  } = options;

  return `
You are a digital sentiment analyst generating detailed platform-wise sentiment breakdowns.

Generate a STRICTLY VALID JSON response for "${query}" using the following schema:

{
  "platform_analysis": {
    "overview": {
      "total_mentions": number,
      "average_sentiment_score": number,
      "most_active_platform": string,
      "sentiment_distribution": {
        "positive": number,
        "neutral": number,
        "negative": number
      }
    },
    "platforms": [
      {
        "name": string,
        "metrics": {
          "mention_volume": number,
          "sentiment_score": number,
          "engagement_rate": number,
          "top_hashtags": [
            {
              "tag": string,
              "count": number,
              "sentiment": number
            }
          ]
        },
        "demographics": {
          "age_groups": {
            "13-24": number,
            "25-34": number,
            "35-44": number,
            "45+": number
          },
          "gender_distribution": {
            "male": number,
            "female": number,
            "other": number
          }
        },
        "topics": [
          {
            "topic": string,
            "sentiment": number,
            "volume": number
          }
        ]
      }
    ],
    "recommendations": {
      "content_strategy": string[],
      "platform_specific": [
        {
          "platform": string,
          "recommendations": string[]
        }
      ]
    }
  },
  "analysis_metadata": {
    "generated_at": "${new Date().toISOString()}",
    "parameters_used": ${JSON.stringify({
      region,
      timeRange,
      ...(timeRange === 'custom' && {
        custom_date_range: { start: customStartDate, end: customEndDate }
      }),
      sentiment_threshold: sentimentThreshold
    }, null, 2)}
  }
}

Rules:
- Output must be VALID JSON only. No markdown or explanations.
- Do not wrap in code blocks.
- No trailing commas.
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

    const systemPrompt = buildPlatformSentimentPrompt(query, options);
    const userPrompt = `Generate a platform sentiment analysis for: ${query}. Only return valid JSON.`;

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
