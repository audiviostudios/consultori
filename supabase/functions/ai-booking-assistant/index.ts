import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  messages: Array<{ role: string; content: string }>;
  availableDays?: Array<{
    id: string;
    data: string;
    metge_actiu: boolean;
    infermera_activa: boolean;
    available_slots_metge: number[];
    available_slots_infermera: number[];
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, availableDays } = await req.json() as BookingRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const systemPrompt = `Ets un assistent virtual amable del Consultori de l'Albagés que ajuda a les persones a demanar cita mèdica o d'infermeria en català.

INFORMACIÓ DELS DIES DISPONIBLES:
${availableDays ? JSON.stringify(availableDays, null, 2) : "No hi ha dies disponibles"}

INSTRUCCIONS:
1. Saluda amablement i pregunta si necessiten cita amb el metge o la infermera
2. Pregunta quin dia prefereixen (mostra els dies disponibles)
3. Pregunta quin número de tanda volen (mostra els disponibles)
4. Demana el nom complet
5. Demana el telèfon
6. Demana el correu electrònic
7. Confirma totes les dades i pregunta si és correcte

Quan tinguis totes les dades, respon amb un JSON especial amb el format:
{"action": "BOOK", "data": {"tipus": "metge|infermera", "dia_visita_id": "xxx", "numero_tanda": X, "nom_complet": "xxx", "telefon": "xxx", "email": "xxx"}}

Si l'usuari confirma, inclou aquest JSON al final del missatge. Si no, continua la conversa.

Parla sempre en català i sigues amable i clar.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Massa sol·licituds, torna-ho a provar més tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crèdits esgotats, contacta amb l'administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servei d'IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI booking error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconegut" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
