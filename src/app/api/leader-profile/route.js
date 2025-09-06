// // app/api/leader-profile/route.js
// import { NextResponse } from 'next/server';
// import Anthropic from '@anthropic-ai/sdk';

// export const runtime = 'nodejs';
// export const maxDuration = 300;

// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

// const buildLeaderProfilePrompt = (query, region, timeRange) => {
  

//   return `
// You are a senior political analyst producing detailed, data-rich leader profiles for strategic use.

// Generate a STRICTLY VALID JSON profile for "${query}" using the following schema:

// {
//   "leader_profile": {
//     "name": string,
//     "position": string,
//     "party_affiliation": string,
//     "constituency": string,
//     "influence_score": number,
//     "sentiment": {
//       "overall": {
//         "positive": number,
//         "negative": number,
//         "neutral": number
//       },
//       "by_region": {
//         "region_name": { "positive": number, "negative": number, "neutral": number }
//       },
//       "by_demographic": {
//         "age_group": { "positive": number, "negative": number, "neutral": number },
//         "gender": { "positive": number, "negative": number, "neutral": number },
//         "education_level": { "positive": number, "negative": number, "neutral": number }
//       }
//     },
//     "key_metrics": {
//       "approval_rating": number,
//       "trust_index": number,
//       "popularity_trend": {
//         "1m": number,
//         "3m": number,
//         "6m": number,
//         "1y": number
//       },
//       "social_media_reach": {
//         "twitter_followers": number,
//         "facebook_likes": number,
//         "instagram_followers": number,
//         "youtube_subscribers": number
//       }
//     },
//     "political_career": [
//       {
//         "year": string,
//         "position": string,
//         "achievements": string[],
//         "controversies": string[]
//       }
//     ],
//     "key_achievements": string[],
//     "controversies": string[],
//     "public_perception": {
//       "strengths": string[],
//       "weaknesses": string[],
//       "opportunities": string[],
//       "threats": string[]
//     },
//     "comparison_with_peers": [
//       {
//         "name": string,
//         "party": string,
//         "approval_rating": number,
//         "key_differences": string[]
//       }
//     ],
//     "recent_activities": [
//       {
//         "date": "YYYY-MM-DD",
//         "event": string,
//         "impact": string,
//         "media_coverage": {
//           "positive": number,
//           "negative": number,
//           "neutral": number
//         }
//       }
//     ]
//   },
//   "analysis_metadata": {
//     "generated_at": "${new Date().toISOString()}",
//     "parameters_used": ${JSON.stringify({
//       region,
//       timeRange,
//     }, null, 2)}
//   }
// }

// Rules:
// - Valid data only.
// - Return valid JSON only. No code blocks or markdown.
// - No commentary, no explanation.
// - Political Career starting to this year 2025 and position check every year 
// - Verify current position is ${query} .
// - Avoid trailing commas.
// `;
// };

// export async function POST(req) {
//   try {
//     let requestBody;
//     try {
//       requestBody = await req.json();
//     } catch {
//       return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
//     }

//     const { query,region, timeRange } = requestBody;
//     if (!query) {
//       return NextResponse.json({ error: 'Query is required' }, { status: 400 });
//     }

//     const systemPrompt = buildLeaderProfilePrompt(query, region, timeRange);
//     const userPrompt = `Generate a leader profile for: ${query}. Only return valid JSON.`;

//     let completion;
//     try {
//       completion = await anthropic.messages.create({
//         model: 'claude-sonnet-4-20250514',
        
//         max_tokens: 4000,
//         temperature: 0.5,
//         messages: [
//           {
//             role: 'user',
//             content: [{ type: 'text', text: `${systemPrompt}\n\n${userPrompt}` }]
//           }
//         ]
//       });
//     } catch (err) {
//       return NextResponse.json({ error: 'Error calling Claude API', details: err.message }, { status: 502 });
//     }

//     const rawContent = completion?.content?.[0]?.text;
//     if (!rawContent) {
//       return NextResponse.json({ error: 'Empty response from Claude API' }, { status: 502 });
//     }

