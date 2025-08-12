import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[TEST-EMAIL] Iniciando teste de email");

    const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendGridApiKey) {
      throw new Error("SENDGRID_API_KEY não configurada");
    }

    console.log("[TEST-EMAIL] SendGrid API Key encontrada:", sendGridApiKey.substring(0, 10) + "...");

    const { email, name } = await req.json();
    
    if (!email || !name) {
      throw new Error("Email e nome são obrigatórios");
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
              email: email, // Email do aluno (destinatário)
              name: name
            }
          ],
          dynamic_template_data: {
            "Nome do Aluno": name, // Usar o nome enviado no teste
            "Nome do Serviço": "Surf Avançado", // Atividade de teste
            "Valor do Pagamento": "R$ 250,00", // Valor de teste
            "Data de Vencimento": "15/08/2025", // Data de vencimento de teste
            "LINK_DE_PAGAMENTO": "https://checkout.stripe.com/pay/cs_test_exemplo123" // URL de teste
          }
        }
      ],
      template_id: templateId
    };

    console.log("[TEST-EMAIL] Enviando email para:", email);
    console.log("[TEST-EMAIL] Dados do email:", JSON.stringify(emailData, null, 2));

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendGridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    console.log("[TEST-EMAIL] Response status:", response.status);
    console.log("[TEST-EMAIL] Response headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("[TEST-EMAIL] Response body:", responseText);

    if (!response.ok) {
      console.error("[TEST-EMAIL] Erro:", responseText);
      throw new Error(`SendGrid Error: ${response.status} - ${responseText}`);
    }

    console.log("[TEST-EMAIL] Email enviado com sucesso!");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email enviado com sucesso",
        status: response.status
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("[TEST-EMAIL] Erro:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
