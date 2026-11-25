import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { GeneralesService } from '../../../../servicios/generales.service';

@Component({
  selector: 'app-empleado-empresa',
  templateUrl: './empleado-empresa.component.html',
  styleUrl: './empleado-empresa.component.css'
})
export class EmpleadoEmpresaComponent implements OnInit {
  @Output() siguiente = new EventEmitter<any>();
  @Output() anterior = new EventEmitter<any>();
  @Input() dato: any;
  @Input() modificar = false;
  @Input() listas = {
    sucursales: [],
    departamentos: [],
    puestos: []
  }
  puestos: any;
  constructor(private generales: GeneralesService) { }
  
  ngOnInit(): void {
    if (this.dato && this.dato.idDepartamento) {
      this.cargarPuestos();
    }
  }

  cambioDepartamento(idDepartamento: any) {
    this.dato.idDepartamento = idDepartamento;
    this.dato.idPuesto = 0;
    this.cargarPuestos();
  }

  cargarPuestos(){
    this.puestos = this.generales.sublista(this.listas?.puestos, this.dato.idDepartamento, 'idDepartamento');
  }
  
  emitir() {
    this.siguiente.emit(this.dato);
  }
  
  cerrar() {
    this.anterior.emit(1);
  }
}
