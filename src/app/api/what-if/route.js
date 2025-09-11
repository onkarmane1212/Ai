import { OpenAI } from 'openai';
import { validateEnv } from '@/lib/env';

// Validate environment variables on startup
validateEnv();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { question, mode } = await request.json();
    
    if (!question) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isFantastical = mode === 'fantastical';
    
    const systemMessage = isFantastical 
      ? `You are a creative assistant. When the user asks a 'What if' question, respond with 2-3 imaginative and creative scenarios exploring that question. Each scenario should be unique and explore different possibilities. Format your response with clear numbering.`
      : `You are a logical and analytical assistant. When the user asks a 'What if' question, respond with 2-3 realistic and fact-based scenarios exploring that question. Base your response on scientific knowledge and logical reasoning. Format your response with clear numbering.`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: question }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: isFantastical ? 0.9 : 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';
    
    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
