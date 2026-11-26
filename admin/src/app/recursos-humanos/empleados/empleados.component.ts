import { Component } from '@angular/core';
import { datatableConfig } from '../../interfaces/tables.interface';
import { GeneralesService } from '../../servicios/generales.service';
import { EmpleadosService } from '../../servicios/empleados.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent {
  configuracion: datatableConfig = {
    alias: ['Nombre', 'Telefono', 'Celular', 'Sucursal', 'Departamento', 'Puesto'],
    encabezados: ['nombre', 'telefono', 'celular', 'sucursal', 'departamento', 'puesto'],
    busqueda: true
  };
  datos: any;
  listas: any;
  cargando = false;
  seleccion: any;
  empleadoSeleccionado: any;
  empleadoNuevo: any;
  vista: any;
  
  constructor(private generales: GeneralesService, private servicio: EmpleadosService, private router: Router){}

  irAVacaciones() {
    if (this.seleccion && this.seleccion.id) {
      this.router.navigate(['admin/vacaciones', this.seleccion.id]);
    }
  }
  
  ngOnInit(): void {
    this.mostrar();
  }
  
  modal(vista: any){
    this.vista = '';
    if (vista === 'modificar') {
      if (!this.seleccion) {
        this.generales.mensajeError('Debe seleccionar un empleado para modificar');
        return;
      }
      this.empleadoSeleccionado = this.formatearEmpleado(this.seleccion);
    } else if (vista === 'nuevo') {
      this.empleadoNuevo = this.nuevoEmpleadoVacio();
    }

    this.generales.delay(300).then(() => {
      this.vista = vista;
      this.generales.abrirModal();
    });
  }

  formatearEmpleado(emp: any) {
    return {
      id: emp.id,
      personales: {
        id: emp.id,
        nombre: emp.nombre || '',
        estadoCivil: emp.estadoCivil || '',
        fechaNacimiento: emp.fechaNacimiento || '',
        telefono: emp.telefono || '',
        celular: emp.celular || '',
        correo: emp.correo || ''
      },
      domicilio: {
        calle: emp.calle || '',
        numeroExterior: emp.numeroExterior || '',
        numeroInterior: emp.numeroInterior || '',
        colonia: emp.colonia || '',
        idEstado: emp.idEstado || 0,
        idMunicipio: emp.idMunicipio || 0,
        codigoPostal: emp.codigoPostal || ''
      },
      fiscales: {
        nss: emp.nss || '',
        rfc: emp.rfc || '',
        curp: emp.curp || '',
        cuentaBancaria: emp.cuentaBancaria || '',
        fechaAltaImss: emp.fechaAltaIMSS || emp.fechaAltaImss || '',
        fechaIngreso: emp.fechaIngreso || '',
        fechaBaja: emp.fechaSalida || emp.fechaBaja || ''
      },
      empresa: {
        sueldoBase: emp.sueldoBase || '',
        sueldoFiscal: emp.sueldoFiscal || '',
        bono: emp.bonoPuntualidad || emp.bono || '',
        bonoPuntualidad: emp.bonoPuntualidad || emp.bono || '',
        idSucursal: emp.idSucursal || 0,
        idDepartamento: emp.idDepartamento || 0,
        idPuesto: emp.idPuesto || 0
      },
      imagenes: {
        actaNacimiento: emp.actaNacimiento || null,
        comprobanteDomicilio: emp.comprobanteDomicilio || null,
        curpImagen: emp.curpImagen || null,
        ifef: emp.ifef || null,
        ifet: emp.ifet || null,
        rfcImagen: emp.rfcImagen || null,
        carta1: emp.carta1 || null,
        carta2: emp.carta2 || null,
        nssImagen: emp.nssImagen || null,
        comprobanteEstudios: emp.comprobanteEstudios || null
      }
    };
  }

  nuevoEmpleadoVacio() {
    return {
      personales: { nombre: '', estadoCivil: '', fechaNacimiento: '', telefono: '', celular: '', correo: '' },
      domicilio: { calle: '', numeroExterior: '', numeroInterior: '', colonia: '', idEstado: 0, idMunicipio: 0, codigoPostal: '' },
      fiscales: { nss: '', rfc: '', curp: '', cuentaBancaria: '', fechaAltaImss: '', fechaIngreso: '', fechaBaja: '' },
      empresa: { sueldoBase: '', sueldoFiscal: '', bono: '', bonoPuntualidad: '', idSucursal: 0, idDepartamento: 0, idPuesto: 0 },
      imagenes: {
        actaNacimiento: null,
        comprobanteDomicilio: null,
        curpImagen: null,
        ifef: null,
        ifet: null,
        rfcImagen: null,
        carta1: null,
        carta2: null,
        nssImagen: null,
        comprobanteEstudios: null
      }
    };
  }
  
  mostrar(){
    this.cargando = true;
    this.servicio.mostrar().subscribe((respuesta: any) => {
      this.cargando = false;
      this.datos = respuesta.datos;
      this.listas = respuesta.listas;
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }
  
  nuevo(dato: any){
    if(this.servicio.validar(dato)){
      this.cargando = true;
      this.servicio.nuevo(dato).subscribe((respuesta: any) => {
        this.cargando = false;
        this.generales.mensajeCorrecto('Empleado agregado correctamente');
        this.datos = this.generales.agregarDatoArray(this.datos, respuesta);
        this.generales.cerrarModal();
      },
      error => {
        this.cargando = false;
        this.generales.interpretarError(error);
      });
    }
  }
  
  modificar(dato: any){
    if (this.seleccion && this.seleccion.id) {
      dato.id = this.seleccion.id;
      if (dato.personales) {
        dato.personales.id = this.seleccion.id;
      }
    }
    if(this.servicio.validar(dato)){
      this.cargando = true;
      this.servicio.modificar(dato).subscribe((respuesta: any) => {
        this.cargando = false;
        this.generales.mensajeCorrecto('Empleado modificado correctamente');
        this.datos = this.generales.actualizarDatoArray(this.datos, respuesta);
        this.seleccion = respuesta;
        this.generales.cerrarModal();
      },
      error => {
        this.cargando = false;
        this.generales.interpretarError(error);
      });
    }
  }
  
  activar(){
    this.cargando = true;
    this.servicio.activar(this.seleccion).subscribe((respuesta: any) => {
      this.cargando = false;
      this.generales.mensajeCorrecto('Empleado activado correctamente');
      this.datos = this.generales.actualizarDatoArray(this.datos, respuesta);
      this.seleccion = respuesta;
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }
  
  desactivar(){
    this.cargando = true;
    this.servicio.desactivar(this.seleccion).subscribe((respuesta: any) => {
      this.cargando = false;
      this.generales.mensajeCorrecto('Empleado desactivado correctamente');
      this.datos = this.generales.actualizarDatoArray(this.datos, respuesta);
      this.seleccion = respuesta;
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }
  
  eliminar(){
    this.cargando = true;
    this.servicio.eliminar(this.seleccion).subscribe((respuesta: any) => {
      this.cargando = false;
      this.generales.mensajeCorrecto('Empleado eliminado correctamente');
      this.datos = this.generales.eliminarDatoArray(this.datos, respuesta);
      this.seleccion = undefined;
    },
    error => {
      this.cargando = false;
      this.generales.interpretarError(error);
    });
  }
  
}
