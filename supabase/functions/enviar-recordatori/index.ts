import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RecordatoriRequest {
  email: string;
  nom: string;
  numero_tanda: number;
  tipus: string;
  data: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, nom, numero_tanda, tipus, data }: RecordatoriRequest = await req.json();

    console.log(`Enviament recordatori a ${email} per cita ${tipus} #${numero_tanda} el ${data}`);

    // Per ara, només loguegem. Per habilitar emails reals, cal configurar RESEND_API_KEY
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY no configurada - recordatori no enviat per email");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Recordatori registrat (email desactivat)" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Importar Resend dinàmicament
    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(RESEND_API_KEY);

    const tipusText = tipus === 'metge' ? 'Metge' : 
                      tipus === 'infermera' ? 'Infermera' : 
                      tipus === 'grip' ? 'Vacuna Grip' : 'Vacuna COVID';

    const emailResponse = await resend.emails.send({
      from: "Consultori Albagés <noreply@albages.cat>",
      to: [email],
      subject: `Recordatori cita: Tanda ${numero_tanda} - ${tipusText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0891b2; margin-bottom: 20px;">Consultori de l'Albagés</h1>
          
          <div style="background-color: #f0f9ff; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 8px 0; color: #164e63;">La teva cita</h2>
            <p style="margin: 0; color: #64748b;">Data: <strong>${data}</strong></p>
          </div>

          <div style="text-align: center; background-color: #0891b2; border-radius: 12px; padding: 32px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; color: #e0f2fe; font-size: 14px;">${tipusText}</p>
            <p style="margin: 0; color: white; font-size: 64px; font-weight: bold;">${numero_tanda}</p>
            <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 14px;">El teu número de tanda</p>
          </div>

          <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e; text-align: center;">
              ⏰ <strong>Sigues puntual i vine una estona abans</strong>
            </p>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Hola ${nom}, aquest és el recordatori de la teva cita al consultori.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            Consultori de l'Albagés - Sistema de gestió de cites
          </p>
        </div>
      `,
    });

    console.log("Email enviat correctament:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Recordatori enviat" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error en enviar recordatori:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
