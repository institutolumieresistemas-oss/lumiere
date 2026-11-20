import { Component } from '@angular/core';
import { GeneralesService } from '../../servicios/generales.service';
import { BalancesService } from '../../servicios/balances.service';
import { TraspasosService } from '../../servicios/traspasos.service';

declare function exportCSVFile(headers: string[] | null, items: unknown[], filename: string): void;

@Component({
  selector: 'app-balance-cuentas',
  templateUrl: './balance-cuentas.component.html',
  styleUrl: './balance-cuentas.component.css'
})
export class BalanceCuentasComponent {
  cargando = false;
  guardando = false;
  cuentas: any;
  sucursales: any;
  vista = '';
  seleccion: any;
  formas: any;
  constructor(
    public generales: GeneralesService,
    private servicios: BalancesService,
    private traspasos: TraspasosService
  ){}

  ngOnInit(){
    this.mostrar();
  }

  modal(){
    this.vista = '';
    this.generales.delay(200).then(fun =>{
      this.vista = 'traspaso';
      this.generales.abrirModal();
    });
  }

  abrirCuenta(cuenta: any){
    this.seleccion = {
      id: cuenta.id,
      efectivo: false,
      totalFinal: cuenta.totalFinal,
      totalIngresos: cuenta.totalIngresos,
      totalEgresos: cuenta.totalEgresos,
      nombre: cuenta.nombre
    };
    this.modal();
  }

  mostrar(){
    this.servicios.cuentas().subscribe((respuesta: any) => {
      this.cuentas = respuesta.cuentas;
      this.sucursales = respuesta.sucursales;
      this.formas = respuesta.formas;
    })
  }

  traspaso(datos: any){
    if (this.guardando) {
      return;
    }

    const montoLimpio = String(datos.monto ?? '').replace(/,/g, '').trim();
    const montoATraspasar = parseFloat(montoLimpio);

    if (isNaN(montoATraspasar) || montoATraspasar <= 0) {
      this.generales.mensajeError('Error: Ingresa un monto válido mayor a 0.');
      return;
    }

    const idFormaPago = Number(datos.idFormaPago || 0);
    const idCuenta = Number(datos.idCuenta || 0);

    if (this.seleccion.efectivo) {
      const saldoDisponible = parseFloat(this.seleccion.totalFinal);

      if (saldoDisponible < montoATraspasar) {
        this.generales.mensajeError('Error: No cuentas con suficiente saldo en Efectivo para realizar este traspaso.');
        return;
      }

      if (this.generales.validarEntero(idCuenta)) {
        this.generales.mensajeError('Error: No has seleccionado la cuenta a la que deseas traspasar el efectivo.');
        return;
      }
    } else {
      if (this.generales.validarEntero(idFormaPago)) {
        this.generales.mensajeError('Error: Debes seleccionar una forma de pago.');
        return;
      }

      if (idFormaPago !== 1) {
        if (this.generales.validarEntero(idCuenta)) {
          this.generales.mensajeError('Error: Debes seleccionar la cuenta destino para el traspaso.');
          return;
        }

        if (idCuenta === Number(this.seleccion.id)) {
          this.generales.mensajeError('Error: La cuenta destino debe ser distinta a la cuenta origen.');
          return;
        }
      }
    }

    const body = {
      egreso: {
        id: this.seleccion.id,
        efectivo: !!this.seleccion.efectivo,
        idSucursal: this.seleccion.idSucursal ?? 10
      },
      ingreso: {
        monto: montoATraspasar,
        idFormaPago: this.seleccion.efectivo ? 1 : idFormaPago,
        idCuenta: (!this.seleccion.efectivo && idFormaPago === 1) ? 0 : idCuenta
      }
    };

    this.guardando = true;
    this.traspasos.nuevo(body).subscribe({
      next: () => {
        this.guardando = false;
        this.generales.cerrarModal();
        this.vista = '';
        this.generales.mensajeCorrecto('Traspaso realizado correctamente');
        this.mostrar();
      },
      error: () => {
        this.guardando = false;
      }
    });
  }

