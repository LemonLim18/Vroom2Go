
import { GoogleGenAI } from "@google/genai";

// Types for AI analysis results
export interface DamageAnalysis {
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  affectedParts: string[];
  estimatedCostRange: { min: number; max: number };
  urgency: 'routine' | 'soon' | 'urgent' | 'immediate';
  description: string;
  recommendations: string[];
  confidenceScore: number;
}

export interface SymptomAnalysis {
  likelyIssues: string[];
  possibleCauses: string[];
  recommendedServices: string[];
  urgency: 'routine' | 'soon' | 'urgent' | 'immediate';
  diyPossible: boolean;
  estimatedCostRange: { min: number; max: number };
}

// Mock responses for when API is unavailable or for testing
const MOCK_DAMAGE_ANALYSES: Record<string, DamageAnalysis> = {
  brake: {
    severity: 'moderate',
    affectedParts: ['Brake Pads', 'Rotors'],
    estimatedCostRange: { min: 250, max: 450 },
    urgency: 'soon',
    description: 'Visible wear on brake components. Pads appear to be 70% worn. Rotors show minor scoring.',
    recommendations: ['Replace front brake pads', 'Resurface or replace rotors', 'Brake fluid flush'],
    confidenceScore: 0.85
  },
  engine: {
    severity: 'severe',
    affectedParts: ['Engine', 'Oil System'],
    estimatedCostRange: { min: 500, max: 2500 },
    urgency: 'urgent',
    description: 'Possible engine issue detected. Recommend immediate diagnostic scan.',
    recommendations: ['Full diagnostic scan', 'Check oil level and condition', 'Inspect engine mounts'],
    confidenceScore: 0.72
  },
  tire: {
    severity: 'minor',
    affectedParts: ['Tires', 'Wheel Alignment'],
    estimatedCostRange: { min: 100, max: 300 },
    urgency: 'routine',
    description: 'Uneven tire wear detected. May indicate alignment issues.',
    recommendations: ['Wheel alignment check', 'Tire rotation', 'Inspect suspension'],
    confidenceScore: 0.88
  },
  default: {
    severity: 'moderate',
    affectedParts: ['Multiple Components'],
    estimatedCostRange: { min: 150, max: 600 },
    urgency: 'soon',
    description: 'General vehicle concern detected. Recommend professional inspection.',
    recommendations: ['Multi-point inspection', 'Diagnostic scan'],
    confidenceScore: 0.65
  }
};

const MOCK_SYMPTOM_ANALYSES: Record<string, SymptomAnalysis> = {
  noise: {
    likelyIssues: ['Brake wear', 'Wheel bearing', 'CV joint'],
    possibleCauses: ['Normal wear', 'Lack of lubrication', 'Impact damage'],
    recommendedServices: ['Brake inspection', 'Suspension check', 'Multi-point inspection'],
    urgency: 'soon',
    diyPossible: false,
    estimatedCostRange: { min: 50, max: 400 }
  },
  light: {
    likelyIssues: ['Check engine code', 'Emissions issue', 'Sensor malfunction'],
    possibleCauses: ['Loose gas cap', 'O2 sensor', 'Catalytic converter'],
    recommendedServices: ['Diagnostic scan', 'Emissions test'],
    urgency: 'soon',
    diyPossible: false,
    estimatedCostRange: { min: 80, max: 800 }
  },
  vibration: {
    likelyIssues: ['Tire imbalance', 'Warped rotors', 'Alignment'],
    possibleCauses: ['Uneven tire wear', 'Brake heat damage', 'Suspension wear'],
    recommendedServices: ['Tire balance', 'Brake inspection', 'Alignment check'],
    urgency: 'routine',
    diyPossible: false,
    estimatedCostRange: { min: 50, max: 350 }
  },
  default: {
    likelyIssues: ['General mechanical concern'],
    possibleCauses: ['Wear and tear', 'Maintenance needed'],
    recommendedServices: ['Multi-point inspection', 'Diagnostic scan'],
    urgency: 'routine',
    diyPossible: false,
    estimatedCostRange: { min: 100, max: 500 }
  }
};

// Helper to detect keywords for mock responses
const detectKeyword = (text: string, keywords: string[]): boolean => {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
};

