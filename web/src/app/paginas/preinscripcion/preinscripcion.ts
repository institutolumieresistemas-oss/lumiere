import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PreinscripcionService } from '../../servicios/preinscripcion.service';
import { AlertaService } from '../../servicios/alerta.service';

@Component({
  selector: 'app-preinscripcion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preinscripcion.html',
  styleUrl: './preinscripcion.css',
})
export class Preinscripcion implements OnInit {
  datos = {
    nombreAlumno: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    celularAlumno: '',
    plantelEleccion: '',
    fechaNacimiento: '',
    calle: '',
    numero: '',
    colonia: '',
    codigoPostal: '',
    estadoAlumno: '',
    municipioAlumno: '',
    correo: '',
    padreTutor: '',
    celularPadreTutor: '',
    nivelProcedencia: '',
    escuelaProcedencia: '',
    otraEscuela: '',
    estadoEscuela: '',
    ciudadEscuela: '',
    promedio: '',
    universidadAspiracion: '',
    centroAspiracion: '',
    calendarioAspiracion: '',
    carrera: '',
    vecesExamen: '',
    tomadoCursoPrep: '',
    dondeCursoPrep: '',
    comoEnteraste: ''
  };

  // Dropdown lists
  sucursales: any[] = [];
  estados: any[] = [];
  municipios: any[] = [];
  escuelas: any[] = [];
  escuelasFiltradas: any[] = [];
  universidades: any[] = [];
  centros: any[] = [];
  calendarios: any[] = [];
  carreras: any[] = [];
  empresas: any[] = [];
  mediosPublicitarios: any[] = [];

  // Filtered dropdowns
  municipiosAlumno: any[] = [];
  municipiosEscuela: any[] = [];
  centrosFiltrados: any[] = [];
  calendariosFiltrados: any[] = [];
  carrerasFiltradas: any[] = [];

  mensajeExito = '';
  mensajeError = '';
  cargando = false;

  constructor(
    private servicio: PreinscripcionService,
    private alerta: AlertaService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.servicio.catalogos().subscribe({
      next: (res: any) => {
        this.sucursales = res.sucursales || [];
        this.estados = res.estados || [];
        this.municipios = res.municipios || [];
        this.escuelas = res.escuelas || [];
        this.escuelasFiltradas = this.escuelas;
        this.universidades = res.universidades || [];
        this.centros = res.centros || [];
        this.calendarios = res.calendarios || [];
        this.carreras = res.carreras || [];
        this.empresas = res.empresas || [];
        this.mediosPublicitarios = res.mediosPublicitarios || [];
      },
      error: () => {
        console.error('Error al cargar catálogos desde la API.');
      }
    });
  }

  onNivelProcedenciaChange(nivelNombre: string) {
    this.datos.escuelaProcedencia = '';
    this.datos.otraEscuela = '';
    if (!nivelNombre) {
      this.escuelasFiltradas = this.escuelas;
      return;
    }
    const gradoTarget = nivelNombre.toLowerCase().trim() === 'preparatoria' ? 1 : 2;
    this.escuelasFiltradas = this.escuelas.filter(e => Number(e.grado) === gradoTarget);
  }

  onEstadoAlumnoChange(estadoNombre: string) {
    this.datos.municipioAlumno = '';
    if (!estadoNombre) {
      this.municipiosAlumno = [];
      return;
    }
    const estadoObj = this.estados.find(e => e.nombre?.toLowerCase().trim() === estadoNombre?.toLowerCase().trim());
    if (estadoObj) {
      this.municipiosAlumno = this.municipios.filter(m => Number(m.idEstado) === Number(estadoObj.id));
      if (this.municipiosAlumno.length === 0) {
        this.municipiosAlumno = this.municipios;
      }
    } else {
      this.municipiosAlumno = this.municipios;
    }
  }

