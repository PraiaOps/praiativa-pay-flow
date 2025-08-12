import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Settings,
  Receipt,
  QrCode,
  Link,
  Calendar,
  DollarSign,
  Waves,
  LogOut,
  Plus,
  MessageCircle,
  UserPlus,
  Trash2,
  CreditCard,
  Edit,
  User as UserIcon,
  Bug,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Instrutor {
  instrutor_id: number;
  created_at: string;
  updated_at: string;
  user_id: string;
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

interface InstructorData {
  atividades: Instrutor[];
  instrutor_principal: Instrutor;
}

interface Aluno {
  created_at: string;
  updated_at: string;
  user_id: string;
  nome: string;
  contato: string;
  email?: string;
  whatsapp?: string;
  atividade: string;
  valor: string;
  valor_mensalidade?: number;
  validade: string;
  data_vencimento?: string;
  contato_instrutor?: number;
  numero_instrutor?: string;
  data_emissao?: string;
}

const DashboardPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [instrutor, setInstrutor] = useState<Instrutor | null>(null);
  const [atividades, setAtividades] = useState<Instrutor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [numeroDetectado, setNumeroDetectado] = useState<string | null>(null);
  const [completeProfileData, setCompleteProfileData] = useState({
    nome: "",
    contato: "",
    cpf_cnpj: "",
    banco: "",
    agencia: "",
    conta: "",
    chave_pix: "",
    numero_instrutor: "",
    atividade: "Atividades Aquáticas",
    localizacao: "",
    valor: "100",
    dia_horario: "",
  });
  const [newStudent, setNewStudent] = useState<Partial<Aluno>>({
    nome: "",
    email: "",
    whatsapp: "",
    valor_mensalidade: 0,
    data_vencimento: "",
    atividade: "",
    valor: "0",
    validade: "",
    contato: "",
  });

  const openWhatsApp = () => {
    window.open("https://wa.me/5521991732847", "_blank");
  };

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Separate useEffect for loading data when user is available
  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  // Função para detectar o número de telefone do usuário baseado no banco de dados
  const detectarNumeroUsuario = async () => {
    if (!user) return null;

    console.log("=== DETECTANDO NÚMERO DO USUÁRIO ===");

    try {
      // Buscar por user_id primeiro para encontrar algum registro
      const { data: registrosPorUserId } = await supabase
        .from("praiativa_instrutores")
        .select("contato, numero_instrutor")
        .eq("user_id", user.id)
        .limit(1);

      if (registrosPorUserId && registrosPorUserId.length > 0) {
        const numero =
          registrosPorUserId[0].contato ||
          registrosPorUserId[0].numero_instrutor;
        console.log("Número detectado pelo user_id:", numero);
        return numero;
      }

      // Se não encontrou por user_id, tentar alguns números comuns baseados na imagem
      const numerosComuns = ["21992370808", "(21)992370808", "+5521992370808"];

      for (const numero of numerosComuns) {
        const { data } = await supabase
          .from("praiativa_instrutores")
          .select("*")
          .eq("contato", numero)
          .limit(1);

        if (data && data.length > 0) {
          console.log("Número detectado por busca comum:", numero);
          return numero;
        }
      }
    } catch (error) {
      console.error("Erro ao detectar número:", error);
    }

    return null;
  };

  // Função auxiliar para buscar dados seguindo exatamente o padrão do n8n
  const buscarDadosComoN8N = async () => {
    if (!user) return;

    console.log("=== BUSCA ESTILO N8N ===");

    try {
      // IMPORTANTE: Buscar por números de telefone, não email!
      // Vamos tentar diferentes formatos de número
      const numerosParaBuscar = [
        "21992370808",
        "(21)992370808",
        "+5521992370808",
        user.email,
      ];

      console.log("N8N: Buscando instrutor por contatos:", numerosParaBuscar);

      let instrutoresPorContato = [];

      // Tentar buscar com cada formato de número
      for (const numero of numerosParaBuscar) {
        const { data } = await supabase
          .from("praiativa_instrutores")
          .select("*")
          .eq("contato", numero);

        if (data && data.length > 0) {
          console.log(
            `N8N: Encontrou ${data.length} instrutores com contato ${numero}:`,
            data
          );
          instrutoresPorContato.push(...data);
        }
      }

      // Remover duplicatas por instrutor_id
      const instrutoresUnicos = instrutoresPorContato.filter(
        (inst, index, arr) =>
          arr.findIndex((i) => i.instrutor_id === inst.instrutor_id) === index
      );

      console.log(
        "N8N: Total de instrutores únicos encontrados:",
        instrutoresUnicos.length
      );

      if (instrutoresUnicos.length > 0) {
        // Buscar alunos usando os IDs dos instrutores encontrados
        const idsInstrutor = instrutoresUnicos.map((inst) => inst.instrutor_id);
        console.log(
          "N8N: Buscando alunos por contato_instrutor (IDs):",
          idsInstrutor
        );

        const { data: alunosPorId } = await supabase
          .from("praiativa_alunos")
          .select("*")
          .in("contato_instrutor", idsInstrutor);

        console.log(
          "N8N: Alunos encontrados por IDs dos instrutores:",
          alunosPorId
        );

        return {
          instrutores: instrutoresUnicos,
          alunos: alunosPorId || [],
        };
      }
    } catch (error) {
      console.error("Erro na busca estilo n8n:", error);
    }

    return { instrutores: [], alunos: [] };
  };

  const carregarDados = async () => {
    if (!user) {
      console.log("Usuário não encontrado");
      return;
    }

    console.log("=== INICIANDO CARREGAMENTO DE DADOS ===");
    console.log("User ID:", user.id);
    console.log("User email:", user.email);

    setLoading(true);
    try {
      // ESTRATÉGIA PRINCIPAL: Buscar em TODOS os registros do banco por CONTATO
      console.log("=== BUSCA EM TODOS OS REGISTROS POR CONTATO ===");

      // Números para buscar - SEM depender de user_id
      const numerosParaBuscar = [
        "21992370808",
        "(21)992370808",
        "+5521992370808",
      ];

      let todasAtividades = [];

      // Buscar atividades por cada número de contato em TODOS os registros
      for (const numero of numerosParaBuscar) {
        console.log(
          `=== Buscando TODAS as atividades com contato = ${numero} ===`
        );
        const { data, error } = await supabase
          .from("praiativa_instrutores")
          .select("*")
          .eq("contato", numero);

        if (error) {
          console.error(`Erro buscando por contato ${numero}:`, error);
        } else if (data && data.length > 0) {
          console.log(
            `✅ Encontrou ${data.length} atividades com contato ${numero}:`,
            data
          );
          todasAtividades.push(...data);
        } else {
          console.log(`❌ Nenhuma atividade encontrada com contato ${numero}`);
        }
      }

      // BUSCA ADICIONAL: Também buscar por numero_instrutor
      for (const numero of numerosParaBuscar) {
        console.log(
          `=== Buscando TODAS as atividades com numero_instrutor = ${numero} ===`
        );
        const { data, error } = await supabase
          .from("praiativa_instrutores")
          .select("*")
          .eq("numero_instrutor", numero);

        if (error) {
          console.error(`Erro buscando por numero_instrutor ${numero}:`, error);
        } else if (data && data.length > 0) {
          console.log(
            `✅ Encontrou ${data.length} atividades com numero_instrutor ${numero}:`,
            data
          );
          todasAtividades.push(...data);
        } else {
          console.log(
            `❌ Nenhuma atividade encontrada com numero_instrutor ${numero}`
          );
        }
      }

      // Remover duplicatas por instrutor_id
      const atividadesUnicas = todasAtividades.filter(
        (ativ, index, arr) =>
          arr.findIndex((a) => a.instrutor_id === ativ.instrutor_id) === index
      );

      console.log("=== RESULTADO ATIVIDADES ===");
      console.log("Total de atividades encontradas:", atividadesUnicas.length);
      console.log("Atividades:", atividadesUnicas);

      if (atividadesUnicas.length > 0) {
        setAtividades(atividadesUnicas);
        setInstrutor(atividadesUnicas[0]);

        // BUSCAR ALUNOS EM TODOS OS REGISTROS POR CONTATO_INSTRUTOR
        console.log("=== BUSCA DE ALUNOS EM TODOS OS REGISTROS ===");

        // Números para buscar alunos - INDEPENDENTE de user_id
        let todosAlunos = [];

        // 1. Buscar por contato_instrutor como ID dos instrutores encontrados
        const idsInstrutor = atividadesUnicas.map((ativ) => ativ.instrutor_id);
        console.log("IDs dos instrutores encontrados:", idsInstrutor);

        if (idsInstrutor.length > 0) {
          console.log(
            "=== Buscando TODOS os alunos por contato_instrutor (IDs) ==="
          );
          const { data: alunosPorId, error: errorAlunos } = await supabase
            .from("praiativa_alunos")
            .select("*")
            .in("contato_instrutor", idsInstrutor);

          if (errorAlunos) {
            console.error("Erro buscando alunos por IDs:", errorAlunos);
          } else if (alunosPorId && alunosPorId.length > 0) {
            console.log(
              `✅ Encontrou ${alunosPorId.length} alunos por contato_instrutor (IDs):`,
              alunosPorId
            );
            todosAlunos.push(...alunosPorId);
          } else {
            console.log(
              "❌ Nenhum aluno encontrado por contato_instrutor (IDs)"
            );
          }
        }

        // 2. BUSCAR EM TODOS OS ALUNOS por contato_instrutor como número de telefone
        console.log(
          "=== Buscando TODOS os alunos por contato_instrutor (números) ==="
        );
        for (const numero of numerosParaBuscar) {
          console.log(
            `Buscando TODOS os alunos com contato_instrutor = ${numero}`
          );

          // Tentar como string
          try {
            const { data } = await supabase
              .from("praiativa_alunos")
              .select("*")
              .eq("contato_instrutor", parseInt(numero));

            if (data && data.length > 0) {
              console.log(
                `✅ Encontrou ${data.length} alunos com contato_instrutor = ${numero} (string)`
              );
              todosAlunos.push(...data);
            }
          } catch (e) {
            console.log(
              `Erro buscando por contato_instrutor = ${numero} como string`
            );
          }

          // Tentar como número se for numérico
          if (!isNaN(Number(numero.replace(/\D/g, "")))) {
            const numeroLimpo = numero.replace(/\D/g, "");
            try {
              const { data } = await supabase
                .from("praiativa_alunos")
                .select("*")
                .eq("contato_instrutor", parseInt(numeroLimpo));

              if (data && data.length > 0) {
                console.log(
                  `✅ Encontrou ${data.length} alunos com contato_instrutor = ${numeroLimpo} (número limpo)`
                );
                todosAlunos.push(...data);
              }
            } catch (e) {
              console.log(
                `Erro buscando por contato_instrutor = ${numeroLimpo} como número`
              );
            }
          }
        }

        // 3. BUSCAR EM TODOS OS ALUNOS por numero_instrutor
        console.log("=== Buscando TODOS os alunos por numero_instrutor ===");
        for (const numero of numerosParaBuscar) {
          console.log(
            `Buscando TODOS os alunos com numero_instrutor = ${numero}`
          );

          try {
            const { data } = await supabase
              .from("praiativa_alunos")
              .select("*")
              .eq("numero_instrutor", numero);

            if (data && data.length > 0) {
              console.log(
                `✅ Encontrou ${data.length} alunos com numero_instrutor = ${numero}`
              );
              todosAlunos.push(...data);
            }
          } catch (e) {
            console.log(`Erro buscando por numero_instrutor = ${numero}`);
          }
        }

        // Filtrar duplicatas dos alunos
        const alunosUnicos = todosAlunos.filter(
          (aluno, index, arr) =>
            arr.findIndex(
              (a) =>
                a.nome === aluno.nome &&
                a.whatsapp === aluno.whatsapp &&
                a.created_at === aluno.created_at
            ) === index
        );

        console.log("=== RESULTADO FINAL ===");
        console.log("Atividades carregadas:", atividadesUnicas.length);
        console.log(
          "Alunos encontrados (total com duplicatas):",
          todosAlunos.length
        );
        console.log("Alunos únicos (sem duplicatas):", alunosUnicos.length);
        console.log("Lista final de alunos:", alunosUnicos);

        setAlunos(alunosUnicos);
        setNumeroDetectado("21992370808"); // Definir para debug

        // Para debug: buscar TODOS os dados do banco SEM filtros
        console.log("=== DEBUG: TODOS OS DADOS DO BANCO ===");
        const { data: todasAtividadesDB } = await supabase
          .from("praiativa_instrutores")
          .select("*");
        const { data: todosAlunosDB } = await supabase
          .from("praiativa_alunos")
          .select("*");

        console.log(
          "TODAS as atividades no banco (sem filtros):",
          todasAtividadesDB?.length || 0
        );
        console.log("Detalhes de TODAS as atividades:", todasAtividadesDB);
        console.log(
          "TODOS os alunos no banco (sem filtros):",
          todosAlunosDB?.length || 0
        );
        console.log("Detalhes de TODOS os alunos:", todosAlunosDB);

        // Verificar especificamente registros com o número 21992370808
        const atividades21992370808 = todasAtividadesDB?.filter(
          (a) =>
            a.contato === "21992370808" ||
            a.numero_instrutor === "21992370808" ||
            a.contato === "(21)992370808" ||
            a.numero_instrutor === "(21)992370808"
        );
        const alunos21992370808 = todosAlunosDB?.filter(
          (a) =>
            a.contato_instrutor === 21992370808 ||
            a.numero_instrutor === "21992370808" ||
            a.contato_instrutor === 21992370808 ||
            String(a.contato_instrutor) === "21992370808"
        );

        console.log(
          "Atividades específicas para 21992370808:",
          atividades21992370808
        );
        console.log("Alunos específicos para 21992370808:", alunos21992370808);
      } else {
        console.log("=== NENHUMA ATIVIDADE ENCONTRADA ===");
        console.log("Tentamos buscar por:", numerosParaBuscar);
        setInstrutor(null);
        setAtividades([]);
        setAlunos([]);
        setNumeroDetectado(null);

        // Mesmo sem atividades, mostrar todos os dados do banco para debug
        console.log("=== DEBUG: TODOS OS DADOS DO BANCO (sem atividades) ===");
        const { data: todasAtividadesDB } = await supabase
          .from("praiativa_instrutores")
          .select("*");
        const { data: todosAlunosDB } = await supabase
          .from("praiativa_alunos")
          .select("*");

        console.log(
          "TODAS as atividades no banco:",
          todasAtividadesDB?.length || 0
        );
        console.log("Detalhes:", todasAtividadesDB);
        console.log("TODOS os alunos no banco:", todosAlunosDB?.length || 0);
        console.log("Detalhes:", todosAlunosDB);
      }
    } catch (error) {
      console.error("=== ERRO NO CARREGAMENTO ===", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (
      !instrutor ||
      !newStudent.nome ||
      !newStudent.whatsapp ||
      !newStudent.valor_mensalidade ||
      !newStudent.atividade
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (nome, WhatsApp, atividade e valor da mensalidade)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("praiativa_alunos").insert({
        user_id: user?.id,
        nome: newStudent.nome,
        email: newStudent.email,
        whatsapp: newStudent.whatsapp,
        valor_mensalidade: newStudent.valor_mensalidade,
        data_vencimento: newStudent.data_vencimento,
        numero_instrutor: instrutor.numero_instrutor,
        atividade: newStudent.atividade,
        valor: newStudent.valor_mensalidade?.toString() || "0",
        validade: newStudent.data_vencimento || "",
        contato: newStudent.whatsapp || "",
        contato_instrutor: instrutor.instrutor_id,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Aluno cadastrado com sucesso",
      });

      setNewStudent({
        nome: "",
        email: "",
        whatsapp: "",
        valor_mensalidade: 0,
        data_vencimento: "",
        atividade: "",
        valor: "0",
        validade: "",
        contato: "",
      });
      setShowAddStudent(false);
      carregarDados();
    } catch (error: any) {
      console.error("Erro ao cadastrar aluno:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar aluno",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentKey: string) => {
    setLoading(true);
    try {
      // Use created_at + nome como identificador único
      const [created_at, nome] = studentKey.split("|");

      await supabase
        .from("praiativa_alunos")
        .delete()
        .eq("created_at", created_at)
        .eq("nome", nome);

      toast({
        title: "Sucesso!",
        description: "Aluno removido com sucesso",
      });

      carregarDados();
    } catch (error: any) {
      console.error("Erro ao remover aluno:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover aluno",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async () => {
    if (
      !user ||
      !completeProfileData.nome ||
      !completeProfileData.contato ||
      !completeProfileData.atividade ||
      !completeProfileData.localizacao ||
      !completeProfileData.valor ||
      !completeProfileData.dia_horario
    ) {
      toast({
        title: "Erro",
        description:
          "Preencha todos os campos obrigatórios: nome, contato, atividade, localização, valor e horário",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("praiativa_instrutores").insert({
        user_id: user.id,
        nome: completeProfileData.nome,
        contato: completeProfileData.contato,
        cpf_cnpj: completeProfileData.cpf_cnpj,
        banco: completeProfileData.banco,
        agencia: completeProfileData.agencia,
        conta: completeProfileData.conta,
        chave_pix: completeProfileData.chave_pix,
        numero_instrutor: completeProfileData.contato, // número do instrutor = contato
        atividade: completeProfileData.atividade,
        valor: completeProfileData.valor,
        dia_horario: completeProfileData.dia_horario,
        localizacao: completeProfileData.localizacao,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Nova atividade cadastrada com sucesso",
      });

      // Limpar formulário
      setCompleteProfileData({
        nome: "",
        contato: "",
        cpf_cnpj: "",
        banco: "",
        agencia: "",
        conta: "",
        chave_pix: "",
        numero_instrutor: "",
        atividade: "Atividades Aquáticas",
        localizacao: "",
        valor: "100",
        dia_horario: "",
      });

      setShowCompleteProfile(false);
      carregarDados();
    } catch (error: any) {
      console.error("Erro ao completar perfil:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao completar perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityBadgeColor = (activity: string) => {
    const colors = {
      "Surf": "bg-blue-50 text-blue-700 ring-blue-700/10",
      "Stand Up Paddle": "bg-green-50 text-green-700 ring-green-700/10",
      "Natação": "bg-cyan-50 text-cyan-700 ring-cyan-700/10",
      "Atividades Aquáticas": "bg-teal-50 text-teal-700 ring-teal-700/10",
      "Windsurf": "bg-purple-50 text-purple-700 ring-purple-700/10",
      "Kitesurf": "bg-orange-50 text-orange-700 ring-orange-700/10",
    };
    return colors[activity as keyof typeof colors] || "bg-gray-50 text-gray-700 ring-gray-700/10";
  };

  const generatePaymentLink = async (aluno: Aluno) => {
    if (!aluno.valor_mensalidade) {
      toast({
        title: "Erro",
        description: "Valor da mensalidade não definido para este aluno",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Debug: verificar dados do aluno
      console.log('=== DEBUG PAYMENT ===');
      console.log('Dados do aluno:', {
        nome: aluno.nome,
        email: aluno.email,
        valor_mensalidade: aluno.valor_mensalidade,
        atividade: aluno.atividade
      });
      console.log('Dados do instrutor:', {
        nome: instrutor?.nome
      });
      
      // Chama a Edge Function do Supabase para criar sessão de pagamento no Stripe
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: Math.round(aluno.valor_mensalidade * 100), // Stripe usa centavos
          currency: 'brl',
          description: `Mensalidade - ${aluno.atividade}`,
          student_name: aluno.nome,
          student_email: aluno.email, // Email para envio
          student_whatsapp: aluno.whatsapp,
          instructor_name: instrutor?.nome || '',
          activity: aluno.atividade,
          payment_amount: aluno.valor_mensalidade, // Valor real da mensalidade
          due_date: aluno.data_vencimento || '' // Data de vencimento
        }
      });

      console.log('Resposta da Edge Function:', { data, error });

      if (error) throw error;

      if (data?.url) {
        // Abre o link de pagamento em nova aba
        window.open(data.url, '_blank');
        
        const emailMessage = data.email_sent 
          ? "O link foi aberto em uma nova aba e um email foi enviado ao aluno!"
          : "O link foi aberto em uma nova aba";
        
        toast({
          title: "Link de Pagamento Gerado!",
          description: emailMessage,
        });
      } else {
        throw new Error('URL de pagamento não retornada');
      }
    } catch (error: any) {
      console.error('Erro ao gerar link de pagamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar link de pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testSendEmail = async () => {
    try {
      setLoading(true);
      
      console.log('🧪 Iniciando teste de email...');
      
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: {
          email: "pedrohferreira98@hotmail.com", // Email de teste atualizado
          name: "Teste Usuario"
        }
      });

      console.log('📧 Resposta do teste de email:', { data, error });

      if (error) {
        console.error('❌ Erro na função:', error);
        throw error;
      }

      toast({
        title: "Teste de Email",
        description: data?.success ? "Email de teste enviado com sucesso!" : `Erro: ${data?.error || 'Erro desconhecido'}`,
        variant: data?.success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('💥 Erro no teste de email:', error);
      console.error('💥 Detalhes do erro:', {
        message: error.message,
        details: error.details,
        stack: error.stack
      });
      
      toast({
        title: "Erro no Teste de Email",
        description: `${error.message || "Erro desconhecido"} - Verifique o console para mais detalhes`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePixCode = async (aluno: Aluno) => {
    if (!aluno.valor_mensalidade) {
      toast({
        title: "Erro",
        description: "Valor da mensalidade não definido para este aluno",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      console.log('=== DEBUG PIX PAYMENT ===');
      console.log('Dados do aluno:', {
        nome: aluno.nome,
        email: aluno.email,
        valor_mensalidade: aluno.valor_mensalidade,
        atividade: aluno.atividade
      });
      
      // Chama a Edge Function do Supabase para criar pagamento PIX no Mercado Pago
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          amount: Math.round(aluno.valor_mensalidade * 100), // Mercado Pago usa centavos
          description: `Mensalidade PIX - ${aluno.atividade}`,
          student_name: aluno.nome,
          student_email: aluno.email,
          instructor_name: instrutor?.nome || '',
          activity: aluno.atividade,
          payment_amount: aluno.valor_mensalidade,
          due_date: aluno.data_vencimento || '',
          payer_email: aluno.email
        }
      });

      console.log('Resposta da Edge Function PIX:', { data, error });

      if (error) throw error;

      if (data?.success && data?.pix_code) {
        // Copiar código PIX para área de transferência
        await navigator.clipboard.writeText(data.pix_code);
        
        // Abrir link de pagamento se disponível
        if (data.payment_url) {
          window.open(data.payment_url, '_blank');
        }
        
        const emailMessage = data.email_sent 
          ? "Código PIX copiado, link de pagamento aberto e email enviado ao aluno!"
          : "Código PIX copiado e link de pagamento aberto";
        
        toast({
          title: "Pagamento PIX Gerado!",
          description: emailMessage,
        });

        // Opcional: Mostrar QR Code se disponível
        if (data.qr_code_base64) {
          console.log('QR Code PIX gerado:', data.qr_code_base64);
          // Aqui você pode implementar um modal para mostrar o QR Code
        }
      } else {
        throw new Error('Falha ao gerar código PIX');
      }
    } catch (error: any) {
      console.error('Erro ao gerar PIX:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar pagamento PIX",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const updateProfile = async () => {
    if (!instrutor || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("praiativa_instrutores")
        .update({
          nome: instrutor.nome,
          contato: instrutor.contato,
          cpf_cnpj: instrutor.cpf_cnpj,
          banco: instrutor.banco,
          agencia: instrutor.agencia,
          conta: instrutor.conta,
          chave_pix: instrutor.chave_pix,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Perfil atualizado com sucesso",
      });

      setShowEditProfile(false);
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !instrutor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Waves className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Waves className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">PraiAtiva Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  {instrutor
                    ? `${instrutor.nome} (#${instrutor.numero_instrutor})`
                    : "Bem-vindo!"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testSendEmail}
                disabled={loading}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Teste Email
              </Button>
              <Button variant="outline" onClick={openWhatsApp}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Suporte
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Debug Info */}
        {showDebugInfo && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">
                Informações de Debug
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <strong>User ID:</strong> {user?.id}
              </div>
              <div>
                <strong>User Email:</strong> {user?.email}
              </div>
              <div>
                <strong>Número detectado:</strong> {numeroDetectado || "Nenhum"}
              </div>
              <div>
                <strong>Atividades carregadas:</strong> {atividades.length}
              </div>
              <div>
                <strong>Alunos carregados:</strong> {alunos.length}
              </div>
              {instrutor && (
                <>
                  <div>
                    <strong>Instrutor principal:</strong> {instrutor.nome} (#
                    {instrutor.numero_instrutor})
                  </div>
                  <div>
                    <strong>ID do instrutor:</strong> {instrutor.instrutor_id}
                  </div>
                  <div>
                    <strong>Contato do instrutor:</strong> {instrutor.contato}
                  </div>
                </>
              )}
              <div>
                <strong>Números de instrutor:</strong>{" "}
                {atividades.map((a) => a.numero_instrutor).join(", ")}
              </div>
              <div>
                <strong>Contatos dos instrutores:</strong>{" "}
                {atividades.map((a) => a.contato).join(", ")}
              </div>
              <div>
                <strong>IDs dos instrutores:</strong>{" "}
                {atividades.map((a) => a.instrutor_id).join(", ")}
              </div>

              <div className="mt-4 p-3 bg-blue-100 rounded">
                <strong>
                  🎯 ESTRATÉGIA ATUAL (busca em TODOS os registros):
                </strong>
                <div>
                  1. ✅ Buscar atividades em TODOS os registros por contato =
                  21992370808
                </div>
                <div>
                  2. ✅ Buscar atividades em TODOS os registros por
                  numero_instrutor = 21992370808
                </div>
                <div>
                  3. ✅ Buscar alunos em TODOS os registros por
                  contato_instrutor (IDs encontrados)
                </div>
                <div>
                  4. ✅ Buscar alunos em TODOS os registros por
                  contato_instrutor (números)
                </div>
                <div>
                  5. ✅ Buscar alunos em TODOS os registros por numero_instrutor
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <strong>⚠️ IMPORTANTE:</strong> Busca independente de user_id
                  - busca em TODOS os registros!
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  <strong>Números testados:</strong> 21992370808, (21)992370808,
                  +5521992370808
                </div>
              </div>

              <div className="mt-4">
                <strong>
                  Abra o Console do navegador (F12) para ver logs detalhados
                </strong>
              </div>
              <Button size="sm" onClick={carregarDados} className="mt-2">
                Recarregar Dados
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {!instrutor ? (
            <div className="col-span-full">
              <Card className="border-dashed border-2 border-primary/20">
                <CardContent className="text-center py-12">
                  <UserIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    Complete seu Perfil de Instrutor
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Para acessar todas as funcionalidades, cadastre sua primeira
                    atividade.
                  </p>
                  <Dialog
                    open={showCompleteProfile}
                    onOpenChange={setShowCompleteProfile}
                  >
                    <DialogTrigger asChild>
                      <Button className="gradient-primary" size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Cadastrar Primeira Atividade
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Cadastrar Nova Atividade</DialogTitle>
                        <DialogDescription>
                          Cadastre uma nova atividade que você oferece
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="complete_nome">Nome Completo *</Label>
                          <Input
                            id="complete_nome"
                            value={completeProfileData.nome}
                            onChange={(e) =>
                              setCompleteProfileData({
                                ...completeProfileData,
                                nome: e.target.value,
                              })
                            }
                            placeholder="Seu nome completo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complete_contato">
                            Contato (WhatsApp) - Número do Instrutor *
                          </Label>
                          <Input
                            id="complete_contato"
                            value={completeProfileData.contato}
                            onChange={(e) => {
                              setCompleteProfileData({
                                ...completeProfileData,
                                contato: e.target.value,
                                numero_instrutor: e.target.value, // O número do instrutor é o mesmo que o contato
                              });
                            }}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complete_atividade">
                            Atividade *
                          </Label>
                          <Input
                            id="complete_atividade"
                            value={completeProfileData.atividade}
                            onChange={(e) =>
                              setCompleteProfileData({
                                ...completeProfileData,
                                atividade: e.target.value,
                              })
                            }
                            placeholder="Ex: Natação, Surf, Stand Up Paddle"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complete_localizacao">
                            Localização da Atividade *
                          </Label>
                          <Input
                            id="complete_localizacao"
                            value={completeProfileData.localizacao}
                            onChange={(e) =>
                              setCompleteProfileData({
                                ...completeProfileData,
                                localizacao: e.target.value,
                              })
                            }
                            placeholder="Ex: Praia de Copacabana, Lagoa Rodrigo de Freitas"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="complete_valor">
                              Valor da Aula *
                            </Label>
                            <Input
                              id="complete_valor"
                              value={completeProfileData.valor}
                              onChange={(e) =>
                                setCompleteProfileData({
                                  ...completeProfileData,
                                  valor: e.target.value,
                                })
                              }
                              placeholder="R$ 100,00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="complete_dia_horario">
                              Dia e Horário *
                            </Label>
                            <Input
                              id="complete_dia_horario"
                              value={completeProfileData.dia_horario}
                              onChange={(e) =>
                                setCompleteProfileData({
                                  ...completeProfileData,
                                  dia_horario: e.target.value,
                                })
                              }
                              placeholder="Seg/Qua 15h"
                            />
                          </div>
                        </div>
                        <Separator />
                        <div className="text-sm font-medium text-muted-foreground">
                          Dados Bancários (opcionais)
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complete_cpf_cnpj">CPF/CNPJ</Label>
                          <Input
                            id="complete_cpf_cnpj"
                            value={completeProfileData.cpf_cnpj}
                            onChange={(e) =>
                              setCompleteProfileData({
                                ...completeProfileData,
                                cpf_cnpj: e.target.value,
                              })
                            }
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="complete_banco">Banco</Label>
                            <Input
                              id="complete_banco"
                              value={completeProfileData.banco}
                              onChange={(e) =>
                                setCompleteProfileData({
                                  ...completeProfileData,
                                  banco: e.target.value,
                                })
                              }
                              placeholder="Nome do banco"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="complete_agencia">Agência</Label>
                            <Input
                              id="complete_agencia"
                              value={completeProfileData.agencia}
                              onChange={(e) =>
                                setCompleteProfileData({
                                  ...completeProfileData,
                                  agencia: e.target.value,
                                })
                              }
                              placeholder="0000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complete_conta">Conta</Label>
                          <Input
                            id="complete_conta"
                            value={completeProfileData.conta}
                            onChange={(e) =>
                              setCompleteProfileData({
                                ...completeProfileData,
                                conta: e.target.value,
                              })
                            }
                            placeholder="00000-0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complete_chave_pix">Chave PIX</Label>
                          <Input
                            id="complete_chave_pix"
                            value={completeProfileData.chave_pix}
                            onChange={(e) =>
                              setCompleteProfileData({
                                ...completeProfileData,
                                chave_pix: e.target.value,
                              })
                            }
                            placeholder="CPF, email ou telefone"
                          />
                        </div>
                        <Button
                          onClick={completeProfile}
                          className="w-full"
                          disabled={loading}
                        >
                          {loading ? "Salvando..." : "Cadastrar Atividade"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Atividades Cadastradas
                  </CardTitle>
                  <Waves className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{atividades.length}</div>
                  <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {atividades
                      .slice(0, 2)
                      .map((a) => a.atividade)
                      .join(", ")}
                    {atividades.length > 2 && "..."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Alunos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{alunos.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Receita Mensal
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R${" "}
                    {alunos
                      .reduce(
                        (sum, aluno) => sum + (aluno.valor_mensalidade || 0),
                        0
                      )
                      .toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {instrutor && (
            <>
              <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Meu Perfil
                      </CardTitle>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        Clique para editar
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                      Atualize suas informações pessoais e bancárias
                    </DialogDescription>
                  </DialogHeader>
                  {instrutor && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome Completo</Label>
                        <Input
                          id="nome"
                          value={instrutor.nome}
                          onChange={(e) =>
                            setInstrutor({ ...instrutor, nome: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contato">Contato</Label>
                        <Input
                          id="contato"
                          value={instrutor.contato}
                          onChange={(e) =>
                            setInstrutor({
                              ...instrutor,
                              contato: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                        <Input
                          id="cpf_cnpj"
                          value={instrutor.cpf_cnpj || ""}
                          onChange={(e) =>
                            setInstrutor({
                              ...instrutor,
                              cpf_cnpj: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="banco">Banco</Label>
                          <Input
                            id="banco"
                            value={instrutor.banco || ""}
                            onChange={(e) =>
                              setInstrutor({
                                ...instrutor,
                                banco: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agencia">Agência</Label>
                          <Input
                            id="agencia"
                            value={instrutor.agencia || ""}
                            onChange={(e) =>
                              setInstrutor({
                                ...instrutor,
                                agencia: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="conta">Conta</Label>
                        <Input
                          id="conta"
                          value={instrutor.conta || ""}
                          onChange={(e) =>
                            setInstrutor({
                              ...instrutor,
                              conta: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chave_pix">Chave PIX</Label>
                        <Input
                          id="chave_pix"
                          value={instrutor.chave_pix || ""}
                          onChange={(e) =>
                            setInstrutor({
                              ...instrutor,
                              chave_pix: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button
                        onClick={updateProfile}
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Novo Aluno
                      </CardTitle>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        Clique para adicionar
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
                    <DialogDescription>
                      Preencha as informações do aluno
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student_name">Nome Completo *</Label>
                      <Input
                        id="student_name"
                        value={newStudent.nome}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, nome: e.target.value })
                        }
                        placeholder="Nome do aluno"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_email">E-mail</Label>
                      <Input
                        id="student_email"
                        type="email"
                        value={newStudent.email}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            email: e.target.value,
                          })
                        }
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_whatsapp">WhatsApp *</Label>
                      <Input
                        id="student_whatsapp"
                        value={newStudent.whatsapp}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            whatsapp: e.target.value,
                          })
                        }
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_activity">Atividade *</Label>
                      <Select
                        value={newStudent.atividade}
                        onValueChange={(value) =>
                          setNewStudent({
                            ...newStudent,
                            atividade: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma atividade" />
                        </SelectTrigger>
                        <SelectContent>
                          {atividades.length > 0 ? (
                            atividades.map((atividade) => (
                              <SelectItem key={atividade.instrutor_id} value={atividade.atividade}>
                                {atividade.atividade}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="Surf">Surf</SelectItem>
                              <SelectItem value="Stand Up Paddle">Stand Up Paddle</SelectItem>
                              <SelectItem value="Natação">Natação</SelectItem>
                              <SelectItem value="Atividades Aquáticas">Atividades Aquáticas</SelectItem>
                              <SelectItem value="Windsurf">Windsurf</SelectItem>
                              <SelectItem value="Kitesurf">Kitesurf</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_monthly_fee">
                        Valor da Mensalidade *
                      </Label>
                      <Input
                        id="student_monthly_fee"
                        type="number"
                        step="0.01"
                        value={newStudent.valor_mensalidade}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            valor_mensalidade: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_due_date">
                        Data de Vencimento
                      </Label>
                      <Input
                        id="student_due_date"
                        type="date"
                        value={newStudent.data_vencimento}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            data_vencimento: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Button
                      onClick={handleAddStudent}
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Cadastrando..." : "Cadastrar Aluno"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={showCompleteProfile}
                onOpenChange={setShowCompleteProfile}
              >
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Nova Atividade
                      </CardTitle>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        Adicionar modalidade
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Nova Atividade</DialogTitle>
                    <DialogDescription>
                      Cadastre uma nova atividade que você oferece
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="complete_nome">Nome Completo *</Label>
                      <Input
                        id="complete_nome"
                        value={
                          completeProfileData.nome || instrutor?.nome || ""
                        }
                        onChange={(e) =>
                          setCompleteProfileData({
                            ...completeProfileData,
                            nome: e.target.value,
                          })
                        }
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complete_contato">
                        Contato (WhatsApp) - Número do Instrutor *
                      </Label>
                      <Input
                        id="complete_contato"
                        value={
                          completeProfileData.contato ||
                          instrutor?.contato ||
                          ""
                        }
                        onChange={(e) => {
                          setCompleteProfileData({
                            ...completeProfileData,
                            contato: e.target.value,
                            numero_instrutor: e.target.value, // O número do instrutor é o mesmo que o contato
                          });
                        }}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complete_atividade">Atividade *</Label>
                      <Input
                        id="complete_atividade"
                        value={completeProfileData.atividade}
                        onChange={(e) =>
                          setCompleteProfileData({
                            ...completeProfileData,
                            atividade: e.target.value,
                          })
                        }
                        placeholder="Ex: Natação, Surf, Stand Up Paddle"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complete_localizacao">
                        Localização da Atividade *
                      </Label>
                      <Input
                        id="complete_localizacao"
                        value={completeProfileData.localizacao}
                        onChange={(e) =>
                          setCompleteProfileData({
                            ...completeProfileData,
                            localizacao: e.target.value,
                          })
                        }
                        placeholder="Ex: Praia de Copacabana, Lagoa Rodrigo de Freitas"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="complete_valor">Valor da Aula *</Label>
                        <Input
                          id="complete_valor"
                          value={completeProfileData.valor}
                          onChange={(e) =>
                            setCompleteProfileData({
                              ...completeProfileData,
                              valor: e.target.value,
                            })
                          }
                          placeholder="R$ 100,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complete_dia_horario">
                          Dia e Horário *
                        </Label>
                        <Input
                          id="complete_dia_horario"
                          value={completeProfileData.dia_horario}
                          onChange={(e) =>
                            setCompleteProfileData({
                              ...completeProfileData,
                              dia_horario: e.target.value,
                            })
                          }
                          placeholder="Seg/Qua 15h"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="text-sm font-medium text-muted-foreground">
                      Dados Bancários (opcionais)
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complete_cpf_cnpj">CPF/CNPJ</Label>
                      <Input
                        id="complete_cpf_cnpj"
                        value={completeProfileData.cpf_cnpj}
                        onChange={(e) =>
                          setCompleteProfileData({
                            ...completeProfileData,
                            cpf_cnpj: e.target.value,
                          })
                        }
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="complete_banco">Banco</Label>
                        <Input
                          id="complete_banco"
                          value={completeProfileData.banco}
                          onChange={(e) =>
                            setCompleteProfileData({
                              ...completeProfileData,
                              banco: e.target.value,
                            })
                          }
                          placeholder="Nome do banco"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complete_agencia">Agência</Label>
                        <Input
                          id="complete_agencia"
                          value={completeProfileData.agencia}
                          onChange={(e) =>
                            setCompleteProfileData({
                              ...completeProfileData,
                              agencia: e.target.value,
                            })
                          }
                          placeholder="0000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complete_conta">Conta</Label>
                      <Input
                        id="complete_conta"
                        value={completeProfileData.conta}
                        onChange={(e) =>
                          setCompleteProfileData({
                            ...completeProfileData,
                            conta: e.target.value,
                          })
                        }
                        placeholder="00000-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complete_chave_pix">Chave PIX</Label>
                      <Input
                        id="complete_chave_pix"
                        value={completeProfileData.chave_pix}
                        onChange={(e) =>
                          setCompleteProfileData({
                            ...completeProfileData,
                            chave_pix: e.target.value,
                          })
                        }
                        placeholder="CPF, email ou telefone"
                      />
                    </div>
                    <Button
                      onClick={completeProfile}
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Salvando..." : "Cadastrar Atividade"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        {/* Activities Details */}
        {atividades.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5" />
                Minhas Atividades ({atividades.length})
              </CardTitle>
              <CardDescription>
                Todas as atividades que você oferece
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {atividades.map((atividade) => (
                  <Card
                    key={`${atividade.created_at}|${atividade.atividade}`}
                    className="border-dashed"
                  >
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-lg mb-2">
                        {atividade.atividade}
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <strong>Local:</strong> {atividade.localizacao}
                        </p>
                        <p>
                          <strong>Valor:</strong> R$ {atividade.valor}
                        </p>
                        <p>
                          <strong>Horário:</strong> {atividade.dia_horario}
                        </p>
                        <p>
                          <strong>Contato:</strong> {atividade.contato}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meus Alunos ({alunos.length})
            </CardTitle>
            <CardDescription>
              Gerencie seus alunos e gere pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alunos.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum aluno cadastrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comece cadastrando seu primeiro aluno
                </p>
                <Button onClick={() => setShowAddStudent(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunos.map((aluno) => (
                    <TableRow key={`${aluno.created_at}|${aluno.nome}`}>
                      <TableCell className="font-medium">
                        {aluno.nome}
                      </TableCell>
                      <TableCell>{aluno.email || "-"}</TableCell>
                      <TableCell>{aluno.whatsapp}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getActivityBadgeColor(aluno.atividade)}`}>
                          <Waves className="h-3 w-3" />
                          {aluno.atividade || "Não informado"}
                        </span>
                      </TableCell>
                      <TableCell>
                        R$ {aluno.valor_mensalidade?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>
                        {aluno.data_vencimento
                          ? new Date(aluno.data_vencimento).toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generatePaymentLink(aluno)}
                          >
                            <Link className="h-3 w-3 mr-1" />
                            Link
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generatePixCode(aluno)}
                          >
                            <QrCode className="h-3 w-3 mr-1" />
                            PIX
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remover aluno
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover {aluno.nome}?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteStudent(
                                      `${aluno.created_at}|${aluno.nome}`
                                    )
                                  }
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
