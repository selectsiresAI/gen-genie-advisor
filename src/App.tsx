import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import AuthPage from "@/components/AuthPage";
import MainDashboard from "@/components/MainDashboard";
import QueryProvider from "@/providers/query-client";
import { TutorialProvider } from "@/features/tutorial/TutorialProvider";
import { SatisfactionSurvey } from "@/components/feedback/SatisfactionSurvey";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { SupportTicketsPage } from "@/pages/admin/SupportTicketsPage";
import BullsImportPage from "@/pages/BullsImportPage";

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    // A função onAuthStateChange já vai detectar a mudança
    // Não precisamos fazer nada aqui
  };

  const handleLogout = () => {
    // A função onAuthStateChange já vai detectar a mudança
    setUser(null);
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando ToolSS...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <Sonner />
      <SatisfactionSurvey />
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <MainDashboard user={user} onLogout={handleLogout} />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          }
        />
        <Route
          path="/import-bulls"
          element={
            user ? (
              <BullsImportPage />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          }
        />
        <Route
          path="/admin/*"
          element={
            user ? (
              <AdminGuard redirectTo="/">
                <AdminLayout onLogout={handleLogout} />
              </AdminGuard>
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="support-tickets" element={<SupportTicketsPage />} />
        </Route>
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <QueryProvider>
        <TutorialProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </TutorialProvider>
      </QueryProvider>
    </BrowserRouter>
  );
};

export default App;
