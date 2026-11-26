import { Component, OnInit } from '@angular/core';
import { GeneralesService } from '../../servicios/generales.service';
import { SesionService, InfoSesion } from '../../servicios/sesion.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-usuario',
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.css'
})
export class UsuarioComponent implements OnInit {
  user: any;
  sesion$: Observable<InfoSesion>;

  constructor(
    private generales: GeneralesService,
    private sesionService: SesionService,
    private router: Router
  ) {
    this.sesion$ = this.sesionService.sesion$;
  }

  ngOnInit(): void {
    this.generales.delay(4000).then(fun => {
      this.user = localStorage.getItem('nombre')?.toString();
    });
  }

  verDetallesSesion(info: InfoSesion): void {
    this.sesionService.mostrarModalDetalles(info);
  }

  cerrarSesion(): void {
    this.generales.cerrarSesion();
    this.router.navigate(['login']);
  }
}
