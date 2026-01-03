// Crop data with images and details
export interface CropData {
  id: string;
  name: string;
  image: string;
  description: string;
  waterRequirement: 'low' | 'medium' | 'high';
  plantingPeriod: string;
  season: string;
  soilType: string[];
  irrigationType: string[];
  yieldPerAcre: string;
}

export const cropsDatabase: CropData[] = [
  {
    id: 'wheat',
    name: 'Wheat',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop',
    description: 'A staple grain crop, wheat is highly nutritious and versatile',
    waterRequirement: 'medium',
    plantingPeriod: 'Sep-Oct',
    season: 'Rabi',
    soilType: ['loamy', 'sandy loam'],
    irrigationType: ['drip', 'flood', 'sprinkler'],
    yieldPerAcre: '20-25 quintals',
  },
  {
    id: 'rice',
    name: 'Rice',
    image: 'https://images.unsplash.com/photo-1586985289688-cacf0dd8c1d8?w=500&h=500&fit=crop',
    description: 'Staple food crop that requires ample water and warm climate',
    waterRequirement: 'high',
    plantingPeriod: 'Jun-Jul',
    season: 'Kharif',
    soilType: ['clay', 'loamy'],
    irrigationType: ['flood'],
    yieldPerAcre: '25-40 quintals',
  },
  {
    id: 'cotton',
    name: 'Cotton',
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd53c4f?w=500&h=500&fit=crop',
    description: 'Cash crop with high market value, used for textiles',
    waterRequirement: 'medium',
    plantingPeriod: 'May-Jun',
    season: 'Kharif',
    soilType: ['loamy', 'sandy loam'],
    irrigationType: ['drip', 'flood'],
    yieldPerAcre: '12-15 bales',
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    image: 'https://images.unsplash.com/photo-1599599810981-9f3c0c1b5e6d?w=500&h=500&fit=crop',
    description: 'Long duration crop used for sugar production',
    waterRequirement: 'high',
    plantingPeriod: 'Sep-Nov',
    season: 'Rabi',
    soilType: ['loamy', 'clay'],
    irrigationType: ['flood', 'drip'],
    yieldPerAcre: '50-60 tonnes',
  },
  {
    id: 'corn',
    name: 'Corn (Maize)',
    image: 'https://images.unsplash.com/photo-1574517320219-553eb213f72d?w=500&h=500&fit=crop',
    description: 'Versatile crop used for food, feed, and industrial purposes',
    waterRequirement: 'medium',
    plantingPeriod: 'Apr-Jul',
    season: 'Kharif',
    soilType: ['loamy', 'sandy loam'],
    irrigationType: ['drip', 'sprinkler'],
    yieldPerAcre: '25-35 quintals',
  },
  {
    id: 'chickpea',
    name: 'Chickpea (Gram)',
    image: 'https://images.unsplash.com/photo-1599599810819-8ac3e7b8d6d0?w=500&h=500&fit=crop',
    description: 'Protein-rich pulse crop, important for nutrition',
    waterRequirement: 'low',
    plantingPeriod: 'Oct-Nov',
    season: 'Rabi',
    soilType: ['loamy', 'sandy loam'],
    irrigationType: ['drip', 'manual'],
    yieldPerAcre: '12-18 quintals',
  },
  {
    id: 'mustard',
    name: 'Mustard',
    image: 'https://images.unsplash.com/photo-1599599810923-7cf3c9a4d5e5?w=500&h=500&fit=crop',
    description: 'Oil seed crop with high market demand',
    waterRequirement: 'low',
    plantingPeriod: 'Sep-Oct',
    season: 'Rabi',
    soilType: ['loamy', 'sandy'],
    irrigationType: ['drip', 'manual'],
    yieldPerAcre: '10-15 quintals',
  },
  {
    id: 'potato',
    name: 'Potato',
    image: 'https://images.unsplash.com/photo-1599599810711-c0e8a0a98c1d?w=500&h=500&fit=crop',
    description: 'High-yield vegetable crop with good storage life',
    waterRequirement: 'medium',
    plantingPeriod: 'Aug-Sep',
    season: 'Rabi',
    soilType: ['loamy', 'sandy loam'],
    irrigationType: ['drip', 'sprinkler'],
    yieldPerAcre: '150-200 quintals',
  },
  {
    id: 'onion',
    name: 'Onion',
    image: 'https://images.unsplash.com/photo-1587049633312-cc9d6b7b7a1a?w=500&h=500&fit=crop',
    description: 'Important vegetable crop with high nutritional value',
    waterRequirement: 'medium',
    plantingPeriod: 'Aug-Dec',
    season: 'Rabi',
    soilType: ['loamy', 'sandy loam'],
    irrigationType: ['drip', 'sprinkler'],
    yieldPerAcre: '200-250 quintals',
  },
  {
    id: 'tomato',
    name: 'Tomato',
    image: 'https://images.unsplash.com/photo-1587049638154-9a2e5e2c6b4a?w=500&h=500&fit=crop',
    description: 'Vegetable crop with year-round demand and good returns',
    waterRequirement: 'medium',
    plantingPeriod: 'Feb-Apr, Jul-Sep',
    season: 'Kharif/Rabi',
    soilType: ['loamy', 'sandy loam'],
    irrigationType: ['drip', 'sprinkler'],
    yieldPerAcre: '200-300 quintals',
  },
  {
    id: 'lentil',
    name: 'Lentil',
    image: 'https://images.unsplash.com/photo-1599599810632-a7cc48e5b7fb?w=500&h=500&fit=crop',
    description: 'Nutritious pulse crop, good for soil health',
    waterRequirement: 'low',
    plantingPeriod: 'Oct-Nov',
    season: 'Rabi',
    soilType: ['loamy', 'sandy loam'],
    irrigationType: ['manual', 'drip'],
    yieldPerAcre: '8-12 quintals',
  },
  {
    id: 'soybean',
    name: 'Soybean',
    image: 'https://images.unsplash.com/photo-1599599810873-e7c5a88c5b3f?w=500&h=500&fit=crop',
    description: 'High-protein cash crop with multiple uses',
    waterRequirement: 'medium',
    plantingPeriod: 'May-Jul',
    season: 'Kharif',
    soilType: ['loamy', 'sandy loam'],
    irrigationType: ['drip', 'sprinkler'],
    yieldPerAcre: '12-18 quintals',
  },
];

// Function to get crop by name
export function getCropByName(name: string): CropData | undefined {
  return cropsDatabase.find(
    crop => crop.name.toLowerCase() === name.toLowerCase()
  );
}

// Function to get crop by ID
export function getCropById(id: string): CropData | undefined {
  return cropsDatabase.find(crop => crop.id === id);
}

// Function to search crops
export function searchCrops(query: string): CropData[] {
  const lowerQuery = query.toLowerCase();
  return cropsDatabase.filter(
    crop =>
      crop.name.toLowerCase().includes(lowerQuery) ||
      crop.description.toLowerCase().includes(lowerQuery)
  );
}
