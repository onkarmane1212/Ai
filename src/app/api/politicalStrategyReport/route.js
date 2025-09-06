// // app/api/political-report/route.js
// import { NextResponse } from 'next/server';
// import Anthropic from '@anthropic-ai/sdk';

// export const runtime = 'nodejs';
// export const maxDuration = 300;

// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

// const systemPrompt = (name,region,timeRange) => `
// You are a political intelligence analyst for Indian constituencies (latest 2025 data only, all links active).
// Return ONLY valid JSON (no markdown) matching this exact schema:

// {
//   "political_strategy_report": {
//     "region": "${region}",
//     "leader": "${name}",
//     "party": "",
//     "report_date": "YYYY-MM-DD",
//     "sections": {
//       "social_media_performance": {summary, platform_comparison[], pro_pages[], anti_pages[]},
//       "sentiment_analysis": {overall_sentiment, sentiment_breakdown, sentiment_trends, top_positive_comments[], top_negative_comments[]},
//       "content_scanning_analysis": {pro_narratives[], anti_narratives[], emerging_trends[], viral_content[]},
//       "demographic_sentiment": {gender_based, age_group, occupation},
//       "opposition_tracking": {top_opponents[], recent_opposition_campaigns[], counter_strategies[]},
//       "strategic_recommendations": {messaging[], content_suggestions[], audience_targeting[], crisis_management[]},
//       "caste_sentiment": {caste_groups[], caste_related_issues[]},
//       "key_issues": [],
//       "party_worker_sentiment": {internal_morale, participation_trend, worker_feedback[]},
//       "flagship_schemes": {overall_sentiment, swot_analysis, public_feedback}
//     }
//   }
// }

// Rules:
// - Fill ALL fields with realistic, recent 2025 data for ${region}.
// - Include numeric stats, %, growth rates, dates, and working URLs.
// - Keep section details rich, specific, and well-structured.
// - Do not omit any of the 10 main sections.
// - Output MUST be valid JSON only — no explanations or extra text.
// `;


// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const { query, name ,region,timeRange} = body;

//     if (!query && !name) {
//       return NextResponse.json({ error: 'Either query or name must be provided' }, { status: 400 });
//     }

    

//     const userPrompt = `
// Generate a comprehensive strategic political report for the region: ${name} political constituency.
// Include all 10 sections as described in the schema.
// Only return JSON output. No explanation or markdown.
// `;

//     const completion = await anthropic.messages.create({
//       model: 'claude-sonnet-4-20250514',
//       max_tokens: 4000,
//       temperature: 0.7,
//       messages: [
//         {
//           role: 'user',
//           content: [
//             {
//               type: 'text',
//               text: `${systemPrompt(name,region,timeRange)}\n\n${userPrompt}`
//             }
//           ]
//         }
//       ]
//     });

//     const rawContent = completion?.content?.[0]?.text;

//     if (!rawContent) {
//       return NextResponse.json({ error: 'Empty response from Claude' }, { status: 502 });
//     }

//     let parsed;
//     try {
//       parsed = JSON.parse(rawContent);
//       console.log("parsed",parsed.sections.social_media_performance);
//     } catch {
//       const jsonMatch = rawContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
//       if (jsonMatch) {
//         parsed = JSON.parse(jsonMatch[1]);
//       } else {
//         const objectMatch = rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
//         if (objectMatch) {
//           parsed = JSON.parse(objectMatch[0]);
//         } else {
//           throw new Error('No valid JSON found in response');
//         }
//       }
//     }

//     return NextResponse.json(parsed, { status: 200 });

//   } catch (err) {
//     return NextResponse.json({ error: 'Unexpected error', details: err.message }, { status: 500 });
//   }
// }

// app/api/political-report/route.js
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import SerpApi from 'google-search-results-nodejs';

export const runtime = 'nodejs';
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const serpapi = new SerpApi.GoogleSearch(process.env.SERPAPI_KEY);

const formatDate = (date) => date.toISOString().split('T')[0];

// Date range: last 90 days
const today = new Date();
const past90Days = new Date();
past90Days.setDate(today.getDate() - 90);

const startDate = formatDate(past90Days);
const endDate = formatDate(today);

// SerpAPI fetcher
const fetchNewsFromSerpAPI = async (query) => {
  return new Promise((resolve) => {
    serpapi.json(
      {
        engine: 'google_news',
        q: query,
        hl: 'en',
        gl: 'in',
        num: 20,
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
              link: item.link,
            }))
          );
        } else {
          resolve([]);
        }
      }
    );
  });
};

const systemPrompt = (name, region, timeRange, realNews = []) => {
  let newsSection = '';
  if (realNews.length) {
    newsSection = `Here are some recent real political headlines and snippets:\n${JSON.stringify(realNews.slice(0, 10), null, 2)}\n\n`;
  }

  return `
You are a political intelligence analyst for Indian constituencies (latest 2025 data only, all links active).
${newsSection}
Return ONLY valid JSON (no markdown) matching this exact schema:

{
  "political_strategy_report": {
    "region": "${region}",
    "leader": "${name}",
    "party": "",
    "report_date": "YYYY-MM-DD",
    "sections": {
      "social_media_performance": {
        "summary": "",
        "platform_comparison": [],
        "pro_pages": [],
        "anti_pages": []
      },
      "sentiment_analysis": {
        "overall_sentiment": "",
        "sentiment_breakdown": {},
        "sentiment_trends": {},
        "top_positive_comments": [],
        "top_negative_comments": []
      },
      "content_scanning_analysis": {
        "pro_narratives": [],
        "anti_narratives": [],
        "emerging_trends": [],
        "viral_content": []
      },
      "demographic_sentiment": {
        "gender_based": {},
        "age_group": {},
        "occupation": {}
      },
      "opposition_tracking": {
        "top_opponents": [],
        "recent_opposition_campaigns": [],
        "counter_strategies": []
      },
      "strategic_recommendations": {
        "messaging": [],
        "content_suggestions": [],
        "audience_targeting": [],
        "crisis_management": []
      },
      "caste_sentiment": {
        "caste_groups": [],
        "caste_related_issues": []
      },
      "key_issues": [],
      "party_worker_sentiment": {
        "internal_morale": "",
        "participation_trend": "",
        "worker_feedback": []
      },
      "flagship_schemes": {
        "overall_sentiment": "",
        "swot_analysis": {},
        "public_feedback": {}
      }
    }
  }
}

Rules:
- Fill ALL fields with realistic, recent 2025 data for ${region}.
- Include numeric stats, %, growth rates, dates, and working URLs.
- Keep section details rich, specific, and well-structured.
- Do not omit any of the 10 main sections.
- Output MUST be valid JSON only — no explanations or extra text.
`;
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, name, region, timeRange } = body;

    if (!query && !name) {
      return NextResponse.json({ error: 'Either query or name must be provided' }, { status: 400 });
    }

    // Step 1: Fetch recent political news from SerpAPI
    const serpNews = await fetchNewsFromSerpAPI(name || query);

    // Step 2: Build prompt with real data context
    const sysPrompt = systemPrompt(name, region, timeRange, serpNews);
    const userPrompt = `
Generate a comprehensive strategic political report for the region: ${name} political constituency.
Include all 10 sections as described in the schema.
Only return JSON output. No explanation or markdown.
`;

    // Step 3: Call Anthropic
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${sysPrompt}\n\n${userPrompt}` }
          ]
        }
      ]
    });

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
          throw new Error('No valid JSON found in response');
        }
      }
    }

    return NextResponse.json(parsed, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error', details: err.message }, { status: 500 });
  }
}