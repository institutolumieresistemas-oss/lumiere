import { Component, OnInit } from '@angular/core';
import { DesarrolloService } from '../../servicios/desarrollo.service';
import { GeneralesService } from '../../servicios/generales.service';
import swal from 'sweetalert2';

interface ColumnaInfo {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: any;
  Extra: string;
}

interface TablaInfo {
  nombre: string;
  filas: number;
}

@Component({
  selector: 'app-databases',
  templateUrl: './databases.component.html',
  styleUrls: ['./databases.component.css']
})
export class DatabasesComponent implements OnInit {
  tablas: TablaInfo[] = [];
  tablasFiltradas: TablaInfo[] = [];
  filtroTabla: string = '';
  tablaSeleccionada: string = '';

  idBusqueda: string = '';
  cargando: boolean = false;
  guardando: boolean = false;

  columnas: ColumnaInfo[] = [];
  registro: any = null;
  registroOriginal: any = null;
  primaryKey: string = 'id';
  tieneEliminado: boolean = false;

  recientes: any[] = [];
  cargandoRecientes: boolean = false;
  errorBusqueda: string = '';
  camposModificados: { [key: string]: boolean } = {};

  constructor(
    private desarrolloService: DesarrolloService,
    private generales: GeneralesService
  ) {}

  ngOnInit(): void {
    this.cargarTablas();
  }

  cargarTablas(): void {
    this.cargando = true;
    this.desarrolloService.obtenerTablas().subscribe({
      next: (resp: any) => {
        this.cargando = false;
        this.tablas = resp || [];
        this.filtrarTablas();
      },
      error: (err: any) => {
        this.cargando = false;
        this.generales.interpretarError(err);
      }
    });
  }

  filtrarTablas(): void {
    const f = (this.filtroTabla || '').trim().toLowerCase();
    if (!f) {
      this.tablasFiltradas = [...this.tablas];
    } else {
      this.tablasFiltradas = this.tablas.filter(t => t.nombre.toLowerCase().includes(f));
    }
  }

  onSeleccionarTabla(event: any): void {
    const tabla = event.target.value;
    this.seleccionarTabla(tabla);
  }

  seleccionarTabla(tabla: string): void {
    this.tablaSeleccionada = tabla;
    this.registro = null;
    this.registroOriginal = null;
    this.columnas = [];
    this.errorBusqueda = '';
    this.idBusqueda = '';
    this.camposModificados = {};
    if (tabla) {
      this.cargarRecientes(tabla);
    } else {
      this.recientes = [];
    }
  }

  cargarRecientes(tabla: string): void {
    this.cargandoRecientes = true;
    this.desarrolloService.obtenerRecientes(tabla).subscribe({
      next: (resp: any) => {
        this.cargandoRecientes = false;
        this.primaryKey = resp.primaryKey || 'id';
        this.recientes = resp.registros || [];
      },
      error: () => {
        this.cargandoRecientes = false;
        this.recientes = [];
      }
    });
  }

  buscar(): void {
    if (!this.tablaSeleccionada) {
      this.generales.mensajeError('Por favor selecciona una tabla');
      return;
    }
    const id = (this.idBusqueda || '').toString().trim();
    if (!id) {
      this.generales.mensajeError('Ingresa un ID a buscar');
      return;
    }

    this.cargando = true;
    this.errorBusqueda = '';
    this.desarrolloService.buscarRegistro(this.tablaSeleccionada, id).subscribe({
      next: (resp: any) => {
        this.cargando = false;
        this.columnas = resp.columnas || [];
        this.primaryKey = resp.primaryKey || 'id';
        this.tieneEliminado = !!resp.tieneEliminado;
        this.registro = { ...resp.registro };
        this.registroOriginal = { ...resp.registro };
        this.camposModificados = {};
      },
      error: (err: any) => {
        this.cargando = false;
        this.registro = null;
        this.registroOriginal = null;
        if (err.status === 404) {
          const mensaje = err.error || `No se encontró ningún registro con ID ${id} en la tabla ${this.tablaSeleccionada}`;
          this.errorBusqueda = mensaje;
          this.generales.mensajeError(mensaje);
        } else {
          this.generales.interpretarError(err);
        }
      }
    });
  }

  cargarDesdeReciente(item: any): void {
    if (!item) return;
    const pkVal = item[this.primaryKey];
    if (pkVal !== undefined && pkVal !== null) {
      this.idBusqueda = pkVal.toString();
      this.buscar();
    }
  }

  marcarModificado(campo: string): void {
    if (!this.registroOriginal) return;
    const valActual = this.registro[campo];
    const valOriginal = this.registroOriginal[campo];
    this.camposModificados[campo] = valActual !== valOriginal;
  }

