import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ship, Mail, Lock, ChevronRight, AlertCircle, Info, Loader2 } from 'lucide-react';

// Componente de Vídeo de Fundo com Lazy Loading
const BackgroundVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && videoRef.current) {
      // Iniciar carregamento do vídeo quando estiver visível
      videoRef.current.load();
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Fallback Image for slow connections or errors */}
      {!isLoaded || hasError ? (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 animate-pulse"
          style={{
            backgroundImage: 'url("/placeholder.svg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      ) : null}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ minHeight: '100vh' }}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        onLoadedData={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      >
        <source src="/BR_MARINAS.m4v" type="video/mp4" />
        Seu navegador não suporta o elemento de vídeo.
      </video>

      {/* Overlay escuro para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
    </div>
  );
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasRedirectedRef = useRef(false);

  // Redirecionar automaticamente quando o usuário fica autenticado
  // Apenas redirecionar quando o perfil estiver carregado (evita loops causados por user temporário)
  useEffect(() => {

    if (user && user.profile && !hasRedirectedRef.current && !loading) {
      hasRedirectedRef.current = true;
      // Redirecionar imediatamente sem delay para evitar loops
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Digite seu email');
      return;
    }
    if (!senha.trim()) {
      setError('Digite sua senha');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(email.trim(), senha);

      if (result.success) {
        // O redirecionamento será feito pelo useEffect quando o user for atualizado
      } else {
        setError(result.error || 'Erro de autenticação');
      }
    } catch (err: any) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (e: string, s: string) => {
    setEmail(e);
    setSenha(s);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Video Component */}
      <BackgroundVideo />
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl marina-header mx-auto mb-6 shadow-elevated-lg border-4 border-white/20">
            <Ship className="h-12 w-12 text-white drop-shadow-xl" />
          </div>
          <h1 className="text-5xl font-display font-extrabold text-white mb-3 drop-shadow-2xl tracking-wide">
              BR Marinas
          </h1>
          <p className="text-lg text-white/95 drop-shadow-lg font-medium">
            Controle de Acesso
          </p>
        </div>

        {/* Login card */}
        <div className="card-elevated-md w-full p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="email" className="flex items-center gap-3 text-black font-semibold text-lg">
                <Mail className="h-5 w-5 text-black" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email.exemplo@marina.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-lg bg-white/95 backdrop-blur-md border-2 border-white/30 focus:border-white/80 focus:ring-4 focus:ring-white/20"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="senha" className="flex items-center gap-3 text-black font-semibold text-lg">
                <Lock className="h-5 w-5 text-black" />
                Senha
              </Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-14 text-lg bg-white/95 backdrop-blur-md border-2 border-white/30 focus:border-white/80 focus:ring-4 focus:ring-white/20"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive-light text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || loading}
              className="w-full h-14 text-lg font-bold gap-3 bg-white hover:bg-gray-100 text-gray-900 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  Entrar no Sistema
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
          <p className="text-sm text-white/90 mt-10 animate-fade-in text-center font-medium tracking-wide" style={{ animationDelay: '300ms' }}>
          Versão 3.0 • BR Marinas
        </p>
      </div>
    </div>
  );
}