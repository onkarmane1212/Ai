// app/api/sentiment-analysis/route.js
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const buildSentimentAnalysisPrompt = (query, options = {}) => {
  const {
    region = 'all',
    timeRange = '1m',
    sentimentThreshold = 0.6,
    includeSentimentBreakdown = true,
    includeSourceAnalysis = true,
    customStartDate = '',
    customEndDate = ''
  } = options;

  return `
You are a sentiment analyst specializing in public opinion analysis across demographics and platforms.

Generate a STRICTLY VALID JSON response for "${query}" using the following schema:

{
  "sentiment_analysis": {
    "overall_sentiment": {
      "positive": number,
      "negative": number,
      "neutral": number,
      "sentiment_threshold": ${sentimentThreshold}
    },
    "sentiment_by_caste": {
      "General": { "positive": number, "negative": number, "neutral": number },
      "OBC": { "positive": number, "negative": number, "neutral": number },
      "SC": { "positive": number, "negative": number, "neutral": number },
      "ST": { "positive": number, "negative": number, "neutral": number },
      "Others": { "positive": number, "negative": number, "neutral": number }
    },
    "sentiment_breakdown": {
      "key_phrases": {
        "positive": string[],
        "negative": string[]
      },
      "intensity_analysis": {
        "strongly_positive": number,
        "positive": number,
        "neutral": number,
        "negative": number,
        "strongly_negative": number
      }
    }
  },
  "platform_sentiment_comparison": {
    "Twitter/X": { "score": number, "positive": number, "negative": number, "neutral": number },
    "Facebook": { "score": number, "positive": number, "negative": number, "neutral": number },
    "Instagram": { "score": number, "positive": number, "negative": number, "neutral": number },
    "YouTube": { "score": number, "positive": number, "negative": number, "neutral": number },
    "Overall": { "score": number, "positive": number, "negative": number, "neutral": number }
  },
  "analysis_metadata": {
    "generated_at": "${new Date().toISOString()}",
    "parameters_used": ${JSON.stringify({
      region,
      timeRange,
      ...(timeRange === 'custom' && {
        custom_date_range: { start: customStartDate, end: customEndDate }
      }),
      sentiment_threshold: sentimentThreshold,
      include_sentiment_breakdown: includeSentimentBreakdown,
      include_source_analysis: includeSourceAnalysis
    }, null, 2)}
  }
}

Rules:
- Output ONLY valid JSON.
- No markdown or explanation.
- Do not wrap output in code blocks.
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

    const systemPrompt = buildSentimentAnalysisPrompt(query, options);
    const userPrompt = `Generate a sentiment analysis for "${query}" including demographic and platform insights. Return only valid JSON.`;

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
    return NextResponse.json(
      { error: 'Something went wrong', details: err.message },
      { status: 500 }
    );
  }
}