//     let parsed;
//     try {
//       parsed = JSON.parse(rawContent);
//     } catch {
//       const jsonMatch = rawContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
//       if (jsonMatch) {
//         parsed = JSON.parse(jsonMatch[1]);
//       } else {
//         const objectMatch = rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
//         if (objectMatch) {
//           parsed = JSON.parse(objectMatch[0]);
//         } else {
//           throw new Error('No valid JSON found in Claude response');
//         }
//       }
//     }

//     return NextResponse.json(parsed, { status: 200 });
//   } catch (err) {
//     return NextResponse.json({ error: 'Something went wrong', details: err.message }, { status: 500 });
//   }
// }


// app/api/leader-profile/route.js
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';

export const runtime = 'nodejs';
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SERPAPI_KEY = process.env.SERPAPI_KEY;

async function fetchRealTimeLeaderData(query) {
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&hl=en&gl=in&api_key=${SERPAPI_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
    const data = await res.json();
console.log(data);

    // Extract useful snippet results
    const snippets = [];
    if (data.organic_results) {
      data.organic_results.forEach(item => {
        if (item.snippet) snippets.push(item.snippet);
      });
    }
    if (data.answer_box?.snippet) snippets.push(data.answer_box.snippet);
    if (data.knowledge_graph) {
      if (data.knowledge_graph.description) snippets.push(data.knowledge_graph.description);
      if (data.knowledge_graph.title) snippets.push(`Title: ${data.knowledge_graph.title}`);
    }

    return snippets.join("\n\n");
  } catch (err) {
    console.error("Error fetching SerpAPI data:", err);
    return "No real-time data available.";
  }
}

const buildLeaderProfilePrompt = (query, region, timeRange, realTimeData) => {
  return `
You are a senior political analyst producing detailed, data-rich leader profiles for strategic use.

You have the following verified real-time information about ${query}:
${realTimeData}

Generate a STRICTLY VALID JSON profile for "${query}" using the following schema:

{
  "leader_profile": {
    "name": string,
    "position": string,
    "party_affiliation": string,
    "constituency": string,
    "influence_score": number,
    "sentiment": {
      "overall": {
        "positive": number,
        "negative": number,
        "neutral": number
      },
      "by_region": {
        "region_name": { "positive": number, "negative": number, "neutral": number }
      },
      "by_demographic": {
        "age_group": { "positive": number, "negative": number, "neutral": number },
        "gender": { "positive": number, "negative": number, "neutral": number },
        "education_level": { "positive": number, "negative": number, "neutral": number }
      }
    },
    "key_metrics": {
      "approval_rating": number,
      "trust_index": number,
      "popularity_trend": {
        "1m": number,
        "3m": number,
        "6m": number,
        "1y": number
      },
      "social_media_reach": {
        "twitter_followers": number,
        "facebook_likes": number,
        "instagram_followers": number,
        "youtube_subscribers": number
      }
    },
    "political_career": [
      {
        "year": string,
        "position": string,
        "achievements": string[],
        "controversies": string[]
      }
    ],
    "key_achievements": string[],
    "controversies": string[],
    "public_perception": {
      "strengths": string[],
      "weaknesses": string[],
      "opportunities": string[],
      "threats": string[]
    },
    "comparison_with_peers": [
      {
        "name": string,
        "party": string,
        "approval_rating": number,
        "key_differences": string[]
      }
    ],
    "recent_activities": [
      {
        "date": "YYYY-MM-DD",
        "event": string,
        "impact": string,
        "media_coverage": {
          "positive": number,
          "negative": number,
          "neutral": number
        }
      }
    ]
  },
  "analysis_metadata": {
    "generated_at": "${new Date().toISOString()}",
    "parameters_used": ${JSON.stringify({
      region,
      timeRange,
    }, null, 2)}
  }
}

Rules:
- Use ONLY the verified real-time facts provided above for accuracy.
- Valid data only.
- Return valid JSON only. No code blocks or markdown.
- Political Career starting from 2025 and position check every year.
- Verify current position is ${query}.
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

    const { query, region, timeRange } = requestBody;
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1️⃣ Get real-time data
    const realTimeData = await fetchRealTimeLeaderData(query);

    // 2️⃣ Build prompt
    const systemPrompt = buildLeaderProfilePrompt(query, region, timeRange, realTimeData);
    const userPrompt = `Generate a leader profile for: ${query}. Only return valid JSON.`;

    // 3️⃣ Claude API call
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
