'use server';
/**
 * @fileOverview An AI assistant that recommends products based on user history.
 *
 * - recommendProducts - A function that generates product recommendations.
 * - AIProductRecommenderInput - The input type for the recommendProducts function.
 * - AIProductRecommenderOutput - The return type for the recommendProducts function.
 */

import {ai} from '@/ai/genkit';
import {
  AIProductRecommenderInputSchema,
  type AIProductRecommenderInput,
  AIProductRecommenderOutputSchema,
  type AIProductRecommenderOutput,
} from '@/ai/schemas';

export async function recommendProducts(
  input: AIProductRecommenderInput
): Promise<AIProductRecommenderOutput> {
  return aiProductRecommenderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProductRecommenderPrompt',
  input: {schema: AIProductRecommenderInputSchema},
  output: {schema: AIProductRecommenderOutputSchema},
  prompt: `You are an expert e-commerce recommendation engine. Your task is to recommend 5 products to a user based on their interaction history.

Analyze the user's history of interacted products (saved, reviewed, or purchased). Do not recommend products that are already in their history.

From the list of all available products, select 5 that are similar in category, complementary, or would likely be of interest to this user. Return a JSON object with a single key "recommendations" containing an array of 5 product IDs.

### User Interaction History:
{{#if userHistory}}
  {{#each userHistory}}
  - {{this.name}} (Category: {{this.category}})
  {{/each}}
{{else}}
  The user has no interaction history.
{{/if}}

### All Available Products to Choose From:
{{#each allProducts}}
- ID: {{this.id}}, Name: {{this.name}}, Category: {{this.category}}
{{/each}}
`,
});

const aiProductRecommenderFlow = ai.defineFlow(
  {
    name: 'aiProductRecommenderFlow',
    inputSchema: AIProductRecommenderInputSchema,
    outputSchema: AIProductRecommenderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
