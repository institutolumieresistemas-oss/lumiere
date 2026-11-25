import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { GeneralesService } from '../../../../servicios/generales.service';
@Component({
  selector: 'app-empleado-domicilio',
  templateUrl: './empleado-domicilio.component.html',
  styleUrl: './empleado-domicilio.component.css'
})
export class EmpleadoDomicilioComponent implements OnInit {
  @Output() siguiente = new EventEmitter<any>();
  @Output() anterior = new EventEmitter<any>();
  @Input() dato: any;
  @Input() listas: any;
  municipios: any;
  @Input() modificar = false;
  constructor(private generales: GeneralesService) { }
  
  ngOnInit(): void {
    if (this.dato && this.dato.idEstado) {
      this.cargarMunicipios();
    }
  }

  cambioEstado(idEstado: any) {
    this.dato.idEstado = idEstado;
    this.dato.idMunicipio = 0;
    this.cargarMunicipios();
  }

  cargarMunicipios(){
    this.municipios = this.generales.sublista(this.listas?.municipios, this.dato.idEstado, 'idEstado');
  }
  
  emitir() {
    this.siguiente.emit(this.dato);
  }
  
  cerrar() {
    this.anterior.emit(1);
  }
}
