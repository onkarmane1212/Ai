// // app/api/executive-summary/route.js
// import { NextResponse } from 'next/server';
// import Anthropic from '@anthropic-ai/sdk';

// export const runtime = 'nodejs';
// export const maxDuration = 300;

// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

// // Build the Claude system prompt
// const systemPrompt = (query, options = {}) => {
//   const {
//     region = 'all',
//     timeRange = '1m',
//     customStartDate = '',
//     customEndDate = '',
//     includeRecommendations = true,
//     includeRiskAssessment = true
//   } = options;

//   return `
// You are a senior strategic analyst producing executive summaries with deep insights, risks, and recommendations.

// Generate a STRICTLY VALID JSON executive summary for "${query}" using the following schema:

// {
//   "executive_summary": {
//     "overview": {
//       "purpose": string,
//       "scope": string,
//       "time_period": string,
//       "key_objectives": string[]
//     },
//     "key_findings": {
//       "main_insights": [
//         {
//           "insight": string,
//           "impact": string,
//           "data_sources": string[],
//           "confidence_level": "high" | "medium" | "low"
//         }
//       ],
//       "performance_metrics": {
//         "metric_name": {
//           "value": number | string,
//           "trend": "increasing" | "decreasing" | "stable",
//           "comparison_period": string,
//           "significance": string
//         }
//       }
//     },
//     "trend_analysis": {
//       "current_trends": [
//         {
//           "trend_name": string,
//           "description": string,
//           "drivers": string[],
//           "projected_impact": string
//         }
//       ],
//       "emerging_patterns": [
//         {
//           "pattern": string,
//           "first_observed": string,
//           "growth_rate": string,
//           "potential_impact": string
//         }
//       ]
//     },
//     "critical_analysis": {
//       "strengths": {
//         "description": string,
//         "supporting_evidence": string[],
//         "strategic_advantage": string
//       },
//       "weaknesses": {
//         "description": string,
//         "areas_of_concern": string[],
//         "mitigation_strategies": string[]
//       },
//       "opportunities": [
//         {
//           "opportunity": string,
//           "potential_impact": string,
//           "feasibility": "high" | "medium" | "low",
//           "time_horizon": "short" | "medium" | "long"
//         }
//       ],
//       "threats": [
//         {
//           "threat": string,
//           "likelihood": "high" | "medium" | "low",
//           "potential_impact": string,
//           "risk_mitigation": string[]
//         }
//       ]
//     },
//     "recommendations": [
//       {
//         "recommendation": string,
//         "rationale": string,
//         "expected_outcome": string,
//         "priority": "high" | "medium" | "low",
//         "timeline": string,
//         "responsible_party": string,
//         "resources_required": string[]
//       }
//     ],
//     "risk_assessment": {
//       "identified_risks": [
//         {
//           "risk": string,
//           "category": string,
//           "likelihood": "high" | "medium" | "low",
//           "impact": "high" | "medium" | "low",
//           "risk_score": number,
//           "mitigation_strategy": string,
//           "contingency_plan": string
//         }
//       ],
//       "risk_matrix": {
//         "high_impact_high_probability": string[],
//         "high_impact_low_probability": string[],
//         "low_impact_high_probability": string[],
//         "low_impact_low_probability": string[]
//       }
//     },
//     "conclusion": {
//       "summary": string,
//       "next_steps": string[],
//       "key_takeaways": string[]
//     }
//   },
//   "supporting_data": {
//     "data_sources": [
//       {
//         "name": string,
//         "type": string,
//         "reliability": "high" | "medium" | "low",
//         "time_period_covered": string
//       }
//     ],
//     "methodology": string,
//     "limitations": string[],
//     "assumptions": string[]
//   },
//   "analysis_metadata": {
//     "generated_at": "${new Date().toISOString()}",
//     "parameters_used": ${JSON.stringify({
//       region,
//       timeRange,
//       ...(timeRange === 'custom' && {
//         custom_date_range: { start: customStartDate, end: customEndDate }
//       }),
//       include_recommendations: includeRecommendations,
//       include_risk_assessment: includeRiskAssessment
//     }, null, 2)},
//     "version": "1.0.0",
//     "generated_by": "AI Analysis System"
//   }
// }

// Rules:
// - Ensure valid JSON output with no extra commentary or markdown.
// - Do not wrap in code blocks unless explicitly requested.
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

//     const { query, options = {} } = requestBody;
//     if (!query) {
//       return NextResponse.json({ error: 'Query is required' }, { status: 400 });
//     }

//     const userPrompt = `Generate an executive summary for: ${query}. Only return valid JSON.`;

