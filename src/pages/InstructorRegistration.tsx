import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Building, Hash, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";

interface InstructorFormData {
  nome: string;
  cpf_cnpj: string;
  banco: string;
  agencia: string;
  conta: string;
  chave_pix: string;
  numero_instrutor: string;
  contato: string;
  atividade: string;
  valor: string;
  dia_horario: string;
  localizacao: string;
}

const InstructorRegistrationPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState<InstructorFormData>({
    nome: '',
    cpf_cnpj: '',
    banco: '',
    agencia: '',
    conta: '',
    chave_pix: '',
    numero_instrutor: '',
    contato: '',
    atividade: '',
    valor: '',
    dia_horario: '',
    localizacao: ''
  });

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para continuar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar se número do instrutor já existe
      const { data: existingInstructor } = await supabase
        .from('praiativa_instrutores')
        .select('numero_instrutor')
        .eq('numero_instrutor', formData.numero_instrutor)
        .single();

      if (existingInstructor) {
        throw new Error("Este número de instrutor já está em uso. Escolha outro número.");
      }

      // Salvar instrutor no banco
      const { error } = await supabase
        .from('praiativa_instrutores')
        .insert({
          nome: formData.nome,
          cpf_cnpj: formData.cpf_cnpj,
          banco: formData.banco,
          agencia: formData.agencia,
          conta: formData.conta,
          chave_pix: formData.chave_pix,
          numero_instrutor: formData.numero_instrutor,
          contato: formData.contato,
          atividade: formData.atividade,
          valor: formData.valor,
          dia_horario: formData.dia_horario,
          localizacao: formData.localizacao,
          user_id: session.user.id
        });

      if (error) throw error;

      toast({
        title: "Instrutor cadastrado!",
        description: "Dados salvos com sucesso. Redirecionando para o dashboard."
      });

      // Redirecionar para dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao cadastrar instrutor:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar instrutor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Waves className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PraiAtiva
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Cadastro de Instrutor
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados Pessoais */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>
                Informações básicas do instrutor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    placeholder="Digite o nome completo"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                  <Input
                    id="cpf_cnpj"
                    placeholder="000.000.000-00"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contato">Celular (WhatsApp) *</Label>
                  <Input
                    id="contato"
                    placeholder="(11) 99999-9999"
                    value={formData.contato}
                    onChange={(e) => setFormData({...formData, contato: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_instrutor">Número do Instrutor *</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="numero_instrutor"
                      placeholder="Ex: 001, 123, etc."
                      className="pl-10"
                      value={formData.numero_instrutor}
                      onChange={(e) => setFormData({...formData, numero_instrutor: e.target.value})}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Identificador único para vincular seus alunos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Bancários */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Dados Bancários
              </CardTitle>
              <CardDescription>
                Informações para recebimento dos pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco *</Label>
                  <Input
                    id="banco"
                    placeholder="Ex: Banco do Brasil, Caixa, etc."
                    value={formData.banco}
                    onChange={(e) => setFormData({...formData, banco: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agencia">Agência *</Label>
                  <Input
                    id="agencia"
                    placeholder="0000"
                    value={formData.agencia}
                    onChange={(e) => setFormData({...formData, agencia: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conta">Conta *</Label>
                  <Input
                    id="conta"
                    placeholder="00000-0"
                    value={formData.conta}
                    onChange={(e) => setFormData({...formData, conta: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chave_pix">Chave PIX *</Label>
                <Input
                  id="chave_pix"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  value={formData.chave_pix}
                  onChange={(e) => setFormData({...formData, chave_pix: e.target.value})}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados da Atividade */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Dados da Atividade
              </CardTitle>
              <CardDescription>
                Informações sobre os serviços oferecidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="atividade">Atividade/Serviço *</Label>
                <Input
                  id="atividade"
                  placeholder="Ex: Aula de SUP, Treino de Vôlei de Praia, etc."
                  value={formData.atividade}
                  onChange={(e) => setFormData({...formData, atividade: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor da Mensalidade (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dia_horario">Dia/Horário *</Label>
                  <Input
                    id="dia_horario"
                    placeholder="Ex: Seg/Qua/Sex 08:00"
                    value={formData.dia_horario}
                    onChange={(e) => setFormData({...formData, dia_horario: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização *</Label>
                  <Input
                    id="localizacao"
                    placeholder="Ex: Praia de Copacabana"
                    value={formData.localizacao}
                    onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="gradient-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Cadastrar Instrutor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstructorRegistrationPage;