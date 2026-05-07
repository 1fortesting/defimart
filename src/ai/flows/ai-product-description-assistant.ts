'use server';
/**
 * @fileOverview An AI assistant that generates compelling product descriptions using Groq.
 *
 * - generateProductDescription - A function that handles the generation process.
 * - AIProductDescriptionAssistantInput - The input type for the flow.
 * - AIProductDescriptionAssistantOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {
  AIProductDescriptionAssistantInputSchema,
  type AIProductDescriptionAssistantInput,
  AIProductDescriptionAssistantOutputSchema,
  type AIProductDescriptionAssistantOutput,
} from '@/ai/schemas';

export async function generateProductDescription(
  input: AIProductDescriptionAssistantInput
): Promise<AIProductDescriptionAssistantOutput> {
  return aiProductDescriptionAssistantFlow(input);
}

const aiProductDescriptionAssistantFlow = ai.defineFlow(
  {
    name: 'aiProductDescriptionAssistantFlow',
    inputSchema: AIProductDescriptionAssistantInputSchema,
    outputSchema: AIProductDescriptionAssistantOutputSchema,
  },
  async input => {
    const systemPrompt = `You are an expert marketing copywriter specializing in creating compelling product descriptions for a student-centric e-commerce platform called DEFIMART. 
    Your goal is to write an attractive product description that highlights benefits and features, encouraging university students to buy.`;

    const userPrompt = `Product Name: ${input.productName}
    Category: ${input.category}
    ${input.price ? `Price: ${input.price}` : ''}
    ${input.shortDescription ? `Current Details: ${input.shortDescription}` : ''}
    ${input.keywords ? `Keywords: ${input.keywords.join(', ')}` : ''}

    Task: Craft a detailed product description (at least 80 words) that is engaging, informative, and persuasive. Focus on creating value for students. 
    
    CRITICAL: You must end the description with exactly this string: " (AI Enhanced)"`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Groq API error');
      }

      const data = await response.json();
      const description = data.choices[0]?.message?.content?.trim();

      if (!description) {
        throw new Error('No description returned from Groq');
      }

      return { description };
    } catch (error) {
      console.error('Groq AI Flow Error:', error);
      throw new Error('Failed to generate description with Groq AI');
    }
  }
);
