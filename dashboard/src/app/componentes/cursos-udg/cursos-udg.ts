import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cursos-udg',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cursos-udg.html',
  styleUrls: ['./cursos-udg.css']
})
export class CursosUdg implements OnInit {
  @Input() props!: {
    title: string;
    subtitle: string;
    stickyNoteTitle: string;
    stickyNoteText: string;
    courses: Array<{
      title: string;
      calendar: string; // '2026b' | '2027a' | 'intensivos'
      price: string;
      priceSuffix: string;
      features: string[];
    }>;
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  editar = false;
  filteredCourses: any[] = [];
  activeFilter = 'all';

  ngOnInit() {
    this.filterCourses('all');
  }

  filterCourses(filter: string) {
    this.activeFilter = filter;
    if (!this.props?.courses) return;

    if (filter === 'all') {
      this.filteredCourses = this.props.courses;
    } else {
      this.filteredCourses = this.props.courses.filter(c => c.calendar === filter);
    }
  }

  inscribirse(courseName: string) {
    alert(`¡Has seleccionado inscribirte al: ${courseName}! Un asesor se comunicará contigo.`);
  }

  addCourse() {
    if (!this.props.courses) {
      this.props.courses = [];
    }
    this.props.courses.push({
      title: 'Nuevo Programa PAA',
      calendar: '2026b',
      price: '$4,000 MXN',
      priceSuffix: 'Pago único',
      features: ['Horas de clase', 'Simulacros de examen']
    });
    this.filterCourses(this.activeFilter);
  }

  removeCourse(index: number) {
    if (this.props.courses) {
      this.props.courses.splice(index, 1);
    }
    this.filterCourses(this.activeFilter);
  }

  addFeature(course: any) {
    if (!course.features) {
      course.features = [];
    }
    course.features.push('Nueva ventaja');
  }

  removeFeature(course: any, idx: number) {
    course.features.splice(idx, 1);
  }

  guardar() {
    this.actualizarProps.emit(this.props);
    this.editar = false;
  }
}
