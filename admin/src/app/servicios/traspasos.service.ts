import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs';
import { GeneralesService } from './generales.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TraspasosService {
  constructor(private http: HttpClient, private generales: GeneralesService) { }
  uri = environment.url+'traspasos/';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type' : 'application/json',
      Authorization : 'bearer ' + this.generales.getSesionToken()
    });
  }
  
  mostrar() {
    const url = this.uri + 'mostrar';
    return this.http.get(url, {headers: this.getHeaders()}).pipe( map(respuesta => respuesta) );
  }
  
  nuevo(body: any) {
    const url = this.uri + 'nuevo';
    return this.http.post(url, body, {headers: this.getHeaders()}).pipe( map(respuesta => respuesta) );
  }
  
  validar(dato: any){
    if(this.generales.validarString(dato.nombre)){
      this.generales.mensajeError('No se ha ingresado el nombre');
      return false;
    }
    return true;
  }
}
