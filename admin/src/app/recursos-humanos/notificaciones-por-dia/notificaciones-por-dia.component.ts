import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VacacionesService } from '../../servicios/vacaciones.service';
import { GeneralesService } from '../../servicios/generales.service';

interface GrupoNotificacion {
  etiqueta: string;
  items: any[];
}

@Component({
  selector: 'app-notificaciones-por-dia',
  templateUrl: './notificaciones-por-dia.component.html',
  styleUrl: './notificaciones-por-dia.component.css'
})
export class NotificacionesPorDiaComponent implements OnInit {
  cargando = false;
  todasLasNotificaciones: any[] = [];
  gruposPorDia: GrupoNotificacion[] = [];
  filtroTipo: 'todas' | 'autorizar' | 'aprobadas' | 'rechazadas' = 'todas';

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
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.vacacionesService.obtenerNotificaciones(this.idEmpleado, this.idTipoUsuario).subscribe(
      (resp: any) => {
        this.cargando = false;
        const porAutorizar = (resp.porAutorizar || []).map((x: any) => ({
          ...x,
          tipoNotificacion: 'porAutorizar',
          fechaGrupo: x.fechaSolicitud || x.created_at || 'Hoy'
        }));

        const misSolicitudes = (resp.misSolicitudes || []).map((x: any) => ({
          ...x,
          tipoNotificacion: 'misSolicitudes',
          fechaGrupo: x.fechaRespuesta || x.fechaSolicitud || x.created_at || 'Hoy'
        }));

        this.todasLasNotificaciones = [...porAutorizar, ...misSolicitudes];
        this.agruparPorDia();
      },
      (err) => {
        this.cargando = false;
        this.generales.interpretarError(err);
      }
    );
  }

  cambiarFiltro(tipo: 'todas' | 'autorizar' | 'aprobadas' | 'rechazadas') {
    this.filtroTipo = tipo;
    this.agruparPorDia();
  }

  agruparPorDia() {
    let lista = [...this.todasLasNotificaciones];

    if (this.filtroTipo === 'autorizar') {
      lista = lista.filter(x => x.tipoNotificacion === 'porAutorizar' && x.estatus === 'Pendiente');
    } else if (this.filtroTipo === 'aprobadas') {
      lista = lista.filter(x => x.estatus === 'Autorizado');
    } else if (this.filtroTipo === 'rechazadas') {
      lista = lista.filter(x => x.estatus === 'Rechazado');
    }

    // Ordenar de más reciente a más antiguo
    lista.sort((a, b) => {
      const fA = new Date(a.fechaGrupo || 0).getTime();
      const fB = new Date(b.fechaGrupo || 0).getTime();
      return fB - fA;
    });

    const hoy = new Date();
    const hoyStr = this.formatoFecha(hoy);

    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = this.formatoFecha(ayer);

    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const gruposMap = new Map<string, any[]>();
    gruposMap.set('Hoy', []);
    gruposMap.set('Ayer', []);
    gruposMap.set('Esta semana', []);
    gruposMap.set('Anteriores', []);

    for (const item of lista) {
      const fItemStr = item.fechaGrupo ? item.fechaGrupo.split(' ')[0] : '';
      if (fItemStr === hoyStr) {
        gruposMap.get('Hoy')!.push(item);
      } else if (fItemStr === ayerStr) {
        gruposMap.get('Ayer')!.push(item);
      } else {
        const d = new Date(fItemStr + 'T00:00:00');
        if (!isNaN(d.getTime()) && d >= hace7Dias) {
          gruposMap.get('Esta semana')!.push(item);
        } else {
          gruposMap.get('Anteriores')!.push(item);
        }
      }
    }

    this.gruposPorDia = [];
    gruposMap.forEach((items, etiqueta) => {
      if (items.length > 0) {
        this.gruposPorDia.push({ etiqueta, items });
      }
    });
  }

  formatoFecha(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  autorizar(item: any) {
    if (!item || !item.id) return;
    this.cargando = true;
    this.vacacionesService.cambiarEstatus({ id: item.id, estatus: 'Autorizado' }).subscribe(
      () => {
        this.cargando = false;
        item.estatus = 'Autorizado';
        item.leido_jefe = 1;
        this.generales.mensajeCorrecto('Solicitud autorizada exitosamente.');
        this.cargar();
      },
      (err) => {
        this.cargando = false;
        this.generales.interpretarError(err);
      }
    );
  }

  rechazar(item: any) {
    if (!item || !item.id) return;
    const motivo = prompt('Motivo de rechazo:') || '';
    this.cargando = true;
    this.vacacionesService.cambiarEstatus({ id: item.id, estatus: 'Rechazado', motivoRechazo: motivo }).subscribe(
      () => {
        this.cargando = false;
        item.estatus = 'Rechazado';
        item.motivoRechazo = motivo;
        item.leido_jefe = 1;
        this.generales.mensajeCorrecto('Solicitud rechazada.');
        this.cargar();
      },
      (err) => {
        this.cargando = false;
        this.generales.interpretarError(err);
      }
    );
  }

  marcarLeida(item: any) {
    const rol = item.tipoNotificacion === 'porAutorizar' ? 'jefe' : 'empleado';
    this.vacacionesService.marcarLeida(item.id, rol, this.idEmpleado).subscribe(() => {
      if (rol === 'jefe') item.leido_jefe = 1;
      else item.leido_empleado = 1;
    });
  }

  marcarTodasLeidas() {
    for (const grupo of this.gruposPorDia) {
      for (const item of grupo.items) {
        this.marcarLeida(item);
      }
    }
    this.generales.mensajeCorrecto('Todas las notificaciones han sido marcadas como leídas.');
  }

  verFicha(idEmpleado: any) {
    if (idEmpleado) {
      this.router.navigate(['admin/vacaciones', idEmpleado]);
    }
  }
}
