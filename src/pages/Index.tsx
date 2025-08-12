import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves, CreditCard, Users, User, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const openWhatsApp = () => {
    window.open('https://wa.me/5521991732847', '_blank');
  };

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
            Sistema completo de gestão para instrutores de atividades aquáticas. 
            Gerencie seus alunos, pagamentos e muito mais em uma só plataforma!
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg" 
              className="gradient-primary text-lg px-8 py-6 shadow-glow"
            >
              Entrar / Cadastrar
            </Button>
            <Button 
              onClick={openWhatsApp}
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-6"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Falar no WhatsApp
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-card border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Gestão de Perfil</CardTitle>
              <CardDescription>
                Complete seu perfil de instrutor com dados pessoais e bancários 
                para receber seus pagamentos com segurança.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>Cadastro de Alunos</CardTitle>
              <CardDescription>
                Gerencie seus alunos facilmente. Cadastre informações completas,
                defina mensalidades e organize suas turmas.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Pagamentos Stripe</CardTitle>
              <CardDescription>
                Gere links de pagamento, códigos PIX e boletos para seus alunos. 
                Receba com segurança através do Stripe.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* About Project */}
        <div className="text-center mb-16">
          <Card className="shadow-card border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-3xl font-bold mb-4">
                Sobre o PraiAtiva
              </h2>
              <p className="text-muted-foreground mb-6 max-w-4xl mx-auto text-lg">
                O PraiAtiva é uma plataforma completa desenvolvida para instrutores de atividades aquáticas. 
                Nossa missão é simplificar a gestão de alunos e pagamentos, permitindo que você foque no que faz de melhor: 
                ensinar e inspirar pessoas nas praias e águas do Brasil.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="text-left">
                  <h3 className="font-semibold mb-2">✅ Funcionalidades</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Autenticação segura para instrutores</li>
                    <li>• Cadastro completo de dados pessoais e bancários</li>
                    <li>• Gestão completa de alunos</li>
                    <li>• Geração de links de pagamento</li>
                    <li>• Códigos PIX e boletos automatizados</li>
                    <li>• Dashboard intuitivo e completo</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold mb-2">🎯 Benefícios</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Organize todos seus alunos em um só lugar</li>
                    <li>• Receba pagamentos de forma segura</li>
                    <li>• Economize tempo com gestão automatizada</li>
                    <li>• Acesso 24/7 via web</li>
                    <li>• Suporte via WhatsApp</li>
                    <li>• Interface moderna e fácil de usar</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="shadow-card border-0 bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-3xl font-bold mb-4">
                Pronto para transformar sua gestão?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Cadastre-se agora e tenha acesso a todas as ferramentas que você precisa 
                para gerenciar seus alunos e pagamentos de forma profissional.
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/auth')}
                  size="lg" 
                  className="gradient-primary text-lg px-8 py-4"
                >
                  Começar Agora
                </Button>
                <Button 
                  onClick={openWhatsApp}
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-4"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Falar Conosco
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
