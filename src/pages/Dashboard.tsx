import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Users, Settings, Receipt, QrCode, Link, Calendar, DollarSign, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Instrutor {
  instrutor_id: number;
  nome: string;
  contato: string;
  atividade: string;
  valor: string;
  dia_horario: string;
  localizacao: string;
}

interface Aluno {
  nome: string;
  contato: string;
  atividade: string;
  valor: string;
  validade: string;
  contato_instrutor: number;
  data_emissao?: string;
  data_vencimento?: string;
}

const DashboardPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [instrutorSelecionado, setInstrutorSelecionado] = useState<Instrutor | null>(null);
  const [valorPadrao, setValorPadrao] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar instrutores
      const { data: instrutoresData, error: instrutoresError } = await supabase
        .from('praiativa_instrutores')
        .select('*')
        .order('created_at', { ascending: false });

      if (instrutoresError) throw instrutoresError;
      setInstrutores(instrutoresData || []);

      // Carregar alunos
      const { data: alunosData, error: alunosError } = await supabase
        .from('praiativa_alunos')
        .select('*')
        .order('created_at', { ascending: false });

      if (alunosError) throw alunosError;
      setAlunos(alunosData || []);

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

  const gerarCobranca = async (aluno: Aluno) => {
    if (!dataEmissao || !dataVencimento) {
      toast({
        title: "Erro",
        description: "Informe as datas de emissão e vencimento",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simular geração de código PIX
      const codigoPix = `PIX${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      const linkPagamento = `https://praiativa.com/pagar/${codigoPix}`;

      toast({
        title: "Cobrança Gerada!",
        description: (
          <div className="space-y-2">
            <p><strong>Código PIX:</strong> {codigoPix}</p>
            <p><strong>Link:</strong> <a href={linkPagamento} className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">{linkPagamento}</a></p>
            <p><strong>Valor:</strong> R$ {aluno.valor}</p>
            <p><strong>Vencimento:</strong> {dataVencimento}</p>
          </div>
        )
      });

      // Aqui você pode integrar com um sistema real de PIX ou gateway de pagamento
      // Por exemplo: Mercado Pago, PagSeguro, etc.

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
    ? alunos.filter(aluno => aluno.contato_instrutor === parseInt(instrutorSelecionado.contato))
    : [];

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
            Gerencie seus instrutores, alunos e cobranças
          </p>
        </div>

        {/* Botões de navegação */}
        <div className="flex gap-4 mb-8 justify-center">
          <Button 
            onClick={() => navigate('/pagamento')} 
            className="gradient-primary"
          >
            Novo Cadastro
          </Button>
          <Button 
            onClick={() => navigate('/')} 
            variant="outline"
          >
            Voltar ao Início
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seção de Instrutores */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Instrutores Cadastrados ({instrutores.length})
              </CardTitle>
              <CardDescription>
                Clique em um instrutor para ver seus alunos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {instrutores.map((instrutor) => (
                  <div 
                    key={instrutor.instrutor_id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      instrutorSelecionado?.instrutor_id === instrutor.instrutor_id 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setInstrutorSelecionado(instrutor)}
                  >
                    <h3 className="font-semibold">{instrutor.nome}</h3>
                    <p className="text-sm text-muted-foreground">{instrutor.atividade}</p>
                    <p className="text-sm text-muted-foreground">Valor: R$ {instrutor.valor}</p>
                    <p className="text-sm text-muted-foreground">Contato: {instrutor.contato}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seção de Configurações */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configurações
              </CardTitle>
              <CardDescription>
                Configure valores padrão e datas de cobrança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {instrutorSelecionado && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Instrutor Selecionado:</p>
                  <p className="text-sm">{instrutorSelecionado.nome}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valor-padrao">Novo Valor Padrão (R$)</Label>
                  <Input
                    id="valor-padrao"
                    type="number"
                    placeholder="0,00"
                    value={valorPadrao}
                    onChange={(e) => setValorPadrao(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={atualizarValorPadrao}
                  disabled={!instrutorSelecionado}
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
            </CardContent>
          </Card>
        </div>

        {/* Seção de Alunos */}
        {instrutorSelecionado && (
          <Card className="shadow-card mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Alunos de {instrutorSelecionado.nome} ({alunosDoInstrutor.length})
              </CardTitle>
              <CardDescription>
                Gerencie as cobranças dos alunos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alunosDoInstrutor.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Atividade</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunosDoInstrutor.map((aluno, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{aluno.nome}</TableCell>
                        <TableCell>{aluno.contato}</TableCell>
                        <TableCell>{aluno.atividade}</TableCell>
                        <TableCell>R$ {aluno.valor}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => gerarCobranca(aluno)}
                              disabled={!dataEmissao || !dataVencimento}
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              PIX
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => gerarCobranca(aluno)}
                              disabled={!dataEmissao || !dataVencimento}
                            >
                              <Link className="h-4 w-4 mr-1" />
                              Link
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum aluno cadastrado para este instrutor.
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