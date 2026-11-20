import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { finalize, catchError, shareReplay } from 'rxjs/operators';
import { GeneralesService } from './generales.service';

@Injectable({
  providedIn: 'root'
})
export class InterceptorService implements HttpInterceptor {
  private readonly enVuelo = new Map<string, Observable<HttpEvent<any>>>();

  constructor(private generales: GeneralesService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const method = req.method.toUpperCase();
    const url = req.url;
    const body = req.body ?? {};
    const headers = req.headers;
    const esFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    if (method === 'POST' && !esFormData && typeof body === 'object') {
      body.log = localStorage.getItem('usuario');
      body.usuarioID = localStorage.getItem('identificador');
      body.sucursalID = localStorage.getItem('sucursal');
      body.calendarioID = localStorage.getItem('calendario');
    }

    const clave = this.construirClave(method, url, body, esFormData);
    if (clave) {
      const peticionEnVuelo = this.enVuelo.get(clave);
      if (peticionEnVuelo) {
        return peticionEnVuelo;
      }
    }

    this.generales.mostrarCargando();
    req = req.clone({ method, url, body, headers });

    let finalizada = false;
    const peticion$ = next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.generales.interpretarError(error);
        return throwError(() => error);
      }),
      finalize(() => {
        finalizada = true;
        if (clave) {
          this.enVuelo.delete(clave);
        }
        this.generales.ocultarCargando();
      }),
      shareReplay(1)
    );

    if (clave && !finalizada) {
      this.enVuelo.set(clave, peticion$);
    }

    return peticion$;
  }

  private construirClave(method: string, url: string, body: any, esFormData: boolean): string | null {
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || esFormData) {
      return null;
    }
    try {
      return `${method}::${url}::${JSON.stringify(body)}`;
    } catch {
      return null;
    }
  }
}