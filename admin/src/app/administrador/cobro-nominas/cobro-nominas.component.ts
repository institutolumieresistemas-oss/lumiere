import { Component } from '@angular/core';
import { datatableConfig } from '../../interfaces/tables.interface';
import { GeneralesService } from '../../servicios/generales.service';
import { NominasService } from '../../servicios/nominas.service';
import { PdfService } from '../../servicios/pdf.service';

@Component({
  selector: 'app-cobro-nominas',
  templateUrl: './cobro-nominas.component.html',
  styleUrl: './cobro-nominas.component.css'
})
export class CobroNominasComponent {
  configuracion: datatableConfig = {
    alias: ['Folio', 'Departamento', 'Calendario', 'Empleado', 'Nivel', 'Total Efectivo', 'Total Deposito', 'Total'],
    encabezados: ['folio', 'departamento', 'calendario', 'empleado', 'nivel', 'totalEfectivo', 'totalDeposito', 'total'],
    busqueda: true
  };
  datos: any;
  cargando = false;
  seleccion: any;
  vista: any;
  
  constructor(private generales: GeneralesService, private servicio: NominasService, private pdf: PdfService){}
  
  ngOnInit(): void {
    this.mostrar();
  }
  
  mostrar(){
    this.cargando = true;
    this.servicio.autorizadas({}).subscribe((respuesta: any) => {
      this.cargando = false;
      this.datos = respuesta;
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }

  cobrar(){
    if (this.cargando || !this.seleccion) {
      return;
    }
    this.cargando = true;
    const nominaCobrada = this.seleccion;
    this.servicio.cobrar(nominaCobrada).subscribe((respuesta: any) => {
      this.cargando = false;
      this.generales.mensajeCorrecto('Nomina cobrada correctamente');

      const idsEliminar: string[] = [];
      if (Array.isArray(nominaCobrada)) {
        nominaCobrada.forEach((item: any) => {
          if (item?.id !== undefined && item?.id !== null) {
            idsEliminar.push(item.id.toString());
          }
        });
      } else if (nominaCobrada?.id !== undefined && nominaCobrada?.id !== null) {
        idsEliminar.push(nominaCobrada.id.toString());
      }

      if (respuesta?.id !== undefined && respuesta?.id !== null) {
        const resId = respuesta.id.toString();
        if (!idsEliminar.includes(resId)) {
          idsEliminar.push(resId);
        }
      }

      if (idsEliminar.length > 0 && Array.isArray(this.datos)) {
        this.datos = this.datos.filter((item: any) => !idsEliminar.includes(item.id?.toString()));
      } else {
        this.datos = this.generales.eliminarDatoArray(this.datos, nominaCobrada);
      }

      this.seleccion = undefined;
      this.mostrar();
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }

  imprimir(){
    if (this.seleccion?.id) {
      this.pdf.pdfNomina(this.seleccion.id);
    }
  }
}
