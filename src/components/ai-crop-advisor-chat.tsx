'use client';

import { useState, useRef, useEffect } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useWeatherStore } from '@/hooks/use-weather-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CropData } from '@/lib/crops-database';
import Image from 'next/image';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICropAdvisorChatProps {
  selectedCrop?: CropData | null;
  onCropSelected?: () => void;
}

export function AICropAdvisorChat({ selectedCrop, onCropSelected }: AICropAdvisorChatProps) {
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { weatherData } = useWeatherStore();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show welcome message when component mounts or crop changes
  useEffect(() => {
    let welcomeContent = `Hello! I'm your AI Crop Advisor. I have your farm information:
- Water Irrigation: ${userProfile?.waterIrrigation || 'Not set'}
- Water Level: ${userProfile?.waterLevel || 'Not set'}
- Soil Type: ${userProfile?.soilType || 'Not set'}
- Land Owned: ${userProfile?.landOwned ? `${userProfile.landOwned} acres` : 'Not set'}`;

    if (selectedCrop) {
      welcomeContent += `\n\nYou've selected **${selectedCrop.name}** for discussion. Let me tell you more about it:
- Water Requirement: ${selectedCrop.waterRequirement}
- Planting Period: ${selectedCrop.plantingPeriod}
- Season: ${selectedCrop.season}
- Suitable Soil Types: ${selectedCrop.soilType.join(', ')}
- Irrigation Methods: ${selectedCrop.irrigationType.join(', ')}
- Yield per acre: ${selectedCrop.yieldPerAcre}

Feel free to ask me any questions about growing ${selectedCrop.name} on your farm!`;
    } else {
      welcomeContent += '\n\nHow can I help you with crop planning today?';
    }

    const welcomeMessage: Message = {
      id: '0',
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [userProfile, selectedCrop]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context from user profile and weather data
      const context = `
User Farm Information:
- Water Irrigation Type: ${userProfile?.waterIrrigation || 'Not specified'}
- Water Level: ${userProfile?.waterLevel || 'Not specified'}
- Soil Type: ${userProfile?.soilType || 'Not specified'}
- Land Owned: ${userProfile?.landOwned || 'Not specified'} acres
${selectedCrop ? `
Selected Crop Information:
- Crop: ${selectedCrop.name}
- Water Requirement: ${selectedCrop.waterRequirement}
- Planting Period: ${selectedCrop.plantingPeriod}
- Season: ${selectedCrop.season}
- Suitable Soil Types: ${selectedCrop.soilType.join(', ')}
- Irrigation Methods: ${selectedCrop.irrigationType.join(', ')}
- Yield per acre: ${selectedCrop.yieldPerAcre}
` : ''}
Current Weather Location: ${weatherData?.locationName || 'Not specified'}
Current Temperature: ${weatherData?.current.temperature || 'N/A'}°C
Current Humidity: ${weatherData?.current.humidity || 'N/A'}%

User Query: ${input}
`;

      // Call the AI endpoint (we'll need to create this)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I could not generate a response. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description: 'Failed to send message. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isProfileLoading) {
    return (
      <Card className="w-full h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            AI Crop Advisor Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center flex-1">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <MessageCircle className="h-5 w-5" />
            <div className="flex-1">
              <CardTitle>
                {selectedCrop ? `Chat about ${selectedCrop.name}` : 'AI Crop Advisor Chat'}
              </CardTitle>
              <CardDescription>
                {selectedCrop ? `Get expert advice on growing ${selectedCrop.name}` : 'Ask me anything about crop planning for your farm'}
              </CardDescription>
            </div>
          </div>
          {selectedCrop && onCropSelected && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCropSelected}
              title="Clear crop selection"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {selectedCrop && (
          <div className="flex items-center gap-3 mt-4 p-3 bg-muted rounded-lg">
            <div className="relative h-12 w-12">
              <Image
                src={selectedCrop.image}
                alt={selectedCrop.name}
                fill
                className="object-cover rounded"
              />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{selectedCrop.name}</p>
              <p className="text-xs text-muted-foreground">{selectedCrop.description}</p>
            </div>
          </div>
        )}
      </CardHeader>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pr-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <CardContent className="border-t pt-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Ask about crops, planting times, irrigation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
