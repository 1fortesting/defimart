'use server';
/**
 * @fileOverview An AI assistant that generates relevant search tags for products.
 *
 * - generateProductTags - A function that generates product tags.
 * - AIProductTagsInput - The input type for the generateProductTags function.
 * - AIProductTagsOutput - The return type for the generateProductTags function.
 */

import {ai} from '@/ai/genkit';
import {
  AIProductTagsInputSchema,
  type AIProductTagsInput,
  AIProductTagsOutputSchema,
  type AIProductTagsOutput,
} from '@/ai/schemas';

export async function generateProductTags(input: AIProductTagsInput): Promise<AIProductTagsOutput> {
  return aiProductTagGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProductTagGeneratorPrompt',
  input: {schema: AIProductTagsInputSchema},
  output: {schema: AIProductTagsOutputSchema},
  prompt: `You are an expert in e-commerce search optimization. Your task is to generate a list of relevant search tags for a product based on its details. These tags should include synonyms, related concepts, use cases, and common misspellings to improve searchability.

For example, if a product is "Running Sneakers", tags could include "running shoes", "athletic footwear", "jogging", "sports shoes", "trainers", "gym shoes".
If a product is "Leather Boots", tags could include "footwear", "shoes", "leather boots", "winter wear", "fashion", "ankle boots".

Generate a list of 5-10 relevant lowercase tags for the following product:

Product Name: {{{productName}}}
Category: {{{category}}}
Description: {{{description}}}

Return only the list of tags.
`,
});

const aiProductTagGeneratorFlow = ai.defineFlow(
  {
    name: 'aiProductTagGeneratorFlow',
    inputSchema: AIProductTagsInputSchema,
    outputSchema: AIProductTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