  onEstadoEscuelaChange(estadoNombre: string) {
    this.datos.ciudadEscuela = '';
    if (!estadoNombre) {
      this.municipiosEscuela = [];
      return;
    }
    const estadoObj = this.estados.find(e => e.nombre?.toLowerCase().trim() === estadoNombre?.toLowerCase().trim());
    if (estadoObj) {
      this.municipiosEscuela = this.municipios.filter(m => Number(m.idEstado) === Number(estadoObj.id));
      if (this.municipiosEscuela.length === 0) {
        this.municipiosEscuela = this.municipios;
      }
    } else {
      this.municipiosEscuela = this.municipios;
    }
  }

  onUniversidadChange(uniNombre: string) {
    this.datos.centroAspiracion = '';
    this.datos.calendarioAspiracion = '';
    this.datos.carrera = '';
    this.centrosFiltrados = [];
    this.calendariosFiltrados = [];
    this.carrerasFiltradas = [];

    if (!uniNombre) {
      return;
    }

    const uniObj = this.universidades.find(u =>
      u.nombre?.toLowerCase().trim() === uniNombre?.toLowerCase().trim() ||
      u.siglas?.toLowerCase().trim() === uniNombre?.toLowerCase().trim() ||
      `${u.nombre} (${u.siglas})`.toLowerCase().trim() === uniNombre?.toLowerCase().trim()
    );

    if (uniObj) {
      this.centrosFiltrados = this.centros.filter(c => Number(c.idUniversidad) === Number(uniObj.id));
      if (this.centrosFiltrados.length === 0) {
        this.centrosFiltrados = this.centros;
      }
    } else {
      this.centrosFiltrados = this.centros;
    }
  }

  onCentroChange(centroNombre: string) {
    this.datos.calendarioAspiracion = '';
    this.datos.carrera = '';
    this.calendariosFiltrados = [];
    this.carrerasFiltradas = [];

    if (!centroNombre) {
      return;
    }

    const centroObj = this.centros.find(c => 
      c.nombre?.toLowerCase().trim() === centroNombre?.toLowerCase().trim() ||
      c.siglas?.toLowerCase().trim() === centroNombre?.toLowerCase().trim() ||
      `${c.nombre} (${c.siglas})`.toLowerCase().trim() === centroNombre?.toLowerCase().trim()
    );

    if (centroObj) {
      const calIdsForCentro = this.carreras
        .filter(c => Number(c.idCentroUniversitario) === Number(centroObj.id))
        .map(c => Number(c.idCalendario));

      this.calendariosFiltrados = this.calendarios.filter(cal => calIdsForCentro.includes(Number(cal.id)));

      if (this.calendariosFiltrados.length === 0) {
        this.calendariosFiltrados = this.calendarios;
      }

      if (this.calendariosFiltrados.length === 1) {
        this.datos.calendarioAspiracion = this.calendariosFiltrados[0].nombre;
        this.onCalendarioChange(this.datos.calendarioAspiracion);
      }
    } else {
      this.calendariosFiltrados = this.calendarios;
    }
  }

  onCalendarioChange(calNombre: string) {
    this.datos.carrera = '';
    this.carrerasFiltradas = [];

    if (!calNombre || !this.datos.centroAspiracion) {
      return;
    }

    const centroObj = this.centros.find(c =>
      c.nombre?.toLowerCase().trim() === this.datos.centroAspiracion?.toLowerCase().trim() ||
      c.siglas?.toLowerCase().trim() === this.datos.centroAspiracion?.toLowerCase().trim() ||
      `${c.nombre} (${c.siglas})`.toLowerCase().trim() === this.datos.centroAspiracion?.toLowerCase().trim()
    );

    const calObj = this.calendarios.find(cal =>
      cal.nombre?.toLowerCase().trim() === calNombre?.toLowerCase().trim()
    );

    if (centroObj && calObj) {
      const uniqueNames = new Set<string>();
      this.carrerasFiltradas = this.carreras
        .filter(c =>
          Number(c.idCentroUniversitario) === Number(centroObj.id) &&
          Number(c.idCalendario) === Number(calObj.id)
        )
        .filter(c => {
          const key = (c.nombre || '').trim().toUpperCase();
          if (!key || uniqueNames.has(key)) return false;
          uniqueNames.add(key);
          return true;
        })
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    }
  }

