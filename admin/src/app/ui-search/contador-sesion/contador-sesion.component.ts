import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { InfoSesion, SesionService } from '../../servicios/sesion.service';

@Component({
  selector: 'app-contador-sesion',
  templateUrl: './contador-sesion.component.html',
  styleUrl: './contador-sesion.component.css'
})
export class ContadorSesionComponent implements OnInit {
  sesion$: Observable<InfoSesion>;

  constructor(private sesionService: SesionService) {
    this.sesion$ = this.sesionService.sesion$;
  }

  ngOnInit(): void {
    this.sesionService.actualizarSesion();
  }

  mostrarDetalles(info: InfoSesion): void {
    this.sesionService.mostrarModalDetalles(info);
  }
}
