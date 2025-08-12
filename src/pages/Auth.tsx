import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, Waves, CreditCard, Phone, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";

const AuthPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome: '',
    contato: '',
    cpf_cnpj: '',
    banco: '',
    agencia: '',
    conta: '',
    chave_pix: '',
    numero_instrutor: '',
    atividade: 'Atividades Aquáticas',
    localizacao: '',
    valor: '',
    dia_horario: ''
  });

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate('/dashboard');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session && event === 'SIGNED_IN') {
          navigate('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao PraiAtiva!"
        });

      } else {
        // Sign up
        if (!formData.nome || !formData.contato || 
            !formData.atividade || !formData.localizacao || !formData.valor || !formData.dia_horario) {
          throw new Error("Todos os campos marcados com * são obrigatórios para cadastro");
        }

        // Primeiro, criar a conta
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              nome: formData.nome,
              contato: formData.contato
            }
          }
        });

        if (error) throw error;

        // Se o usuário foi criado ou já existe, tentar fazer login
        if (data.user) {
          // Se o usuário precisa confirmar email, vamos tentar fazer login mesmo assim
          if (!data.session) {
            // Tentar fazer login imediatamente
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password,
            });

            if (loginError) {
              throw new Error("Conta criada, mas não foi possível fazer login automaticamente. Tente fazer login manualmente.");
            }
          }

          // Criar perfil e dados do instrutor em background
          const userId = data.user.id;
          
          // Criar perfil (se não existir será ignorado pelo banco)
          supabase.from('profiles').upsert({
            user_id: userId,
            nome: formData.nome,
            contato: formData.contato
          });
          
          // Criar instrutor (se não existir será ignorado pelo banco)
          supabase.from('praiativa_instrutores').upsert({
            user_id: userId,
            nome: formData.nome,
            contato: formData.contato,
            cpf_cnpj: formData.cpf_cnpj,
            banco: formData.banco,
            agencia: formData.agencia,
            conta: formData.conta,
            chave_pix: formData.chave_pix,
            numero_instrutor: formData.contato, // número do instrutor = contato
            atividade: formData.atividade,
            valor: formData.valor,
            dia_horario: formData.dia_horario,
            localizacao: formData.localizacao
          });
        }

        toast({
          title: "Cadastro realizado!",
          description: "Bem-vindo ao PraiAtiva! Redirecionando..."
        });

        // Redirecionar automaticamente para o dashboard após 1.5 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao realizar autenticação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already authenticated
  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Waves className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PraiAtiva
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            {isLogin ? 'Faça login para acessar' : 'Crie sua conta'}
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {isLogin ? 'Login' : 'Cadastro'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Entre com suas credenciais' : 'Preencha seus dados para criar uma conta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required={!isLogin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contato">Contato (WhatsApp) - Número do Instrutor *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contato"
                        type="text"
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                        value={formData.contato}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contato: e.target.value,
                          numero_instrutor: e.target.value // O número do instrutor é o mesmo que o contato
                        })}
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="atividade">Atividade *</Label>
                    <Input
                      id="atividade"
                      type="text"
                      placeholder="Ex: Natação, Surf, Stand Up Paddle"
                      value={formData.atividade}
                      onChange={(e) => setFormData({...formData, atividade: e.target.value})}
                      required={!isLogin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localizacao">Localização da Atividade *</Label>
                    <Input
                      id="localizacao"
                      type="text"
                      placeholder="Ex: Praia de Copacabana, Lagoa Rodrigo de Freitas"
                      value={formData.localizacao}
                      onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                      required={!isLogin}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor da Aula *</Label>
                      <Input
                        id="valor"
                        type="text"
                        placeholder="R$ 100,00"
                        value={formData.valor}
                        onChange={(e) => setFormData({...formData, valor: e.target.value})}
                        required={!isLogin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dia_horario">Dia e Horário *</Label>
                      <Input
                        id="dia_horario"
                        type="text"
                        placeholder="Seg/Qua 15h"
                        value={formData.dia_horario}
                        onChange={(e) => setFormData({...formData, dia_horario: e.target.value})}
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  <div className="text-sm font-medium text-muted-foreground mb-3">Dados Bancários (opcionais)</div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                    <Input
                      id="cpf_cnpj"
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpf_cnpj}
                      onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="banco">Banco</Label>
                      <Input
                        id="banco"
                        type="text"
                        placeholder="Nome do banco"
                        value={formData.banco}
                        onChange={(e) => setFormData({...formData, banco: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agencia">Agência</Label>
                      <Input
                        id="agencia"
                        type="text"
                        placeholder="0000"
                        value={formData.agencia}
                        onChange={(e) => setFormData({...formData, agencia: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conta">Conta</Label>
                    <Input
                      id="conta"
                      type="text"
                      placeholder="00000-0"
                      value={formData.conta}
                      onChange={(e) => setFormData({...formData, conta: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chave_pix">Chave PIX</Label>
                    <Input
                      id="chave_pix"
                      type="text"
                      placeholder="CPF, email ou telefone"
                      value={formData.chave_pix}
                      onChange={(e) => setFormData({...formData, chave_pix: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary" 
                disabled={loading}
              >
                {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
              </Button>
            </form>

            <Separator className="my-4" />

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm"
              >
                {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;