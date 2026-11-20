import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface AlertaConfig {
  tipo: 'success' | 'error' | 'warning' | 'info';
  titulo: string;
  mensaje: string;
  botonTexto?: string;
  callback?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class AlertaService {
  private alertaSource = new Subject<AlertaConfig>();
  alerta$ = this.alertaSource.asObservable();

  show(tipo: AlertaConfig['tipo'], titulo: string, mensaje: string, botonTexto?: string, callback?: () => void) {
    this.alertaSource.next({ tipo, titulo, mensaje, botonTexto, callback });
  }

  success(titulo: string, mensaje: string, botonTexto?: string, callback?: () => void) {
    this.show('success', titulo, mensaje, botonTexto, callback);
  }

  error(titulo: string, mensaje: string, botonTexto?: string, callback?: () => void) {
    this.show('error', titulo, mensaje, botonTexto, callback);
  }

  warning(titulo: string, mensaje: string, botonTexto?: string, callback?: () => void) {
    this.show('warning', titulo, mensaje, botonTexto, callback);
  }

  info(titulo: string, mensaje: string, botonTexto?: string, callback?: () => void) {
    this.show('info', titulo, mensaje, botonTexto, callback);
  }
}
