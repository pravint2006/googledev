import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  const bgImage = PlaceHolderImages.find(p => p.id === 'login-background');
  
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
      <LoginForm />
    </main>
  );
}
