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
};

export type ReporteListaDTO = {
  id: number;
  descripcion: string;
  latitud: number;
  longitud: number;
  estado?: string;
};

const BASE_URL = 'http://192.168.1.16:8080/api';

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
    const response = await fetch(`${BASE_URL}/reportes/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error enviando reporte');
  }
};