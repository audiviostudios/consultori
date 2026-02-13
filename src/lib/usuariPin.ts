import { supabase } from '@/integrations/supabase/client';

export interface UsuariPinPerfil {
  pin: string;
  nom_complet: string;
  telefon: string;
  email: string | null;
}

const normalizeSingleRow = (data: unknown): UsuariPinPerfil | null => {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as UsuariPinPerfil) ?? null;
  return data as UsuariPinPerfil;
};

const isMissingFunctionError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { message?: string; details?: string; hint?: string };
  const text = `${maybe.message ?? ''} ${maybe.details ?? ''} ${maybe.hint ?? ''}`.toLowerCase();
  return (
    text.includes('could not find the function public.registrar_usuari_pin') ||
    text.includes('function public.registrar_usuari_pin')
  );
};

const generatePin4 = () => String(Math.floor(Math.random() * 10000)).padStart(4, '0');

const fallbackGuardarUsuariPin = async (payload: {
  nom_complet: string;
  telefon: string;
  email?: string | null;
}): Promise<UsuariPinPerfil> => {
  const normalized = {
    nom_complet: payload.nom_complet.trim(),
    telefon: payload.telefon.trim(),
    email: payload.email?.trim() || null,
  };

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const pin = generatePin4();
    const { error } = await supabase.from('usuaris_pin').upsert(
      {
        pin,
        nom_complet: normalized.nom_complet,
        telefon: normalized.telefon,
        email: normalized.email,
      },
      { onConflict: 'telefon' }
    );

    if (!error) {
      return {
        pin,
        nom_complet: normalized.nom_complet,
        telefon: normalized.telefon,
        email: normalized.email,
      };
    }

    lastError = error;
    const maybe = error as { code?: string; message?: string; details?: string };
    const text = `${maybe.message ?? ''} ${maybe.details ?? ''}`.toLowerCase();
    const isUniquePin = maybe.code === '23505' || text.includes('usuaris_pin_pin_key') || text.includes('unique');
    if (!isUniquePin) break;
  }

  throw lastError ?? new Error("No s'ha pogut guardar el perfil amb PIN");
};

export async function obtenirUsuariPerPin(pin: string): Promise<UsuariPinPerfil | null> {
  const { data, error } = await supabase.rpc('obtenir_usuari_per_pin', { _pin: pin });
  if (error) throw error;
  return normalizeSingleRow(data);
}

export async function registrarUsuariPin(payload: {
  nom_complet: string;
  telefon: string;
  email?: string | null;
}): Promise<UsuariPinPerfil> {
  const signatureVariants = [
    {
      _email: payload.email ?? null,
      _nom_complet: payload.nom_complet,
      _telefon: payload.telefon,
    },
    {
      _nom_complet: payload.nom_complet,
      _telefon: payload.telefon,
      _email: payload.email ?? null,
    },
  ];

  let lastError: unknown = null;

  for (const args of signatureVariants) {
    const { data, error } = await supabase.rpc('registrar_usuari_pin', args);
    if (!error) {
      const row = normalizeSingleRow(data);
      if (!row) {
        throw new Error("No s'ha pogut registrar el perfil amb PIN");
      }
      return row;
    }

    lastError = error;
    if (!isMissingFunctionError(error)) {
      throw error;
    }
  }

  if (isMissingFunctionError(lastError)) {
    return fallbackGuardarUsuariPin(payload);
  }

  throw lastError;
}
