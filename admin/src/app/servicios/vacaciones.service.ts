import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs';
import { GeneralesService } from './generales.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VacacionesService {
  constructor(private http: HttpClient, private generales: GeneralesService) { }

  get headers(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'bearer ' + localStorage.getItem('token')
    });
  }

  uri = environment.url + 'vacaciones/';

  mostrar() {
    const url = this.uri + 'mostrar';
    return this.http.get(url, { headers: this.headers }).pipe(map(respuesta => respuesta));
  }

  nuevo(body: any) {
    const url = this.uri + 'nuevo';
    return this.http.post(url, body, { headers: this.headers }).pipe(map(respuesta => respuesta));
  }

  eliminar(body: any) {
    const url = this.uri + 'eliminar';
    return this.http.post(url, body, { headers: this.headers }).pipe(map(respuesta => respuesta));
  }

  /**
   * Tabulador Oficial de Vacaciones (Ley Federal del Trabajo / Reforma Vacaciones Dignas México)
   * 1 año  => 12 días
   * 2 años => 14 días
   * 3 años => 16 días
   * 4 años => 18 días
   * 5 años => 20 días
   * 6 a 10 años => 22 días
   * 11 a 15 años => 24 días
   * 16 a 20 años => 26 días
   * 21 a 25 años => 28 días
   * 26 a 30 años => 30 días
   * 31 a 35 años => 32 días
   */
  obtenerTabulador() {
    return [
      { anios: '1 año', dias: 12 },
      { anios: '2 años', dias: 14 },
      { anios: '3 años', dias: 16 },
      { anios: '4 años', dias: 18 },
      { anios: '5 años', dias: 20 },
      { anios: '6 a 10 años', dias: 22 },
      { anios: '11 a 15 años', dias: 24 },
      { anios: '16 a 20 años', dias: 26 },
      { anios: '21 a 25 años', dias: 28 },
      { anios: '26 a 30 años', dias: 30 },
      { anios: '31 a 35 años', dias: 32 }
    ];
  }

  obtenerDiasPorAntiguedad(anios: number): number {
    if (anios <= 0) return 0;
    if (anios === 1) return 12;
    if (anios === 2) return 14;
    if (anios === 3) return 16;
    if (anios === 4) return 18;
    if (anios === 5) return 20;
    if (anios >= 6 && anios <= 10) return 22;
    if (anios >= 11 && anios <= 15) return 24;
    if (anios >= 16 && anios <= 20) return 26;
    if (anios >= 21 && anios <= 25) return 28;
    if (anios >= 26 && anios <= 30) return 30;
    if (anios >= 31 && anios <= 35) return 32;
    return 32 + (Math.floor((anios - 35) / 5) * 2);
  }

  calcularDiasCorresponden(fechaIngresoStr: string): { aniosAntiguedad: number, diasVacaciones: number } {
    if (!fechaIngresoStr) return { aniosAntiguedad: 0, diasVacaciones: 0 };
    const fechaIngreso = new Date(fechaIngresoStr + 'T00:00:00');
    const hoy = new Date();
    
    let anios = hoy.getFullYear() - fechaIngreso.getFullYear();
    const m = hoy.getMonth() - fechaIngreso.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaIngreso.getDate())) {
      anios--;
    }
    if (anios <= 0) {
      return { aniosAntiguedad: 0, diasVacaciones: 0 };
    }

    return { aniosAntiguedad: anios, diasVacaciones: this.obtenerDiasPorAntiguedad(anios) };
  }

  /**
   * Calcula los periodos anuales de un empleado, las solicitudes de su año actual
   * y los días pendientes a favor acumulados de periodos anteriores.
   */
  calcularBalanceCompleto(fechaIngresoStr: string, todasLasSolicitudes: any[]) {
    if (!fechaIngresoStr) {
      return {
        aniosCumplidos: 0,
        periodoActual: null,
        periodos: [],
        diasPendientesAnteriores: 0,
        diasDisponibles: 0,
        solicitudesActuales: []
      };
    }

    const partes = fechaIngresoStr.split('-');
    const yIngreso = parseInt(partes[0], 10);
    const mIngreso = parseInt(partes[1], 10) - 1;
    const dIngreso = parseInt(partes[2], 10);

    const hoy = new Date();
    const fechaAniversarioEsteAnio = new Date(hoy.getFullYear(), mIngreso, dIngreso);

    // Determinar inicio del periodo activo de 1 año
    let anioInicioPeriodo: number;
    if (hoy >= fechaAniversarioEsteAnio) {
      anioInicioPeriodo = hoy.getFullYear();
    } else {
      anioInicioPeriodo = hoy.getFullYear() - 1;
    }

    if (anioInicioPeriodo < yIngreso) {
      anioInicioPeriodo = yIngreso;
    }

    const fechaInicioPeriodoActual = new Date(anioInicioPeriodo, mIngreso, dIngreso);
    const fechaFinPeriodoActual = new Date(anioInicioPeriodo + 1, mIngreso, dIngreso);

    // Antigüedad cumplida al inicio de este periodo
    const aniosCumplidos = Math.max(0, anioInicioPeriodo - yIngreso);
    const diasTabuladorActual = this.obtenerDiasPorAntiguedad(Math.max(1, aniosCumplidos));

    // Construir todos los periodos anuales transcurridos desde el ingreso
    const periodos: any[] = [];
    let diasPendientesAnteriores = 0;

    for (let anio = yIngreso; anio <= anioInicioPeriodo; anio++) {
      const pInicio = new Date(anio, mIngreso, dIngreso);
      const pFin = new Date(anio + 1, mIngreso, dIngreso);
      const esActual = anio === anioInicioPeriodo;
      const aniosPeriodo = esActual ? Math.max(1, anio - yIngreso) : Math.max(1, (anio + 1) - yIngreso);
      const diasPeriodo = this.obtenerDiasPorAntiguedad(aniosPeriodo);

      // Filtrar solicitudes dentro de este periodo
      const solicitudesPeriodo = todasLasSolicitudes.filter(s => {
        if (!s.fechaInicio) return false;
        const f = new Date(s.fechaInicio + 'T00:00:00');
        return f >= pInicio && f < pFin;
      });

      const diasTomados = solicitudesPeriodo.reduce((acc, s) => acc + (parseInt(s.diasEfectivos, 10) || 0), 0);
      const saldoAFavor = Math.max(0, diasPeriodo - diasTomados);

      // Si es un periodo anterior, acumular días a favor no tomados
      if (!esActual) {
        diasPendientesAnteriores += saldoAFavor;
      }

      periodos.push({
        anioInicio: anio,
        anioFin: anio + 1,
        fechaInicio: pInicio,
        fechaFin: pFin,
        fechaInicioStr: this.formatearFechaIso(pInicio),
        fechaFinStr: this.formatearFechaIso(pFin),
        etiqueta: `${this.formatearFechaCorta(pInicio)} - ${this.formatearFechaCorta(pFin)}`,
        aniosCumplidos: aniosPeriodo,
        diasTabulador: diasPeriodo,
        diasTomados: diasTomados,
        saldoAFavor: saldoAFavor,
        esPeriodoActual: esActual,
        solicitudes: solicitudesPeriodo
      });
    }

    // Solicitudes del periodo actual
    const solicitudesActuales = todasLasSolicitudes.filter(s => {
      if (!s.fechaInicio) return false;
      const f = new Date(s.fechaInicio + 'T00:00:00');
      return f >= fechaInicioPeriodoActual && f < fechaFinPeriodoActual;
    });

    const diasTomadosActual = solicitudesActuales.reduce((acc, s) => acc + (parseInt(s.diasEfectivos, 10) || 0), 0);
    const diasDisponibles = Math.max(0, (diasTabuladorActual + diasPendientesAnteriores) - diasTomadosActual);

    return {
      fechaIngreso: fechaIngresoStr,
      aniosCumplidos,
      periodoActual: {
        inicio: fechaInicioPeriodoActual,
        fin: fechaFinPeriodoActual,
        inicioStr: this.formatearFechaIso(fechaInicioPeriodoActual),
        finStr: this.formatearFechaIso(fechaFinPeriodoActual),
        inicioLegible: this.formatearFechaCorta(fechaInicioPeriodoActual),
        finLegible: this.formatearFechaCorta(fechaFinPeriodoActual),
        proximaRenovacion: this.formatearFechaCorta(fechaFinPeriodoActual),
        diasTabulador: diasTabuladorActual,
        diasPendientesAnteriores,
        diasTomados: diasTomadosActual,
        diasDisponibles,
        solicitudes: solicitudesActuales
      },
      periodos,
      diasPendientesAnteriores,
      diasDisponibles,
      solicitudesActuales
    };
  }

  formatearFechaIso(f: Date): string {
    const yyyy = f.getFullYear();
    const mm = String(f.getMonth() + 1).padStart(2, '0');
    const dd = String(f.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  formatearFechaCorta(f: Date): string {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${f.getDate()} de ${meses[f.getMonth()]} ${f.getFullYear()}`;
  }

  cambiarEstatus(body: { id: number | string, estatus: string, motivoRechazo?: string, idEmpleado?: any }) {
    const url = this.uri + 'cambiar-estatus';
    const payload = {
      ...body,
      idEmpleado: body.idEmpleado || localStorage.getItem('idEmpleado')
    };
    return this.http.post(url, payload, { headers: this.headers }).pipe(map(respuesta => respuesta));
  }

  obtenerNotificaciones(idEmpleado?: any, idTipoUsuario?: any) {
    const url = this.uri + 'notificaciones';
    let params: any = {};
    if (idEmpleado) params.idEmpleado = idEmpleado;
    if (idTipoUsuario) params.idTipoUsuario = idTipoUsuario;
    return this.http.get(url, { headers: this.headers, params }).pipe(map(respuesta => respuesta));
  }

  marcarLeida(id: any, rol: 'jefe' | 'empleado', idEmpleado?: any) {
    const url = this.uri + 'marcar-leida';
    return this.http.post(url, { id, rol, idEmpleado }, { headers: this.headers }).pipe(map(respuesta => respuesta));
  }
}
