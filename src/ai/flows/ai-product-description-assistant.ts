'use server';
/**
 * @fileOverview An AI assistant that generates compelling product descriptions.
 *
 * - generateProductDescription - A function that generates a product description.
 * - AIProductDescriptionAssistantInput - The input type for the generateProductDescription function.
 * - AIProductDescriptionAssistantOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIProductDescriptionAssistantInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product (e.g., electronics, apparel, books).'),
  price: z.string().describe('The price of the product, including currency.'),
  shortDescription: z.string().describe('A brief summary or key features of the product.'),
  keywords: z.array(z.string()).describe('A list of keywords related to the product, separated by commas.'),
});
export type AIProductDescriptionAssistantInput = z.infer<typeof AIProductDescriptionAssistantInputSchema>;

const AIProductDescriptionAssistantOutputSchema = z.object({
  description: z.string().describe('A compelling and detailed product description.'),
});
export type AIProductDescriptionAssistantOutput = z.infer<typeof AIProductDescriptionAssistantOutputSchema>;

export async function generateProductDescription(
  input: AIProductDescriptionAssistantInput
): Promise<AIProductDescriptionAssistantOutput> {
  return aiProductDescriptionAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProductDescriptionAssistantPrompt',
  input: {schema: AIProductDescriptionAssistantInputSchema},
  output: {schema: AIProductDescriptionAssistantOutputSchema},
  prompt: `You are an expert marketing copywriter specializing in creating compelling product descriptions for e-commerce. Your goal is to write an attractive product description that highlights the product's benefits and features, encouraging potential buyers.

Use the following information to craft the description:

Product Name: {{{productName}}}
Category: {{{category}}}
Price: {{{price}}}
Short Description/Key Features: {{{shortDescription}}}
Keywords: {{{#each keywords}}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}}

Craft a detailed product description that is engaging, informative, and persuasive. Focus on creating value and addressing potential customer needs. The description should be at least 150 words but no more than 300 words.
`,
});

const aiProductDescriptionAssistantFlow = ai.defineFlow(
  {
    name: 'aiProductDescriptionAssistantFlow',
    inputSchema: AIProductDescriptionAssistantInputSchema,
    outputSchema: AIProductDescriptionAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
