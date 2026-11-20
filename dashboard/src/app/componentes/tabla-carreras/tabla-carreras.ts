import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface CarreraItem {
  carrera: string;
  puntaje: string;
  cupos: string;
  aspirantes: string;
  calendario: string;
}

@Component({
  selector: 'app-tabla-carreras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tabla-carreras.html',
  styleUrls: ['./tabla-carreras.css']
})
export class TablaCarreras implements OnInit {
  @Input() props!: {
    centroUniversitario: string;
    titulo?: string;
    colorFondo?: string;
    colorLetra?: string;
    carreras: CarreraItem[];
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  configOpen = false;
  tabConfig = 'configuracion';
  tempProps: any = {};

  ngOnInit() {
    if (!this.props.carreras) {
      this.props.carreras = [];
    }
  }

  abrirConfig() {
    this.tempProps = JSON.parse(JSON.stringify(this.props));
    if (!this.tempProps.carreras) this.tempProps.carreras = [];
    if (!this.tempProps.centroUniversitario) this.tempProps.centroUniversitario = 'CUCEI';
    if (!this.tempProps.titulo) this.tempProps.titulo = 'Puntajes de Admisión';
    if (!this.tempProps.colorFondo) this.tempProps.colorFondo = '#3b82f6';
    if (!this.tempProps.colorLetra) this.tempProps.colorLetra = '#ffffff';
    this.tabConfig = 'configuracion';
    this.configOpen = true;
  }

  cerrarConfig() {
    this.configOpen = false;
  }

  guardarConfig() {
    this.props = { ...this.tempProps };
    this.actualizarProps.emit(this.props);
    this.cerrarConfig();
  }

  agregarCarrera() {
    this.tempProps.carreras.push({
      carrera: 'Nueva Carrera',
      puntaje: '100.00',
      cupos: '50',
      aspirantes: '150',
      calendario: '2026-A'
    });
  }

  eliminarCarrera(index: number) {
    this.tempProps.carreras.splice(index, 1);
  }

  importarExcel(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    const targetCentro = (this.tempProps.centroUniversitario || '').trim().toUpperCase();
    if (targetCentro === "") {
      alert("Por favor escribe el nombre de un Centro Universitario en la pestaña de Configuración primero.");
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convertir la hoja a JSON
        const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (rawRows.length < 2) {
          alert("El archivo Excel no tiene el formato o registros suficientes.");
          event.target.value = '';
          return;
        }

        // Mapear claves de columnas identificando la columna CENTRO y las demás
        let keyCentro = "";
        let keyCarrera = "";
        let keyPuntaje = "";
        let keyCupo = "";
        let keyAspirantes = "";

        // Escaneamos las primeras 5 filas buscando el header correcto de cada columna
        const limiteFilas = Math.min(rawRows.length, 5);
        for (let i = 0; i < limiteFilas; i++) {
          const rowObj = rawRows[i];
          Object.keys(rowObj).forEach(k => {
            const val = String(rowObj[k]).trim().toUpperCase();
            if (val.includes("CENTRO")) keyCentro = k;
            if (val.includes("CARRERA")) keyCarrera = k;
            if (val.includes("PUNTAJE M") || val.includes("MINIMO") || val.includes("MÍNIMO")) keyPuntaje = k;
            if (val.includes("CUPO") || val.includes("ADMITIDOS")) keyCupo = k;
            if (val.includes("ASPIRANTES")) keyAspirantes = k;
          });
        }

        // Respaldos de claves por defecto de acuerdo a la estructura estándar del excel
        if (!keyCentro) keyCentro = '__EMPTY_2'; // Si no se encuentra, buscar en columnas vacías
        // Intentar adivinar por los nombres de propiedad por defecto de xlsx
        if (!keyCentro) {
          const keys = Object.keys(rawRows[0] || {});
          keyCentro = keys.find(k => String(rawRows[0][k]).toUpperCase().includes("CENTRO")) || 'PUNTAJES MÍNIMOS NIVEL SUPERIOR CAL. 2026"A"';
        }
        if (!keyCarrera) keyCarrera = '__EMPTY_3';
        if (!keyPuntaje) keyPuntaje = '__EMPTY_9';
        if (!keyCupo) keyCupo = '__EMPTY_6'; // Admitidos reales
        if (!keyAspirantes) keyAspirantes = '__EMPTY_4';

        let currentCentro = "";
        const carrerasFiltradas: CarreraItem[] = [];
        let centroExisteEnExcel = false;

        // Bucle procesando los datos
        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          const centroVal = String(row[keyCentro] || row['PUNTAJES MÍNIMOS NIVEL SUPERIOR CAL. 2026"A"'] || '').trim().toUpperCase();
          if (centroVal !== "") {
            currentCentro = centroVal;
          }

          if (currentCentro === targetCentro) {
            centroExisteEnExcel = true;
            const nombreCarrera = String(row[keyCarrera] || '').trim();
            let puntajeVal = String(row[keyPuntaje] || row['__EMPTY_9'] || '').trim();
            // Si el puntaje es de convenio, tomar el puntaje mínimo general
            if (puntajeVal === "" || isNaN(Number(puntajeVal))) {
              if (row['__EMPTY_9'] !== undefined && !isNaN(Number(row['__EMPTY_9']))) {
                puntajeVal = String(row['__EMPTY_9']).trim();
              }
            }
            if (nombreCarrera !== "" && nombreCarrera !== "CARRERA" && !nombreCarrera.includes("PUNTAJES")) {
              carrerasFiltradas.push({
                carrera: nombreCarrera,
                puntaje: puntajeVal || '0',
                cupos: String(row[keyCupo] || row['__EMPTY_6'] || '0').trim(),
                aspirantes: String(row[keyAspirantes] || row['__EMPTY_4'] || '0').trim(),
                calendario: '2026-A'
              });
            }
          }
        }

        if (!centroExisteEnExcel) {
          alert(`no exsite centro ${this.tempProps.centroUniversitario} en excel`);
        } else {
          this.tempProps.carreras = carrerasFiltradas;
          alert(`Se cargaron con éxito ${carrerasFiltradas.length} carreras del centro ${this.tempProps.centroUniversitario}.`);
        }

      } catch (err: any) {
        alert("Error al procesar el archivo Excel: " + err.message);
      }
      event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  }

  trackByFn(index: number) {
    return index;
  }
}
