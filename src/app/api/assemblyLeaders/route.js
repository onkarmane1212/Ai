// app/api/assembly-leaders/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 300;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = (name) => `
You are a civic data analyst specializing in political accountability in Andhra Pradesh.

Generate a structured JSON report that helps citizens understand their Assembly Constituency leadership and related issues. ${name ? `Focus on information related to ${name} and their political impact.` : ''}

Use the schema below:

{
  "assembly_leader_report": {
    "constituency": "[Name of Assembly Constituency]",
    "mla": {
      "name": "[Full Name of MLA]",
      "party": "[Political Party]",
      "term_start": "[YYYY-MM-DD]",
      "contact": {
        "mobile": "[Mobile Number]",
        "email": "[Email]",
        "office_address": "[Constituency Office Address]"
      }
    },
    "key_issues": [
      {
        "issue": "[Major issue in the constituency]",
        "sentiment": "positive/negative/neutral",
        "impact_level": "high/moderate/low",
        "public_opinion_summary": "[2-3 sentence summary of public sentiment]",
        "leader_response": "[What the MLA has done or said about this issue]",
        "suggested_interventions": [
          "[Actionable step 1]",
          "[Actionable step 2]"
        ]
      },
      ...
    ]
  }
}

Guidelines:
- Always include 5 key_issues per constituency.
- Use realistic names and parties from Andhra Pradesh (no fake parties).
- Suggested interventions must be concrete and feasible.
- Contact details should appear realistic.
- Ensure valid and complete JSON with no trailing commas or formatting issues.
`;

export async function POST(req) {
  console.log('Received request to assemblyLeaders API');
  
  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { query, name } = requestBody;
    
    if (!query && !name) {
      const error = 'Either query or name must be provided';
      console.error(error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    console.log(`Processing request for ${name || query}`);
    // Set default values for parameters
    const assembly_constituency = 'Guntur West';
    const region = 'Andhra Pradesh';
    const date_range = 'last 6 months';

    const userPrompt = `
Generate a public leadership report for the Assembly Constituency: ${assembly_constituency}, located in ${region}, covering key public issues over the ${date_range}.
Return ONLY the JSON output as per the schema above.
`;

    const searchQuery = name ? `Name: ${name}${query ? `\nAdditional context: ${query}` : ''}` : query;
    
    // Call OpenAI API
    console.log('Calling OpenAI API...');
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt(name) },
          { role: "user", content: `Generate a report for: ${searchQuery}` },
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
      console.log('OpenAI API call successful');
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json(
        { 
          error: 'Error calling OpenAI API',
          details: openaiError.message 
        },
        { status: 502 }
      );
    }

    if (!completion.choices?.[0]?.message?.content) {
      console.error('Invalid response format from OpenAI:', JSON.stringify(completion, null, 2));
      return NextResponse.json(
        { error: 'Invalid response format from OpenAI API' },
        { status: 502 }
      );
    }
    
    const rawContent = completion.choices[0].message.content;
    console.log('Raw OpenAI response content:', rawContent.substring(0, 200) + '...');
    
    if (!rawContent) {
      console.error('Empty response content from OpenAI');
      return NextResponse.json(
        { error: 'Empty response from OpenAI API' },
        { status: 502 }
      );
    }

    // Attempt to extract and parse JSON from the OpenAI response
    console.log('Attempting to parse JSON from response...');
    let parsed;
    try {
      // First try to parse the entire content as JSON
      try {
        parsed = JSON.parse(rawContent);
      } catch (e) {
        // If that fails, try to extract JSON from code blocks
        const jsonMatch = rawContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          // If no code blocks, try to find JSON object/array in the text
          const objectMatch = rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (objectMatch) {
            parsed = JSON.parse(objectMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
      }
      
      console.log('Successfully parsed JSON response');
      return NextResponse.json(parsed, { status: 200 });
      
    } catch (parseError) {
      console.error('Error parsing JSON from OpenAI response:', parseError);
      console.error('Raw content that failed to parse:', rawContent);
      
      return NextResponse.json(
        { 
          error: 'Failed to parse response from OpenAI',
          details: parseError.message,
          rawContent: rawContent.substring(0, 500) + (rawContent.length > 500 ? '...' : '')
        },
        { status: 502 }
      );
    }

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong', details: err.message }, { status: 500 });
  }
}
