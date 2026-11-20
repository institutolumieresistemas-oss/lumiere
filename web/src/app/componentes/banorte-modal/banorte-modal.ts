import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BanorteService, SolicitudPago, RespuestaConfirmacion } from '../../servicios/banorte.service';

export interface ErrorDetalleBanorte {
  codigoError?: string;
  resultadoPayw?: string;
  resultadoTexto?: string;
  numeroControl?: string;
  referencia?: string;
  detallesTecnicos?: any;
}

@Component({
  selector: 'app-banorte-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './banorte-modal.html',
  styleUrls: ['./banorte-modal.css']
})
export class BanorteModal implements OnInit, OnDestroy {
  visible = signal(false);
  estado = signal<'formulario' | 'cargando' | 'lightbox' | 'aprobado' | 'error'>('formulario');

  solicitud: SolicitudPago | null = null;
  numeroControlActual = '';

  // Formulario del cliente
  cliente = {
    nombre: '',
    correo: '',
    telefono: ''
  };

  // Errores de validación
  errorValidacion = signal('');
  mensajeError = signal('');
  errorDetalles = signal<ErrorDetalleBanorte | null>(null);
  mostrarDetallesTecnicos = signal(false);

  // Resultado de pago aprobado
  comprobante = signal<{
    numeroControl: string;
    codigoAutorizacion: string;
    referencia: string;
    monto: number;
    concepto: string;
    fecha: string;
    nombre: string;
  } | null>(null);

  private sub: Subscription | null = null;

  constructor(private banorteService: BanorteService) {}

