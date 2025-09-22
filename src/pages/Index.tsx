import React, { useEffect } from 'react';

const Index: React.FC = () => {
  useEffect(() => {
    // Redirect to root since App.tsx handles auth now
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Carregando ToolSS...</p>
      </div>
    </div>
  );
};

export default Index;