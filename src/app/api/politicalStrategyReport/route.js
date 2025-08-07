// import { NextResponse } from 'next/server';
// import OpenAI from 'openai';

// export const runtime = 'nodejs';
// export const maxDuration = 300;

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const systemPrompt = (name) => `
// You are a political intelligence analyst with deep expertise in digital media, voter sentiment, and public opinion across Indian constituencies.

// Generate a **comprehensive JSON report** for the region "${name || 'the given region'}" using the structure and logic below. This will help strategists evaluate political performance and shape future campaigns.

// Your JSON must strictly follow this schema and include **all 10 sections** listed:

// {
//   "political_strategy_report": {
//     "region": "[Region/Constituency Name]",
//     "leader": "[Leader's Full Name]",
//     "party": "[Political Party]",
//     "report_date": "[YYYY-MM-DD]",
//     "sections": {
//       "social_media_performance": {
//         "summary": "[Overall evaluation of leader's presence and activity]",
//         "platform_comparison": [
//           {
//             "platform": "Facebook/Twitter/Instagram/YouTube",
//             "follower_count": 123456,
//             "engagement_rate": "high/medium/low",
//             "growth_rate": "+X% from last month",
//             "ranking_vs_others": "Top 10% in region/state",
//             "top_performing_posts": ["Post URL 1", "Post URL 2"]
//           }
//         ],
//         "pro_pages": [
//           {
//             "name": "Page Name",
//             "followers": 50000,
//             "engagement_rate": "high",
//             "sentiment": "positive"
//           }
//         ],
//         "anti_pages": [
//           {
//             "name": "Critic Page",
//             "followers": 20000,
//             "engagement_rate": "medium",
//             "sentiment": "negative"
//           }
//         ]
//       },
//       "sentiment_analysis": {
//         "overall_sentiment": "positive/neutral/negative",
//         "sentiment_breakdown": {
//           "positive": 52,
//           "neutral": 28,
//           "negative": 20
//         },
//         "sentiment_trends": {
//           "week_over_week": {
//             "positive_change": 5,
//             "negative_change": -2
//           },
//           "month_over_month": {
//             "positive_change": 12,
//             "negative_change": -5
//           }
//         },
//         "top_positive_comments": [
//           {
//             "text": "Comment text...",
//             "platform": "Twitter",
//             "engagement": 245,
//             "date": "2023-11-15"
//           }
//         ],
//         "top_negative_comments": [
//           {
//             "text": "Comment text...",
//             "platform": "Facebook",
//             "engagement": 189,
//             "date": "2023-11-14"
//           }
//         ]
//       },
//       "content_scanning_analysis": {
//         "pro_narratives": [
//           {
//             "narrative": "Development initiatives in the region",
//             "reach": 50000,
//             "sentiment": "positive",
//             "key_influencers": ["@influencer1", "@influencer2"]
//           }
//         ],
//         "anti_narratives": [
//           {
//             "narrative": "Allegations of corruption",
//             "reach": 30000,
//             "sentiment": "negative",
//             "key_influencers": ["@critic1", "@activist1"]
//           }
//         ],
//         "emerging_trends": [
//           {
//             "hashtag": "#LeaderXForDevelopment",
//             "volume": 2500,
//             "sentiment": "positive",
//             "growth_rate": "+150% this week"
//           }
//         ],
//         "viral_content": [
//           {
//             "type": "video/post/image",
//             "url": "https://example.com/video1",
//             "views": 150000,
//             "shares": 5000,
//             "sentiment": "positive"
//           }
//         ]
//       },
//       "demographic_sentiment": {
//         "gender_based": {
//           "male": { "sentiment": "neutral", "confidence": 0.75 },
//           "female": { "sentiment": "positive", "confidence": 0.82 },
//           "other": { "sentiment": "neutral", "confidence": 0.65 }
//         },
//         "age_group": {
//           "18-25": { "sentiment": "positive", "percentage": 35 },
//           "26-40": { "sentiment": "neutral", "percentage": 40 },
//           "41-60": { "sentiment": "negative", "percentage": 20 },
//           "60+": { "sentiment": "neutral", "percentage": 5 }
//         },
//         "occupation": {
//           "students": { "sentiment": "positive", "key_issues": ["education", "jobs"] },
//           "farmers": { "sentiment": "negative", "key_issues": ["crop prices", "loan waivers"] },
//           "salaried": { "sentiment": "neutral", "key_issues": ["taxation", "inflation"] },
//           "business": { "sentiment": "positive", "key_issues": ["ease of doing business"] }
//         }
//       },
//       "opposition_tracking": {
//         "top_opponents": [
//           {
//             "name": "Opponent Name",
//             "party": "Opposition Party",
//             "sentiment_polarity": "neutral",
//             "social_media_reach": 150000,
//             "recent_activities": ["Recent rally in X location", "Policy announcement on Y"]
//           }
//         ],
//         "recent_opposition_campaigns": [
//           {
//             "campaign": "Online Rally on Employment",
//             "reach": 100000,
//             "sentiment": "negative",
//             "key_messages": ["Job crisis", "Unemployment rate"]
//           }
//         ],
//         "counter_strategies": [
//           "Highlight job creation initiatives",
//           "Showcase skill development programs"
//         ]
//       },
//       "strategic_recommendations": {
//         "messaging": [
//           {
//             "recommendation": "Highlight welfare schemes with real beneficiary stories",
//             "priority": "high",
//             "expected_impact": "Increase positive sentiment among beneficiaries"
//           },
//           {
//             "recommendation": "Use more video content to connect with youth",
//             "priority": "medium",
//             "platforms": ["Instagram", "YouTube Shorts"]
//           }
//         ],
//         "content_suggestions": [
//           {
//             "type": "Weekly Q&A with Leader",
//             "format": "Live Video",
//             "topics": ["Local issues", "Upcoming initiatives"]
//           },
//           {
//             "type": "Testimonials from local entrepreneurs",
//             "format": "Video series",
//             "platforms": ["Facebook", "YouTube"]
//           }
//         ],
//         "audience_targeting": [
//           {
//             "segment": "Farmers in rural belts",
//             "message": "Agricultural reforms and support schemes",
//             "channels": ["WhatsApp", "Local radio"]
//           },
//           {
//             "segment": "Youth in urban centers",
//             "message": "Employment opportunities and skill development",
//             "channels": ["Instagram", "Twitter"]
//           }
//         ],
//         "crisis_management": [
//           "Monitor sentiment on [specific issue]",
//           "Prepare response for [potential controversy]"
//         ]
//       },
//       "caste_sentiment": {
//         "caste_groups": [
//           {
//             "caste": "SC",
//             "sentiment": "positive"
//           },
//           {
//             "caste": "OBC",
//             "sentiment": "neutral"
//           },
//           {
//             "caste": "ST",
//             "sentiment": "negative"
//           }
//         ],
//         "caste_related_issues": ["Reservation awareness", "Caste-based violence", "Representation demands"]
//       },
//       "key_issues": [
//         {
//           "issue": "Unemployment",
//           "engagement_trend": "rising",
//           "leader_response": "Announced job fairs and youth skill centers",
//           "public_sentiment": "negative"
//         },
//         {
//           "issue": "Water Supply",
//           "engagement_trend": "stable",
//           "leader_response": "Promoted pipeline upgrade projects",
//           "public_sentiment": "neutral"
//         }
//       ],
//       "party_worker_sentiment": {
//         "internal_morale": "moderate",
//         "participation_trend": "declining",
//         "worker_feedback": [
//           "Need better coordination with central office",
//           "Low visibility of local campaigns"
//         ]
//       },
//       "flagship_schemes": {
//         "overall_sentiment": "positive",
//         "swot_analysis": {
//           "strengths": ["Free healthcare scheme", "Scholarships for girls"],
//           "weaknesses": ["Low awareness in tribal areas"],
//           "opportunities": ["Mobile app for benefits tracking"],
//           "threats": ["Opposition disinformation"]
//         },
//         "public_feedback": {
//           "development": "good",
//           "infrastructure": "average",
//           "employment": "poor",
//           "agriculture": "improving",
//           "drainage": "needs work",
//           "electricity": "stable",
//           "safety": "positive"
//         }
//       }
//     }
//   }
// }

// Guidelines:
// - Fill all 10 sections with realistic and complete data.
// - Use Indian political context, real caste terms, digital platform names, etc.
// - Format must be valid JSON only. No explanations or markdown.
// - If a data point is not available, use a placeholder or note "insufficient data".
// - Use today's date for "report_date".
// - Ensure data is logically consistent and context-aware for ${name || 'the region'}.
// `;

