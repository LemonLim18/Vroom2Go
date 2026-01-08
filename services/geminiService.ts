
import { GoogleGenAI } from "@google/genai";

// Initialization and model usage following @google/genai guidelines.

export const generateMechanicAdvice = async (userQuery: string, context?: string): Promise<string> => {
  try {
    // ALWAYS use new GoogleGenAI({apiKey: process.env.API_KEY}) directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // For Complex Text Tasks, 'gemini-3-pro-preview' is recommended.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a helpful, expert mechanic assistant on the Vroom2 Go platform. 
      The user is asking a question about vehicle maintenance or repair.
      Context: ${context || 'General automotive inquiry'}
      
      User Question: ${userQuery}
      
      Provide a concise, professional, and safety-conscious answer. 
      If the issue sounds dangerous, advise them to visit a shop immediately.
      Format the response in plain text with clear paragraphs.`,
    });

    // Access the .text property directly.
    return response.text || "I'm sorry, I couldn't generate advice at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Assistant is currently offline. Please try again later.";
  }
};

export const analyzeSymptomImage = async (base64Image: string, description: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Using 'gemini-2.5-flash-image' for visual tasks.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        text: `Analyze this vehicle image regarding the user's description: "${description}". 
                        Identify visible damage or potential issues. Provide a preliminary assessment for a mechanic quote.`
                    }
                ]
            }
        });

        return response.text || "Could not analyze the image.";
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return "Visual analysis unavailable.";
    }
};
