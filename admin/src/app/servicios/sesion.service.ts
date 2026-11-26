import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import Swal from 'sweetalert2';

export interface InfoSesion {
  activa: boolean;
  expirada: boolean;
  segundosRestantes: number;
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  formatoCorto: string;
  formatoDetallado: string;
  fechaExpiracion: Date | null;
  fechaExpiracionTexto: string;
  estado: 'normal' | 'alerta' | 'peligro' | 'expirada';
}

const ESTADO_INICIAL: InfoSesion = {
  activa: false,
  expirada: false,
  segundosRestantes: 0,
  dias: 0,
  horas: 0,
  minutos: 0,
  segundos: 0,
  formatoCorto: '--:--',
  formatoDetallado: 'Sin sesión activa',
  fechaExpiracion: null,
  fechaExpiracionTexto: '--/--/----',
  estado: 'normal'
};

@Injectable({
  providedIn: 'root'
})
export class SesionService implements OnDestroy {
  private sesionSubject = new BehaviorSubject<InfoSesion>(ESTADO_INICIAL);
  public sesion$: Observable<InfoSesion> = this.sesionSubject.asObservable();

  private timerSub?: Subscription;
  private expiracionNotificada = false;

  constructor(private router: Router, private ngZone: NgZone) {
    this.iniciarMonitoreo();
  }

  ngOnDestroy(): void {
    this.detenerMonitoreo();
  }

  public iniciarMonitoreo(): void {
    if (this.timerSub) {
      return;
    }

    // Actualización inmediata
    this.calcularEstado();

    // Actualizar cada segundo fuera de NgZone para no saturar change detection innecesariamente
    this.ngZone.runOutsideAngular(() => {
      this.timerSub = interval(1000).subscribe(() => {
        this.ngZone.run(() => {
          this.calcularEstado();
        });
      });
    });
  }

  public detenerMonitoreo(): void {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = undefined;
    }
  }

  public get sesionActual(): InfoSesion {
    return this.sesionSubject.value;
  }

  public isTokenExpirado(): boolean {
    const payload = this.obtenerPayload();
    if (!payload || !payload.exp) {
      return false; // Si no tiene exp verificable no lo marcamos expirado por defecto
    }
    const ahoraSegundos = Math.floor(Date.now() / 1000);
    return payload.exp <= ahoraSegundos;
  }

  public actualizarSesion(): void {
    this.expiracionNotificada = false;
    this.calcularEstado();
  }

  private obtenerToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('token');
  }

  private obtenerPayload(): any | null {
    const token = this.obtenerToken();
    if (!token) {
      return null;
    }

    try {
      const partes = token.split('.');
      if (partes.length !== 3) {
        return null;
      }
      const base64Url = partes[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  private calcularEstado(): void {
    const payload = this.obtenerPayload();
    if (!payload || !payload.exp) {
      if (this.sesionSubject.value.activa) {
        this.sesionSubject.next(ESTADO_INICIAL);
      }
      return;
    }

    const ahoraMs = Date.now();
    const expMs = payload.exp * 1000;
    const diffMs = expMs - ahoraMs;
    const fechaExpiracion = new Date(expMs);

    const fechaFormateada = fechaExpiracion.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    if (diffMs <= 0) {
      const estadoExpirada: InfoSesion = {
        activa: false,
        expirada: true,
        segundosRestantes: 0,
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0,
        formatoCorto: 'Expirada',
        formatoDetallado: 'La sesión ha finalizado',
        fechaExpiracion,
        fechaExpiracionTexto: fechaFormateada,
        estado: 'expirada'
      };

      this.sesionSubject.next(estadoExpirada);

      if (!this.expiracionNotificada) {
        this.expiracionNotificada = true;
        this.manejarSesionExpirada();
      }
      return;
    }

    const segundosTotales = Math.floor(diffMs / 1000);
    const dias = Math.floor(segundosTotales / 86400);
    const horas = Math.floor((segundosTotales % 86400) / 3600);
    const minutos = Math.floor((segundosTotales % 3600) / 60);
    const segundos = segundosTotales % 60;

    let formatoCorto = '';
    if (dias > 0) {
      formatoCorto = `${dias}d ${this.pad(horas)}h ${this.pad(minutos)}m ${this.pad(segundos)}s`;
    } else if (horas > 0) {
      formatoCorto = `${horas}h ${this.pad(minutos)}m ${this.pad(segundos)}s`;
    } else if (minutos > 0) {
      formatoCorto = `${minutos}m ${this.pad(segundos)}s`;
    } else {
      formatoCorto = `${segundos}s`;
    }

    let formatoDetallado = '';
    const partesDetalle: string[] = [];
    if (dias > 0) partesDetalle.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
    if (horas > 0 || dias > 0) partesDetalle.push(`${horas} ${horas === 1 ? 'hora' : 'horas'}`);
    if (minutos > 0 || horas > 0 || dias > 0) partesDetalle.push(`${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`);
    partesDetalle.push(`${segundos} ${segundos === 1 ? 'segundo' : 'segundos'}`);
    formatoDetallado = partesDetalle.join(', ');

    let estado: 'normal' | 'alerta' | 'peligro' = 'normal';
    if (segundosTotales <= 3600) {
      estado = 'peligro'; // menos de 1 hora
    } else if (segundosTotales <= 86400) {
      estado = 'alerta'; // menos de 24 horas
    }

    const nuevoEstado: InfoSesion = {
      activa: true,
      expirada: false,
      segundosRestantes: segundosTotales,
      dias,
      horas,
      minutos,
      segundos,
      formatoCorto,
      formatoDetallado,
      fechaExpiracion,
      fechaExpiracionTexto: fechaFormateada,
      estado
    };

    this.sesionSubject.next(nuevoEstado);
  }

  private pad(valor: number): string {
    return valor.toString().padStart(2, '0');
  }

  private manejarSesionExpirada(): void {
    Swal.fire({
      icon: 'warning',
      title: 'Sesión Finalizada',
      text: 'Tu sesión ha llegado a su límite de vigencia. Por favor ingresa nuevamente.',
      confirmButtonText: 'Aceptar',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      localStorage.clear();
      this.router.navigate(['/login']);
    });
  }

  public mostrarModalDetalles(s?: InfoSesion): void {
    const sesion = s || this.sesionSubject.value;

    if (!sesion.activa && !sesion.expirada) {
      Swal.fire({
        icon: 'info',
        title: 'Sesión',
        text: 'No hay una sesión activa en este momento.',
        confirmButtonText: 'Cerrar'
      });
      return;
    }

    const estadoTexto = sesion.expirada
      ? '<span class="badge bg-danger">Expirada</span>'
      : '<span class="badge bg-success">Activa (Vigencia 1 año)</span>';

    Swal.fire({
      title: '<h4 class="mb-0 text-dark">Información de la Sesión</h4>',
      html: `
        <div class="text-start p-2" style="font-size: 0.95rem;">
          <div class="mb-2"><strong>Estado:</strong> ${estadoTexto}</div>
          <div class="mb-2"><strong>Tiempo restante:</strong> <span class="text-primary font-weight-bold">${sesion.formatoDetallado}</span></div>
          <div class="mb-2"><strong>Fecha de finalización:</strong> ${sesion.fechaExpiracionTexto}</div>
          <div class="alert alert-light border mt-3 text-xs mb-0">
            <i class="fas fa-info-circle text-info me-1"></i> La sesión en el sistema está configurada para durar <strong>1 año</strong> continuo.
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cerrar sesión',
      cancelButtonColor: '#d33',
      confirmButtonColor: '#5e72e4'
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }
}