  ngOnInit(): void {
    // Escuchar solicitudes de pago emitidas desde cualquier componente
    this.sub = this.banorteService.modalPago$.subscribe((datos: SolicitudPago) => {
      this.abrir(datos);
    });

    // Precargar scripts de Banorte en segundo plano
    this.banorteService.cargarScriptsBanorte().catch(() => {});
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  abrir(datos: SolicitudPago): void {
    this.solicitud = datos;
    this.estado.set('formulario');
    this.errorValidacion.set('');
    this.mensajeError.set('');
    this.errorDetalles.set(null);
    this.mostrarDetallesTecnicos.set(false);
    this.comprobante.set(null);
    this.visible.set(true);
  }

  cerrar(): void {
    if (this.estado() === 'cargando') return;
    this.visible.set(false);
  }

  procesarPago(): void {
    this.errorValidacion.set('');

    if (!this.cliente.nombre.trim()) {
      this.errorValidacion.set('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!this.cliente.correo.trim() || !this.cliente.correo.includes('@')) {
      this.errorValidacion.set('Por favor ingresa un correo electrónico válido.');
      return;
    }
    const cleanTel = this.cliente.telefono.replace(/\D/g, '');
    if (cleanTel.length < 10) {
      this.errorValidacion.set('Por favor ingresa tu número telefónico (10 dígitos).');
      return;
    }

    if (!this.solicitud || !this.solicitud.monto || this.solicitud.monto < 1) {
      this.errorValidacion.set('El monto de la operación es inválido.');
      return;
    }

    this.estado.set('cargando');

    // 1. Iniciar transacción en el backend
    this.banorteService.iniciarTransaccion({
      monto: this.solicitud.monto,
      concepto: this.solicitud.concepto || `Pago Curso ${this.solicitud.curso}`,
      tipo_origen: 'curso',
      id_origen: this.solicitud.idAltaCurso,
      cliente_nombre: this.cliente.nombre.trim(),
      cliente_correo: this.cliente.correo.trim(),
      cliente_telefono: cleanTel
    }).subscribe({
      next: (resp: any) => {
        if (!resp || !resp.cadenaFinal) {
          this.mostrarError('Respuesta inesperada al inicializar pasarela Banorte.', {
            codigoError: 'ERR_RESPUESTA_VACIA'
          });
          return;
        }

        this.numeroControlActual = resp.numeroControl;
        this.estado.set('lightbox');

        // 2. Abrir Lightbox de Banorte
        this.banorteService.abrirLightbox(resp.cadenaFinal, {
          onSuccess: (data: any) => {
            console.log('%c[BANORTE LIGHTBOX SUCCESS]:', 'color: #00ff00; font-weight: bold;', data);
            this.handleSuccess(data);
          },
          onError: (err: any) => {
            console.error('%c[BANORTE LIGHTBOX ERROR]:', 'color: #ff0000; font-weight: bold;', err);
            this.handleError(err);
          },
          onCancel: (cancel: any) => {
            console.warn('%c[BANORTE LIGHTBOX CANCEL]:', 'color: #ffa500;', cancel);
            this.handleCancel(cancel);
          },
          onClosed: (closed: any) => {
            if (this.estado() === 'lightbox') {
              this.estado.set('formulario');
            }
          }
        });
      },
      error: (err: any) => {
        const errObj = err?.error || {};
        const msg = errObj.mensaje || errObj.error || 'Error al conectar con el servidor de cobro.';
        this.mostrarError(msg, {
          codigoError: errObj.codigoError || 'ERR_INICIAR',
          resultadoTexto: errObj.mensaje || 'Error al inicializar la pasarela',
          detallesTecnicos: errObj
        });
      }
    });
  }

  private handleSuccess(data: any): void {
    this.estado.set('cargando');

    const numControl = data?.numeroControl || data?.controlNumber || this.numeroControlActual;
    const cypherData = data?.data || data?.crypt || (typeof data === 'string' ? data : (data?.response || data));

    this.banorteService.confirmarTransaccion({
      numeroControl: numControl,
      data: cypherData
    }).subscribe({
      next: (res: RespuestaConfirmacion) => {
        this.comprobante.set({
          numeroControl: res.numeroControl || numControl,
          codigoAutorizacion: res.codigoAutorizacion || 'N/A',
          referencia: res.referencia || 'N/A',
          monto: res.monto || this.solicitud?.monto || 0,
          concepto: this.solicitud?.concepto || 'Inscripción Lumiere',
          fecha: new Date().toLocaleString('es-MX'),
          nombre: this.cliente.nombre
        });
        this.estado.set('aprobado');
      },
      error: (err: any) => {
        const errObj = err?.error || {};
        const msg = errObj.mensaje || ('La transacción no fue autorizada. No. de control: ' + numControl);
        
        this.mostrarError(msg, {
          codigoError: errObj.codigoError || errObj.resultadoPayw || 'DECLINADO',
          resultadoPayw: errObj.resultadoPayw || 'D',
          resultadoTexto: errObj.texto || (errObj.resultadoPayw === 'D' ? 'DECLINADA' : 'RECHAZADA'),
          numeroControl: errObj.numeroControl || numControl,
          referencia: errObj.referencia,
          detallesTecnicos: errObj.datos || errObj
        });
      }
    });
  }

  private handleError(err: any): void {
    let codigo = 'ERR_BANORTE_VCE';
    let texto = '';
    let msg = 'Ocurrió un error al procesar tu tarjeta en Banorte. Por favor verifica tus datos o intenta con otra tarjeta.';

    if (typeof err === 'string') {
      try {
        const parsed = JSON.parse(err);
        codigo = parsed.code || parsed.codigoError || parsed.resultadoPayw || parsed.id_error || codigo;
        texto = parsed.text || parsed.texto || parsed.message || parsed.mensaje || err;
        msg = parsed.message || parsed.mensaje || texto || msg;
      } catch {
        texto = err;
        msg = err;
      }
    } else if (err && typeof err === 'object') {
      codigo = err.code || err.codigo || err.errorCode || err.id_error || err.status || err.resultadoPayw || codigo;
      texto = err.text || err.texto || err.message || err.mensaje || err.description || err.desc || '';
      if (err.message || err.mensaje || err.detail) {
        msg = err.message || err.mensaje || err.detail;
      } else if (texto) {
        msg = `Banorte reportó: ${texto}`;
      }
    }

    this.mostrarError(msg, {
      codigoError: String(codigo),
      resultadoTexto: texto || 'Error reportado durante el Lightbox de Banorte',
      numeroControl: this.numeroControlActual,
      detallesTecnicos: err
    });
  }

  private handleCancel(cancel: any): void {
    this.estado.set('formulario');
    this.errorValidacion.set('La operación fue cancelada por el usuario.');
  }

  private mostrarError(mensaje: string, detalles?: ErrorDetalleBanorte): void {
    this.mensajeError.set(mensaje);
    this.errorDetalles.set(detalles || null);
    this.estado.set('error');
  }

  obtenerSignificadoResultado(resultado?: string): string {
    switch (resultado) {
      case 'A': return 'Aprobada / Autorizada';
      case 'D': return 'Declinada por el banco emisor (fondos insuficientes, tarjeta bloqueada o rechazada)';
      case 'R': return 'Rechazada por reglas de seguridad bancaria / 3D Secure';
      case 'T': return 'Tiempo de espera agotado (timeout de comunicación con el switch)';
      case 'E': return 'Error de formato, parámetros o comunicación con Banorte Payworks';
      default: return 'Transacción no completada';
    }
  }

  toggleDetallesTecnicos(): void {
    this.mostrarDetallesTecnicos.update(v => !v);
  }

  imprimirComprobante(): void {
    window.print();
  }
}