  esModificado(campo: string): boolean {
    return !!this.camposModificados[campo];
  }

  hayCambios(): boolean {
    return Object.values(this.camposModificados).some(mod => mod);
  }

  guardarCambios(): void {
    if (!this.registro || !this.registroOriginal) return;
    const pkVal = this.registroOriginal[this.primaryKey];

    swal.fire({
      title: '¿Guardar modificaciones?',
      text: `Se actualizará el registro con ${this.primaryKey} = ${pkVal} en la tabla ${this.tablaSeleccionada}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2dce89',
      cancelButtonColor: '#f5365c'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardando = true;
        this.cargando = true;
        this.desarrolloService.modificarRegistro(this.tablaSeleccionada, pkVal, this.registro).subscribe({
          next: (resp: any) => {
            this.guardando = false;
            this.cargando = false;
            this.generales.mensajeCorrecto('Registro actualizado correctamente');
            if (resp.registro) {
              this.registro = { ...resp.registro };
              this.registroOriginal = { ...resp.registro };
            }
            this.camposModificados = {};
            this.cargarRecientes(this.tablaSeleccionada);
          },
          error: (err: any) => {
            this.guardando = false;
            this.cargando = false;
            this.generales.interpretarError(err);
          }
        });
      }
    });
  }

  eliminar(): void {
    if (!this.registro || !this.registroOriginal) return;
    const pkVal = this.registroOriginal[this.primaryKey];

    if (this.tieneEliminado) {
      swal.fire({
        title: 'Eliminar Registro',
        html: `¿Cómo deseas eliminar el registro <b>${this.primaryKey} = ${pkVal}</b> de la tabla <b>${this.tablaSeleccionada}</b>?<br><br>
               <small class="text-muted">La tabla cuenta con columna <code>eliminado</code>.</small>`,
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Eliminado Lógico (eliminado=1)',
        denyButtonText: 'Eliminación Permanente (DELETE)',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#fb6340',
        denyButtonColor: '#f5365c',
        cancelButtonColor: '#8898aa'
      }).then((result) => {
        if (result.isConfirmed) {
          this.ejecutarEliminacion(pkVal, 'logica');
        } else if (result.isDenied) {
          this.ejecutarEliminacion(pkVal, 'permanente');
        }
      });
    } else {
      swal.fire({
        title: '¿Eliminar permanentemente?',
        html: `Esta acción no se puede deshacer.<br>Se borrará el registro <b>${this.primaryKey} = ${pkVal}</b> de la tabla <b>${this.tablaSeleccionada}</b>.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f5365c',
        cancelButtonColor: '#8898aa'
      }).then((result) => {
        if (result.isConfirmed) {
          this.ejecutarEliminacion(pkVal, 'permanente');
        }
      });
    }
  }

  private ejecutarEliminacion(pkVal: any, tipo: 'logica' | 'permanente'): void {
    this.cargando = true;
    this.desarrolloService.eliminarRegistro(this.tablaSeleccionada, pkVal, tipo).subscribe({
      next: (resp: any) => {
        this.cargando = false;
        const msg = resp.mensaje || (tipo === 'logica' ? 'Registro marcado como eliminado' : 'Registro eliminado permanentemente');
        this.generales.mensajeCorrecto(msg);
        this.limpiar();
        this.cargarRecientes(this.tablaSeleccionada);
      },
      error: (err: any) => {
        this.cargando = false;
        this.generales.interpretarError(err);
      }
    });
  }

  limpiar(): void {
    this.registro = null;
    this.registroOriginal = null;
    this.columnas = [];
    this.camposModificados = {};
    this.errorBusqueda = '';
    this.idBusqueda = '';
  }

  restablecerValores(): void {
    if (this.registroOriginal) {
      this.registro = { ...this.registroOriginal };
      this.camposModificados = {};
    }
  }

  esTipoLargo(col: ColumnaInfo): boolean {
    const t = (col.Type || '').toLowerCase();
    return t.includes('text') || t.includes('json') || t.includes('blob');
  }

  esTipoBooleano(col: ColumnaInfo): boolean {
    const t = (col.Type || '').toLowerCase();
    const f = (col.Field || '').toLowerCase();
    return t.startsWith('tinyint(1)') || f === 'activo' || f === 'eliminado';
  }

  esTipoNumero(col: ColumnaInfo): boolean {
    const t = (col.Type || '').toLowerCase();
    return t.includes('int') || t.includes('decimal') || t.includes('float') || t.includes('double');
  }

  setNull(campo: string): void {
    this.registro[campo] = null;
    this.marcarModificado(campo);
  }

  setVacio(campo: string): void {
    this.registro[campo] = '';
    this.marcarModificado(campo);
  }
}
