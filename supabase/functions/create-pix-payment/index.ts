import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para enviar email via SendGrid (reutilizada)
async function sendPaymentEmail(
  toEmail: string,
  studentName: string,
  instructorName: string,
  activity: string,
  paymentAmount: number,
  dueDate: string,
  pixCode: string,
  pixQrCode: string
) {
  const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
  if (!sendGridApiKey) {
    throw new Error("SENDGRID_API_KEY não configurada");
  }

  const templateId = "d-3aec26f006994c14b2b8da77f292aaba";
  
  const emailData = {
    from: {
      email: "praiativaops@gmail.com",
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
          "LINK_DE_PAGAMENTO": `PIX: ${pixCode}` // Incluir código PIX
        }
      }
    ],
    template_id: templateId
  };

  console.log("[SENDGRID] Enviando email PIX para:", toEmail);

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

  console.log("[SENDGRID] Email PIX enviado com sucesso para:", toEmail);
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CREATE-PIX-PAYMENT] Iniciando processamento de pagamento PIX");

    const mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    console.log("[CREATE-PIX-PAYMENT] Access Token encontrado:", mercadoPagoAccessToken ? "SIM" : "NÃO");
    
    if (!mercadoPagoAccessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurada");
    }

    const { 
      amount, 
      description, 
      student_name,
      student_email,
      instructor_name,
      activity,
      payment_amount,
      due_date,
      payer_email
    } = await req.json();
    
    console.log("[CREATE-PIX-PAYMENT] Dados recebidos:", { 
      amount, 
      description, 
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

    // Criar pagamento PIX no Mercado Pago
    let paymentData = {
      transaction_amount: payment_amount || (amount / 100),
      description: description || `Mensalidade PraiAtiva - ${activity}`,
      payment_method_id: "pix",
      payer: {
        email: payer_email || student_email || "cliente@exemplo.com",
        first_name: student_name?.split(' ')[0] || "Cliente",
        last_name: student_name?.split(' ').slice(1).join(' ') || "PraiAtiva"
      }
    };

    console.log("[CREATE-PIX-PAYMENT] Dados do pagamento:", JSON.stringify(paymentData, null, 2));

    try {
      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mercadoPagoAccessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `pix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        body: JSON.stringify(paymentData),
      });

      const mpResponseData = await mpResponse.json();
      console.log("[CREATE-PIX-PAYMENT] Status Mercado Pago:", mpResponse.status);
      console.log("[CREATE-PIX-PAYMENT] Resposta Mercado Pago:", JSON.stringify(mpResponseData, null, 2));

      if (!mpResponse.ok) {
        console.error("[CREATE-PIX-PAYMENT] Erro Mercado Pago:", mpResponseData);
        
        // Retornar erro detalhado
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Erro Mercado Pago: ${mpResponseData.message || 'Erro desconhecido'}`,
            details: mpResponseData,
            status: mpResponse.status
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400, // Retornar 400 em vez de 500 para erros do Mercado Pago
          }
        );
      }

      // Extrair dados do PIX
      const pixCode = mpResponseData.point_of_interaction?.transaction_data?.qr_code;
      const pixQrCodeBase64 = mpResponseData.point_of_interaction?.transaction_data?.qr_code_base64;
      const paymentId = mpResponseData.id;
      const paymentUrl = mpResponseData.point_of_interaction?.transaction_data?.ticket_url || 
                        `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${paymentId}`;

      console.log("[CREATE-PIX-PAYMENT] PIX criado:", {
        paymentId,
        pixCode: pixCode ? "Disponível" : "Não disponível",
        qrCode: pixQrCodeBase64 ? "Disponível" : "Não disponível",
        paymentUrl: paymentUrl ? "Disponível" : "Não disponível"
      });

      // Tentar enviar email se os dados estiverem disponíveis
      let emailSent = false;
      if (student_email && student_name && instructor_name && activity) {
        try {
          await sendPaymentEmail(
            student_email,
            student_name,
            instructor_name,
            activity,
            payment_amount || (amount / 100),
            due_date || '',
            pixCode || `Pagamento ID: ${paymentId}`,
            pixQrCodeBase64 || ''
          );
          emailSent = true;
          console.log("[CREATE-PIX-PAYMENT] Email enviado com sucesso");
        } catch (emailError) {
          console.error("[CREATE-PIX-PAYMENT] Erro ao enviar email (continuando):", emailError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          payment_id: paymentId,
          pix_code: pixCode,
          qr_code_base64: pixQrCodeBase64,
          payment_url: paymentUrl,
          email_sent: emailSent,
          message: "Pagamento PIX criado com sucesso"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    } catch (fetchError) {
      console.error("[CREATE-PIX-PAYMENT] Erro na requisição:", fetchError);
      throw new Error(`Erro de rede: ${fetchError.message}`);
    }

  } catch (error) {
    console.error("[CREATE-PIX-PAYMENT] Erro:", error);
    
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