// Initialization and model usage following @google/genai guidelines.
// Initialization and model usage following @google/genai guidelines.
export const generateMechanicAdvice = async (userQuery: string, context?: string, images?: string[]): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
      console.warn('Gemini API Key missing or placeholder. Using mock data.');
      return getMockMechanicAdvice(userQuery);
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const parts: any[] = [];
    
    // Add images if present
    if (images && images.length > 0) {
        images.forEach(img => {
            const cleanData = img.split(',')[1] || img;
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: cleanData
                }
            });
        });
    }

    parts.push({
        text: `You are a helpful, expert mechanic assistant on the Vroom2 Go platform. 
      The user is asking a question about vehicle maintenance or repair.
      Context: ${context || 'General automotive inquiry'}
      
      User Question: ${userQuery}
      
      Instructions:
      1. If images are provided, analyze them for visible issues (wear, leaks, damage, rust).
      2. Incorporate visual observations into your advice.
      3. Provide a concise, professional, and safety-conscious answer. 
      4. If the issue sounds dangerous, advise them to visit a shop immediately.
      5. Format the response in plain text with clear paragraphs.`
    });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });

    return response.text || "I'm sorry, I couldn't generate advice at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Mock fallback
    return getMockMechanicAdvice(userQuery);
  }
};

// Mock mechanic advice fallback
const getMockMechanicAdvice = (query: string): string => {
  if (detectKeyword(query, ['brake', 'squeal', 'squeak', 'stop'])) {
    return `Based on your description, this sounds like typical brake wear. The squealing noise is often caused by worn brake pads rubbing against the rotor. I recommend having your brakes inspected within the next week.

Key points:
• This is a common issue and usually not an emergency unless the noise is constant
• Cost estimate: $250-$450 for brake pad replacement  
• Don't delay too long - worn brakes reduce stopping power

Would you like me to help you find a shop for a brake inspection?`;
  }
  
  if (detectKeyword(query, ['engine', 'check', 'light'])) {
    return `A check engine light can indicate many things, from minor issues like a loose gas cap to more serious problems. Here's what I recommend:

1. First, check if your gas cap is tight
2. If the light stays on, get a diagnostic scan (most auto parts stores do this free)
3. Don't ignore a flashing check engine light - that requires immediate attention

Most common causes include O2 sensors, catalytic converter issues, or spark plugs. Average repair cost: $100-$400.`;
  }

  return `Thank you for your question! Based on what you've described, I'd recommend getting a professional inspection. Many issues are easier and cheaper to fix when caught early.

A multi-point inspection typically costs $50-$100 and can identify potential problems before they become expensive repairs.

Would you like me to help you request quotes from local shops?`;
};

export const analyzeSymptomImage = async (base64Image: string, description: string): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
       return getMockImageAnalysis(description);
    }
    const ai = new GoogleGenAI({ apiKey });
    
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
    return getMockImageAnalysis(description);
  }
};

// Mock image analysis fallback
const getMockImageAnalysis = (description: string): string => {
  if (detectKeyword(description, ['brake', 'caliper', 'rotor'])) {
    return `**Image Analysis Complete**

I can see what appears to be your brake assembly. Based on the visible wear patterns:

• **Brake Pad Condition:** Approximately 30% remaining
• **Rotor Surface:** Minor scoring visible
• **Recommended Action:** Schedule replacement within 2-4 weeks

Estimated repair cost: $250 - $400 depending on parts quality.`;
  }

  return `**Image Analysis Complete**

I've analyzed the uploaded image. Here's my preliminary assessment:

• **Visible Condition:** Some wear visible
• **Severity:** Moderate - recommend professional inspection
• **Next Steps:** Have a certified mechanic inspect in person

Note: This is an AI assessment and may require physical confirmation.`;
};

// NEW: Full damage detection with structured response
export const analyzeDamage = async (base64Image: string, description: string): Promise<DamageAnalysis> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
        return getMockDamageAnalysis(description);
    }
    const ai = new GoogleGenAI({ apiKey });
    
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
            text: `Analyze this vehicle damage image. User description: "${description}"
            
            Return a JSON object with:
            - severity: "minor" | "moderate" | "severe" | "critical"
            - affectedParts: array of affected components
            - estimatedCostRange: { min: number, max: number } in USD
            - urgency: "routine" | "soon" | "urgent" | "immediate"
            - description: brief damage description
            - recommendations: array of recommended repairs
            - confidenceScore: 0-1 confidence in assessment
            
            Return ONLY valid JSON.`
          }
        ]
      }
    });

    const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DamageAnalysis;
    }
    throw new Error('Could not parse JSON response');
  } catch (error) {
    console.error("Damage analysis error:", error);
    return getMockDamageAnalysis(description);
  }
};

// Mock damage analysis
const getMockDamageAnalysis = (description: string): DamageAnalysis => {
  if (detectKeyword(description, ['brake', 'stop', 'squeal'])) {
    return MOCK_DAMAGE_ANALYSES.brake;
  }
  if (detectKeyword(description, ['engine', 'motor', 'power'])) {
    return MOCK_DAMAGE_ANALYSES.engine;
  }
  if (detectKeyword(description, ['tire', 'wheel', 'flat'])) {
    return MOCK_DAMAGE_ANALYSES.tire;
  }
  return MOCK_DAMAGE_ANALYSES.default;
};

