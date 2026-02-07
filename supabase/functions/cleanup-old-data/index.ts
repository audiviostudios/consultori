import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calcular la data d'ahir
    const avui = new Date();
    avui.setHours(0, 0, 0, 0);
    const ahir = new Date(avui);
    ahir.setDate(ahir.getDate() - 1);
    const ahirStr = ahir.toISOString().split('T')[0];

    console.log(`Netejant dades anteriors a: ${ahirStr}`);

    // Obtenir dies de visita anteriors a avui
    const { data: diesAntics, error: errorDies } = await supabase
      .from('dies_visita')
      .select('id')
      .lt('data', avui.toISOString().split('T')[0]);

    if (errorDies) {
      console.error("Error obtenint dies antics:", errorDies);
      throw errorDies;
    }

    const diesIds = diesAntics?.map(d => d.id) || [];
    let citesEliminades = 0;
    let diesEliminats = 0;
    let consultesEliminades = 0;

    // Eliminar cites de dies anteriors
    if (diesIds.length > 0) {
      const { count, error: errorCites } = await supabase
        .from('cites')
        .delete()
        .in('dia_visita_id', diesIds);

      if (errorCites) {
        console.error("Error eliminant cites:", errorCites);
        throw errorCites;
      }
      citesEliminades = count || 0;
      console.log(`Cites eliminades: ${citesEliminades}`);

      // Eliminar dies de visita anteriors
      const { count: countDies, error: errorDelDies } = await supabase
        .from('dies_visita')
        .delete()
        .in('id', diesIds);

      if (errorDelDies) {
        console.error("Error eliminant dies:", errorDelDies);
        throw errorDelDies;
      }
      diesEliminats = countDies || 0;
      console.log(`Dies eliminats: ${diesEliminats}`);
    }

    // Eliminar consultes telefòniques ateses de més de 24h
    const fa24h = new Date();
    fa24h.setHours(fa24h.getHours() - 24);
    
    const { count: countConsultes, error: errorConsultes } = await supabase
      .from('consultes_telefoniques')
      .delete()
      .eq('atesa', true)
      .lt('created_at', fa24h.toISOString());

    if (errorConsultes) {
      console.error("Error eliminant consultes:", errorConsultes);
      throw errorConsultes;
    }
    consultesEliminades = countConsultes || 0;
    console.log(`Consultes ateses eliminades: ${consultesEliminades}`);

    return new Response(
      JSON.stringify({
        success: true,
        citesEliminades,
        diesEliminats,
        consultesEliminades,
        message: `Neteja completada: ${citesEliminades} cites, ${diesEliminats} dies, ${consultesEliminades} consultes eliminades`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en la neteja:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconegut" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
