import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-foto-planteles',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './foto-planteles.html',
  styleUrls: ['./foto-planteles.css']
})
export class FotoPlanteles implements OnInit, OnDestroy {

  @Input() props!: {
    images: string[];
    layout?: 'classic' | 'polaroid' | 'bento' | 'stories' | 'idcard';
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  abrirConfig = false;
  currentIndex = 0;
  isFlashing = false;
  intervalId: any;

  actualizarLayout(layout: any) {
    this.props.layout = layout;
    this.emitChanges();
  }

  ngOnInit() {
    if (!this.props?.images) this.props = { images: [] };
    this.startAutoCycle();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  toggleConfig() {
    this.abrirConfig = !this.abrirConfig;

    if (this.abrirConfig) clearInterval(this.intervalId);
    else this.startAutoCycle();
  }


  startAutoCycle() {
    this.intervalId = setInterval(() => {
      this.nextImage();
    }, 3000);
  }

  nextImage() {
    if (!this.props.images.length) return;

    this.isFlashing = true;
    setTimeout(() => {
      this.isFlashing = false;
      this.currentIndex = (this.currentIndex + 1) % this.props.images.length;
    }, 250);
  }

  selectImage(i: number) {
    this.currentIndex = i;
  }

  getImgUrl(img: any): string {
    return typeof img === 'string' ? img : (img?.url || '');
  }

  getImgNombre(img: any, index: number): string {
    if (typeof img === 'string') return 'Plantel ' + (index + 1);
    return img?.nombre || 'Plantel ' + (index + 1);
  }

  setImgNombre(index: number, name: string) {
    if (typeof this.props.images[index] === 'string') {
      this.props.images[index] = {
        url: this.props.images[index] as any,
        nombre: name
      } as any;
    } else {
      (this.props.images[index] as any).nombre = name;
    }
    this.emitChanges();
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newImages = [...(this.props.images || [])];
      newImages.push({
        url: reader.result as string,
        nombre: 'Nuevo Plantel'
      } as any);
      this.props.images = newImages;
      this.emitChanges();
    };
    reader.readAsDataURL(file);
  }

  removeImage(i: number) {
    const newImages = [...(this.props.images || [])];
    newImages.splice(i, 1);
    this.props.images = newImages;
    this.emitChanges();
  }

  drop(event: CdkDragDrop<string[]>) {
    const newImages = [...(this.props.images || [])];
    moveItemInArray(newImages, event.previousIndex, event.currentIndex);
    this.props.images = newImages;
    this.emitChanges();
  }

  emitChanges() {
    this.actualizarProps.emit({ 
      images: [...this.props.images],
      layout: this.props.layout
    });
  }

  eliminar() {
    this.eliminarElemento.emit();
  }
}
