import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ReceptaRenovadaRequest {
  email: string;
  nom: string;
  medicament: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, nom, medicament }: ReceptaRenovadaRequest = await req.json();

    if (!email || !nom || !medicament) {
      return new Response(
        JSON.stringify({ error: 'Falten camps obligatoris: email, nom, medicament' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Enviament notificacio recepta renovada a ${email} (${nom})`);

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY no configurada - notificacio no enviada per email');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Notificacio registrada (email desactivat)',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { Resend } = await import('npm:resend@2.0.0');
    const resend = new Resend(RESEND_API_KEY);

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'alcaldia@albages.cat';
    const fromName = Deno.env.get('RESEND_FROM_NAME') || "Consultori Albagés";

    const emailResponse = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject: 'Recepta Renovada',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0891b2; margin-bottom: 20px;">Consultori de l'Albagés</h1>

          <div style="background-color: #ecfeff; border-radius: 12px; padding: 24px; margin-bottom: 20px; border: 1px solid #a5f3fc;">
            <h2 style="margin: 0 0 8px 0; color: #155e75;">Recepta Renovada</h2>
            <p style="margin: 0; color: #0f172a;">Hola ${nom}, t'informem que la teva recepta ja ha estat renovada.</p>
          </div>

          <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #334155;"><strong>Medicament:</strong> ${medicament}</p>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Aquest correu és una notificació automàtica del consultori.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            Consultori de l'Albagés - Sistema de gestió de cites
          </p>
        </div>
      `,
    });

    console.log('Email de recepta renovada enviat correctament:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Notificacio enviada' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    console.error('Error en enviar notificacio de recepta renovada:', error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