//     let completion;
//     try {
//       completion = await anthropic.messages.create({
//         model: 'claude-sonnet-4-20250514',
//         max_tokens: 4000,
//         temperature: 0.5,
//         messages: [
//           {
//             role: 'user',
//             content: [{ type: 'text', text: `${systemPrompt(query, options)}\n\n${userPrompt}` }]
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



// app/api/executive-summary/route.js
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';

export const runtime = 'nodejs';
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Your SerpAPI key
const SERPAPI_KEY = process.env.SERPAPI_KEY;

// Function to get real-time data from SerpAPI
async function fetchRealTimeData(query) {
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&hl=en&gl=in&api_key=${SERPAPI_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
    const data = await res.json();

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

// Build the Claude system prompt
const systemPrompt = (query, options = {}, realTimeData = "") => {
  const {
    region = 'all',
    timeRange = '1m',
    customStartDate = '',
    customEndDate = '',
    includeRecommendations = true,
    includeRiskAssessment = true
  } = options;

  return `
You are a senior strategic analyst producing executive summaries with deep insights, risks, and recommendations.

You have the following verified real-time information about ${query}:
${realTimeData}

Generate a STRICTLY VALID JSON executive summary for "${query}" using the following schema:

{
  "executive_summary": {
    "overview": {
      "purpose": string,
      "scope": string,
      "time_period": string,
      "key_objectives": string[]
    },
    "key_findings": {
      "main_insights": [
        {
          "insight": string,
          "impact": string,
          "data_sources": string[],
          "confidence_level": "high" | "medium" | "low"
        }
      ],
      "performance_metrics": {
        "metric_name": {
          "value": number | string,
          "trend": "increasing" | "decreasing" | "stable",
          "comparison_period": string,
          "significance": string
        }
      }
    },
    "trend_analysis": {
      "current_trends": [
        {
          "trend_name": string,
          "description": string,
          "drivers": string[],
          "projected_impact": string
        }
      ],
      "emerging_patterns": [
        {
          "pattern": string,
          "first_observed": string,
          "growth_rate": string,
          "potential_impact": string
        }
      ]
    },
    "critical_analysis": {
      "strengths": {
        "description": string,
        "supporting_evidence": string[],
        "strategic_advantage": string
      },
      "weaknesses": {
        "description": string,
        "areas_of_concern": string[],
        "mitigation_strategies": string[]
      },
      "opportunities": [
        {
          "opportunity": string,
          "potential_impact": string,
          "feasibility": "high" | "medium" | "low",
          "time_horizon": "short" | "medium" | "long"
        }
      ],
      "threats": [
        {
          "threat": string,
          "likelihood": "high" | "medium" | "low",
          "potential_impact": string,
          "risk_mitigation": string[]
        }
      ]
    },
    "recommendations": [
      {
        "recommendation": string,
        "rationale": string,
        "expected_outcome": string,
        "priority": "high" | "medium" | "low",
        "timeline": string,
        "responsible_party": string,
        "resources_required": string[]
      }
    ],
    "risk_assessment": {
      "identified_risks": [
        {
          "risk": string,
          "category": string,
          "likelihood": "high" | "medium" | "low",
          "impact": "high" | "medium" | "low",
          "risk_score": number,
          "mitigation_strategy": string,
          "contingency_plan": string
        }
      ],
      "risk_matrix": {
        "high_impact_high_probability": string[],
        "high_impact_low_probability": string[],
        "low_impact_high_probability": string[],
        "low_impact_low_probability": string[]
      }
    },
    "conclusion": {
      "summary": string,
      "next_steps": string[],
      "key_takeaways": string[]
    }
  },
  "supporting_data": {
    "data_sources": [
      {
        "name": string,
        "type": string,
        "reliability": "high" | "medium" | "low",
        "time_period_covered": string
      }
    ],
    "methodology": string,
    "limitations": string[],
    "assumptions": string[]
  },
  "analysis_metadata": {
    "generated_at": "${new Date().toISOString()}",
    "parameters_used": ${JSON.stringify({
      region,
      timeRange,
      ...(timeRange === 'custom' && {
        custom_date_range: { start: customStartDate, end: customEndDate }
      }),
      include_recommendations: includeRecommendations,
      include_risk_assessment: includeRiskAssessment
    }, null, 2)},
    "version": "1.0.0",
    "generated_by": "AI Analysis System"
  }
}

Rules:
- Use ONLY the verified real-time facts provided above for accuracy.
- Ensure valid JSON output with no extra commentary or markdown.
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

    // 1️⃣ Get real-time data
    const realTimeData = await fetchRealTimeData(query);

    const userPrompt = `Generate an executive summary for: ${query}. Only return valid JSON.`;

    let completion;
    try {
      completion = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: `${systemPrompt(query, options, realTimeData)}\n\n${userPrompt}` }]
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