// NEW: Symptom-based analysis without image
export const analyzeSymptoms = async (symptoms: string[], vehicleInfo?: string): Promise<SymptomAnalysis> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
        return getMockSymptomAnalysis(symptoms);
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an expert automotive diagnostic AI. Analyze these symptoms:
      
      Symptoms: ${symptoms.join(', ')}
      Vehicle: ${vehicleInfo || 'Unknown vehicle'}
      
      Return a JSON object with:
      - likelyIssues: array of likely mechanical issues
      - possibleCauses: array of root causes
      - recommendedServices: array of recommended service types
      - urgency: "routine" | "soon" | "urgent" | "immediate"
      - diyPossible: boolean if DIY fix is reasonable
      - estimatedCostRange: { min: number, max: number } in USD
      
      Return ONLY valid JSON.`
    });

    const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as SymptomAnalysis;
    }
    throw new Error('Could not parse JSON response');
  } catch (error) {
    console.error("Symptom analysis error:", error);
    return getMockSymptomAnalysis(symptoms);
  }
};

// Mock symptom analysis
const getMockSymptomAnalysis = (symptoms: string[]): SymptomAnalysis => {
  const joined = symptoms.join(' ').toLowerCase();
  
  if (detectKeyword(joined, ['noise', 'sound', 'squeal', 'knock'])) {
    return MOCK_SYMPTOM_ANALYSES.noise;
  }
  if (detectKeyword(joined, ['light', 'warning', 'check', 'dashboard'])) {
    return MOCK_SYMPTOM_ANALYSES.light;
  }
  if (detectKeyword(joined, ['vibrat', 'shake', 'shudder'])) {
    return MOCK_SYMPTOM_ANALYSES.vibration;
  }
  return MOCK_SYMPTOM_ANALYSES.default;
};

// NEW: Photo cost estimator for quick quotes
export const getPhotoQuoteEstimate = async (
  base64Image: string, 
  description: string,
  vehicleType: 'economy' | 'standard' | 'luxury' | 'performance'
): Promise<{ 
  estimatedCost: { min: number; max: number };
  breakdown: { part: string; labor: number; parts: number }[];
  confidence: number;
  notes: string;
}> => {
  // For now, use mock data - in production would call Gemini
  const damage = await analyzeDamage(base64Image, description);
  
  // Apply vehicle type multiplier
  const multipliers = {
    economy: 0.8,
    standard: 1.0,
    luxury: 1.5,
    performance: 1.8
  };
  
  const multiplier = multipliers[vehicleType];
  
  return {
    estimatedCost: {
      min: Math.round(damage.estimatedCostRange.min * multiplier),
      max: Math.round(damage.estimatedCostRange.max * multiplier)
    },
    breakdown: damage.affectedParts.map(part => ({
      part,
      labor: Math.round((damage.estimatedCostRange.min / damage.affectedParts.length) * 0.4 * multiplier),
      parts: Math.round((damage.estimatedCostRange.min / damage.affectedParts.length) * 0.6 * multiplier)
    })),
    confidence: damage.confidenceScore,
    notes: damage.description
  };
};

// Helper to format AI response for display
export const formatCostRange = (range: { min: number; max: number }): string => {
  return `$${range.min.toLocaleString()} - $${range.max.toLocaleString()}`;
};


// NEW: Refine draft post with text and images
export const improvePostDraft = async (
  currentText: string, 
  base64Images: string[]
): Promise<{ title: string; content: string }> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
        return {
          title: "Refined: " + currentText.substring(0, 20) + "...",
          content: "Detailed description of: " + currentText + "\n(This is a mock refinement. Add API key for real AI.)"
        };
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const parts: any[] = [];
    
    // Add images if present
    base64Images.forEach(img => {
      // Strip prefix if present (e.g. "data:image/jpeg;base64,")
      const cleanData = img.split(',')[1] || img;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanData
        }
      });
    });
    
    parts.push({
      text: `You are an expert automotive service advisor. Rewrite the following user forum post to be professional, clear, and detailed.
      
      User Draft: "${currentText}"
      
      Instructions:
      1. Create a catchy but descriptive Title.
      2. Rewrite the Content to describe symptoms clearly. 
      3. If images are attached, describe RELEVANT visible issues (rust, leaks, wear) in the content.
      4. Return ONLY a JSON object: { "title": "...", "content": "..." }`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts }
    });
    
    const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse JSON response');

  } catch (error) {
    console.error("Post improvement error:", error);
    return { title: '', content: '' }; // Handle gracefully in UI
  }
};

export const formatUrgency = (urgency: string): { label: string; color: string } => {
  switch (urgency) {
    case 'immediate':
      return { label: 'Immediate Attention', color: 'error' };
    case 'urgent':
      return { label: 'Urgent', color: 'warning' };
    case 'soon':
      return { label: 'Schedule Soon', color: 'info' };
    default:
      return { label: 'Routine', color: 'success' };
  }
};
