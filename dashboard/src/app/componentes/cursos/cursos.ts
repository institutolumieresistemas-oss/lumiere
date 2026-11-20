import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Curso } from '../curso/curso';
import { register } from 'swiper/element/bundle';

register();

export interface CursoProps {
  id?: number | string;
  idAltacurso?: string;
  titulo: string;
  imagen: string;
  modalidad: string;
  duracion?: string;
  duracionSemanas?: number;
  descuento?: number;
  precio: number;
  precioLista?: number;
  precioPromo: number;
  ahorro: number;
  semanas?: number;
  limiteLiquidar: string;
  textoLiquidar: string;
  textoMeses: string;
  horas?: number;
  simulacros?: string;
  inicio?: string;
  termina?: string;
  apartado?: number;
  urlComprar?: string;
  urlApartar?: string;
  horarios?: string[];
}

export interface CursosComponentProps {
  cursos?: CursoProps[];
  layout?: 'carousel' | 'bento' | 'stories' | 'flashcard' | 'workspace';
}

export interface CursoBackend {
  id: string;
  curso_nombre: string;
  curso_imagen: string;
  modalidad_nombre: string;
  precio: number;
  inicio: string;
  fin: string;
  limitePago: string;
  calendario_nombre?: string;
  eliminado?: number;
  horarios?: string[];
}

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, Curso],
  templateUrl: './cursos.html',
  styleUrls: ['./cursos.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Cursos implements OnInit {
  @ViewChild('container') container!: ElementRef;

  cursos = input<CursoBackend[]>([]);
  props = input.required<CursosComponentProps>();
  actualizarProps = output<CursosComponentProps>();
  eliminarElemento = output<void>();

  configOpen = signal(false);
  tab = signal<'curso' | 'config'>('curso');
  cursoSeleccionado = signal<CursoProps | null>(null);
  cursoIndex = signal<number | null>(null);
  cursoSeleccionadoBackend = signal<CursoBackend | null>(null);
  
  calendarioSeleccionado = signal<string>('');
  cursosFiltradosPorCalendario = signal<CursoBackend[]>([]);
  activeWorkspaceIndex = 0;

  get calendariosDisponibles(): string[] {
    const list = this.cursos() || [];
    const cals = list.map(c => c.calendario_nombre || '');
    return Array.from(new Set(cals)).filter(c => c).sort();
  }

  onCalendarioChange(cal: string) {
    this.calendarioSeleccionado.set(cal);
    const list = this.cursos() || [];
    
    // Filtrar por el nombre del calendario oficial y el campo eliminado en 0
    const filtrados = list.filter((c: any) => {
      return c.calendario_nombre === cal && c.eliminado !== 1;
    });
    
    this.cursosFiltradosPorCalendario.set(filtrados);
    this.cursoSeleccionadoBackend.set(null);
  }

  ngOnInit() {
    const currentProps = this.props();
    if (!currentProps.cursos || currentProps.cursos.length === 0) {
      this.actualizarProps.emit({ ...currentProps, cursos: this.getDefaultCursos(), layout: 'carousel' });
    } else {
      let modificado = false;
      const cursosActualizados = currentProps.cursos.map(c => {
        let itemModificado = false;
        const updated = { ...c };
        if (updated.textoLiquidar === undefined) {
          updated.textoLiquidar = '¡Liquídalo antes del:';
          itemModificado = true;
        }
        if (updated.textoMeses === undefined) {
          updated.textoMeses = 'Hasta 12 meses sin intereses';
          itemModificado = true;
        }
        if (itemModificado) {
          modificado = true;
        }
        return updated;
      });
      if (modificado) {
        this.actualizarProps.emit({ ...currentProps, cursos: cursosActualizados });
      }
    }
  }

  // --- LÓGICA DEL CARRUSEL NATUVO ---
  mover(direccion: number) {
    if (!this.container?.nativeElement) return;
    const el = this.container.nativeElement;
    const item = el.querySelector('.carousel-item');
    if (!item) return;
    const itemWidth = item.offsetWidth;
    const scrollTarget = el.scrollLeft + (itemWidth * direccion);

    el.scrollTo({
      left: scrollTarget,
      behavior: 'smooth'
    });

    if (el.scrollLeft + el.offsetWidth >= el.scrollWidth && direccion > 0) {
      setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 500);
    } else if (el.scrollLeft <= 0 && direccion < 0) {
      setTimeout(() => el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' }), 500);
    }
  }

  agregarCurso() {
    const nuevoCurso = { ...this.getDefaultCursos()[0] };
    const currentProps = this.props();
    const updated = {
      ...currentProps,
      cursos: [...(currentProps.cursos || []), nuevoCurso]
    };
    this.actualizarProps.emit(updated);
  }

  eliminarCurso(index: number) {
    const currentProps = this.props();
    const updated = {
      ...currentProps,
      cursos: (currentProps.cursos || []).filter((_, i) => i !== index)
    };
    this.actualizarProps.emit(updated);
  }

  actualizarLayout(layout: 'carousel' | 'bento' | 'stories' | 'flashcard' | 'workspace') {
    const currentProps = this.props();
    this.actualizarProps.emit({
      ...currentProps,
      layout
    });
  }

  abrirConfig(curso: CursoProps, index: number) {
    this.cursoSeleccionado.set({ ...curso }); // Clon para edición segura
    this.cursoIndex.set(index);
    this.cursoSeleccionadoBackend.set(null);
    this.calendarioSeleccionado.set('');
    this.cursosFiltradosPorCalendario.set([]);
    this.tab.set('curso');
    this.configOpen.set(true);
  }

  cerrarConfig() {
    this.configOpen.set(false);
    this.cursoSeleccionado.set(null);
    this.cursoIndex.set(null);
  }

  onCursoBackendChange(c: CursoBackend) {
    if (!c) return;
    this.cursoSeleccionadoBackend.set(c);
    const current = this.cursoSeleccionado() || {} as CursoProps;
    const updated: CursoProps = {
      ...current,
      idAltacurso: c.id,
      titulo: c.curso_nombre,
      imagen: c.curso_imagen,
      modalidad: c.modalidad_nombre,
      precio: c.precio,
      precioLista: c.precio,
      inicio: c.inicio,
      termina: c.fin,
      limiteLiquidar: c.limitePago,
      textoLiquidar: current.textoLiquidar || '¡Liquídalo antes del:',
      textoMeses: current.textoMeses || 'Hasta 12 meses sin intereses',
      horarios: c.horarios || []
    };
    this.cursoSeleccionado.set(updated);
    this.recalcular();
    this.tab.set('config');
  }

  updateCursoProp(field: keyof CursoProps, value: any) {
    const current = this.cursoSeleccionado();
    if (current) {
      const updated = {
        ...current,
        [field]: value
      };
      this.cursoSeleccionado.set(updated);
    }
  }

  seleccionarImagenCurso(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.updateCursoProp('imagen', e.target.result);
    };
    reader.readAsDataURL(file);
    // Resetear el input para permitir seleccionar el mismo archivo de nuevo
    event.target.value = '';
  }

  recalcular() {
    const c = this.cursoSeleccionado();
    if (!c) return;
    const basePrice = c.precioLista !== undefined ? c.precioLista : (c.precio !== undefined ? c.precio : 0);
    const precioPromo = basePrice - (basePrice * (c.descuento || 0)) / 100;
    const ahorro = basePrice - precioPromo;
    this.cursoSeleccionado.set({
      ...c,
      precio: basePrice,
      precioLista: basePrice,
      precioPromo,
      ahorro
    });
  }

  actualizarDesdeDb() {
    const current = this.cursoSeleccionado();
    if (!current || !current.idAltacurso) return;

    const c = this.cursos().find(item => item.id === current.idAltacurso);
    if (!c) return;

    const updated: CursoProps = {
      ...current,
      titulo: c.curso_nombre,
      imagen: c.curso_imagen,
      modalidad: c.modalidad_nombre,
      precio: c.precio,
      precioLista: c.precio,
      inicio: c.inicio,
      termina: c.fin,
      limiteLiquidar: c.limitePago,
      horarios: c.horarios || []
    };
    this.cursoSeleccionado.set(updated);
    this.recalcular();
  }

  guardarConfig() {
    const idx = this.cursoIndex();
    const currentCurso = this.cursoSeleccionado();
    const currentProps = this.props();
    if (idx === null || !currentCurso || !currentProps.cursos) return;
    const cursosActualizados = [...currentProps.cursos];
    cursosActualizados[idx] = { ...currentCurso };
    this.actualizarProps.emit({ ...currentProps, cursos: cursosActualizados });
    this.cerrarConfig();
  }

  private getDefaultCursos(): CursoProps[] {
    return [{
      titulo: 'Curso de Ingreso a UdeG',
      imagen: 'https://picsum.photos/400/250?random=21',
      modalidad: 'Presencial',
      duracion: '6 meses',
      descuento: 0,
      precio: 12000,
      precioLista: 12000,
      precioPromo: 12000,
      ahorro: 0,
      semanas: 0,
      limiteLiquidar: '31 de Enero 2026',
      textoLiquidar: '¡Liquídalo antes del:',
      textoMeses: 'Hasta 12 meses sin intereses',
      urlComprar: '',
      urlApartar: '',
      horarios: ['Matutino: 08:00 - 12:00', 'Vespertino: 14:00 - 18:00']
    }];
  }
}