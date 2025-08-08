import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Users, User, CreditCard, CheckCircle, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Instrutor {
  nome: string;
  contato: string;
  atividade: string;
  valor: string;
  frequencia: string;
}

interface Aluno {
  nome: string;
  contato: string;
  atividade: string;
  valor: string;
  dataEmissao?: string;
  dataVencimento?: string;
}

const PagamentoPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<'instrutor' | 'alunos' | 'pagamento' | 'sucesso'>('instrutor');
  const [instrutor, setInstrutor] = useState<Instrutor>({
    nome: '',
    contato: '',
    atividade: '',
    valor: '',
    frequencia: 'por-aula'
  });
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoAtual, setAlunoAtual] = useState<Aluno>({
    nome: '',
    contato: '',
    atividade: '',
    valor: '',
    dataEmissao: '',
    dataVencimento: ''
  });
  const [loading, setLoading] = useState(false);

  const adicionarAluno = () => {
    if (!alunoAtual.nome || !alunoAtual.contato) {
      toast({
        title: "Erro",
        description: "Nome e contato do aluno são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setAlunos([...alunos, { ...alunoAtual }]);
    setAlunoAtual({
      nome: '',
      contato: '',
      atividade: instrutor.atividade,
      valor: instrutor.valor,
      dataEmissao: '',
      dataVencimento: ''
    });

    toast({
      title: "Aluno adicionado!",
      description: `${alunoAtual.nome} foi adicionado à lista.`
    });
  };

  const processarPagamento = async () => {
    setLoading(true);
    try {
      // Verificar se usuário está logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para continuar",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Salvar instrutor no banco
      const { data: instrutorData, error: instrutorError } = await supabase
        .from('praiativa_instrutores')
        .insert({
          nome: instrutor.nome,
          contato: instrutor.contato,
          atividade: instrutor.atividade,
          valor: instrutor.valor,
          dia_horario: instrutor.frequencia,
          localizacao: 'A definir',
          user_id: session.user.id
        })
        .select()
        .single();

      if (instrutorError) throw instrutorError;

      // Salvar alunos no banco com o valor do instrutor
      for (const aluno of alunos) {
        const { error: alunoError } = await supabase
          .from('praiativa_alunos')
          .insert({
            nome: aluno.nome,
            contato: aluno.contato,
            atividade: aluno.atividade,
            valor: instrutor.valor, // Usar valor do instrutor
            contato_instrutor: instrutorData.instrutor_id,
            validade: 'A definir',
            user_id: session.user.id
          });

        if (alunoError) throw alunoError;
      }

      // Criar sessão de pagamento Stripe usando valor do instrutor
      const valorPorAluno = parseFloat(instrutor.valor || '0');
      const valorTotal = alunos.length * valorPorAluno;
      
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: Math.round(valorTotal * 100), // Converter para centavos
          currency: 'brl',
          description: `Pagamento PraiAtiva - ${instrutor.nome}`,
          instructor_id: instrutorData.instrutor_id,
          students: alunos
        }
      });

      if (checkoutError) throw checkoutError;

      // Redirecionar para Stripe Checkout
      if (checkoutData?.url) {
        window.open(checkoutData.url, '_blank');
        setEtapa('sucesso');
      }

    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast({
        title: "Erro no pagamento",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const proximaEtapa = () => {
    if (etapa === 'instrutor') {
      if (!instrutor.nome || !instrutor.contato || !instrutor.atividade || !instrutor.valor) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }
      setAlunoAtual({
        nome: '',
        contato: '',
        atividade: instrutor.atividade,
        valor: instrutor.valor, // Manter valor do instrutor
        dataEmissao: '',
        dataVencimento: ''
      });
      setEtapa('alunos');
    } else if (etapa === 'alunos') {
      if (alunos.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um aluno antes de continuar",
          variant: "destructive"
        });
        return;
      }
      setEtapa('pagamento');
    }
  };

  const voltarEtapa = () => {
    if (etapa === 'alunos') setEtapa('instrutor');
    else if (etapa === 'pagamento') setEtapa('alunos');
  };

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
            Sistema de Pagamentos - Cadastro de Instrutores e Alunos
          </p>
        </div>

        {/* Indicador de Progresso */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            etapa === 'instrutor' ? 'bg-primary text-primary-foreground' : 
            ['alunos', 'pagamento', 'sucesso'].includes(etapa) ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <User className="h-4 w-4" />
            <span className="font-medium">Instrutor</span>
          </div>
          <div className="h-px w-8 bg-border"></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            etapa === 'alunos' ? 'bg-primary text-primary-foreground' : 
            ['pagamento', 'sucesso'].includes(etapa) ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <Users className="h-4 w-4" />
            <span className="font-medium">Alunos</span>
          </div>
          <div className="h-px w-8 bg-border"></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            etapa === 'pagamento' ? 'bg-primary text-primary-foreground' : 
            etapa === 'sucesso' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <CreditCard className="h-4 w-4" />
            <span className="font-medium">Pagamento</span>
          </div>
        </div>

        {/* Etapa 1: Cadastro do Instrutor */}
        {etapa === 'instrutor' && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Cadastro do Instrutor
              </CardTitle>
              <CardDescription>
                Preencha os dados do instrutor de atividades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    placeholder="Digite o nome completo"
                    value={instrutor.nome}
                    onChange={(e) => setInstrutor({...instrutor, nome: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contato">Celular (WhatsApp) *</Label>
                  <Input
                    id="contato"
                    placeholder="(11) 99999-9999"
                    value={instrutor.contato}
                    onChange={(e) => setInstrutor({...instrutor, contato: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="atividade">Atividade/Serviço *</Label>
                <Input
                  id="atividade"
                  placeholder="Ex: Aula de SUP, Treino de Vôlei de Praia, etc."
                  value={instrutor.atividade}
                  onChange={(e) => setInstrutor({...instrutor, atividade: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor do Serviço (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    placeholder="0,00"
                    value={instrutor.valor}
                    onChange={(e) => setInstrutor({...instrutor, valor: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequencia">Frequência de Pagamento *</Label>
                  <Select value={instrutor.frequencia} onValueChange={(value) => setInstrutor({...instrutor, frequencia: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="por-aula">Por Aula</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="pacote">Pacote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={proximaEtapa} className="gradient-primary">
                  Próxima Etapa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Cadastro de Alunos */}
        {etapa === 'alunos' && (
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Cadastro de Alunos
                </CardTitle>
                <CardDescription>
                  Adicione os alunos que irão contratar o serviço de {instrutor.nome}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome-aluno">Nome do Aluno *</Label>
                    <Input
                      id="nome-aluno"
                      placeholder="Digite o nome do aluno"
                      value={alunoAtual.nome}
                      onChange={(e) => setAlunoAtual({...alunoAtual, nome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contato-aluno">Celular do Aluno *</Label>
                    <Input
                      id="contato-aluno"
                      placeholder="(11) 99999-9999"
                      value={alunoAtual.contato}
                      onChange={(e) => setAlunoAtual({...alunoAtual, contato: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="atividade-aluno">Atividade</Label>
                    <Input
                      id="atividade-aluno"
                      value={alunoAtual.atividade || instrutor.atividade}
                      onChange={(e) => setAlunoAtual({...alunoAtual, atividade: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor-aluno">Valor (R$)</Label>
                    <Input
                      id="valor-aluno"
                      type="number"
                      value={instrutor.valor}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O valor é igual ao cadastrado pelo instrutor
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="data-emissao">Data de Emissão</Label>
                    <Input
                      id="data-emissao"
                      type="date"
                      value={alunoAtual.dataEmissao}
                      onChange={(e) => setAlunoAtual({...alunoAtual, dataEmissao: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data-vencimento">Data de Vencimento</Label>
                    <Input
                      id="data-vencimento"
                      type="date"
                      value={alunoAtual.dataVencimento}
                      onChange={(e) => setAlunoAtual({...alunoAtual, dataVencimento: e.target.value})}
                    />
                  </div>
                </div>

                <Button onClick={adicionarAluno} variant="secondary" className="w-full">
                  Adicionar Aluno
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Alunos Adicionados */}
            {alunos.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Alunos Cadastrados ({alunos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alunos.map((aluno, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{aluno.nome}</p>
                          <p className="text-sm text-muted-foreground">{aluno.contato}</p>
                          <p className="text-sm text-muted-foreground">{aluno.atividade} - R$ {instrutor.valor}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setAlunos(alunos.filter((_, i) => i !== index))}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total: R$ {(alunos.length * parseFloat(instrutor.valor || '0')).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={voltarEtapa}>
                Voltar
              </Button>
              <Button onClick={proximaEtapa} className="gradient-primary">
                Ir para Pagamento
              </Button>
            </div>
          </div>
        )}

        {/* Etapa 3: Pagamento */}
        {etapa === 'pagamento' && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Finalizar Pagamento
              </CardTitle>
              <CardDescription>
                Confirme os dados e proceda com o pagamento via Stripe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">Resumo do Pedido</h3>
                
                <div className="space-y-2">
                  <p><span className="font-medium">Instrutor:</span> {instrutor.nome}</p>
                  <p><span className="font-medium">Atividade:</span> {instrutor.atividade}</p>
                  <p><span className="font-medium">Contato:</span> {instrutor.contato}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="font-medium">Alunos cadastrados ({alunos.length}):</p>
                  {alunos.map((aluno, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{aluno.nome}</span>
                      <span>R$ {parseFloat(aluno.valor || '0').toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total a Pagar:</span>
                  <span className="text-primary">R$ {alunos.reduce((total, aluno) => total + parseFloat(aluno.valor || '0'), 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={voltarEtapa}>
                  Voltar
                </Button>
                <Button 
                  onClick={processarPagamento} 
                  className="gradient-primary"
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Pagar com Stripe'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 4: Sucesso */}
        {etapa === 'sucesso' && (
          <Card className="shadow-card text-center">
            <CardContent className="pt-6 pb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Cadastro Realizado com Sucesso!</h2>
              <p className="text-muted-foreground mb-6">
                O instrutor e alunos foram cadastrados. O pagamento está sendo processado via Stripe.
              </p>
              <p className="text-sm text-muted-foreground">
                Você receberá uma confirmação por email assim que o pagamento for processado.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="gradient-primary mt-6"
              >
                Fazer Novo Cadastro
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PagamentoPage;