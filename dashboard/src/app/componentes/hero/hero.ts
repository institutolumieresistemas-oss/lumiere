import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PagesService } from '../../servicios/page';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './hero.html',
  styleUrls: ['./hero.css']
})
export class Hero implements OnInit {
  @Input() props!: {
    badge: string;
    titleStart: string;
    titleHighlight: string;
    titleMiddle: string;
    titleCircle: string;
    description: string;
    stats: Array<{ value: string; label: string; tag?: string }>;
    stickyNoteTitle: string;
    stickyNoteText: string;
    floatingTitle: string;
    floatingSubtitle: string;
    floatingAvatar: string;
    heroImage: string;
    btn1Text?: string;
    btn1LinkType?: 'url' | 'page';
    btn1Url?: string;
    btn1PageSlug?: string;
    btn2Text?: string;
    btn2LinkType?: 'url' | 'page';
    btn2Url?: string;
    btn2PageSlug?: string;
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  editar = false;
  pagesList: any[] = [];
  private pagesService = inject(PagesService);

  ngOnInit() {
    this.pagesService.mostrar().subscribe((res: any) => {
      this.pagesList = res.data || res;
    });
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.props.heroImage = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  guardar() {
    this.actualizarProps.emit(this.props);
    this.editar = false;
  }
}
