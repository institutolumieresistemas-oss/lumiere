import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-foto-planteles',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './foto-planteles.html',
  styleUrls: ['./foto-planteles.css']
})
export class FotoPlanteles implements OnInit, OnDestroy {

  @Input({ required: true }) images: any[] = [];
  @Input() layout?: 'classic' | 'polaroid' | 'bento' | 'stories' | 'idcard' = 'classic';

  currentIndex = 0;
  isFlashing = false;
  intervalId: any;

  getImgUrl(img: any): string {
    return typeof img === 'string' ? img : (img?.url || '');
  }

  getImgNombre(img: any, index: number): string {
    if (typeof img === 'string') return 'Plantel ' + (index + 1);
    return img?.nombre || 'Plantel ' + (index + 1);
  }

  ngOnInit() {
    this.startAutoCycle();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  startAutoCycle() {
    if (this.images.length <= 1) return;

    this.intervalId = setInterval(() => {
      this.nextImage();
    }, 3000);
  }

  nextImage() {
    this.isFlashing = true;

    setTimeout(() => {
      this.isFlashing = false;
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }, 250);
  }

  selectImage(index: number) {
    this.currentIndex = index;
  }
}
