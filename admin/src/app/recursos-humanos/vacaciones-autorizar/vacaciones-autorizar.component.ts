import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VacacionesService } from '../../servicios/vacaciones.service';
import { GeneralesService } from '../../servicios/generales.service';

@Component({
  selector: 'app-vacaciones-autorizar',
  templateUrl: './vacaciones-autorizar.component.html',
  styleUrl: './vacaciones-autorizar.component.css'
})
export class VacacionesAutorizarComponent implements OnInit {
  cargando = false;
  solicitudes: any[] = [];
  solicitudesFiltradas: any[] = [];
  filtroEstatus: 'todas' | 'Pendiente' | 'Autorizado' | 'Rechazado' = 'Pendiente';
  busquedaTexto = '';

  idEmpleado: any = null;
  idTipoUsuario: any = null;

  constructor(
    private vacacionesService: VacacionesService,
    public generales: GeneralesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idEmpleado = localStorage.getItem('idEmpleado');
    this.idTipoUsuario = localStorage.getItem('permisos');
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.cargando = true;
    this.vacacionesService.obtenerNotificaciones(this.idEmpleado, this.idTipoUsuario).subscribe(
      (resp: any) => {
        this.cargando = false;
        // Solicitudes asignadas para autorizar (o todas las de la empresa si es admin)
        this.solicitudes = resp.porAutorizar || [];
        this.aplicarFiltros();
      },
      (err) => {
        this.cargando = false;
        this.generales.interpretarError(err);
      }
    );
  }

  cambiarFiltro(estatus: 'todas' | 'Pendiente' | 'Autorizado' | 'Rechazado') {
    this.filtroEstatus = estatus;
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let res = [...this.solicitudes];

    if (this.filtroEstatus !== 'todas') {
      res = res.filter(s => (s.estatus || 'Pendiente') === this.filtroEstatus);
    }

    const txt = (this.busquedaTexto || '').toLowerCase().trim();
    if (txt) {
      res = res.filter(s => {
        const emp = (s.empleadoNombre || '').toLowerCase();
        const puesto = (s.puesto || '').toLowerCase();
        const obs = (s.observaciones || '').toLowerCase();
        return emp.includes(txt) || puesto.includes(txt) || obs.includes(txt);
      });
    }

    this.solicitudesFiltradas = res;
  }

  puedeAutorizar(item: any): boolean {
    // Si no hay jefe asignado no aparecen
    if (!item || !item.idJefeInmediato) {
      return false;
    }
    // Solo le aparecen al jefe que esté asignado en ese momento
    return !!this.idEmpleado && String(item.idJefeInmediato) === String(this.idEmpleado);
  }

  autorizar(item: any) {
    if (!item || !item.id) return;
    this.cargando = true;
    this.vacacionesService.cambiarEstatus({ id: item.id, estatus: 'Autorizado' }).subscribe(
      () => {
        this.cargando = false;
        item.estatus = 'Autorizado';
        this.generales.mensajeCorrecto('Solicitud de vacaciones de ' + item.empleadoNombre + ' autorizada correctamente.');
        this.cargarSolicitudes();
      },
      (err) => {
        this.cargando = false;
        this.generales.interpretarError(err);
      }
    );
  }

  rechazar(item: any) {
    if (!item || !item.id) return;
    const motivo = prompt('Ingrese el motivo de rechazo de la solicitud:') || '';
    this.cargando = true;
    this.vacacionesService.cambiarEstatus({ id: item.id, estatus: 'Rechazado', motivoRechazo: motivo }).subscribe(
      () => {
        this.cargando = false;
        item.estatus = 'Rechazado';
        item.motivoRechazo = motivo;
        this.generales.mensajeCorrecto('Solicitud rechazada.');
        this.cargarSolicitudes();
      },
      (err) => {
        this.cargando = false;
        this.generales.interpretarError(err);
      }
    );
  }

  verPerfilVacaciones(idEmpleado: any) {
    if (idEmpleado) {
      this.router.navigate(['admin/vacaciones', idEmpleado]);
    }
  }

  volverAVacaciones() {
    this.router.navigate(['admin/vacaciones']);
  }
}
