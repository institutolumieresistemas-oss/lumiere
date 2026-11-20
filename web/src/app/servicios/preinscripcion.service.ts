import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PreinscripcionService {
  constructor(private http: HttpClient) { }
  
  headers: HttpHeaders = new HttpHeaders({
    'Content-Type' : 'application/json'
  });
  
  catalogos() {
    const url = environment.url + 'preinscripciones/catalogos';
    return this.http.get(url, {headers: this.headers}).pipe( map(respuesta => respuesta) );
  }
  
  guardar(datos: any) {
    const url = environment.url + 'preinscripciones/guardar';
    return this.http.post(url, datos, {headers: this.headers}).pipe( map(respuesta => respuesta) );
  }
}
