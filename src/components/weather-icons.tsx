
import { Sun, Moon, Cloud, CloudSun, CloudMoon, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, LucideProps } from 'lucide-react';

interface WeatherIconProps extends LucideProps {
  weatherCode: number;
  isDay: boolean;
}

export const WeatherIcon = ({ weatherCode, isDay, ...props }: WeatherIconProps) => {
  switch (weatherCode) {
    case 0: // Clear sky
      return isDay ? <Sun {...props} /> : <Moon {...props} />;
    case 1: // Mainly clear
       return isDay ? <CloudSun {...props} /> : <CloudMoon {...props} />;
    case 2: // Partly cloudy
      return isDay ? <CloudSun {...props} /> : <CloudMoon {...props} />;
    case 3: // Overcast
      return <Cloud {...props} />;
    case 45: // Fog
    case 48: // Depositing rime fog
      return <CloudFog {...props} />;
    case 51: // Drizzle: Light
    case 53: // Drizzle: Moderate
    case 55: // Drizzle: Dense
      return <CloudDrizzle {...props} />;
    case 56: // Freezing Drizzle: Light
    case 57: // Freezing Drizzle: Dense
      return <CloudDrizzle {...props} />;
    case 61: // Rain: Slight
    case 63: // Rain: Moderate
    case 65: // Rain: Heavy
      return <CloudRain {...props} />;
    case 66: // Freezing Rain: Light
    case 67: // Freezing Rain: Heavy
      return <CloudRain {...props} />;
    case 71: // Snow fall: Slight
    case 73: // Snow fall: Moderate
    case 75: // Snow fall: Heavy
      return <CloudSnow {...props} />;
    case 77: // Snow grains
      return <CloudSnow {...props} />;
    case 80: // Rain showers: Slight
    case 81: // Rain showers: Moderate
    case 82: // Rain showers: Violent
      return <CloudRain {...props} />;
    case 85: // Snow showers slight
    case 86: // Snow showers heavy
      return <CloudSnow {...props} />;
    case 95: // Thunderstorm: Slight or moderate
      return <CloudLightning {...props} />;
    case 96: // Thunderstorm with slight hail
    case 99: // Thunderstorm with heavy hail
      return <CloudLightning {...props} />;
    default:
      return isDay ? <Sun {...props} /> : <Moon {...props} />;
  }
};
