import { Component, Input, Output, EventEmitter, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-galeria-carrusel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './galeria-carrusel.html',
  styleUrls: ['./galeria-carrusel.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GaleriaCarrusel implements OnInit {
  @Input() props!: {
    titulo: string;
    items: {
      nombre: string;
      ubicacion: string;
      avatar: string;
      imagen: string;
      liked?: boolean;
      bookmarked?: boolean;
    }[];
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  configOpen = false;
  itemSeleccionado: any = null;
  itemIndex: number | null = null;

  ngOnInit() {
    if (!this.props) {
      this.props = {
        titulo: 'Galería de Experiencias',
        items: []
      };
    }
    if (!this.props.items) {
      this.props.items = this.getDefaultItems();
    }
  }

  toggleLike(item: any) {
    item.liked = !item.liked;
    this.actualizarProps.emit({ ...this.props });
  }

  toggleBookmark(item: any) {
    item.bookmarked = !item.bookmarked;
    this.actualizarProps.emit({ ...this.props });
  }

  abrirConfig(item: any, index: number) {
    this.itemSeleccionado = { ...item }; // Clonación superficial
    this.itemIndex = index;
    this.configOpen = true;
  }

  cerrarConfig() {
    this.configOpen = false;
    this.itemSeleccionado = null;
    this.itemIndex = null;
  }

  guardarConfig() {
    if (this.itemIndex !== null && this.itemSeleccionado) {
      this.props.items[this.itemIndex] = { ...this.itemSeleccionado };
      this.actualizarProps.emit({ ...this.props });
    }
    this.cerrarConfig();
  }

  agregarItem() {
    if (this.props.items.length >= 10) {
      alert('Límite máximo de 10 publicaciones alcanzado.');
      return;
    }
    const indexRand = Math.floor(Math.random() * 70) + 10;
    const nuevo = {
      nombre: 'Nuevo Alumno',
      ubicacion: 'Guadalajara, Jalisco',
      avatar: `https://i.pravatar.cc/150?img=${indexRand}`,
      imagen: `https://picsum.photos/500/500?random=${indexRand}`,
      liked: false,
      bookmarked: false
    };
    this.props.items.push(nuevo);
    this.actualizarProps.emit({ ...this.props });
  }

  eliminarItem(index: number) {
    this.props.items.splice(index, 1);
    this.actualizarProps.emit({ ...this.props });
  }

  onFileChange(event: any, field: 'avatar' | 'imagen') {
    if (!this.itemSeleccionado) return;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (field === 'avatar') {
        this.itemSeleccionado.avatar = reader.result as string;
      } else {
        this.itemSeleccionado.imagen = reader.result as string;
      }
      this.actualizarProps.emit({ ...this.props });
    };
    reader.readAsDataURL(file);
  }

  private getDefaultItems() {
    return [
      {
        nombre: 'Jesus Alanis',
        ubicacion: 'Zapopan, Jalisco',
        avatar: 'https://i.pravatar.cc/150?img=11',
        imagen: 'https://picsum.photos/500/500?random=81',
        liked: false,
        bookmarked: false
      },
      {
        nombre: 'Carlos Mendez',
        ubicacion: 'Zapopan, Jalisco',
        avatar: 'https://i.pravatar.cc/150?img=12',
        imagen: 'https://picsum.photos/500/500?random=82',
        liked: true,
        bookmarked: false
      },
      {
        nombre: 'Graciela Perez',
        ubicacion: 'Zapopan, Jalisco',
        avatar: 'https://i.pravatar.cc/150?img=14',
        imagen: 'https://picsum.photos/500/500?random=83',
        liked: false,
        bookmarked: true
      },
      {
        nombre: 'Carlos Zamora',
        ubicacion: 'Guadalajara, Jalisco',
        avatar: 'https://i.pravatar.cc/150?img=15',
        imagen: 'https://picsum.photos/500/500?random=84',
        liked: false,
        bookmarked: false
      }
    ];
  }
}
