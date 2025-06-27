import {
  GoogleGenAI,
  GenerateContentResponse,
  Part,
  GroundingChunk as GenAIGroundingChunk,
  Chat,
} from "@google/genai";
import {
  NutritionalInfo,
  FitnessModeId,
  MicronutrientAnalysisResponse,
  AISuggestedMeal,
  MealSuggestionResponse,
  GroundingChunk,
  DietPlanResponse,
  DietPlanDay,
  User,
  GeminiChatInstance,
} from "../types";
import {
  GEMINI_FOOD_ID_MODEL,
  GEMINI_NUTRITION_MODEL,
  GEMINI_SUGGESTION_MODEL,
  GEMINI_MICRONUTRIENT_MODEL,
  GEMINI_DIET_PLAN_MODEL,
  GEMINI_CHATBOT_MODEL,
  DEFAULT_NUTRITION_SERVING_SIZE_G,
  FITNESS_MODES,
  ACTIVITY_LEVELS,
  COMMON_DIETARY_PREFERENCES,
} from "../constants";
import i18n, { geminiLanguageMap } from "../src/i18n.js";

// if (
//   typeof process === "undefined" ||
//   typeof process.env === "undefined" ||
//   !process.env.API_KEY
// ) {
//   console.error(
//     "API_KEY environment variable not found, or 'process.env' is not available. " +
//       "Please ensure API_KEY is set in the execution environment for AI features to work."
//   );
// }

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

function parseJsonFromText(text: string): any {
  let jsonStr = text.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original text:", text);
    throw new Error(
      i18n.t("error.invalidJsonResponse", { lng: i18n.language || "en" })
    );
  }
}

function buildUserProfileSegment(
  userProfile: User | null,
  currentLanguage: string
): string {
  if (!userProfile) return "";
  let profileSegment =
    i18n.t("geminiPrompts.userProfile.baseIntro", { lng: "en" }) + "\n";
  if (userProfile.age)
    profileSegment += `- ${i18n.t("geminiPrompts.userProfile.age", {
      age: userProfile.age,
      lng: "en",
    })}\n`;
  if (userProfile.weight && userProfile.height) {
    profileSegment += `- ${i18n.t("geminiPrompts.userProfile.weightHeight", {
      weight: userProfile.weight,
      height: userProfile.height,
      lng: "en",
    })}\n`;
  } else {
    if (userProfile.weight)
      profileSegment += `- ${i18n.t("geminiPrompts.userProfile.weightOnly", {
        weight: userProfile.weight,
        lng: "en",
      })}\n`;
    if (userProfile.height)
      profileSegment += `- ${i18n.t("geminiPrompts.userProfile.heightOnly", {
        height: userProfile.height,
        lng: "en",
      })}\n`;
  }
  if (userProfile.activityLevel) {
    const levelLabel = ACTIVITY_LEVELS.find(
      (l) => l.id === userProfile.activityLevel
    )?.labelKey;
    if (levelLabel)
      profileSegment += `- ${i18n.t("geminiPrompts.userProfile.activityLevel", {
        level: i18n.t(levelLabel, { lng: currentLanguage }),
        lng: "en",
      })}\n`;
  }
  if (
    userProfile.dietaryPreferences &&
    userProfile.dietaryPreferences.length > 0
  ) {
    const prefs = userProfile.dietaryPreferences
      .map((id) => {
        if (id.startsWith("other:")) return id.substring(6); // Get the custom text
        const prefLabel = COMMON_DIETARY_PREFERENCES.find(
          (p) => p.id === id
        )?.labelKey;
        return prefLabel ? i18n.t(prefLabel, { lng: currentLanguage }) : id;
      })
      .join(", ");
    profileSegment += `- ${i18n.t(
      "geminiPrompts.userProfile.dietaryPreferences",
      { preferences: prefs, lng: "en" }
    )}\n`;
  }
  return profileSegment.trim() ? `\n${profileSegment}\n` : "";
}

