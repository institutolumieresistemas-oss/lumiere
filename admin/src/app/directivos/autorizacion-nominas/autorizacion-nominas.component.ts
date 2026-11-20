import { Component } from '@angular/core';
import { datatableConfig } from '../../interfaces/tables.interface';
import { GeneralesService } from '../../servicios/generales.service';
import { NominasService } from '../../servicios/nominas.service';
import { PdfService } from '../../servicios/pdf.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-autorizacion-nominas',
  templateUrl: './autorizacion-nominas.component.html',
  styleUrl: './autorizacion-nominas.component.css'
})
export class AutorizacionNominasComponent {
  configuracion: datatableConfig = {
    alias: ['Nomina', 'Departamento', 'Empleado', 'Nivel', 'Calendario', 'Sucursal', 'Total Efectivo', 'Total Deposito', 'Total'],
    encabezados: ['folio', 'departamento', 'empleado', 'nivel', 'calendario', 'sucursal', 'totalEfectivo', 'totalDeposito', 'totalFormato'],
    busqueda: true,
    multiseleccion: true
  };
  datos: any;
  cargando = false;
  seleccion: any;
  listas = {
    sucursales: []
  }
  listado: any
  idSucursal = 0;
  constructor(private generales: GeneralesService, private servicio: NominasService, private pdf: PdfService, private router: Router){}
  
  ngOnInit(): void {
    this.mostrar();
  }

  mostrar(callback?: () => void){
    this.cargando = true;
    this.servicio.creadas().subscribe((respuesta: any) => {
      this.cargando = false;
      this.listas = respuesta.listas;
      this.listado = respuesta.nominas;
      if (callback) {
        callback();
      }
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }

  buscar(){
    this.datos = this.generales.sublista(this.listado, this.idSucursal, 'idSucursal')
  }

  autorizar(){
    if (!this.seleccion || (Array.isArray(this.seleccion) && this.seleccion.length === 0)) {
      return;
    }
    this.cargando = true;
    const nominasAutorizadas = this.seleccion;
    const body = {
      nominas: nominasAutorizadas
    }
    this.servicio.autorizar(body).subscribe((respuesta: any) => {
      this.cargando = false;
      this.generales.mensajeCorrecto('Nominas autorizadas correctamente');

      const ids: string[] = [];
      if (Array.isArray(nominasAutorizadas)) {
        nominasAutorizadas.forEach((item: any) => {
          if (item?.id !== undefined && item?.id !== null) {
            ids.push(item.id.toString());
          }
        });
      } else if (nominasAutorizadas?.id !== undefined && nominasAutorizadas?.id !== null) {
        ids.push(nominasAutorizadas.id.toString());
      }

      if (ids.length > 0) {
        if (Array.isArray(this.datos)) {
          this.datos = this.datos.filter((d: any) => !ids.includes(d.id?.toString()));
        }
        if (Array.isArray(this.listado)) {
          this.listado = this.listado.filter((d: any) => !ids.includes(d.id?.toString()));
        }
      }

      this.seleccion = undefined;
      this.mostrar(() => {
        this.buscar();
      });
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }

  modificar(){
    if (this.seleccion && this.seleccion.length > 0) {
      this.router.navigate(['/admin/nomina', this.seleccion[0].id]);
    }
  }

  imprimir(){
    if (this.seleccion && this.seleccion.length > 0) {
      this.pdf.pdfNomina(this.seleccion[0].id);
    }
  }
}
