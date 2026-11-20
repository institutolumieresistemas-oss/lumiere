import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cursos-udg',
  standalone: true,
  imports: [CommonModule],
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
}
