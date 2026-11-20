import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tabla-admitidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tabla-admitidos.html',
  styleUrls: ['./tabla-admitidos.css']
})
export class TablaAdmitidos implements OnInit {
  @Input() props!: {
    titulo: string;
    filas: {
      alumno: string;
      puntaje: string;
      carrera: string;
      curso: string;
      calendario: string;
    }[];
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  configOpen = false;
  propsEdit: any = {
    titulo: '',
    filas: []
  };

  ngOnInit() {
    if (!this.props) {
      this.props = {
        titulo: 'Lista de Admitidos a UdeG',
        filas: []
      };
    }
    if (!this.props.filas) {
      this.props.filas = this.getDefaultFilas();
    }
  }

  abrirConfig() {
    this.propsEdit = {
      titulo: this.props.titulo,
      filas: this.props.filas.map(f => ({ ...f }))
    };
    this.configOpen = true;
  }

  cerrarConfig() {
    this.configOpen = false;
  }

  guardarConfig() {
    this.props = {
      titulo: this.propsEdit.titulo,
      filas: this.propsEdit.filas.map((f: any) => ({ ...f }))
    };
    this.actualizarProps.emit(this.props);
    this.cerrarConfig();
  }

  agregarFilaEdit() {
    this.propsEdit.filas.push({
      alumno: 'Nuevo Alumno',
      puntaje: '180.00',
      carrera: 'Médico Cirujano y Partero',
      curso: 'Maestro plus',
      calendario: '2026A'
    });
  }

  eliminarFilaEdit(index: number) {
    this.propsEdit.filas.splice(index, 1);
  }

  private getDefaultFilas() {
    return [
      {
        alumno: 'Andrea Cárdenas Allec',
        puntaje: '189.97',
        carrera: 'Médico Cirujano y Partero',
        curso: 'Maestro plus',
        calendario: '2026A'
      },
      {
        alumno: 'Cristopher Aaron Dominguez Mora',
        puntaje: '189.97',
        carrera: 'Médico Cirujano y Partero',
        curso: 'Maestro',
        calendario: '2026A'
      },
      {
        alumno: 'Diana Jacqueline Mercado Arvizu',
        puntaje: '189.84',
        carrera: 'Médico Cirujano y Partero',
        curso: 'Maestro plus',
        calendario: '2026A'
      },
      {
        alumno: 'Gladys Ordaz Mendoza',
        puntaje: '189.77',
        carrera: 'Médico Cirujano y Partero',
        curso: 'Alto Rendimiento',
        calendario: '2026A'
      },
      {
        alumno: 'Eduardo Verduzco Aslan',
        puntaje: '189.72',
        carrera: 'Médico Cirujano y Partero',
        curso: 'Especial Altos Puntajes',
        calendario: '2026A'
      },
      {
        alumno: 'Juan Guillermo Amador Prado',
        puntaje: '189.72',
        carrera: 'Médico Cirujano y Partero',
        curso: 'Maestro',
        calendario: '2026A'
      },
      {
        alumno: 'Fátima Nuñez Flores',
        puntaje: '189.66',
        carrera: 'Médico Cirujano y Partero',
        curso: 'Maestro Virtual en Vivo',
        calendario: '2026A'
      },
      {
        alumno: 'Saharaim Cordero García',
        puntaje: '189.60',
        carrera: 'Médico Cirujano y Partero',
        curso: 'Ingresa a la Universidad',
        calendario: '2026A'
      },
      {
        alumno: 'Luis Fernando Caudillo Cerrillos',
        puntaje: '189.59',
        carrera: 'Médico Cirujano y Partero',
        curso: 'Maestro plus',
        calendario: '2026A'
      },
      {
        alumno: 'Pilar Guadalupe Figueroa González',
        puntaje: '189.37',
        carrera: 'Médico Cirujano y Partero',
        curso: 'Maestro plus',
        calendario: '2026A'
      }
    ];
  }
}
