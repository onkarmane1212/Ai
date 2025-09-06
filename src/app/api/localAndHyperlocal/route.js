

// app/api/local-issues/route.js
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import SerpApi from 'google-search-results-nodejs';
import { jsonrepair } from 'jsonrepair'; // <-- NEW

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

// SerpAPI setup
const serpapi = new SerpApi.GoogleSearch(process.env.SERPAPI_KEY);

const formatDate = (date) => date.toISOString().split('T')[0];
const today = new Date();
const past90Days = new Date();
past90Days.setDate(today.getDate() - 90);
const startDate = formatDate(past90Days);
const endDate = formatDate(today);

// Fetch constituency-related local news/issues from SerpAPI
const fetchLocalIssuesFromSerpAPI = async (query) => {
  return new Promise((resolve) => {
    serpapi.json(
      {
        engine: 'google_news',
        q: `${query} constituency local issues OR civic problems OR development updates`,
        hl: 'en',
        gl: 'in',
        num: 15,
        tbs: `cdr:1,cd_min:${startDate},cd_max:${endDate}`
      },
      (data) => {
        if (data?.news_results?.length) {
          resolve(
            data.news_results.map((item) => ({
              title: item.title,
              source: item.source?.name || '',
              date: item.date,
              snippet: item.snippet,
              link: item.link
            }))
          );
        } else {
          resolve([]);
        }
      }
    );
  });
};

// Initialize Claude (Anthropic)
let anthropic;
try {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 300000, // 5 minutes
  });

  console.log('Claude (Anthropic) client initialized successfully');
} catch (err) {
  console.error('Anthropic init error:', err.message);
  throw new Error('Claude API initialization failed');
}

const systemPrompt = (query, realNews = []) => {
  let newsContext = '';
  if (realNews.length) {
    newsContext = `Here are some recent real-world local issue headlines and snippets for context:\n${JSON.stringify(realNews.slice(0, 8), null, 2)}\n\n`;
  }

  return `
You are a data analyst for ${query} constituency governance. Generate a concise JSON report with local and hyperlocal issues.

${query ? `Focus on issues related to ${query}.` : 'Focus on current issues.'}
${newsContext}
Guidelines:
- Return exactly 10 local_issues and 10 hyperlocal_issues
- Mention real-sounding towns and villages in ${query} constituency
- Keep issues specific and relevant to ${query} constituency
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
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'query must be provided' }, { status: 400 });
    }

    const searchQuery = query;

    // Step 1: Fetch local news/issues via SerpAPI
    const serpNews = await fetchLocalIssuesFromSerpAPI(query);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

    // Step 2: Send to Claude with SerpAPI context
    const completion = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${systemPrompt(query, serpNews)}\n\nGenerate a report for: ${searchQuery}`
              }
            ]
          }
        ]
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const rawContent = completion?.content?.[0]?.text;

    if (!rawContent || typeof rawContent !== 'string') {
      return NextResponse.json({ error: 'Invalid or empty response from Claude' }, { status: 502 });
    }

    let parsed;
    try {
      // Extract JSON text from Claude's response
      const matchCode = rawContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
      const matchInline = rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      let jsonText;

      if (matchCode) {
        jsonText = matchCode[1];
      } else if (matchInline) {
        jsonText = matchInline[0];
      } else {
        jsonText = rawContent; // fallback to whole text
      }

      // 🔹 Repair malformed JSON before parsing
      const repairedJson = jsonrepair(jsonText);

      parsed = JSON.parse(repairedJson);
    } catch (jsonErr) {
      return NextResponse.json(
        {
          error: 'Failed to parse or repair JSON',
          details: jsonErr.message,
          rawContent: rawContent.slice(0, 500)
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed, { status: 200 });

  } catch (err) {
    if (err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Claude request timed out after 5 minutes' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
