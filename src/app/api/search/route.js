// app/api/search/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 300;
// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// In-memory store for reports (in production, use a database)
const reports = new Map();

// Helper function to get time range text
const getTimeRangeText = (range) => {
  switch (range) {
    case '1m': return 'month';
    case '3m': return '3 months';
    case '6m': return '6 months';
    case '1y': return 'year';
    default: return '';
  }
};

// Save report using the reports API
async function saveReport(reportData) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      
      body: JSON.stringify(reportData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save report');
    }
    
    const result = await response.json();
    return result.reportId;
  } catch (error) {
    console.error('Error saving report:', error);
    throw new Error('Failed to save report: ' + error.message);
  }
  
  return reportId;
}

// Get report by ID
async function getReport(reportId, password = null) {
  const report = reports.get(reportId);
  
  if (!report) {
    return null;
  }
  
  // If report is password protected, verify password
  if (report.password && report.password !== password) {
    return { error: 'Incorrect password' };
  }
  
  return report;
}

// Enhanced sentiment analysis function
async function analyzeSentiment(text) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert sentiment analyzer. Analyze the sentiment of the following text and provide a detailed analysis.'
        },
        {
          role: 'user',
          content: `Analyze the sentiment of this text and provide a detailed analysis including sentiment score (-1 to 1), confidence level (0-1), and key phrases that influenced the sentiment.\n\nText: ${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });
    
    return response.choices[0]?.message?.content || 'No analysis available';
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    return 'Sentiment analysis failed';
  }
}

// Generate dynamic caste analysis using GPT
async function generateCasteAnalysis(query, {
  detailed = false,
  region = 'all',
  timeRange = '1m',
  sentimentThreshold = 0.6,
  includeSentimentBreakdown = true,
  includeSourceAnalysis = true,
  customStartDate = '',
  customEndDate = ''
} = {}) {
  // Get current month and year for news filtering
  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Format date range text
  let dateRangeText = '';
  if (timeRange === 'custom' && customStartDate && customEndDate) {
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    dateRangeText = `from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
  } else if (timeRange && timeRange !== 'all') {
    dateRangeText = `the last ${getTimeRangeText(timeRange)}`;
  }
  
  // Build the system prompt with region and time context
  const systemPrompt = `You are an expert data analyst and crisis management specialist. 
  Generate a comprehensive analysis of public opinion about the given topic across different caste groups in India${
    region && region !== 'all' ? `, specifically in the ${region} region` : ''
  }${dateRangeText ? `, covering ${dateRangeText}` : ''}.
  
  IMPORTANT: Your response MUST include the following sections with COMPLETE data:
  
  1. leader_profile: An array of 3-5 key leaders/influencers related to the topic, each with:
     - name: Full name (REQUIRED)
     - position: Current position/role (REQUIRED)
     - influence_score: Number from 1-100 indicating their influence (REQUIRED)
     - sentiment: 'positive', 'negative', or 'neutral' based on public perception (REQUIRED)
     - key_quotes: 2-3 notable quotes from the leader about the topic (REQUIRED)
     - recent_activities: 2-3 recent actions or statements related to the topic (REQUIRED)
     
  2. executive_summary: A 3-4 paragraph summary including (REQUIRED):
     - Key findings and insights from the analysis
     - Major trends and patterns in public opinion
     - Potential implications for different stakeholders
     - Strategic recommendations based on the findings

  3. news: An object containing three arrays (REQUIRED):
     - positive: EXACTLY 10 news items with positive sentiment (sentiment_score > 0.3)
     - negative: EXACTLY 10 news items with negative sentiment (sentiment_score < -0.3)
     - neutral: EXACTLY 5 news items with neutral sentiment (-0.3 <= sentiment_score <= 0.3)
     
     Each news item MUST include ALL of these fields:
     - headline: A clear, concise headline (REQUIRED, 5-12 words)
     - source: The news publication name (REQUIRED, use real publication names like 'The Hindu', 'Times of India')
     - date: In YYYY-MM-DD format (REQUIRED, must be within the last 30 days)
     - summary: A 1-2 sentence summary of the article (REQUIRED, 15-40 words)
     - sentiment_score: A number between -1 and 1 (REQUIRED, positive > 0.3, negative < -0.3, neutral between -0.3 and 0.3)
     - key_phrases: Array of 2-3 key phrases (REQUIRED, each 1-4 words)
     - impact_analysis: 1-2 sentences on potential consequences (REQUIRED for negative items)
     - resolution_suggestions: Array of 2-3 actionable suggestions (REQUIRED for negative items, each 5-15 words)

  4. sentiment_analysis: Object containing (REQUIRED):
     - overall_sentiment: { positive: number, negative: number, neutral: number, sentiment_threshold: number }
     - sentiment_by_caste: Object with caste-wise sentiment breakdown
     - sentiment_breakdown: Detailed analysis including key_phrases and intensity_analysis

  5. Additional required sections (all REQUIRED):
     - caste_distribution: Object with caste-wise percentage distribution
     - key_insights: Array of 3-5 key insights
     - trends: Array of 2-3 major trends
     - source_analysis: Analysis of top sources and their reliability
     - key_strengths_weaknesses: Object with strengths and weaknesses arrays
     - region_wise_analysis: Sentiment analysis by region
     - platform_sentiment_comparison: Sentiment analysis by platform
     - demographic_support_base: Support percentages by demographic
     - analysis_metadata: Metadata about the analysis

  Analysis Parameters:
  - Sentiment Threshold: ${sentimentThreshold}
  - Detailed Sentiment Breakdown: ${includeSentimentBreakdown ? 'Enabled' : 'Disabled'}
  - Source Analysis: ${includeSourceAnalysis ? 'Enabled' : 'Disabled'}
  - Region: ${region === 'all' ? 'All India' : region}
  - Time Range: ${timeRange === 'custom' ? `${customStartDate} to ${customEndDate}` : timeRange}
  
  IMPORTANT: Your response MUST be a valid JSON object with ALL the above sections. Do not include any markdown formatting or additional text outside the JSON object.
  {
    "caste_distribution": {
      "General": 27.3,
      "OBC": 38.5,
      "SC": 18.2,
      "ST": 10.1,
      "Others": 5.9
    },
    "sentiment_analysis": {
      "overall_sentiment": {
        "positive": 57,
        "negative": 23,
        "neutral": 20,
        "sentiment_threshold": ${sentimentThreshold}
      },
      "sentiment_by_caste": {
        "General": { "positive": 61, "negative": 19, "neutral": 20 },
        "OBC": { "positive": 55, "negative": 25, "neutral": 20 },
        "SC": { "positive": 53, "negative": 27, "neutral": 20 },
        "ST": { "positive": 50, "negative": 30, "neutral": 20 },
        "Others": { "positive": 65, "negative": 15, "neutral": 20 }
      },
      "sentiment_breakdown": {
        "key_phrases": {
          "positive": ["development initiatives", "inclusive policies"],
          "negative": ["lack of representation", "economic disparity"]
        },
        "intensity_analysis": {
          "strongly_positive": 25,
          "positive": 32,
          "neutral": 20,
          "negative": 15,
          "strongly_negative": 8
        }
      }
    },
    "leader_profile": [
      {
        "name": "Rahul Gandhi",
        "position": "Member of Parliament, Indian National Congress",
        "influence_score": 85,
        "sentiment": "positive",
        "key_quotes": [
          "We must ensure that every Indian, regardless of caste or community, has equal opportunities to succeed.",
          "The true strength of India lies in its diversity and inclusive growth."
        ],
        "recent_activities": [
          "Launched a nationwide campaign for social justice and equality",
          "Advocated for increased reservation in private sector for marginalized communities"
        ]
      }
    ],
    "executive_summary": [
      "The analysis reveals a complex landscape of public opinion across different caste groups in India. The General category shows the most positive sentiment (61%) towards current policies, while SC/ST communities express significant concerns about representation and economic opportunities. The OBC community presents a mixed response, with sentiment slightly leaning towards the positive side.",
      "A clear trend emerging from the data is the growing youth engagement in social justice issues, particularly among urban populations. However, rural areas continue to show higher levels of dissatisfaction, especially regarding implementation of welfare schemes. The analysis also uncovers significant regional variations, with southern states generally showing more positive sentiment compared to northern regions.",
      "These findings have important implications for policymakers and community leaders. There is a pressing need for more targeted interventions addressing the specific concerns of marginalized communities while maintaining the positive momentum in other groups. The data suggests that policies focusing on education, employment, and social protection could significantly improve overall sentiment.",
      "Based on the analysis, we recommend: 1) Enhanced monitoring of policy implementation in rural areas, 2) Development of community-specific intervention programs, 3) Strengthening grievance redressal mechanisms, and 4) Increased engagement with youth leaders to bridge the perception gap between different caste groups."
    ],
    "key_insights": [
      "General caste group shows the highest positive sentiment, possibly due to perceived benefits from policy developments.",
      "ST and SC groups express elevated negative sentiment around representation and economic disparity.",
      "OBC sentiment is balanced but slightly skewed towards negative."
    ],
    "trends": [
      "Trend 1: Positive sentiment has risen by ~5% month-over-month across all castes.",
      "Trend 2: Regional variations visible, with coastal areas showing more optimism than inland."
    ],
    "source_analysis": {
      "top_sources": [
        { "source": "The Hindu", "bias": "center-left", "coverage": 22 },
        { "source": "Times of India", "bias": "center", "coverage": 20 },
        { "source": "Republic TV", "bias": "right", "coverage": 15 }
      ],
      "source_reliability": {
        "reliable": 65,
        "somewhat_reliable": 20,
        "unreliable": 15
      }
    },
    "news": {
      "positive": [
        {
          "headline": "Inclusive education policy gains praise among youth",
          "source": "The Hindu",
          "date": new Date().toISOString().split('T')[0],
          "summary": "New policy aimed at broadening access receives strong support from student groups.",
          "sentiment_score": 0.88,
          "key_phrases": ["inclusive education", "student welfare"]
        }
      ],
      "negative": [
        {
          "headline": "SC/ST leaders protest economic neglect in rural districts",
          "source": "Times of India",
          "date": new Date(Date.now() - 86400000).toISOString().split('T')[0],
          "summary": "Leaders highlight lack of funding and opportunities in tribal regions.",
          "impact_analysis": "May fuel disillusionment among marginalized communities.",
          "resolution_suggestions": ["Increase rural development budgets", "Strengthen local representation"],
          "sentiment_score": -0.76,
          "key_phrases": ["funding gap", "marginalized voices"]
        }
      ],
      "neutral": [
        {
          "headline": "Government releases caste-wise dataset on employment",
          "source": "Press Information Bureau",
          "date": new Date().toISOString().split('T')[0],
          "summary": "Official release of employment data provides factual overview without commentary.",
          "sentiment_score": 0.05,
          "key_phrases": ["employment statistics", "caste dataset"]
        }
      ]
    },
    "key_strengths_weaknesses": {
      "strengths": [
        "Widespread positive reception of inclusion policies.",
        "Youth engagement driving optimistic discourse."
      ],
      "weaknesses": [
        "Persistent grievances in SC/ST communities around representation.",
        "Media fragmentation leading to variable coverage quality."
      ]
    },
    "region_wise_analysis": {
      "North": { "positive": 60, "negative": 20, "neutral": 20 },
      "South": { "positive": 55, "negative": 25, "neutral": 20 },
      "East": { "positive": 58, "negative": 22, "neutral": 20 },
      "West": { "positive": 53, "negative": 27, "neutral": 20 }
    },
    "platform_sentiment_comparison": {
      "Twitter/X": {
        "score": 62,
        "positive": 65,
        "negative": 20,
        "neutral": 15
      },
      "Facebook": {
        "score": 55,
        "positive": 58,
        "negative": 25,
        "neutral": 17
      },
      "Instagram": {
        "score": 59,
        "positive": 63,
        "negative": 18,
        "neutral": 19
      },
      "YouTube": {
        "score": 50,
        "positive": 52,
        "negative": 30,
        "neutral": 18
      },
      "Overall": {
        "score": 57,
        "positive": 60,
        "negative": 23,
        "neutral": 17
      }
    },
    "demographic_support_base": {
      "Youth (18-35)": 65,
      "Middle-age (36-55)": 55,
      "Senior (56+)": 45,
      "Urban": 60,
      "Rural": 50,
      "Overall": 57
    },
    "analysis_metadata": {
      "generated_at": "${new Date().toISOString()}",
      "parameters_used": {
        "detailed": true,
        "region": "${region}",
        "time_range": "${timeRange}",
        ${timeRange === 'custom' ? `"custom_date_range": {
          "start": "${customStartDate}",
          "end": "${customEndDate}"
        },` : ''}
        "sentiment_threshold": ${sentimentThreshold},
        "include_sentiment_breakdown": true,
        "include_source_analysis": true
      }
    }
  },
  "demographic_support_base": {
    "Youth (18-35)": 65,
    "Middle-age (36-55)": 55,
    "Senior (56+)": 45,
    "Urban": 60,
    "Rural": 50,
    "Overall": 57
  },
  "analysis_metadata": {
    "generated_at": "${new Date().toISOString()}",
    "parameters_used": {
      "detailed": true,
      "region": "${region}",
      "time_range": "${timeRange}",
      ${timeRange === 'custom' ? `"custom_date_range": {
        "start": "${customStartDate}",
        "end": "${customEndDate}"
      },` : ''}
      "sentiment_threshold": ${sentimentThreshold},
      "include_sentiment_breakdown": ${includeSentimentBreakdown},
      "include_source_analysis": ${includeSourceAnalysis}
    }
  }
}`;

  // Additional instructions for the model
  const additionalInstructions = `
  CRITICAL INSTRUCTIONS FOR NEWS ITEMS GENERATION:

  1. NEWS ITEM QUANTITY (MUST FOLLOW REQUIRED QUANTITY EXACTLY):
     - positive: EXACTLY 10 items (sentiment_score > 0.3)
     - negative: EXACTLY 10 items (sentiment_score < -0.3)
     - neutral: EXACTLY 5 items (-0.3 <= sentiment_score <= 0.3)
     - TOTAL: 25 news items (10 + 10 + 5)
     - DO NOT include fewer items in any category

  2. NEWS ITEM STRUCTURE (EACH ITEM MUST HAVE ALL FIELDS):
     {
       "headline": "[5-12 word headline]",
       "source": "[Publication Name]",
       "date": "YYYY-MM-DD",
       "summary": "[15-40 word summary]",
       "sentiment_score": [number between -1 and 1],
       "key_phrases": ["phrase 1", "phrase 2"],
       "impact_analysis": "[Only for negative items, 1-2 sentences]",
       "resolution_suggestions": ["suggestion 1", "suggestion 2"]
     }

  3. DATA GENERATION RULES:
     - Generate ALL data based on the query and current context
     - Create realistic, diverse news items if real data is unavailable
     - Ensure headlines and summaries are unique and not repetitive
     - Use realistic publication names (e.g., 'The Hindu', 'Times of India')
     - Vary the dates within the last 30 days

  4. DATA VALIDATION:
     - All required fields must be present in every news item
     - Sentiment scores must match the category (positive > 0.3, negative < -0.3, neutral between -0.3 and 0.3)
     - Dates must be in YYYY-MM-DD format and within the last 30 days
     - Key phrases must be an array of 2-3 phrases

  5. RESPONSE FORMAT:
     - Must be valid JSON
     - No markdown code blocks or additional text outside JSON
     - Properly escape all quotes and special characters

  FAILURE TO FOLLOW THESE INSTRUCTIONS WILL RESULT IN AN INVALID RESPONSE
  
  `;

  try {
    console.log('Sending request to OpenAI with query:', query);
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          role: "system", 
          content: systemPrompt + additionalInstructions
        },
        { 
          role: "user", 
          content: `Analyze public opinion about: ${query}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response from OpenAI');
    }

    console.log('Raw response from OpenAI:', content);

    // Clean and parse the JSON response
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\n?|```$/g, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\n?|```$/g, '');
    }
    
    console.log('Cleaned content:', cleanedContent);
    
    try {
      const result = JSON.parse(cleanedContent);
      
      // Define all required top-level fields
      const requiredTopLevel = [
        'caste_distribution',
        'sentiment_analysis',
        'news',
        'leader_profile',
        'executive_summary',
        'region_wise_analysis',
        'platform_sentiment_comparison',
        'demographic_support_base',
        'analysis_metadata',
        'key_insights',
        'trends',
        'source_analysis',
        'key_strengths_weaknesses'
      ];
      
      // Check for missing required fields
      const missingTopLevel = requiredTopLevel.filter(field => {
        const exists = field in result;
        if (!exists) return true;
        
        // Additional validation for specific fields
        if (field === 'news') {
          return !result.news || typeof result.news !== 'object' || 
                 !result.news.positive || !result.news.negative || !result.news.neutral;
        }
        return false;
      });
      
      if (missingTopLevel.length > 0) {
        console.warn(`Warning: Missing top-level fields: ${missingTopLevel.join(', ')}`);
        // Add empty defaults for missing fields instead of throwing an error
        missingTopLevel.forEach(field => {
          if (field === 'leader_profile') {
            result.leader_profile = [];
          } else if (field === 'executive_summary') {
            result.executive_summary = '';
          }
        });
      }
      
      // Define required news categories and their minimum counts
      const requiredNewsCategories = {
        positive: { min: 10, ideal: 10 },
        negative: { min: 10, ideal: 10 },
        neutral: { min: 5, ideal: 5 }
      };

      // Track validation issues
      const validationIssues = [];
      let hasCriticalError = false;

      // Validate news categories
      for (const [category, counts] of Object.entries(requiredNewsCategories)) {
        if (!result.news || typeof result.news !== 'object') {
          validationIssues.push('News object is missing or invalid');
          hasCriticalError = true;
          break;
        }

        if (!Array.isArray(result.news[category])) {
          validationIssues.push(`'${category}' category is not an array`);
          hasCriticalError = true;
          continue;
        }
        
        // Check if we have the minimum required items
        const itemCount = result.news[category].length;
        if (itemCount < counts.min) {
          validationIssues.push(`Insufficient items in '${category}' category: found ${itemCount}, minimum ${counts.min} required`);
          // Only mark as critical if we have no items at all
          if (itemCount === 0) hasCriticalError = true;
        } else if (itemCount < counts.ideal) {
          validationIssues.push(`Warning: Only ${itemCount} items in '${category}' category (ideally ${counts.ideal})`);
        }
      }

      // If we have critical errors, throw an exception
      if (hasCriticalError) {
        throw new Error(`News validation failed:\n- ${validationIssues.join('\n- ')}`);
      } else if (validationIssues.length > 0) {
        console.warn('News validation warnings:', validationIssues);
      }
      
      // Define required fields for news items
      const requiredNewsItemFields = ['headline', 'source', 'date', 'summary', 'sentiment_score', 'key_phrases'];
      
      // Validate each news item
      for (const [category, items] of Object.entries(result.news)) {
        if (!Array.isArray(items)) continue;
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (typeof item !== 'object' || item === null) {
            console.warn(`Skipping invalid ${category} news item ${i + 1}: not an object`);
            continue;
          }
          
          // Check for missing required fields
          const missingFields = [];
          const fieldWarnings = [];
          
          requiredNewsItemFields.forEach(field => {
            const value = item[field];
            if (value === undefined || value === null || value === '') {
              missingFields.push(field);
            } else if (field === 'key_phrases' && (!Array.isArray(value) || value.length === 0)) {
              fieldWarnings.push(`${field} must be a non-empty array`);
            } else if (field === 'sentiment_score' && (typeof value !== 'number' || value < -1 || value > 1)) {
              fieldWarnings.push(`${field} must be a number between -1 and 1`);
            } else if (field === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              fieldWarnings.push(`${field} must be in YYYY-MM-DD format`);
            }
          });
          
          // Additional validation for negative sentiment items
          if (category === 'negative') {
            if (!item.impact_analysis) {
              fieldWarnings.push('missing impact_analysis');
            }
            if (!item.resolution_suggestions || !Array.isArray(item.resolution_suggestions) || item.resolution_suggestions.length === 0) {
              fieldWarnings.push('missing or invalid resolution_suggestions');
            }
          }
          
          // Log warnings for issues but don't fail the entire request
          if (missingFields.length > 0 || fieldWarnings.length > 0) {
            const warnings = [
              ...missingFields.map(f => `missing ${f}`),
              ...fieldWarnings
            ];
            console.warn(`Issues in ${category} news item ${i + 1}: ${warnings.join('; ')}`);
            
            // Add default values for missing required fields
            missingFields.forEach(field => {
              if (field === 'key_phrases') {
                item[field] = ['general'];
              } else if (field === 'sentiment_score') {
                item[field] = category === 'positive' ? 0.7 : category === 'negative' ? -0.7 : 0;
              } else if (field === 'date') {
                item[field] = new Date().toISOString().split('T')[0];
              } else {
                item[field] = `[${field} not provided]`;
              }
            });
          }
        }
      }

      console.log('Successfully parsed response');
      return result;
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Problematic content:', cleanedContent);
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in generateCasteAnalysis:', error);
    throw error;
  }
}

// API endpoint to get a saved report
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');
    const password = searchParams.get('password');
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }
    
    const report = await getReport(reportId, password);
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    if (report.error) {
      return NextResponse.json({ error: report.error }, { status: 403 });
    }
    
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { 
      query, 
      analysisType, 
      timeRange = '1m', 
      region = 'all', 
      detailed = false,
      includeNews = true,
      includeTrends = true,
      saveReport: shouldSave = false,
      password = null,
      // New parameters for detailed analysis
      sentimentThreshold = 0.6,
      includeSentimentBreakdown = true,
      includeSourceAnalysis = true,
      customStartDate = '',
      customEndDate = ''
    } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    // Generate analysis based on the requested type
    let result;
    
    if (analysisType === 'caste_analysis') {
      try {
        result = await generateCasteAnalysis(query, { 
          detailed, 
          region, 
          timeRange,
          sentimentThreshold,
          includeSentimentBreakdown,
          includeSourceAnalysis,
          customStartDate,
          customEndDate
        });
      } catch (error) {
        console.error('Error in caste analysis:', error);
        throw error;
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unsupported analysis type',
        supportedTypes: ['caste_analysis']
      }, { status: 400 });
    }
    
    // Add metadata with all parameters
    const reportData = {
      query,
      analysisType,
      timeRange,
      region,
      detailed,
      includeNews,
      includeTrends,
      sentimentThreshold,
      includeSentimentBreakdown,
      includeSourceAnalysis,
      customStartDate: timeRange === 'custom' ? customStartDate : undefined,
      customEndDate: timeRange === 'custom' ? customEndDate : undefined,
      timestamp: new Date().toISOString(),
      ...result
    };
    
    // Save report if requested
    if (shouldSave) {
      const reportId = await saveReport({
        ...reportData,
        password: password || null
      });
      
      return NextResponse.json({ 
        success: true, 
        reportId,
        isProtected: !!password,
        ...reportData
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      ...reportData 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    const errorResponse = {
      success: false,
      error: error.message || 'An error occurred while processing your request',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        ...(error.response && {
          response: {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          }
        })
      })
    };
    
    return NextResponse.json(errorResponse, { 
      status: error.status || 500 
    });
  }
}