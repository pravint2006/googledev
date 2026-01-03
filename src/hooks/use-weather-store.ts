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
  lastFetchTime: number | null;
}

const WEATHER_CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useWeatherStore = create<WeatherState>((set, get) => ({
  weatherData: null,
  loading: true,
  error: null,
  lastFetchTime: null,
  clearError: () => set({ error: null }),
  fetchWeather: async (params: WeatherInput) => {
    const state = get();
    const now = Date.now();
    
    // Check if cache is still valid
    if (state.weatherData && state.lastFetchTime && (now - state.lastFetchTime) < CACHE_DURATION) {
      set({ loading: false });
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const data = await getWeather(params);
      set({ weatherData: data, loading: false, lastFetchTime: now });
    } catch (e: any) {
      set({ error: e.message || 'Could not load weather data.', loading: false });
    }
  },
}));
