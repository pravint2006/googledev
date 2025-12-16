
'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/login-form';
import { SignUpForm } from '@/components/signup-form';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function LoginPage() {
  const bgImage = PlaceHolderImages.find((p) => p.id === 'login-background');
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          className="object-cover -z-10 brightness-[0.4]"
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent -z-9" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={isLoginView ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          {isLoginView ? (
            <LoginForm onSwitchToSignup={() => setIsLoginView(false)} />
          ) : (
            <SignUpForm onSwitchToLogin={() => setIsLoginView(true)} />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
