import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

function cleanMarkdown(text: string): string {
  // Remove markdown headers
  text = text.replace(/^#+\s*/gm, '');
  
  // Convert bullet points to regular text
  text = text.replace(/^\*\s*/gm, '• ');
  
  // Remove bold formatting
  text = text.replace(/\*\*/g, '');
  
  // Remove extra newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

export async function summarizeText(text: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Summarize the following text in a concise manner, using plain text format without markdown and give the summary in points:

${text}

Summary:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let summary = response.text();

    // Clean up any remaining markdown
    summary = cleanMarkdown(summary);

    return summary || 'Unable to generate summary.';
  } catch (error) {
    console.error('Error in text summarization:', error);
    throw new Error('An error occurred during text summarization');
  }
}