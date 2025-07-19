// app/api/search/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';


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
  
  IMPORTANT: Your response MUST include the following sections:
  1. leader_profile: An array of 3-5 key leaders/influencers related to the topic, each with:
     - name: Full name
     - position: Current position/role
     - influence_score: Number from 1-100 indicating their influence
     - sentiment: 'positive', 'negative', or 'neutral' based on public perception
     - key_quotes: 2-3 notable quotes from the leader about the topic
     - recent_activities: 2-3 recent actions or statements related to the topic
     
  2. executive_summary: A 3-4 paragraph summary including:
     - Key findings and insights from the analysis
     - Major trends and patterns in public opinion
     - Potential implications for different stakeholders
     - Strategic recommendations based on the findings

  Analysis Parameters:
  - Sentiment Threshold: ${sentimentThreshold} (higher values indicate stronger sentiment required for classification)
  - Detailed Sentiment Breakdown: Enabled
  - Source Analysis: Enabled
  - Detail Level: Detailed
  
  News Article Requirements:
  - Include at least 20 recent news items minimum 10 and 30
  - Each news item MUST include:
    - headline: A clear, concise headline
    - source: The news publication name
    - date: In YYYY-MM-DD format (must be within the last month)
    - summary: A 1-2 sentence summary of the article
    - sentiment_score: A number between -1 (very negative) and 1 (very positive)
    - key_phrases: 2-3 key phrases that capture the main topics
  - For negative sentiment articles, also include:
    - impact_analysis: 1-2 sentences on potential consequences
    - resolution_suggestions: 2-3 actionable suggestions to address the issue
  - Ensure news items are diverse and cover different aspects of the topic
  - All news items must be realistic and relevant to the query
  
  IMPORTANT: Your response MUST be a valid JSON object with the following exact structure. Do not include any markdown formatting or additional text outside the JSON object.
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
  INSTRUCTIONS:
  1.all data must be required to be generated by the model
  2.Generate realistic data based on the query and current context
  3.Ensure all percentages add up to 100% within each sentiment category
  4. You MUST include EXACTLY 20 news items in EACH sentiment category: 
   - "positive": 10 items
   - "negative": 10 items
   - "neutral": 5 items
   This means the total number of news items should be 25.

5. Do NOT include fewer than 20 in any category. DO NOT include only 3, 5, or 10 items — that will be considered an incomplete response.

6. If there is not enough real data, simulate realistic, diverse, and relevant data that matches the topic and sentiment category.

7. Be very careful to match the required news item structure for each item (headline, source, date, summary, sentiment_score, key_phrases, etc.)

8. Format all dates as 'YYYY-MM-DD'

9. Ensure the response is valid JSON with proper escaping of quotes

10. Do not include any markdown code blocks or additional text outside the JSON

11. News items should be diverse and cover different aspects of the topic

12. Ensure all news items are realistic and relevant to the query
  13. You MUST generate ALL data - do not use placeholders or example data
14. IMPORTANT: The news object must contain total 20 items in sentiment category (positive, negative, neutral)
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
      
      // Validate the response structure
      const requiredTopLevel = ['caste_distribution', 'sentiment_analysis', 'news', 'leader_profile', 'executive_summary', 'region_wise_analysis', 'platform_sentiment_comparison', 'demographic_support_base', 'analysis_metadata', 'key_strengths_weaknesses', 'key_findings', 'recommendations', 'sentiment_breakdown', 'overall_sentiment', 'sentiment_by_caste', 'sentiment_by_region', 'sentiment_by_platform', 'sentiment_by_demographic', 'sentiment_by_time', 'sentiment_by_caste_region', 'sentiment_by_caste_platform', 'sentiment_by_caste_demographic', 'sentiment_by_caste_time', 'sentiment_by_region_platform', 'sentiment_by_region_demographic', 'sentiment_by_region_time', 'sentiment_by_platform_demographic', 'sentiment_by_platform_time', 'sentiment_by_demographic_time', 'sentiment_by_caste_region_platform', 'sentiment_by_caste_region_demographic', 'sentiment_by_caste_region_time', 'sentiment_by_caste_platform_demographic', 'sentiment_by_caste_platform_time', 'sentiment_by_caste_demographic_time', 'sentiment_by_region_platform_demographic', 'sentiment_by_region_platform_time', 'sentiment_by_region_demographic_time', 'sentiment_by_platform_demographic_time', 'sentiment_by_caste_region_platform_demographic', 'sentiment_by_caste_region_platform_time', 'sentiment_by_caste_region_demographic_time', 'sentiment_by_caste_platform_demographic_time', 'sentiment_by_region_platform_demographic_time', 'sentiment_by_caste_region_platform_demographic_time'];
      const missingTopLevel = requiredTopLevel.filter(field => !result[field]);
      
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
      
      // Validate news structure
      const requiredNewsFields = ['positive', 'negative', 'neutral'];
      const missingNewsCategories = requiredNewsFields.filter(cat => !result.news[cat]);
      
      if (missingNewsCategories.length > 0) {
        throw new Error(`Invalid news format: missing categories - ${missingNewsCategories.join(', ')}`);
      }
      
      // Validate each news item has required fields
      const requiredNewsItemFields = ['headline', 'source', 'date', 'summary', 'sentiment_score', 'key_phrases'];
      
      for (const category of requiredNewsFields) {
        if (!Array.isArray(result.news[category])) {
          throw new Error(`Invalid news format: ${category} is not an array`);
        }
        
        if (result.news[category].length < 10) {
          console.warn(`Warning: Only ${result.news[category].length} items in ${category} category (minimum 10 required)`);
        }
        
        for (const item of result.news[category]) {
          const missingFields = requiredNewsItemFields.filter(field => item[field] === undefined);
          if (missingFields.length > 0) {
            console.warn(`Warning: Missing fields in ${category} news item: ${missingFields.join(', ')}`);
          }
          
          // Validate date format (YYYY-MM-DD)
          if (item.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
            console.warn(`Warning: Invalid date format in ${category} news item: ${item.date}`);
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