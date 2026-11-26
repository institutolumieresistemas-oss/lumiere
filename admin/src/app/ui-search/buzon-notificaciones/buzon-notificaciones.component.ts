import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { VacacionesService } from '../../servicios/vacaciones.service';
import { GeneralesService } from '../../servicios/generales.service';

@Component({
  selector: 'app-buzon-notificaciones',
  templateUrl: './buzon-notificaciones.component.html',
  styleUrl: './buzon-notificaciones.component.css'
})
export class BuzonNotificacionesComponent implements OnInit, OnDestroy {
  abierto = false;
  cargando = false;
  intervalo: any = null;

  notificacionesPorAutorizar: any[] = [];
  notificacionesEmpleado: any[] = [];
  totalNoLeidas = 0;

  idEmpleado: any = null;
  idTipoUsuario: any = null;

  constructor(
    private vacacionesService: VacacionesService,
    private generales: GeneralesService,
    private router: Router,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.obtenerCredenciales();
    this.cargarNotificaciones();

    // Actualizar periódicamente cada 60 segundos
    this.intervalo = setInterval(() => {
      this.cargarNotificaciones(false);
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  obtenerCredenciales() {
    this.idEmpleado = localStorage.getItem('idEmpleado');
    this.idTipoUsuario = localStorage.getItem('permisos');
  }

  cargarNotificaciones(mostrarLoader: boolean = false) {
    this.obtenerCredenciales();
    if (mostrarLoader) this.cargando = true;

    this.vacacionesService.obtenerNotificaciones(this.idEmpleado, this.idTipoUsuario).subscribe(
      (resp: any) => {
        if (mostrarLoader) this.cargando = false;
        this.notificacionesPorAutorizar = resp.porAutorizar || [];
        this.notificacionesEmpleado = resp.misSolicitudes || [];

        // Conteo no leídas
        const noLeidasJefe = this.notificacionesPorAutorizar.filter(n => !n.leido_jefe).length;
        const noLeidasEmp = this.notificacionesEmpleado.filter(n => !n.leido_empleado).length;
        this.totalNoLeidas = noLeidasJefe + noLeidasEmp;
      },
      () => {
        if (mostrarLoader) this.cargando = false;
      }
    );
  }

  toggleDropdown(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.abierto = !this.abierto;
    if (this.abierto) {
      this.cargarNotificaciones(false);
    }
  }

  cerrarDropdown() {
    this.abierto = false;
  }

  @HostListener('document:click', ['$event'])
  clickAfuera(event: MouseEvent) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.cerrarDropdown();
    }
  }

  // --- ACCIONES RÁPIDAS DIRECTAMENTE DESDE LA NOTIFICACIÓN SIN SALIR ---

  autorizarRapido(item: any, event: MouseEvent) {
    event.stopPropagation();
    this.cargando = true;
    this.vacacionesService.cambiarEstatus({ id: item.id, estatus: 'Autorizado' }).subscribe(
      () => {
        this.cargando = false;
        item.estatus = 'Autorizado';
        item.leido_jefe = 1;
        this.generales.mensajeCorrecto('Solicitud de ' + (item.empleadoNombre || 'empleado') + ' autorizada.');
        this.cargarNotificaciones(false);
      },
      (err) => {
        this.cargando = false;
        this.generales.interpretarError(err);
      }
    );
  }

  rechazarRapido(item: any, event: MouseEvent) {
    event.stopPropagation();
    const motivo = prompt('Ingrese el motivo de rechazo:') || '';
    this.cargando = true;
    this.vacacionesService.cambiarEstatus({ id: item.id, estatus: 'Rechazado', motivoRechazo: motivo }).subscribe(
      () => {
        this.cargando = false;
        item.estatus = 'Rechazado';
        item.leido_jefe = 1;
        this.generales.mensajeCorrecto('Solicitud rechazada.');
        this.cargarNotificaciones(false);
      },
      (err) => {
        this.cargando = false;
        this.generales.interpretarError(err);
      }
    );
  }

  // --- NAVEGACIÓN AL DAR CLIC EN EL CUERPO DE LA NOTIFICACIÓN ---

  clickNotificacionJefe(item: any) {
    this.vacacionesService.marcarLeida(item.id, 'jefe', this.idEmpleado).subscribe(() => {
      item.leido_jefe = 1;
    });
    this.cerrarDropdown();
    this.router.navigate(['admin/buzon/vacaciones-autorizar']);
  }

  clickNotificacionEmpleado(item: any) {
    this.vacacionesService.marcarLeida(item.id, 'empleado', this.idEmpleado).subscribe(() => {
      item.leido_empleado = 1;
    });
    this.cerrarDropdown();
    if (item.idEmpleado) {
      this.router.navigate(['admin/vacaciones', item.idEmpleado]);
    } else {
      this.router.navigate(['admin/buzon/notificaciones']);
    }
  }

  irAVacacionesAutorizar() {
    this.cerrarDropdown();
    this.router.navigate(['admin/buzon/vacaciones-autorizar']);
  }

  irANotificacionesPorDia() {
    this.cerrarDropdown();
    this.router.navigate(['admin/buzon/notificaciones']);
  }
}