export interface DiaVisita {
  id: string;
  data: string;
  metge_actiu: boolean;
  infermera_activa: boolean;
  max_tandes_metge: number;
  max_tandes_infermera: number;
  vacunes_grip_actiu: boolean;
  max_tandes_grip: number;
  vacunes_covid_actiu: boolean;
  max_tandes_covid: number;
  hora_inici_metge: string;
  hora_inici_infermera: string;
  created_at: string;
  updated_at: string;
}

export interface Cita {
  id: string;
  dia_visita_id: string;
  tipus: 'metge' | 'infermera' | 'grip' | 'covid';
  numero_tanda: number;
  nom_complet: string;
  telefon: string;
  email?: string | null;
  pin_cancelacio?: string;
  estat_assistencia?: 'visitat' | 'no_assistit' | 'eliminat' | null;
  created_at: string;
}

export interface ConsultaTelefonica {
  id: string;
  dia_visita_id?: string | null;
  tipus: 'metge' | 'infermera';
  nom_complet: string;
  telefon: string;
  email?: string | null;
  urgencia: 'baixa' | 'mitjana' | 'alta';
  motiu: string;
  atesa: boolean;
  created_at: string;
}

export interface Recepta {
  id: string;
  dia_visita_id?: string | null;
  nom_complet: string;
  telefon: string;
  email?: string | null;
  medicament: string;
  notes?: string | null;
  atesa: boolean;
  created_at: string;
}

export interface NumeroActual {
  id: string;
  tipus: 'metge' | 'infermera';
  numero: number;
  dia_visita_id: string | null;
  nom_professional: string | null;
  estat_visita: 'visitat' | 'no_assistit' | null;
  emergencia_activa: boolean;
  consultes_pendents: number;
  receptes_pendents: number;
  updated_at: string;
}

export interface UsuariPin {
  id: string;
  pin: string;
  nom_complet: string;
  telefon: string;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

export type TipusCita = 'metge' | 'infermera' | 'grip' | 'covid';
