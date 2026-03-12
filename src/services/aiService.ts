import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AIAnalysisResult {
  risks: {
    type: string;
    level: 'Low' | 'Medium' | 'High';
    description: string;
    recommendation: string;
  }[];
  growthStatus: {
    status: string;
    description: string;
    suggestions: string[];
  };
  nutritionRecommendations: {
    food: string;
    calories: string;
    nutritionalValues: string;
    benefits: string;
    portion: string;
  }[];
  dailyTips: string[];
  summary: string;
}

export const analyzeStudentHealth = async (studentData: any, healthHistory: any[], activities: any[]): Promise<AIAnalysisResult> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following student health data and provide intelligent predictions, insights, and recommendations.
    
    Student Info:
    - Name: ${studentData.fullName}
    - Age: ${calculateAge(studentData.dob)}
    - Gender: ${studentData.gender}
    - Current Height: ${healthHistory[0]?.height} cm
    - Current Weight: ${healthHistory[0]?.weight} kg
    - Current BMI: ${healthHistory[0]?.bmi}
    
    Health History (last 5 records):
    ${healthHistory.slice(0, 5).map(h => `- Date: ${h.date}, Height: ${h.height}cm, Weight: ${h.weight}kg, BMI: ${h.bmi}`).join('\n')}
    
    Recent Activities:
    ${activities.slice(0, 5).map(a => `- Date: ${a.date}, Type: ${a.type}, Name: ${a.name}, Points: ${a.points}`).join('\n')}
    
    Please provide the analysis in JSON format with the following structure:
    {
      "risks": [
        { "type": "Risk of obesity/malnutrition/inactivity/etc", "level": "Low/Medium/High", "description": "...", "recommendation": "..." }
      ],
      "growthStatus": {
        "status": "Normal/Slow/Rapid weight gain/etc",
        "description": "...",
        "suggestions": ["..."]
      },
      "nutritionRecommendations": [
        { "food": "...", "calories": "...", "nutritionalValues": "...", "benefits": "...", "portion": "..." }
      ],
      "dailyTips": ["...", "...", "..."],
      "summary": "..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  level: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                  description: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                }
              }
            },
            growthStatus: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            nutritionRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  food: { type: Type.STRING },
                  calories: { type: Type.STRING },
                  nutritionalValues: { type: Type.STRING },
                  benefits: { type: Type.STRING },
                  portion: { type: Type.STRING }
                }
              }
            },
            dailyTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};

export const getAdminAIInsights = async (allStudentsData: any[]): Promise<any> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following aggregated student health data for a school and provide high-level AI health insights for administrators.
    
    Data Summary:
    - Total Students: ${allStudentsData.length}
    - BMI Categories: ${JSON.stringify(countBy(allStudentsData, 'category'))}
    
    Please provide the insights in JSON format with the following structure:
    {
      "studentsAtRiskCount": number,
      "abnormalGrowthCount": number,
      "mostImprovedCount": number,
      "classLevelPredictions": [
        { "className": "...", "prediction": "...", "recommendation": "..." }
      ],
      "topRisks": ["...", "..."],
      "summary": "..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentsAtRiskCount: { type: Type.NUMBER },
            abnormalGrowthCount: { type: Type.NUMBER },
            mostImprovedCount: { type: Type.NUMBER },
            classLevelPredictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  className: { type: Type.STRING },
                  prediction: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                }
              }
            },
            topRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Admin AI Insights Error:", error);
    throw error;
  }
};

function calculateAge(dob: string) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export const getBreakfastInsights = async (history: any[]): Promise<string> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following student breakfast history and provide a short, encouraging AI nutrition insight.
    
    Breakfast History:
    ${history.map(h => `- Item: ${h.itemName}, Date: ${h.sellingDate}`).join('\n')}
    
    Provide a 1-2 sentence insight about their eating habits and how it might affect their energy and health.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Keep up the healthy eating habits!";
  } catch (error) {
    console.error("Breakfast Insights Error:", error);
    return "Keep up the healthy eating habits!";
  }
};

function countBy(arr: any[], key: string) {
  return arr.reduce((acc, obj) => {
    const val = obj[key];
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}