  efectivo(sucursal: any){
    this.seleccion = {
      id: 0,
      idSucursal: sucursal.id,
      efectivo: true,
      totalFinal: sucursal.total_final,
      totalIngresos: sucursal.total_ingresos,
      totalEgresos: sucursal.total_egresos,
      nombre: 'Efectivo'
    };
    this.modal();
  }

  descargarExcel(lista: Record<string, unknown>[] | undefined, tipo: string, nombreCuenta: string): void {
    if (!lista || lista.length === 0) {
      this.generales.mensajeError(`No hay ${tipo.toLowerCase()} registrados para esta cuenta.`);
      return;
    }

    const configuracionesReporte: Record<string, { headers: string[]; campos: string[] }> = {
      Ingresos: {
        headers: [
          'No.',
          'Folio',
          'Nivel',
          'Calendario',
          'Sucursal',
          'Mes',
          'Fecha',
          'Hora',
          'Rubro',
          'Concepto',
          'Pago',
          'Cuenta',
          'Monto',
          'Estatus'
        ],
        campos: [
          'id',
          'folio',
          'nivel',
          'calendario',
          'sucursal',
          'mes',
          'fecha',
          'hora',
          'rubro',
          'concepto',
          'forma',
          'cuenta',
          'monto',
          'activo'
        ]
      },
      Egresos: {
        headers: [
          'No.',
          'Folio',
          'Nivel',
          'Calendario',
          'Sucursal Caputura',
          'Sucursal Egreso',
          'Mes',
          'Fecha',
          'Hora',
          'Rubro',
          'Tipo',
          'Concepto',
          'Pago',
          'Cuenta',
          'Monto',
          'Estatus'
        ],
        campos: [
          'id',
          'folio',
          'nivel',
          'calendario',
          'sucursalCaptura',
          'sucursalEgreso',
          'mes',
          'fecha',
          'hora',
          'rubro',
          'tipo',
          'concepto',
          'forma',
          'cuenta',
          'monto',
          'activo'
        ]
      }
    };

    const sanitizarValor = (val: unknown): unknown => {
      if (val === null || val === undefined) {
        return '';
      }
      if (typeof val === 'string') {
        return val.replace(/,/g, ' ').replace(/[\r\n]+/g, ' ');
      }
      return val;
    };

    const configReporte = configuracionesReporte[tipo];
    const nombreArchivo = `${tipo}_${nombreCuenta.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (configReporte) {
      const copiaLista = lista.map((item: Record<string, unknown>) => {
        const nuevoItem: Record<string, unknown> = {};
        configReporte.campos.forEach(campo => {
          nuevoItem[campo] = sanitizarValor(item[campo]);
        });
        return nuevoItem;
      });
      exportCSVFile(configReporte.headers, copiaLista, nombreArchivo);
      return;
    }

    const copiaLista = lista.map((item: Record<string, unknown>) => {
      const nuevoItem: Record<string, unknown> = {};
      Object.keys(item).forEach(key => {
        nuevoItem[key] = sanitizarValor(item[key]);
      });

      if (!nuevoItem['fecha'] && item['created_at']) {
        const d = new Date(item['created_at'] as string);
        nuevoItem['fecha'] = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : item['created_at'];
      }

      return nuevoItem;
    });

    const mapClaves: Record<string, string> = {
      id: 'ID',
      fecha: 'Fecha',
      folio: 'Folio',
      concepto: 'Concepto',
      monto: 'Monto',
      forma: 'Forma de Pago',
      cuenta: 'Cuenta',
      banco: 'Banco',
      voucher: 'Voucher',
      activo: 'Activo',
      ficha: 'Ficha',
      usuario: 'Usuario',
      sucursal: 'Sucursal',
      tipo: 'Tipo',
      rubro: 'Rubro',
      calendario: 'Calendario',
      nivel: 'Nivel',
      estatus: 'Estatus'
    };

    const keys = Object.keys(copiaLista[0]);
    const headers = keys.map(key => mapClaves[key] || key.toUpperCase());

    exportCSVFile(headers, copiaLista, nombreArchivo);
  }
}
