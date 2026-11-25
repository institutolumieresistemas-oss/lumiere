import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { GeneralesService } from '../../../../servicios/generales.service';

@Component({
  selector: 'app-modal-empleado',
  templateUrl: './modal-empleado.component.html',
  styleUrl: './modal-empleado.component.css'
})
export class ModalEmpleadoComponent implements OnInit {
  @Output() emitidor = new EventEmitter<any>();
  
  @Input() dato: any = {
    personales: { nombre: '', estadoCivil: '', fechaNacimiento: '', telefono: '', celular: '', correo: '' },
    domicilio: { calle: '', numeroExterior: '', numeroInterior: '', colonia: '', idEstado: 0, idMunicipio: 0, codigoPostal: '' },
    fiscales: { nss: '', rfc: '', curp: '', cuentaBancaria: '', fechaAltaImss: '', fechaIngreso: '', fechaBaja: '' },
    empresa: { sueldoBase: '', sueldoFiscal: '', bono: '', bonoPuntualidad: '', idSucursal: 0, idDepartamento: 0, idPuesto: 0 }
  };

  @Input() listas = {
    domicilio: { estados: [], municipios: [] },
    empresa: { sucursales: [], departamentos: [], puestos: [] }
  };
  
  @Input() modificar = false;
  vista = 0;

  constructor(private generales: GeneralesService) { }
  
  ngOnInit(): void {
    this.vista = 0;
  }

  irAPaso(paso: number) {
    this.vista = paso;
  }
  
  guardarPaso(seccion: string, datosRecibidos: any) {
    // Almacena de forma segura los datos enviados por el componente hijo
    if (seccion === 'personales') this.dato.personales = datosRecibidos;
    if (seccion === 'domicilio') this.dato.domicilio = datosRecibidos;
    if (seccion === 'fiscales') this.dato.fiscales = datosRecibidos;
    if (seccion === 'empresa') this.dato.empresa = datosRecibidos;

    // Controla si avanza o si ya es el último paso (Empresa es paso 3)
    if (this.vista < 3) {
      this.vista++;
    } else if (this.vista === 3) {
      this.finalizarRegistro();
    }
  }

  atrasPaso() {
    if (this.vista > 0) {
      this.vista--;
    }
  }

  finalizarRegistro() {
    this.emitidor.emit(this.dato);
  }
  
  cerrar() {
    this.generales.cerrarModal();
  }
}