import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves, CreditCard, Users, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 pt-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Waves className="h-12 w-12 text-primary" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PraiAtiva
            </h1>
          </div>
          <p className="text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Conectando instrutores e alunos nas mais belas praias. 
            Cadastre-se e comece a ensinar atividades aquáticas hoje mesmo!
          </p>
          <Button 
            onClick={() => navigate('/pagamento')}
            size="lg" 
            className="gradient-primary text-lg px-8 py-6 shadow-glow"
          >
            Cadastre-se Gratuitamente
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-card border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Cadastro Simples</CardTitle>
              <CardDescription>
                Cadastre-se como instrutor em poucos minutos. 
                Adicione suas informações, atividades e valores.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>Gestão de Alunos</CardTitle>
              <CardDescription>
                Cadastre seus alunos facilmente e gerencie suas turmas. 
                Controle de presença e pagamentos.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Pagamentos Seguros</CardTitle>
              <CardDescription>
                Receba seus pagamentos de forma segura através do Stripe. 
                Suporte a cartão, PIX e boleto.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="shadow-card border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-3xl font-bold mb-4">
                Pronto para começar sua jornada?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Junte-se à comunidade PraiAtiva e transforme sua paixão por esportes aquáticos em uma fonte de renda. 
                É rápido, fácil e seguro!
              </p>
              <Button 
                onClick={() => navigate('/pagamento')}
                size="lg" 
                className="gradient-primary text-lg px-8 py-4"
              >
                Começar Agora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
