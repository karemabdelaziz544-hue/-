
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTasksFromDoctorNotes = async (notes: string, startDate: string, endDate: string): Promise<any[]> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing. Returning mock data.");
    return [];
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a medical dietary assistant. 
      Create a daily plan for a patient based on the Doctor's Notes: "${notes}".
      
      The plan must cover the period from ${startDate} to ${endDate}.
      For EACH day in this range, generate 3-5 specific tasks (meals/activities).
      Variate the meals slightly if appropriate for the diet.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "The specific date in YYYY-MM-DD format" },
              title: { type: Type.STRING, description: "Short title e.g. Breakfast" },
              description: { type: Type.STRING, description: "Detailed instruction" },
              type: { type: Type.STRING, enum: ["MEAL", "ACTIVITY"] },
              time: { type: Type.STRING, description: "Suggested time e.g. 08:00 AM" }
            },
            required: ["date", "title", "description", "type", "time"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return [];

  } catch (error) {
    console.error("Error generating tasks with Gemini:", error);
    return [];
  }
};
