'use server'

import { generateValuesPromptTemplate } from './prompts/generate-values-prompt';

export async function getPromptTemplate(): Promise<string> {
  return generateValuesPromptTemplate;
}