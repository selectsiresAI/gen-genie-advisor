import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/hooks/useTranslation';
import toolssLogo from '@/assets/toolss-logo.jpg';

interface AuthPageProps {
  onAuthSuccess: () => void;
}
const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { toast } = useToast();
  const { t } = useTranslation();

  // Estados para login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados para registro
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    // Verificar se já está logado
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        onAuthSuccess();
      }
    };
    checkAuth();
  }, [onAuthSuccess]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      if (error) {
        throw error;
      }
      if (data.user) {
        toast({
          title: t("auth.loginSuccess"),
          description: t("auth.welcome")
        });
        onAuthSuccess();
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError(error.message || 'Erro ao fazer login');
      toast({
        title: "Erro no login",
        description: error.message || 'Verifique suas credenciais e tente novamente',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validações básicas
    if (!fullName.trim()) {
      setError('Nome completo é obrigatório');
      setIsLoading(false);
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }
    if (signupPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }
    try {
      const redirectUrl = `${window.location.origin}/`;
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim()
          }
        }
      });
      if (error) {
        throw error;
      }
      if (data.user) {
        toast({
          title: t("auth.signupSuccess"),
          description: t("auth.checkEmail")
        });

        // Limpar formulário e ir para aba de login
        setSignupEmail('');
        setSignupPassword('');
        setConfirmPassword('');
        setFullName('');
        setActiveTab('login');
      }
    } catch (error: any) {
      console.error('Erro no registro:', error);
      setError(error.message || 'Erro ao criar conta');
      toast({
        title: "Erro ao criar conta",
        description: error.message || 'Tente novamente',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      toast({
        title: t("auth.resetEmailSent"),
        description: t("auth.checkInbox")
      });

      setIsForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Erro ao enviar e-mail:', error);
      setError(error.message || 'Erro ao enviar e-mail de recuperação');
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message || 'Tente novamente',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <img src={toolssLogo} alt="ToolSS Logo" className="h-16 mx-auto mb-2" />
          
          <CardDescription>{t("auth.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                {t("auth.login")}
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                {t("auth.signup")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              {!isForgotPassword ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input id="login-email" type="email" placeholder={t("auth.emailPlaceholder")} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="pl-10" required disabled={isLoading} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input id="login-password" type="password" placeholder={t("auth.passwordPlaceholder")} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="pl-10" required disabled={isLoading} minLength={6} />
                    </div>
                  </div>

                  {error && <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth.login")}...
                      </> : <>
                        <LogIn className="mr-2 h-4 w-4" />
                        {t("auth.login")}
                      </>}
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                    }}
                    disabled={isLoading}
                  >
                    {t("auth.forgotPassword")}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        id="reset-email" 
                        type="email" 
                        placeholder={t("auth.emailPlaceholder")} 
                        value={resetEmail} 
                        onChange={e => setResetEmail(e.target.value)} 
                        className="pl-10" 
                        required 
                        disabled={isLoading} 
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("auth.resetDescription")}
                    </p>
                  </div>

                  {error && <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth.sendResetEmail")}...
                      </> : t("auth.sendResetEmail")}
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError('');
                      setResetEmail('');
                    }}
                    disabled={isLoading}
                  >
                    {t("auth.backToLogin")}
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t("auth.fullName")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input id="signup-name" type="text" placeholder={t("auth.namePlaceholder")} value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10" required disabled={isLoading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input id="signup-email" type="email" placeholder={t("auth.emailPlaceholder")} value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className="pl-10" required disabled={isLoading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input id="signup-password" type="password" placeholder={t("auth.minChars")} value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="pl-10" required disabled={isLoading} minLength={6} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input id="confirm-password" type="password" placeholder={t("auth.confirmPlaceholder")} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-10" required disabled={isLoading} minLength={6} />
                  </div>
                </div>

                {error && <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.signup")}...
                    </> : <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t("auth.signup")}
                    </>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>
          </p>
            <p className="mt-1">
          </p>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default AuthPage;