export const geminiService = {
  identifyFoodInImage: async (
    base64Image: string,
    mimeType: string,
    currentLanguage: string
  ): Promise<string[]> => {
    try {
      const imagePart: Part = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      };
      const textPart: Part = {
        text: i18n.t("geminiPrompts.identifyFood", { lng: "en" }),
      };

      const targetLanguageName =
        geminiLanguageMap[currentLanguage] || "English";
      const noFoodIdentifiedString = i18n.t("geminiPrompts.noFoodIdentified", {
        lng: currentLanguage,
      });

      const response: GenerateContentResponse = await ai.models.generateContent(
        {
          model: GEMINI_FOOD_ID_MODEL,
          contents: { parts: [imagePart, textPart] },
          config: {
            systemInstruction: `Respond in ${targetLanguageName}. If no food items are clearly identifiable, you MUST respond with only the exact phrase: "${noFoodIdentifiedString}". Otherwise, list identified food items separated by commas.`,
          },
        }
      );

      const text: string = response.text ?? "";
      if (
        text.trim().toLowerCase() === noFoodIdentifiedString.toLowerCase() ||
        text.trim() === ""
      ) {
        return [];
      }
      return text
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    } catch (error) {
      console.error("Error identifying food in image:", error);
      throw new Error(
        i18n.t("errorAIFailedIdentify", { lng: currentLanguage })
      );
    }
  },

  getNutritionalInfo: async (
    foodName: string,
    currentLanguage: string,
    base64Image: string | null,
    mimeType: string | null
  ): Promise<NutritionalInfo | null> => {
    try {
      const targetLanguageName =
        geminiLanguageMap[currentLanguage] || "English";
      let promptContent: string | { parts: Part[] };

      if (base64Image && mimeType) {
        const imagePart: Part = {
          inlineData: { data: base64Image, mimeType: mimeType },
        };
        const textPartInstruction = i18n.t(
          "geminiPrompts.getNutritionWithImage",
          {
            lng: "en",
            foodItemDescription: foodName,
            defaultServingSize: DEFAULT_NUTRITION_SERVING_SIZE_G,
          }
        );
        const textPart: Part = { text: textPartInstruction };
        promptContent = { parts: [imagePart, textPart] };
      } else {
        promptContent = i18n.t("geminiPrompts.getNutritionNoImage", {
          lng: "en",
          foodItemDescription: foodName,
          defaultServingSize: DEFAULT_NUTRITION_SERVING_SIZE_G,
        });
      }

      const systemInstruction = `You are an expert nutritionist. Your task is to provide nutritional information for a given food item. Use Google Search to find accurate information, especially for regional or less common foods. You MUST respond ONLY with a single, valid JSON object, and nothing else. The JSON can be inside a markdown block (e.g., \`\`\`json\n{...}\n\`\`\`). The JSON object must contain these exact keys in lowercase: "name", "calories", "protein", "carbs", "fat", "serving_size_g". The "name" should be translated into ${targetLanguageName} if a common translation exists. All nutritional values must be numbers for the specified serving size. Do not add any conversational text, explanations, or apologies before or after the JSON object.`;

      const response: GenerateContentResponse = await ai.models.generateContent(
        {
          model: GEMINI_NUTRITION_MODEL,
          contents: promptContent,
          config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: systemInstruction,
          },
        }
      );

      const parsedData = parseJsonFromText(response.text ?? "");

      if (parsedData && typeof parsedData.calories === "number") {
        return {
          ...parsedData,
          name: parsedData.name || foodName,
        } as NutritionalInfo;
      }
      return null;
    } catch (error) {
      console.error(`Error getting nutritional info for ${foodName}:`, error);
      throw new Error(
        i18n.t("errorFailedToGetNutrition", { foodName, lng: currentLanguage })
      );
    }
  },

  suggestMeals: async (
    dietaryContext: string,
    currentLanguage: string,
    effectiveCalorieGoal: number,
    fitnessMode: FitnessModeId,
    cuisinePreference: string,
    mealType: string,
    userProfile: User | null
  ): Promise<MealSuggestionResponse> => {
    try {
      const targetLanguageName =
        geminiLanguageMap[currentLanguage] || "English";
      const fitnessModeDetails = FITNESS_MODES.find(
        (fm) => fm.id === fitnessMode
      );
      const fitnessModeLabel = fitnessModeDetails
        ? i18n.t(fitnessModeDetails.labelKey, { lng: "en" })
        : "general";

      const mealTypeLabel = mealType === "any" ? "any meal" : mealType;
      const profileSegment = buildUserProfileSegment(
        userProfile,
        currentLanguage
      );

      const userPrompt = i18n.t("geminiPrompts.suggestMealsBase", {
        lng: "en",
        calorieGoal: effectiveCalorieGoal.toFixed(0),
        fitnessMode: fitnessModeLabel,
        mealType: mealTypeLabel,
        cuisinePreference: cuisinePreference || "any",
        dietaryContext: dietaryContext,
        userProfileSegment:
          profileSegment ||
          i18n.t("geminiPrompts.userProfile.notProvided", { lng: "en" }),
      });

      const systemInstruction = `Respond ONLY in valid JSON format. The JSON response MUST be an object with a single key "suggestions" which is an array of meal objects. Each meal object MUST have the following keys: "name" (string, translated to ${targetLanguageName}), "description" (string, in ${targetLanguageName}), "estimatedCalories" (number), "estimatedProtein" (number, in grams), "estimatedCarbs" (number, in grams), and "estimatedFat" (number, in grams). Do not include any text, notes, or explanations outside of this JSON structure. If you use Google Search for grounding, include a "sources" array within the main JSON object, where each source is an object like {"web": {"uri": "url", "title": "title"}}.`;

      const response: GenerateContentResponse = await ai.models.generateContent(
        {
          model: GEMINI_SUGGESTION_MODEL,
          contents: userPrompt,
          config: {
            responseMimeType: "application/json",
            tools:
              dietaryContext.length > 20 ||
              cuisinePreference.length > 5 ||
              (profileSegment && profileSegment.length > 10)
                ? [{ googleSearch: {} }]
                : undefined,
            systemInstruction: systemInstruction,
          },
        }
      );

      const parsedData = parseJsonFromText(response.text ?? "");
      const suggestions: AISuggestedMeal[] = parsedData.suggestions || [];

      let processedSources: GroundingChunk[] | undefined = undefined;
      if (parsedData.sources) {
        const sdkGroundingChunks: GenAIGroundingChunk[] = parsedData.sources;
        processedSources = sdkGroundingChunks
          .map((chunk) =>
            chunk.web &&
            typeof chunk.web.uri === "string" &&
            chunk.web.uri.length > 0
              ? { web: { uri: chunk.web.uri, title: chunk.web.title } }
              : null
          )
          .filter(
            (chunk): chunk is { web: { uri: string; title: any } } =>
              chunk !== null
          );
      }

      return { suggestions, sources: processedSources };
    } catch (error) {
      console.error("Error suggesting meals:", error);
      throw new Error(
        i18n.t("errorAIFailedSuggestions", { lng: currentLanguage })
      );
    }
  },

  getMicronutrientAnalysis: async (
    foodNames: string[],
    currentLanguage: string,
    userProfile: User | null
  ): Promise<MicronutrientAnalysisResponse> => {
    try {
      const targetLanguageName =
        geminiLanguageMap[currentLanguage] || "English";
      const foodListString = foodNames.join(", ");
      const profileSegment = buildUserProfileSegment(
        userProfile,
        currentLanguage
      );

      const prompt = i18n.t("geminiPrompts.analyzeMicronutrients", {
        lng: "en",
        foodList: foodListString,
        userProfileSegment:
          profileSegment ||
          i18n.t("geminiPrompts.userProfile.notProvided", { lng: "en" }),
      });

      const response: GenerateContentResponse = await ai.models.generateContent(
        {
          model: GEMINI_MICRONUTRIENT_MODEL,
          contents: prompt,
          config: {
            systemInstruction: `You are a helpful nutritional assistant. Your response MUST be in ${targetLanguageName}. Analyze the provided list of commonly consumed food items for potential general micronutrient deficiencies (e.g., Iron, Vitamin D, B12, Calcium, Zinc, Magnesium, Folate). Consider the user's profile if provided. Provide a brief, general analysis. Focus on common patterns. Then, suggest 2-3 general food groups or types of foods that could help address these potential gaps. This is NOT medical advice. Keep the entire response concise, conversational, and easy to understand, under 150 words. Example output structure: "Based on the foods you've logged, you might want to ensure you're getting enough [Nutrient X] and [Nutrient Y]. Consider incorporating more [Food Group A] or [Food Group B] into your diet. Remember, this isn't medical advice."`,
          },
        }
      );

      const analysisText = response.text || "No analysis available.";
      return { analysisText };
    } catch (error) {
      console.error("Error getting micronutrient analysis:", error);
      throw new Error(
        i18n.t("micronutrientInsights.errorAnalysis", { lng: currentLanguage })
      );
    }
  },

  generateDietPlan: async (params: {
    duration: number;
    targetCalories: number;
    proteinPercent?: number;
    carbsPercent?: number;
    fatPercent?: number;
    cuisinePreference?: string;
    dietaryRestrictions?: string;
    currentLanguage: string;
    userProfile: User | null;
  }): Promise<DietPlanResponse> => {
    try {
      const {
        duration,
        targetCalories,
        proteinPercent,
        carbsPercent,
        fatPercent,
        cuisinePreference,
        dietaryRestrictions,
        currentLanguage,
        userProfile,
      } = params;

      const targetLanguageName =
        geminiLanguageMap[currentLanguage] || "English";
      const profileSegment = buildUserProfileSegment(
        userProfile,
        currentLanguage
      );

      const userPrompt = i18n.t("geminiPrompts.generateDietPlanBase", {
        lng: "en",
        duration: duration,
        targetCalories: targetCalories.toFixed(0),
        proteinPercent: proteinPercent || "balanced",
        carbsPercent: carbsPercent || "balanced",
        fatPercent: fatPercent || "balanced",
        cuisinePreference: cuisinePreference || "any",
        dietaryRestrictions: dietaryRestrictions || "none",
        userProfileSegment:
          profileSegment ||
          i18n.t("geminiPrompts.userProfile.notProvided", { lng: "en" }),
      });

      const systemInstruction = `You are an expert diet planner. Respond ONLY in valid JSON format. The JSON response MUST be an object with a single key "plan", which is an array of day objects. Each day object MUST have "dayLabel" (string, e.g., "Day 1", "Day 2"), "meals" (an object with keys "breakfast", "lunch", "dinner", "snacks", each being an array of meal detail objects), and "dailyTotals" (an object with keys "calories", "protein", "carbs", "fat", all numbers). Each meal detail object MUST have "name" (string, translated to ${targetLanguageName} if a common translation exists, otherwise use a concise and accurate description in ${targetLanguageName}), "description" (string, optional, in ${targetLanguageName}, providing a brief idea of ingredients or preparation), "estimatedCalories" (number), "estimatedProtein" (number, in grams), "estimatedCarbs" (number, in grams), and "estimatedFat" (number, in grams). Ensure meal names are diverse and appealing. Daily totals for calories and macronutrients should closely match the user's targets. The number of day objects in the "plan" array MUST match the requested duration. Consider the user's profile if provided. If you use Google Search for grounding (e.g., for specific cuisine recipes or restrictions), include a "sources" array within the main JSON object, where each source is an object like {"web": {"uri": "url", "title": "title"}}. Optionally, include a "notes" field (string) in the main JSON object for any general advice, disclaimers, or important considerations related to the plan. Do not include any text, notes, or explanations outside of this JSON structure.`;

      const response: GenerateContentResponse = await ai.models.generateContent(
        {
          model: GEMINI_DIET_PLAN_MODEL,
          contents: userPrompt,
          config: {
            responseMimeType: "application/json",
            tools:
              (dietaryRestrictions && dietaryRestrictions.length > 10) ||
              (cuisinePreference && cuisinePreference.length > 5) ||
              (profileSegment && profileSegment.length > 10)
                ? [{ googleSearch: {} }]
                : undefined,
            systemInstruction: systemInstruction,
          },
        }
      );

      const parsedData = parseJsonFromText(response.text ?? "");
      const plan: DietPlanDay[] = parsedData.plan || [];
      const notes: string | undefined = parsedData.notes;

      let processedSources: GroundingChunk[] | undefined = undefined;
      if (parsedData.sources) {
        const sdkGroundingChunks: GenAIGroundingChunk[] = parsedData.sources;
        processedSources = sdkGroundingChunks
          .map((chunk) =>
            chunk.web &&
            typeof chunk.web.uri === "string" &&
            chunk.web.uri.length > 0
              ? { web: { uri: chunk.web.uri, title: chunk.web.title } }
              : null
          )
          .filter(
            (chunk): chunk is { web: { uri: string; title: any } } =>
              chunk !== null
          );
      }

      return { plan, notes, sources: processedSources };
    } catch (error) {
      console.error("Error generating diet plan:", error);
      throw new Error(
        i18n.t("dietPlan.error.apiError", { lng: params.currentLanguage })
      );
    }
  },

  createChatSession: async (
    currentLanguage: string,
    userProfile: User | null
  ): Promise<GeminiChatInstance> => {
    const targetLanguageName = geminiLanguageMap[currentLanguage] || "English";
    const profileSegment = buildUserProfileSegment(
      userProfile,
      currentLanguage
    );

    const systemPrompt =
      i18n.t("geminiPrompts.chatbotSystemBase", { lng: "en" }) +
      (profileSegment
        ? `\n${i18n.t("geminiPrompts.chatbotSystemUserProfileContext", {
            lng: "en",
          })}\n${profileSegment}`
        : "") +
      `\n${i18n.t("geminiPrompts.chatbotSystemLanguageInstruction", {
        language: targetLanguageName,
        lng: "en",
      })}`;

    const chat: Chat = ai.chats.create({
      model: GEMINI_CHATBOT_MODEL,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }], // Enable Google Search for up-to-date info
      },
    });

    // Return an object that conforms to GeminiChatInstance, wrapping the SDK's chat.sendMessage
    return {
      sendMessage: async (message: string) => {
        const response: GenerateContentResponse = await chat.sendMessage({
          message,
        });
        let processedSources: GroundingChunk[] | undefined = undefined;
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const sdkGroundingChunks: GenAIGroundingChunk[] =
            response.candidates[0].groundingMetadata.groundingChunks;
          processedSources = sdkGroundingChunks
            .map((chunk) =>
              chunk.web &&
              typeof chunk.web.uri === "string" &&
              chunk.web.uri.length > 0
                ? { web: { uri: chunk.web.uri, title: chunk.web.title } }
                : null
            )
            .filter(
              (chunk): chunk is { web: { uri: string; title: any } } =>
                chunk !== null
            );
        }
        return { text: response.text ?? "", sources: processedSources };
      },
    };
  },
};
