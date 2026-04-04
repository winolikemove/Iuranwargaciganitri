'use client';

import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { LandingPage } from '@/components/landing-page';
import { Dashboard } from '@/components/dashboard';
import { AuthModal } from '@/components/auth-modal';
import { LoadingScreen } from '@/components/loading-screen';
import { useState } from 'react';

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: appLoading } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Show loading screen while checking auth or loading initial data
  if (authLoading || (appLoading && !user)) {
    return <LoadingScreen />;
  }

  // Show dashboard for authenticated users
  if (user) {
    return <Dashboard />;
  }

  // Show landing page for non-authenticated users
  return (
    <>
      <LandingPage
        onLoginClick={() => {
          setAuthMode('login');
          setShowAuthModal(true);
        }}
        onRegisterClick={() => {
          setAuthMode('register');
          setShowAuthModal(true);
        }}
      />
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
}
