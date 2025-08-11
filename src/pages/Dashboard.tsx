import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Users, Settings, Receipt, QrCode, Link, Calendar, DollarSign, Waves, LogOut, Plus, MessageCircle, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";

interface Instrutor {
  instrutor_id: number;
  nome: string;
  contato: string;
  atividade: string;
  valor: string;
  dia_horario: string;
  localizacao: string;
  numero_instrutor: string;
  cpf_cnpj?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  chave_pix?: string;
}

interface Aluno {
  id?: string;
  nome: string;
  contato: string;
  email?: string;
  whatsapp?: string;
  atividade: string;
  valor: string;
  valor_mensalidade?: number;
  validade: string;
  data_vencimento?: string;
  contato_instrutor: number;
  numero_instrutor?: string;
  data_emissao?: string;
}

const DashboardPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [instrutorSelecionado, setInstrutorSelecionado] = useState<Instrutor | null>(null);
  const [valorPadrao, setValorPadrao] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      } else {
        carregarDados();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const carregarDados = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Carregar dados do instrutor logado
      const { data: instrutorData, error: instrutorError } = await supabase
        .from('praiativa_instrutores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (instrutorError && instrutorError.code !== 'PGRST116') throw instrutorError;
      
      if (instrutorData) {
        setInstrutores([instrutorData]);
        setInstrutorSelecionado(instrutorData);

        // Carregar alunos vinculados ao número do instrutor
        const { data: alunosData, error: alunosError } = await supabase
          .from('praiativa_alunos')
          .select('*')
          .eq('numero_instrutor', instrutorData.numero_instrutor)
          .order('created_at', { ascending: false });

        if (alunosError) throw alunosError;
        setAlunos(alunosData || []);
      } else {
        // Instrutor não cadastrado
        setInstrutores([]);
        setAlunos([]);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarValorPadrao = async () => {
    if (!instrutorSelecionado || !valorPadrao) {
      toast({
        title: "Erro",
        description: "Selecione um instrutor e informe o valor padrão",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('praiativa_instrutores')
        .update({ valor: valorPadrao })
        .eq('instrutor_id', instrutorSelecionado.instrutor_id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Valor padrão atualizado com sucesso!"
      });

      carregarDados();
      setValorPadrao("");
    } catch (error) {
      console.error('Erro ao atualizar valor:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar valor padrão",
        variant: "destructive"
      });
    }
  };

  const gerarCobranca = async (aluno: Aluno, tipoPagamento: 'pix' | 'link' | 'boleto') => {
    if (!dataEmissao || !dataVencimento) {
      toast({
        title: "Erro",
        description: "Informe as datas de emissão e vencimento",
        variant: "destructive"
      });
      return;
    }

    try {
      const valorAluno = aluno.valor_mensalidade || parseFloat(aluno.valor);
      const valorEmCentavos = Math.round(valorAluno * 100);
      
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: valorEmCentavos,
          currency: 'brl',
          description: `${aluno.atividade} - ${aluno.nome} - Mensalidade`,
          instructor_id: instrutorSelecionado?.instrutor_id,
          students: [aluno],
          payment_type: tipoPagamento,
          due_date: dataVencimento,
          issue_date: dataEmissao
        }
      });

      if (checkoutError) throw checkoutError;

      if (checkoutData?.url) {
        // Abrir link do Stripe em nova aba
        window.open(checkoutData.url, '_blank');
        
        toast({
          title: `${tipoPagamento.toUpperCase()} Gerado!`,
          description: (
            <div className="space-y-2">
              <p><strong>Aluno:</strong> {aluno.nome}</p>
              <p><strong>Valor:</strong> R$ {valorAluno.toFixed(2)}</p>
              <p><strong>Emissão:</strong> {new Date(dataEmissao).toLocaleDateString('pt-BR')}</p>
              <p><strong>Vencimento:</strong> {new Date(dataVencimento).toLocaleDateString('pt-BR')}</p>
              <p>Link de pagamento aberto em nova aba</p>
            </div>
          )
        });
      }

    } catch (error) {
      console.error('Erro ao gerar cobrança:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar cobrança",
        variant: "destructive"
      });
    }
  };

  const alunosDoInstrutor = instrutorSelecionado 
    ? alunos.filter(aluno => 
        aluno.numero_instrutor === instrutorSelecionado.numero_instrutor ||
        aluno.contato_instrutor === instrutorSelecionado.instrutor_id
      )
    : [];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Show loading or redirect if not authenticated
  if (!session || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Waves className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PraiAtiva Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            {instrutorSelecionado ? `Instrutor: ${instrutorSelecionado.nome} (#${instrutorSelecionado.numero_instrutor})` : 'Sistema de Gestão de Instrutores'}
          </p>
        </div>

        {/* Botões de navegação */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          {!instrutorSelecionado ? (
            <Button 
              onClick={() => navigate('/instructor-registration')} 
              className="gradient-primary"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar Instrutor
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => navigate('/student-management')} 
                className="gradient-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Gerenciar Alunos
              </Button>
              <Button 
                onClick={() => window.open('https://wa.me/5521991732847', '_blank')} 
                variant="secondary"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </>
          )}
          <Button 
            onClick={() => navigate('/')} 
            variant="outline"
          >
            Voltar ao Início
          </Button>
          <Button 
            onClick={handleLogout} 
            variant="destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Mensagem se instrutor não cadastrado */}
        {!instrutorSelecionado && (
          <Card className="shadow-card mb-8">
            <CardContent className="text-center py-12">
              <UserPlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Bem-vindo ao PraiAtiva!</h3>
              <p className="text-muted-foreground mb-6">
                Para começar a gerenciar seus alunos e gerar cobranças, você precisa se cadastrar como instrutor.
              </p>
              <Button 
                onClick={() => navigate('/instructor-registration')} 
                className="gradient-primary"
                size="lg"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Fazer Cadastro de Instrutor
              </Button>
            </CardContent>
          </Card>
        )}

        {instrutorSelecionado && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dados do Instrutor */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Meus Dados
                </CardTitle>
                <CardDescription>
                  Informações do instrutor logado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nome</p>
                      <p className="font-semibold">{instrutorSelecionado.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Número</p>
                      <p className="font-semibold">#{instrutorSelecionado.numero_instrutor}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Atividade</p>
                      <p className="font-semibold">{instrutorSelecionado.atividade}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor Mensalidade</p>
                      <p className="font-semibold">R$ {instrutorSelecionado.valor}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Horários</p>
                    <p className="font-semibold">{instrutorSelecionado.dia_horario}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Localização</p>
                    <p className="font-semibold">{instrutorSelecionado.localizacao}</p>
                  </div>
                  {instrutorSelecionado.chave_pix && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Chave PIX</p>
                      <p className="font-mono text-sm bg-muted p-2 rounded">{instrutorSelecionado.chave_pix}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Seção de Configurações de Cobrança */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Configurações de Cobrança
                </CardTitle>
                <CardDescription>
                  Configure valores e datas de cobrança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor-padrao">Novo Valor Padrão (R$)</Label>
                    <Input
                      id="valor-padrao"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={valorPadrao}
                      onChange={(e) => setValorPadrao(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={atualizarValorPadrao}
                    className="w-full"
                    variant="secondary"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Atualizar Valor Padrão
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Datas para Cobrança</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data-emissao">Data de Emissão</Label>
                      <Input
                        id="data-emissao"
                        type="date"
                        value={dataEmissao}
                        onChange={(e) => setDataEmissao(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data-vencimento">Data de Vencimento</Label>
                      <Input
                        id="data-vencimento"
                        type="date"
                        value={dataVencimento}
                        onChange={(e) => setDataVencimento(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">WhatsApp e Chatbot</h3>
                  <p className="text-sm text-muted-foreground">
                    Links de comunicação direta
                  </p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => window.open('https://wa.me/5521991732847', '_blank')}
                      variant="outline"
                      className="w-full"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Conversar no WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seção de Alunos */}
        {instrutorSelecionado && (
          <Card className="shadow-card mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Meus Alunos ({alunosDoInstrutor.length})
              </CardTitle>
              <CardDescription>
                Gerencie as cobranças dos seus alunos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alunosDoInstrutor.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Mensalidade</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alunosDoInstrutor.map((aluno, index) => (
                        <TableRow key={aluno.id || index}>
                          <TableCell className="font-medium">{aluno.nome}</TableCell>
                          <TableCell>
                            {aluno.whatsapp ? (
                              <a 
                                href={`https://wa.me/55${aluno.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {aluno.whatsapp}
                              </a>
                            ) : (
                              aluno.contato
                            )}
                          </TableCell>
                          <TableCell>{aluno.email || '-'}</TableCell>
                          <TableCell>
                            R$ {(aluno.valor_mensalidade || parseFloat(aluno.valor) || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {aluno.data_vencimento ? 
                              new Date(aluno.data_vencimento).toLocaleDateString('pt-BR') : 
                              (aluno.validade !== 'A definir' ? aluno.validade : '-')
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Button
                                size="sm"
                                onClick={() => gerarCobranca(aluno, 'pix')}
                                disabled={!dataEmissao || !dataVencimento}
                              >
                                <QrCode className="h-3 w-3 mr-1" />
                                PIX
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => gerarCobranca(aluno, 'link')}
                                disabled={!dataEmissao || !dataVencimento}
                              >
                                <Link className="h-3 w-3 mr-1" />
                                Link
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => gerarCobranca(aluno, 'boleto')}
                                disabled={!dataEmissao || !dataVencimento}
                              >
                                <Receipt className="h-3 w-3 mr-1" />
                                Boleto
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="text-center pt-4">
                    <Button 
                      onClick={() => navigate('/student-management')} 
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Gerenciar Alunos
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Nenhum aluno cadastrado ainda.</p>
                  <Button 
                    onClick={() => navigate('/student-management')} 
                    className="gradient-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Aluno
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;