// export async function POST(req) {
//   try {
//     let requestBody;
//     try {
//       requestBody = await req.json();
//     } catch (parseError) {
//       return NextResponse.json(
//         { error: 'Invalid JSON in request body' },
//         { status: 400 }
//       );
//     }

//     const { query, name } = requestBody;
//     if (!query && !name) {
//       return NextResponse.json(
//         { error: 'Either query or name must be provided' },
//         { status: 400 }
//       );
//     }

//     const userPrompt = `
// Generate a comprehensive strategic political report for the region: ${name || query}.
// Include all 10 sections as described in the schema.
// Only return JSON output. No explanation or markdown.
// `;

//     const searchQuery = name ? `Name: ${name}${query ? `\nAdditional context: ${query}` : ''}` : query;

//     let completion;
//     try {
//       completion = await openai.chat.completions.create({
//         model: "gpt-4-turbo-preview",
//         messages: [
//           { role: "system", content: systemPrompt(name) },
//           { role: "user", content: userPrompt }
//         ],
//         temperature: 0.7,
//         max_tokens: 3000
//       });
//     } catch (openaiError) {
//       return NextResponse.json(
//         { error: 'Error calling OpenAI API', details: openaiError.message },
//         { status: 502 }
//       );
//     }

//     const rawContent = completion.choices[0]?.message?.content;
//     if (!rawContent) {
//       return NextResponse.json(
//         { error: 'Empty response from OpenAI API' },
//         { status: 502 }
//       );
//     }

