import { DashboardDTO } from '../types/DashboardDTO';
import { getItem } from './storage';

export type ReporteDTO = {
  descripcion: string;
  latitud: number;
  longitud: number;
};

export type FocoMapaDTO = {
  id: number;
  latitud: number;
  longitud: number;
  estado: string;
  verificado: boolean;
};

export type ReporteListaDTO = {
  id: number;
  descripcion: string;
  latitud: number;
  longitud: number;
  estado?: string;
  verificado?: boolean;
};

const BACKEND_IP = "192.168.1.16";
const BASE_URL = `http://${BACKEND_IP}:8080/api`;
export { BASE_URL };

export const fetchReportes = async (): Promise<ReporteListaDTO[]> => {
  try {
    const response = await fetch(`${BASE_URL}/reportes`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data as ReporteListaDTO[];
  } catch (error: any) {
    throw new Error(error.message || 'Error fetching reportes');
  }
};

export const fetchFocos = async (): Promise<FocoMapaDTO[]> => {
  try {
    const response = await fetch(`${BASE_URL}/focos`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data as FocoMapaDTO[];
  } catch (error: any) {
    throw new Error(error.message || 'Error fetching focos');
  }
};

export const enviarReporte = async (data: ReporteDTO): Promise<void> => {
  try {
    const token = await getItem('access_token');
    if (!token) {
      throw new Error('Para enviar un reporte debes iniciar sesión.');
    }
    const response = await fetch(`${BASE_URL}/reportes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Tu sesión ha expirado o debes iniciar sesión para enviar un reporte.');
      }
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error enviando reporte');
  }
};

export const fetchDashboardCombinado = async (): Promise<DashboardDTO> => {
try {
    const response = await fetch(`${BASE_URL}/bff/dashboard-combinado`);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as DashboardDTO;
  } catch (error: any) {
    throw new Error(error.message || 'Error fetching dashboard combinado');
  }
};


