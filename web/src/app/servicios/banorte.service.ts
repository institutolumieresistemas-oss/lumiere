import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SolicitudPago {
  curso?: string;
  modalidad?: string;
  tipo: 'comprar' | 'apartar' | 'general';
  monto: number;
  concepto: string;
  idAltaCurso?: number | string;
  imagen?: string;
  clienteNombre?: string;
  clienteCorreo?: string;
  clienteTelefono?: string;
}

export interface RespuestaConfirmacion {
  status: string;
  mensaje: string;
  numeroControl?: string;
  codigoAutorizacion?: string;
  referencia?: string;
  monto?: number;
  texto?: string;
  resultadoPayw?: string;
  codigoError?: string;
  datos?: any;
}

@Injectable({
  providedIn: 'root'
})
export class BanorteService {
  private apiUrl = environment.url;
  private headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  // Notificador para abrir el modal de pago
  private modalPagoSource = new Subject<SolicitudPago>();
  modalPago$ = this.modalPagoSource.asObservable();

  // Scripts de Banorte
  private scriptsLoaded = false;
  private scriptLoadingPromise: Promise<boolean> | null = null;

  constructor(private http: HttpClient) {
    this.iniciarInterceptorGlobal();
  }

  /**
   * Abre el modal de pago para cualquier curso o concepto
   */
  solicitarPago(datos: SolicitudPago): void {
    this.modalPagoSource.next(datos);
  }

  /**
   * Inicializa la transacción con el backend y obtiene la cadena cifrada
   */
  iniciarTransaccion(datos: {
    monto: number;
    concepto: string;
    tipo_origen?: string;
    id_origen?: any;
    cliente_nombre: string;
    cliente_correo: string;
    cliente_telefono: string;
  }): Observable<any> {
    const url = `${this.apiUrl}banorte/iniciar`;
    return this.http.post(url, datos, { headers: this.headers });
  }

  /**
   * Confirma la transacción recibida del lightbox con el backend
   */
  confirmarTransaccion(datos: {
    numeroControl: string;
    data: any;
  }): Observable<RespuestaConfirmacion> {
    const url = `${this.apiUrl}banorte/confirmar`;
    return this.http.post<RespuestaConfirmacion>(url, datos, { headers: this.headers });
  }

  /**
   * Consulta el estado de una transacción
   */
  consultarTransaccion(numeroControl: string): Observable<any> {
    const url = `${this.apiUrl}banorte/consultar`;
    return this.http.post(url, { numeroControl }, { headers: this.headers });
  }

  /**
   * Obtiene la instancia de Payment soportando variables globales declaradas con let o window
   */
  getPaymentInstance(): any {
    if (typeof window === 'undefined') return null;
    if ((window as any).Payment) return (window as any).Payment;
    try {
      const p = (window as any).eval?.('typeof Payment !== "undefined" ? Payment : null');
      if (p) {
        (window as any).Payment = p;
        return p;
      }
    } catch (e) {}
    return null;
  }

  /**
   * Carga de forma asíncrona los scripts oficiales requeridos por el Lightbox de Banorte VCE
   */
  cargarScriptsBanorte(): Promise<boolean> {
    if (this.getPaymentInstance()) {
      this.scriptsLoaded = true;
      return Promise.resolve(true);
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise((resolve) => {
      // 1. Cargar jQuery primero si no está disponible
      const cargarJQuery = (): Promise<void> => {
        if ((window as any).jQuery && (window as any).$) {
          return Promise.resolve();
        }
        return new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://multicobros.banorte.com/orquestador/resources/js/jquery-3.3.1.js';
          s.type = 'text/javascript';
          s.onload = () => res();
          s.onerror = (e) => rej(e);
          document.head.appendChild(s);
        });
      };

      // 1.5 Cargar jQuery Modal
      const cargarJQueryModal = (): Promise<void> => {
        const hasModal = (window as any).$ && typeof (window as any).$.modal === 'function';
        if (hasModal) {
          return Promise.resolve();
        }
        return new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery-modal/0.9.1/jquery.modal.min.js';
          s.type = 'text/javascript';
          s.onload = () => res();
          s.onerror = (e) => rej(e);
          document.head.appendChild(s);

          const css = document.createElement('link');
          css.rel = 'stylesheet';
          css.href = 'https://cdnjs.cloudflare.com/ajax/libs/jquery-modal/0.9.1/jquery.modal.min.css';
          document.head.appendChild(css);
        });
      };

