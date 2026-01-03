'use client';

import { create } from 'zustand';
import { getWeather } from '@/ai/flows/weather-flow';
import { type WeatherOutput, type WeatherInput } from '@/ai/flows/weather-types';
import { useUserProfile } from './use-user-profile';

interface WeatherState {
  weatherData: WeatherOutput | null;
  loading: boolean;
  error: string | null;
  fetchWeather: (params: WeatherInput) => Promise<void>;
  clearError: () => void;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  weatherData: null,
  loading: true,
  error: null,
  clearError: () => set({ error: null }),
  fetchWeather: async (params: WeatherInput) => {
    set({ loading: true, error: null });
    try {
      const data = await getWeather(params);
      set({ weatherData: data, loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Could not load weather data.', loading: false });
    }
  },
}));
