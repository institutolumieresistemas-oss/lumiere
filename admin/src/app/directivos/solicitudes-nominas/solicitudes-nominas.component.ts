import { Component } from '@angular/core';
import { datatableConfig } from '../../interfaces/tables.interface';
import { GeneralesService } from '../../servicios/generales.service';
import { NominasService } from '../../servicios/nominas.service';

@Component({
  selector: 'app-solicitudes-nominas',
  templateUrl: './solicitudes-nominas.component.html',
  styleUrl: './solicitudes-nominas.component.css'
})
export class SolicitudesNominasComponent {
  configuracion: datatableConfig = {
    alias: ['Folio', 'Empleado', 'Forma', 'Concepto', 'Accion', 'Tipo'],
    encabezados: ['folio', 'empleado', 'forma', 'concepto', 'accion', 'tipoCambio'],
    busqueda: true
  };
  listado: any;
  datos: any;
  cargando = false;
  seleccion: any;
  vista: any;
  opciones = [
    { id: 0, nombre: 'Pendientes' },
    { id: 1, nombre: 'Aceptadas' },
    { id: 2, nombre: 'Rechazadas' }
  ]
  constructor(private generales: GeneralesService, private servicio: NominasService){}
  
  ngOnInit(): void {
    this.mostrar();
  }
  
  modal(vista: any){
    this.vista = '';
    this.generales.delay(500).then(fun => {
      this.vista = vista;
      this.generales.abrirModal();
    });
  }

  traer(estatus: any){
    this.datos = this.generales.registros(this.listado, estatus, 'estatus');
  }
  
  mostrar(){
    this.cargando = true;
    this.servicio.solicitudes().subscribe((respuesta: any) => {
      this.cargando = false;
      this.listado = respuesta;
      this.traer(0);
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }

  aceptar(){
    if (!this.seleccion) {
      return;
    }
    this.cargando = true;
    const seleccionada = this.seleccion;
    this.servicio.aceptarSolicitud(seleccionada).subscribe((respuesta: any) => {
      this.cargando = false;
      this.generales.mensajeCorrecto('Solicitud aceptada correctamente');
      if (seleccionada?.id !== undefined && seleccionada?.id !== null && Array.isArray(this.datos)) {
        this.datos = this.datos.filter((item: any) => item.id?.toString() !== seleccionada.id.toString());
      }
      this.seleccion = undefined;
      this.mostrar();
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }

  rechazar(){
    if (!this.seleccion) {
      return;
    }
    this.cargando = true;
    const seleccionada = this.seleccion;
    this.servicio.rechazarSolicitud(seleccionada).subscribe((respuesta: any) => {
      this.cargando = false;
      this.generales.mensajeCorrecto('Solicitud rechazada correctamente');
      if (seleccionada?.id !== undefined && seleccionada?.id !== null && Array.isArray(this.datos)) {
        this.datos = this.datos.filter((item: any) => item.id?.toString() !== seleccionada.id.toString());
      }
      this.seleccion = undefined;
      this.mostrar();
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }
  
}