      // 2. Cargar checkoutV2.js de Banorte
      const cargarCheckout = (): Promise<void> => {
        if (this.getPaymentInstance()) {
          return Promise.resolve();
        }
        return new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://multicobros.banorte.com/orquestador/lightbox/checkoutV2.js';
          s.type = 'text/javascript';
          s.onload = () => {
            setTimeout(() => {
              this.getPaymentInstance();
              res();
            }, 50);
          };
          s.onerror = (e) => rej(e);
          document.head.appendChild(s);
        });
      };

      cargarJQuery()
        .then(() => cargarJQueryModal())
        .then(() => cargarCheckout())
        .then(() => {
          this.scriptsLoaded = !!this.getPaymentInstance();
          resolve(this.scriptsLoaded);
        })
        .catch(err => {
          console.error('Error al cargar librerías de Banorte:', err);
          this.scriptLoadingPromise = null;
          resolve(false);
        });
    });

    return this.scriptLoadingPromise;
  }

  /**
   * Abre la Ventana de Comercio Electrónico (Lightbox) de Banorte
   */
  async abrirLightbox(
    cadenaFinal: string,
    callbacks: {
      onSuccess: (resp: any) => void;
      onError: (err: any) => void;
      onCancel: (resp: any) => void;
      onClosed: (resp: any) => void;
    }
  ): Promise<void> {
    await this.cargarScriptsBanorte();

    let Payment = this.getPaymentInstance();
    if (!Payment) {
      await new Promise(r => setTimeout(r, 200));
      Payment = this.getPaymentInstance();
    }
    if (!Payment) {
      await new Promise(r => setTimeout(r, 400));
      Payment = this.getPaymentInstance();
    }

    if (!Payment) {
      callbacks.onError({
        mensaje: 'No fue posible cargar el módulo seguro de Banorte. Por favor intenta de nuevo.'
      });
      return;
    }

    // Configurar ambiente de producción/pruebas oficial de Banorte
    try {
      Payment.setEnv('pro');
    } catch (e) {
      console.warn('Payment.setEnv warning:', e);
    }

    // Inicializar pasarela
    Payment.startPayment({
      Params: cadenaFinal,
      onSuccess: (resp: any) => {
        callbacks.onSuccess(resp);
      },
      onError: (err: any) => {
        callbacks.onError(err);
      },
      onCancel: (cancel: any) => {
        callbacks.onCancel(cancel);
      },
      onClosed: (close: any) => {
        callbacks.onClosed(close);
      }
    });
  }

  /**
   * Interceptor global: Atrapa cualquier clic en enlaces que contengan
   * 'mercadopago.com', 'mpago.la' o 'mpago.li' en toda la web y los redirige a Banorte.
   */
  private iniciarInterceptorGlobal(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    document.addEventListener('click', (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a');
      if (!target || !target.href) return;

      const href = target.href.toLowerCase();
      const esMercadoPago = href.includes('mercadopago.com') ||
                            href.includes('mpago.la') ||
                            href.includes('mpago.li');

      if (esMercadoPago) {
        event.preventDefault();
        event.stopPropagation();

        // Buscar información en la tarjeta de curso o contenedor más cercano
        const cursoCard = target.closest('.curso-card, .card, [class*="curso"]');
        const titulo = cursoCard?.querySelector('h1, h2, h3, h4, .titulo')?.textContent?.trim() || 'Curso Lumiere';
        const precioElem = cursoCard?.querySelector('.precio-oferta, .precio, [class*="precio"]');
        let monto = 1000;
        if (precioElem && precioElem.textContent) {
          const num = parseFloat(precioElem.textContent.replace(/[^0-9.]/g, ''));
          if (!isNaN(num) && num > 0) monto = num;
        }

        const esApartado = target.textContent?.toLowerCase().includes('apart') || false;

        this.solicitarPago({
          curso: titulo,
          modalidad: 'En línea / Presencial',
          tipo: esApartado ? 'apartar' : 'comprar',
          monto: esApartado ? Math.min(1000, monto) : monto,
          concepto: `${esApartado ? 'Apartado' : 'Inscripción'} ${titulo}`
        });
      }
    }, true);
  }
}
