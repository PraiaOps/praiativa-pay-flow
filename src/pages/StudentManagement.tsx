import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, Trash2, Mail, Phone, Calendar, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";

interface Aluno {
  id?: string;
  nome: string;
  email: string;
  whatsapp: string;
  valor_mensalidade: number;
  data_vencimento: string;
  numero_instrutor: string;
  created_at?: string;
}

interface Instrutor {
  instrutor_id: number;
  nome: string;
  numero_instrutor: string;
  valor: string;
  atividade: string;
}

const StudentManagementPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [instrutor, setInstrutor] = useState<Instrutor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Aluno>({
    nome: '',
    email: '',
    whatsapp: '',
    valor_mensalidade: 0,
    data_vencimento: '',
    numero_instrutor: ''
  });

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
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
        if (!session) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const carregarDados = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
      // Carregar dados do instrutor logado
      const { data: instrutorData, error: instrutorError } = await supabase
        .from('praiativa_instrutores')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (instrutorError) throw instrutorError;
      if (!instrutorData) {
        toast({
          title: "Instrutor não encontrado",
          description: "Você precisa se cadastrar como instrutor primeiro",
          variant: "destructive"
        });
        navigate('/instructor-registration');
        return;
      }

      setInstrutor(instrutorData);

      // Carregar alunos vinculados ao número do instrutor
      const { data: alunosData, error: alunosError } = await supabase
        .from('praiativa_alunos')
        .select('*')
        .eq('numero_instrutor', instrutorData.numero_instrutor)
        .order('created_at', { ascending: false });

      if (alunosError) throw alunosError;
      setAlunos(alunosData || []);

      // Inicializar form com dados do instrutor
      setFormData({
        nome: '',
        email: '',
        whatsapp: '',
        valor_mensalidade: parseFloat(instrutorData.valor) || 0,
        data_vencimento: '',
        numero_instrutor: instrutorData.numero_instrutor
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user || !instrutor) {
      toast({
        title: "Erro",
        description: "Sessão inválida",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('praiativa_alunos')
        .insert({
          nome: formData.nome,
          email: formData.email,
          whatsapp: formData.whatsapp,
          valor_mensalidade: formData.valor_mensalidade,
          data_vencimento: formData.data_vencimento,
          numero_instrutor: formData.numero_instrutor,
          user_id: session.user.id,
          // Campos legados para compatibilidade
          contato: formData.whatsapp,
          atividade: instrutor.atividade,
          valor: formData.valor_mensalidade.toString(),
          validade: formData.data_vencimento,
          contato_instrutor: instrutor.instrutor_id
        });

      if (error) throw error;

      toast({
        title: "Aluno adicionado!",
        description: `${formData.nome} foi cadastrado com sucesso.`
      });

      // Reset form
      setFormData({
        nome: '',
        email: '',
        whatsapp: '',
        valor_mensalidade: parseFloat(instrutor.valor) || 0,
        data_vencimento: '',
        numero_instrutor: instrutor.numero_instrutor
      });
      setShowForm(false);
      carregarDados();

    } catch (error: any) {
      console.error('Erro ao adicionar aluno:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar aluno",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removerAluno = async (alunoId: string, nomeAluno: string) => {
    if (!confirm(`Tem certeza que deseja remover o aluno ${nomeAluno}?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('praiativa_alunos')
        .delete()
        .match({ id: alunoId });

      if (error) throw error;

      toast({
        title: "Aluno removido",
        description: `${nomeAluno} foi removido com sucesso.`
      });

      carregarDados();

    } catch (error: any) {
      console.error('Erro ao remover aluno:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover aluno",
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Waves className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Gerenciar Alunos
            </h1>
          </div>
          {instrutor && (
            <p className="text-xl text-muted-foreground">
              Instrutor: {instrutor.nome} (#{instrutor.numero_instrutor})
            </p>
          )}
        </div>

        {/* Navegação */}
        <div className="flex gap-4 mb-8 justify-center">
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline"
          >
            Voltar ao Dashboard
          </Button>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className="gradient-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Cancelar' : 'Adicionar Aluno'}
          </Button>
        </div>

        {/* Formulário de Cadastro */}
        {showForm && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Novo Aluno
              </CardTitle>
              <CardDescription>
                Adicione um novo aluno ao seu grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={adicionarAluno} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      placeholder="Digite o nome do aluno"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="aluno@email.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_mensalidade">Valor Mensalidade (R$) *</Label>
                    <Input
                      id="valor_mensalidade"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.valor_mensalidade}
                      onChange={(e) => setFormData({...formData, valor_mensalidade: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="data_vencimento"
                        type="date"
                        className="pl-10"
                        value={formData.data_vencimento}
                        onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="gradient-primary"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : 'Cadastrar Aluno'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Alunos */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Alunos Cadastrados ({alunos.length})
            </CardTitle>
            <CardDescription>
              Gerencie todos os alunos vinculados ao seu número de instrutor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alunos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell className="font-medium">{aluno.nome}</TableCell>
                      <TableCell>{aluno.email}</TableCell>
                      <TableCell>
                        <a 
                          href={`https://wa.me/55${aluno.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {aluno.whatsapp}
                        </a>
                      </TableCell>
                      <TableCell>R$ {aluno.valor_mensalidade?.toFixed(2) || '0,00'}</TableCell>
                      <TableCell>
                        {aluno.data_vencimento ? new Date(aluno.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => aluno.id && removerAluno(aluno.id, aluno.nome)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum aluno cadastrado ainda.</p>
                <p className="text-sm">Clique em "Adicionar Aluno" para começar.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentManagementPage;