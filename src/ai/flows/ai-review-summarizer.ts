'use server';
/**
 * @fileOverview An AI assistant that summarizes product reviews.
 *
 * - generateReviewSummary - A function that generates a product review summary.
 * - AIReviewSummarizerInput - The input type for the generateReviewSummary function.
 * - AIReviewSummarizerOutput - The return type for the generateReviewSummary function.
 */

import {ai} from '@/ai/genkit';
import {
  AIReviewSummarizerInputSchema,
  type AIReviewSummarizerInput,
  AIReviewSummarizerOutputSchema,
  type AIReviewSummarizerOutput,
} from '@/ai/schemas';

export async function generateReviewSummary(
  input: AIReviewSummarizerInput
): Promise<AIReviewSummarizerOutput> {
  return aiReviewSummarizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiReviewSummarizerPrompt',
  input: {schema: AIReviewSummarizerInputSchema},
  output: {schema: AIReviewSummarizerOutputSchema},
  prompt: `You are a product analyst. Based on the following reviews for the product "{{productName}}", provide a concise summary (2-3 sentences) of customer feedback and determine the overall sentiment.

Reviews:
{{#each reviews}}
- Rating: {{rating}}/5. Comment: {{comment}}
{{/each}}

Analyze the comments and ratings to identify common praises and complaints. Your summary should be balanced and reflect the general consensus. The sentiment should be 'Positive', 'Neutral', or 'Negative'.`,
});

const aiReviewSummarizerFlow = ai.defineFlow(
  {
    name: 'aiReviewSummarizerFlow',
    inputSchema: AIReviewSummarizerInputSchema,
    outputSchema: AIReviewSummarizerOutputSchema,
  },
  async input => {
    // To keep costs low, we'll only summarize the first 20 reviews.
    const reviewsToSummarize = input.reviews.slice(0, 20);
    const {output} = await prompt({...input, reviews: reviewsToSummarize});
    return output!;
  }
);