  onInputPromedio(event: any) {
    let val = event.target.value || '';
    val = val.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    this.datos.promedio = val;
  }

  formatearPromedio() {
    if (!this.datos.promedio) return;
    const valStr = this.datos.promedio.toString().trim().replace(',', '.');
    let val = parseFloat(valStr);
    if (isNaN(val) || val < 0) {
      this.datos.promedio = '';
      return;
    }
    if (val > 0 && val <= 10) {
      val = val * 10;
    }
    if (val > 100) {
      val = 100;
    }
    this.datos.promedio = val.toFixed(2);
  }

  onInputUpper(campo: keyof typeof this.datos) {
    if (typeof this.datos[campo] === 'string') {
      (this.datos as any)[campo] = ((this.datos as any)[campo] as string).toUpperCase();
    }
  }

  enviar() {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.datos.promedio) {
      this.formatearPromedio();
    }

    // Convertir todos los campos de texto a mayúsculas
    for (const key in this.datos) {
      if (typeof (this.datos as any)[key] === 'string' && key !== 'promedio') {
        (this.datos as any)[key] = ((this.datos as any)[key] as string).toUpperCase().trim();
      }
    }

    if (!this.datos.nombreAlumno || !this.datos.apellidoPaterno || !this.datos.apellidoMaterno || !this.datos.celularAlumno || !this.datos.fechaNacimiento || !this.datos.correo || !this.datos.plantelEleccion || !this.datos.padreTutor || !this.datos.celularPadreTutor) {
      const msg = 'Por favor, completa los campos obligatorios (*): Nombres, Apellido Paterno, Apellido Materno, Celular, Fecha de Nacimiento, Correo, Plantel de elección, Nombre del Padre o Tutor y Celular del Padre o Tutor.';
      this.mensajeError = msg;

      this.alerta.warning(
        'Campos incompletos',
        'Por favor, asegúrate de llenar todos los campos obligatorios (*) antes de enviar tu solicitud.',
        'Entendido'
      );
      return;
    }

    this.cargando = true;
    this.servicio.guardar(this.datos).subscribe({
      next: () => {
        this.mensajeExito = '¡Preinscripción enviada con éxito!';
        this.limpiarFormulario();
        this.cargando = false;

        this.alerta.success(
          '¡Preinscripción Exitosa! 🎉',
          'Tus datos se han registrado correctamente en nuestro sistema escolar. En breve nos comunicaremos contigo vía WhatsApp o correo para dar seguimiento a tu registro.',
          '¡Excelente! 🚀'
        );
      },
      error: (err: any) => {
        const errorMsg = (typeof err?.error === 'string') ? err.error : 'Ocurrió un error al enviar tu preinscripción. Por favor, intenta de nuevo o contáctanos directamente.';
        this.mensajeError = errorMsg;
        this.cargando = false;

        this.alerta.error(
          'Error al registrar',
          errorMsg,
          'Reintentar'
        );
      }
    });
  }

  limpiarFormulario() {
    this.datos = {
      nombreAlumno: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      celularAlumno: '',
      plantelEleccion: '',
      fechaNacimiento: '',
      calle: '',
      numero: '',
      colonia: '',
      codigoPostal: '',
      estadoAlumno: '',
      municipioAlumno: '',
      correo: '',
      padreTutor: '',
      celularPadreTutor: '',
      nivelProcedencia: '',
      escuelaProcedencia: '',
      otraEscuela: '',
      estadoEscuela: '',
      ciudadEscuela: '',
      promedio: '',
      universidadAspiracion: '',
      centroAspiracion: '',
      calendarioAspiracion: '',
      carrera: '',
      vecesExamen: '',
      tomadoCursoPrep: '',
      dondeCursoPrep: '',
      comoEnteraste: ''
    };
    this.municipiosAlumno = [];
    this.municipiosEscuela = [];
    this.centrosFiltrados = [];
    this.calendariosFiltrados = [];
    this.carrerasFiltradas = [];
    this.escuelasFiltradas = this.escuelas;
  }
}
