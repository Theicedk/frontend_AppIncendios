import { ReporteListaDTO, FocoMapaDTO } from '../services/apiGateway';

export interface DashboardDTO {
  reportes: ReporteListaDTO[];
  focos: FocoMapaDTO[];
}