//     let parsed;
//     try {
//       try {
//         parsed = JSON.parse(rawContent);
//       } catch (e) {
//         const jsonMatch = rawContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
//         if (jsonMatch) {
//           parsed = JSON.parse(jsonMatch[1]);
//         } else {
//           const objectMatch = rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
//           if (objectMatch) {
//             parsed = JSON.parse(objectMatch[0]);
//           } else {
//             throw new Error('No valid JSON found in response');
//           }
//         }
//       }

//       return NextResponse.json(parsed, { status: 200 });

//     } catch (parseError) {
//       return NextResponse.json(
//         {
//           error: 'Failed to parse response from OpenAI',
//           details: parseError.message,
//           rawContent: rawContent.substring(0, 500) + (rawContent.length > 500 ? '...' : '')
//         },
//         { status: 502 }
//       );
//     }

//   } catch (err) {
//     return NextResponse.json({ error: 'Unexpected error', details: err.message }, { status: 500 });
//   }
// }


// app/api/political-report/route.js
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const systemPrompt = (name) => `
You are a political intelligence analyst with deep expertise in digital media, voter sentiment, and public opinion across Indian constituencies.
all data must be latest 2025.all links must be active.
Generate a **comprehensive JSON report** for the region "${name || 'the given region'}" using the structure and logic below. This will help strategists evaluate political performance and shape future campaigns.

Your JSON must strictly follow this schema and include **all 10 sections** listed:

{
  "political_strategy_report": {
    "region": "[Region/Constituency Name]",
    "leader": "[Leader's Full Name]",
    "party": "[Political Party]",
    "report_date": "[YYYY-MM-DD]",
    "sections": {
      "social_media_performance": {
        "summary": "[Overall evaluation of leader's presence and activity]",
        "platform_comparison": [
          {
            "platform": "Facebook/Twitter/Instagram/YouTube",
            "follower_count": 123456,
            "engagement_rate": "high/medium/low",
            "growth_rate": "+X% from last month",
            "ranking_vs_others": "Top 10% in region/state",
            "top_performing_posts": ["Post URL 1", "Post URL 2"]
          }
        ],
        "pro_pages": [
          {
            "name": "Page Name",
            "followers": 50000,
            "engagement_rate": "high",
            "sentiment": "positive"
          }
        ],
        "anti_pages": [
          {
            "name": "Critic Page",
            "followers": 20000,
            "engagement_rate": "medium",
            "sentiment": "negative"
          }
        ]
      },
      "sentiment_analysis": {
        "overall_sentiment": "positive/neutral/negative",
        "sentiment_breakdown": {
          "positive": 52,
          "neutral": 28,
          "negative": 20
        },
        "sentiment_trends": {
          "week_over_week": {
            "positive_change": 5,
            "negative_change": -2
          },
          "month_over_month": {
            "positive_change": 12,
            "negative_change": -5
          }
        },
        "top_positive_comments": [
          {
            "text": "Comment text...",
            "platform": "Twitter",
            "engagement": 245,
            "date": "2023-11-15"
          }
        ],
        "top_negative_comments": [
          {
            "text": "Comment text...",
            "platform": "Facebook",
            "engagement": 189,
            "date": "2023-11-14"
          }
        ]
      },
      "content_scanning_analysis": {
        "pro_narratives": [
          {
            "narrative": "Development initiatives in the region",
            "reach": 50000,
            "sentiment": "positive",
            "key_influencers": ["@influencer1", "@influencer2"]
          }
        ],
        "anti_narratives": [
          {
            "narrative": "Allegations of corruption",
            "reach": 30000,
            "sentiment": "negative",
            "key_influencers": ["@critic1", "@activist1"]
          }
        ],
        "emerging_trends": [
          {
            "hashtag": "#LeaderXForDevelopment",
            "volume": 2500,
            "sentiment": "positive",
            "growth_rate": "+150% this week"
          }
        ],
        "viral_content": [
          {
            "type": "video/post/image",
            "url": "https://example.com/video1",
            "views": 150000,
            "shares": 5000,
            "sentiment": "positive"
          }
        ]
      },
      "demographic_sentiment": {
        "gender_based": {
          "male": { "sentiment": "neutral", "confidence": 0.75 },
          "female": { "sentiment": "positive", "confidence": 0.82 },
          "other": { "sentiment": "neutral", "confidence": 0.65 }
        },
        "age_group": {
          "18-25": { "sentiment": "positive", "percentage": 35 },
          "26-40": { "sentiment": "neutral", "percentage": 40 },
          "41-60": { "sentiment": "negative", "percentage": 20 },
          "60+": { "sentiment": "neutral", "percentage": 5 }
        },
        "occupation": {
          "students": { "sentiment": "positive", "key_issues": ["education", "jobs"] },
          "farmers": { "sentiment": "negative", "key_issues": ["crop prices", "loan waivers"] },
          "salaried": { "sentiment": "neutral", "key_issues": ["taxation", "inflation"] },
          "business": { "sentiment": "positive", "key_issues": ["ease of doing business"] }
        }
      },
      "opposition_tracking": {
        "top_opponents": [
          {
            "name": "Opponent Name",
            "party": "Opposition Party",
            "sentiment_polarity": "neutral",
            "social_media_reach": 150000,
            "recent_activities": ["Recent rally in X location", "Policy announcement on Y"]
          }
        ],
        "recent_opposition_campaigns": [
          {
            "campaign": "Online Rally on Employment",
            "reach": 100000,
            "sentiment": "negative",
            "key_messages": ["Job crisis", "Unemployment rate"]
          }
        ],
        "counter_strategies": [
          "Highlight job creation initiatives",
          "Showcase skill development programs"
        ]
      },
      "strategic_recommendations": {
        "messaging": [
          {
            "recommendation": "Highlight welfare schemes with real beneficiary stories",
            "priority": "high",
            "expected_impact": "Increase positive sentiment among beneficiaries"
          },
          {
            "recommendation": "Use more video content to connect with youth",
            "priority": "medium",
            "platforms": ["Instagram", "YouTube Shorts"]
          }
        ],
        "content_suggestions": [
          {
            "type": "Weekly Q&A with Leader",
            "format": "Live Video",
            "topics": ["Local issues", "Upcoming initiatives"]
          },
          {
            "type": "Testimonials from local entrepreneurs",
            "format": "Video series",
            "platforms": ["Facebook", "YouTube"]
          }
        ],
        "audience_targeting": [
          {
            "segment": "Farmers in rural belts",
            "message": "Agricultural reforms and support schemes",
            "channels": ["WhatsApp", "Local radio"]
          },
          {
            "segment": "Youth in urban centers",
            "message": "Employment opportunities and skill development",
            "channels": ["Instagram", "Twitter"]
          }
        ],
        "crisis_management": [
          "Monitor sentiment on [specific issue]",
          "Prepare response for [potential controversy]"
        ]
      },
      "caste_sentiment": {
        "caste_groups": [
          {
            "caste": "SC",
            "sentiment": "positive"
          },
          {
            "caste": "OBC",
            "sentiment": "neutral"
          },
          {
            "caste": "ST",
            "sentiment": "negative"
          }
        ],
        "caste_related_issues": ["Reservation awareness", "Caste-based violence", "Representation demands"]
      },
      "key_issues": [
        {
          "issue": "Unemployment",
          "engagement_trend": "rising",
          "leader_response": "Announced job fairs and youth skill centers",
          "public_sentiment": "negative"
        },
        {
          "issue": "Water Supply",
          "engagement_trend": "stable",
          "leader_response": "Promoted pipeline upgrade projects",
          "public_sentiment": "neutral"
        }
      ],
      "party_worker_sentiment": {
        "internal_morale": "moderate",
        "participation_trend": "declining",
        "worker_feedback": [
          "Need better coordination with central office",
          "Low visibility of local campaigns"
        ]
      },
      "flagship_schemes": {
        "overall_sentiment": "positive",
        "swot_analysis": {
          "strengths": ["Free healthcare scheme", "Scholarships for girls"],
          "weaknesses": ["Low awareness in tribal areas"],
          "opportunities": ["Mobile app for benefits tracking"],
          "threats": ["Opposition disinformation"]
        },
        "public_feedback": {
          "development": "good",
          "infrastructure": "average",
          "employment": "poor",
          "agriculture": "improving",
          "drainage": "needs work",
          "electricity": "stable",
          "safety": "positive"
        }
      }
    }
  }
}
`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, name } = body;

    if (!query && !name) {
      return NextResponse.json({ error: 'Either query or name must be provided' }, { status: 400 });
    }

    const region = name || query;

    const userPrompt = `
Generate a comprehensive strategic political report for the region: ${region}.
Include all 10 sections as described in the schema.
Only return JSON output. No explanation or markdown.
`;

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${systemPrompt(name)}\n\n${userPrompt}`
            }
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
