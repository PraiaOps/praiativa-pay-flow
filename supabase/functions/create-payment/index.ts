import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para enviar email via SendGrid
async function sendPaymentEmail(
  toEmail: string,
  studentName: string,
  instructorName: string,
  activity: string,
  paymentAmount: number,
  dueDate: string,
  paymentUrl: string
) {
  const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
  if (!sendGridApiKey) {
    throw new Error("SENDGRID_API_KEY não configurada");
  }

  const templateId = "d-3aec26f006994c14b2b8da77f292aaba";
  
  const emailData = {
    from: {
      email: "praiativaops@gmail.com", // Email verificado no SendGrid
      name: "PraiAtiva"
    },
    personalizations: [
      {
        to: [
          {
            email: toEmail,
            name: studentName
          }
        ],
        dynamic_template_data: {
          "Nome do Aluno": studentName,
          "Nome do Serviço": activity,
          "Valor do Pagamento": `R$ ${paymentAmount.toFixed(2).replace('.', ',')}`,
          "Data de Vencimento": dueDate,
          "LINK_DE_PAGAMENTO": paymentUrl
        }
      }
    ],
    template_id: templateId
  };

  console.log("[SENDGRID] Enviando email para:", toEmail);
  console.log("[SENDGRID] Dados do template:", emailData.personalizations[0].dynamic_template_data);

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sendGridApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[SENDGRID] Erro ao enviar email:", response.status, errorText);
    throw new Error(`Erro SendGrid: ${response.status} - ${errorText}`);
  }

  console.log("[SENDGRID] Email enviado com sucesso para:", toEmail);
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CREATE-PAYMENT] Iniciando processamento de pagamento");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }

    const { 
      amount, 
      currency = 'brl', 
      description, 
      instructor_id, 
      students,
      student_name,
      student_email,
      instructor_name,
      activity,
      payment_amount,
      due_date
    } = await req.json();
    
    console.log("[CREATE-PAYMENT] Dados recebidos:", { 
      amount, 
      currency, 
      description, 
      instructor_id, 
      studentsCount: students?.length,
      student_name,
      student_email,
      instructor_name,
      activity,
      payment_amount,
      due_date
    });

    if (!amount || amount <= 0) {
      throw new Error("Valor do pagamento inválido");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: description || 'Pagamento PraiAtiva',
              description: `Cadastro de ${students?.length || 0} aluno(s)`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin") || "http://localhost:3000"}/pagamento?success=true`,
      cancel_url: `${req.headers.get("origin") || "http://localhost:3000"}/pagamento?canceled=true`,
      metadata: {
        instructor_id: instructor_id?.toString() || '',
        students_count: students?.length?.toString() || '0',
      },
    });

    console.log("[CREATE-PAYMENT] Sessão criada com sucesso:", session.id);

    // Tentar enviar email se os dados estiverem disponíveis
    let emailSent = false;
    if (student_email && student_name && instructor_name && activity && session.url) {
      try {
        await sendPaymentEmail(
          student_email,
          student_name,
          instructor_name,
          activity,
          payment_amount || (amount / 100), // Usa payment_amount se disponível, senão converte de centavos
          due_date || '',
          session.url
        );
        emailSent = true;
        console.log("[CREATE-PAYMENT] Email enviado com sucesso");
      } catch (emailError) {
        console.error("[CREATE-PAYMENT] Erro ao enviar email (continuando):", emailError);
        // Não interrompe o fluxo se o email falhar
      }
    } else {
      console.log("[CREATE-PAYMENT] Dados insuficientes para envio de email:", {
        student_email: !!student_email,
        student_name: !!student_name,
        instructor_name: !!instructor_name,
        activity: !!activity,
        session_url: !!session.url
      });
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id,
        email_sent: emailSent
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("[CREATE-PAYMENT] Erro:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});