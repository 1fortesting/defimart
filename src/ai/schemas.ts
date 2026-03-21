import { z } from 'genkit';

// Schemas from ai-product-description-assistant.ts
export const AIProductDescriptionAssistantInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product (e.g., electronics, apparel, books).'),
  price: z.string().describe('The price of the product, including currency.'),
  shortDescription: z.string().describe('A brief summary or key features of the product.'),
  keywords: z.array(z.string()).describe('A list of keywords related to the product, separated by commas.'),
});
export type AIProductDescriptionAssistantInput = z.infer<typeof AIProductDescriptionAssistantInputSchema>;

export const AIProductDescriptionAssistantOutputSchema = z.object({
  description: z.string().describe('A compelling and detailed product description.'),
});
export type AIProductDescriptionAssistantOutput = z.infer<typeof AIProductDescriptionAssistantOutputSchema>;


// Schemas from ai-product-tag-generator.ts
export const AIProductTagsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  description: z.string().describe('The description of the product.'),
  category: z.string().optional().describe('The category of the product.'),
});
export type AIProductTagsInput = z.infer<typeof AIProductTagsInputSchema>;

export const AIProductTagsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe(
      'A list of relevant search tags, synonyms, and related terms for the product. Should be in lowercase.'
    ),
});
export type AIProductTagsOutput = z.infer<typeof AIProductTagsOutputSchema>;
