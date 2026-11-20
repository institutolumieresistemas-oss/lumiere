import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { GeneralesService } from '../../../../servicios/generales.service';

@Component({
  selector: 'app-modal-traspaso',
  templateUrl: './modal-traspaso.component.html',
  styleUrl: './modal-traspaso.component.css'
})
export class ModalTraspasoComponent {
  @Output() emitidor = new EventEmitter<any>();
  @Input() dato = {
    monto: '',
    idFormaPago: 0,
    idCuenta: 0,
    efectivo: false
  };
  @Input() cuenta: any;
  @Input() formas = [];
  @Input() cuentas: any[] = [];
  @Input() guardando = false;
  constructor(public generales: GeneralesService) { }
  
  ngOnInit(): void {
    this.dato = {
      monto: '',
      idFormaPago: (this.cuenta?.efectivo) ? 1 : 0,
      idCuenta: 0,
      efectivo: !!this.cuenta?.efectivo
    };
  }

  get cuentasDestino(): any[] {
    if (!Array.isArray(this.cuentas)) {
      return [];
    }
    if (this.cuenta?.efectivo) {
      return this.cuentas;
    }
    return this.cuentas.filter((c: any) => String(c.id) !== String(this.cuenta?.id));
  }

  cambiarFormaPago(idFormaPago: any) {
    this.dato.idFormaPago = idFormaPago;
    if (Number(idFormaPago) === 1 && !this.cuenta?.efectivo) {
      this.dato.idCuenta = 0;
    }
  }
  
  emitir() {
    this.emitidor.emit({ ...this.dato });
  }
  
  cerrar() {
    this.generales.cerrarModal();
  }
}
