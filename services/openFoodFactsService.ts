// services/openFoodFactsService.ts
import { NutritionalInfo } from '../types';
import { OPEN_FOOD_FACTS_API_URL, DEFAULT_NUTRITION_SERVING_SIZE_G, DEFAULT_SERVING_QUANTITY } from '../constants';
import i18n from '../src/i18n.js';

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_en?: string;
  product_name_es?: string;
  product_name_hi?: string;
  product_name_zh?: string;
  product_name_ar?: string;
  product_name_fr?: string;
  product_name_pt?: string;
  product_name_ru?: string;
  product_name_de?: string;
  product_name_ja?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
  };
  serving_size?: string;
}

interface OpenFoodFactsResponse {
  status: number; // 0 for failure, 1 for success
  status_verbose: string;
  product?: OpenFoodFactsProduct;
  code: string; // The barcode
}

const parseServingSizeToGrams = (servingSize?: string): number | undefined => {
  if (!servingSize) return undefined;
  const match = servingSize.match(/([\d.]+)\s*g/i);
  if (match && match[1]) {
    const grams = parseFloat(match[1]);
    return isNaN(grams) ? undefined : grams;
  }
  return undefined;
};

export const openFoodFactsService = {
  fetchProductByBarcode: async (barcode: string, currentLanguage: string): Promise<NutritionalInfo | null> => {
    try {
      const fieldsToFetch = 'product_name,product_name_en,product_name_es,product_name_hi,product_name_zh,product_name_ar,product_name_fr,product_name_pt,product_name_ru,product_name_de,product_name_ja,nutriments,serving_size';
      const response = await fetch(`${OPEN_FOOD_FACTS_API_URL}${barcode}.json?fields=${fieldsToFetch}`);
      if (!response.ok) {
        console.error(`Open Food Facts API request failed with status ${response.status} for barcode ${barcode}`);
        throw new Error(i18n.t('barcodeScanner.errorApiFetch', {lng: currentLanguage}));
      }
      
      const data: OpenFoodFactsResponse = await response.json();

      if (data.status === 0 || !data.product) {
        console.warn(`Product not found or data incomplete for barcode ${barcode}: ${data.status_verbose}`);
        return null; // Product not found
      }

      const product = data.product;
      const nutriments = product.nutriments || {};

      // Determine product name based on current language, fallback to English, then generic name
      let productName = product[`product_name_${currentLanguage}` as keyof OpenFoodFactsProduct] as string || 
                        product.product_name_en || 
                        product.product_name || 
                        i18n.t('barcodeScanner.unnamedProduct', {lng: currentLanguage});

      // Prefer per 100g values, fallback to per serving if 100g not available
      const calories = nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_serving'];
      const protein = nutriments.proteins_100g ?? nutriments.proteins_serving;
      const carbs = nutriments.carbohydrates_100g ?? nutriments.carbohydrates_serving;
      const fat = nutriments.fat_100g ?? nutriments.fat_serving;
      
      let servingSizeG = parseServingSizeToGrams(product.serving_size);
      
      if (calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
        console.warn(`Essential nutritional info missing for barcode ${barcode}. Product: ${productName}`);
        return null; 
      }
      
      if (!servingSizeG) {
        if (nutriments['energy-kcal_100g'] === undefined) { 
             console.warn(`Used per-serving nutrition for ${productName} but serving size is unknown/unparseable. Cannot accurately log.`);
             return null;
        }
         servingSizeG = DEFAULT_NUTRITION_SERVING_SIZE_G;
      }


      return {
        name: productName,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        serving_size_g: servingSizeG,
      };

    } catch (error) {
      console.error(`Error fetching or processing product for barcode ${barcode}:`, error);
      if (error instanceof Error && error.message.includes("API request failed")) {
         throw error;
      }
      throw new Error(i18n.t('barcodeScanner.errorApiFetchGeneric', {lng: currentLanguage}));
    }
  }
};