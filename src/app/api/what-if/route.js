// import { OpenAI } from 'openai';
// import { validateEnv } from '@/lib/env';

// // Validate environment variables on startup
// validateEnv();

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// export async function POST(request) {
//   try {
//     const { question, mode } = await request.json();
    
//     if (!question) {
//       return new Response(JSON.stringify({ error: 'Question is required' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const isFantastical = mode === 'fantastical';
    
//     const systemMessage = isFantastical 
//       ? `You are a creative assistant. When the user asks a 'What if' question, respond with 2-3 imaginative and creative scenarios exploring that question. Each scenario should be unique and explore different possibilities. Format your response with clear numbering.`
//       : `You are a logical and analytical assistant. When the user asks a 'What if' question, respond with 2-3 realistic and fact-based scenarios exploring that question. Base your response on scientific knowledge and logical reasoning. Format your response with clear numbering.`;

//     const messages = [
//       { role: 'system', content: systemMessage },
//       { role: 'user', content: question }
//     ];

//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4',
//       messages,
//       temperature: isFantastical ? 0.9 : 0.7,
//       max_tokens: 1000,
//     });

//     const response = completion.choices[0]?.message?.content || 'No response generated';
    
//     return new Response(JSON.stringify({ response }), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });
    
//   } catch (error) {
//     console.error('Error:', error);
//     return new Response(JSON.stringify({ error: 'Internal server error' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// }

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Interaction from '../../../models/Interaction';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const question = (body?.question || '').trim();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    await dbConnect();

    // Prompts
    const prompts = {
      fantastical: `You are a creative assistant. When the user asks a 'What if' question, respond with 2-3 imaginative and creative scenarios exploring that question. Each scenario should be unique and explore different possibilities. Format your response with clear numbering.`,
      logical: `You are a logical and analytical assistant. When the user asks a 'What if' question, respond with 2-3 realistic and fact-based scenarios exploring that question. Base your response on scientific knowledge and logical reasoning. Format your response with clear numbering.`,
    };

    // Generate both responses
    const responses = [];
    for (const [mode, systemMessage] of Object.entries(prompts)) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // or gpt-4
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: question },
        ],
        temperature: mode === 'fantastical' ? 0.9 : 0.7,
        max_tokens: 800,
      });

      responses.push({
        mode,
        content: completion.choices[0]?.message?.content || 'No response generated',
      });
    }

    // Metadata
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Save to DB
    const interaction = await Interaction.create({
      question,
      responses,
      ip: Array.isArray(ip) ? ip[0] : ip,
      userAgent,
    });

    return NextResponse.json(
      { question: interaction.question, responses: interaction.responses },
      { status: 200 }
    );
  } catch (err) {
    console.error('POST /api/what-if error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
