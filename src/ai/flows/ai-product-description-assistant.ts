'use server';
/**
 * @fileOverview An AI assistant that generates compelling product descriptions using Genkit and Gemini.
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

const prompt = ai.definePrompt({
  name: 'aiProductDescriptionAssistantPrompt',
  input: {schema: AIProductDescriptionAssistantInputSchema},
  output: {schema: AIProductDescriptionAssistantOutputSchema},
  prompt: `You are an expert marketing copywriter specializing in creating compelling product descriptions for a student-centric e-commerce platform called DEFIMART. 
Your goal is to write an attractive product description that highlights benefits and features, encouraging university students to buy.

Use the following information to craft the description:
Product Name: {{{productName}}}
Category: {{{category}}}
{{#if price}}Price: {{{price}}}{{/if}}
{{#if shortDescription}}Current Details: {{{shortDescription}}}{{/if}}
{{#if keywords}}Keywords: {{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

Task: Craft a detailed product description (at least 80 words) that is engaging, informative, and persuasive. Focus on creating value for students. 

CRITICAL: You must end the description with exactly this string: " (AI Enhanced)"`,
});

const aiProductDescriptionAssistantFlow = ai.defineFlow(
  {
    name: 'aiProductDescriptionAssistantFlow',
    inputSchema: AIProductDescriptionAssistantInputSchema,
    outputSchema: AIProductDescriptionAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    if (!output) {
      throw new Error('No description returned from AI');
    }

    return output;
  }
);
