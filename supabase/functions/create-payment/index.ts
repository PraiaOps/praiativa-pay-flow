import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { amount, currency = 'brl', description, instructor_id, students } = await req.json();
    
    console.log("[CREATE-PAYMENT] Dados recebidos:", { 
      amount, 
      currency, 
      description, 
      instructor_id, 
      studentsCount: students?.length 
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

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id 
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