import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs';
import { GeneralesService } from './generales.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DesarrolloService {
  constructor(private http: HttpClient, private generales: GeneralesService) { }
  
  headers: HttpHeaders = new HttpHeaders({
    'Content-Type' : 'application/json',
    Authorization : 'bearer ' + localStorage.getItem('token')
  });

  getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type' : 'application/json',
      Authorization : 'bearer ' + localStorage.getItem('token')
    });
  }

  uri = environment.url+'desarrollo/';
  
  testing(body: any) {
    const url = this.uri + 'testing';
    return this.http.post(url, body, {headers: this.getHeaders()}).pipe( map(respuesta => respuesta) );
  }

  obtenerTablas() {
    const url = this.uri + 'databases/tablas';
    return this.http.get(url, {headers: this.getHeaders()}).pipe( map(respuesta => respuesta) );
  }

  buscarRegistro(tabla: string, id: any) {
    const url = this.uri + 'databases/buscar';
    return this.http.post(url, { tabla, id }, {headers: this.getHeaders()}).pipe( map(respuesta => respuesta) );
  }

  obtenerRecientes(tabla: string) {
    const url = this.uri + 'databases/recientes';
    return this.http.post(url, { tabla }, {headers: this.getHeaders()}).pipe( map(respuesta => respuesta) );
  }

  modificarRegistro(tabla: string, id: any, datos: any) {
    const url = this.uri + 'databases/modificar';
    return this.http.post(url, { tabla, id, datos }, {headers: this.getHeaders()}).pipe( map(respuesta => respuesta) );
  }

  eliminarRegistro(tabla: string, id: any, tipo: string = 'permanente') {
    const url = this.uri + 'databases/eliminar';
    return this.http.post(url, { tabla, id, tipo }, {headers: this.getHeaders()}).pipe( map(respuesta => respuesta) );
  }
}
