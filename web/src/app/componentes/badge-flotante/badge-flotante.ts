import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge-flotante',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge-flotante.html',
  styleUrls: ['./badge-flotante.css']
})
export class BadgeFlotante {
  @Input() props!: {
    text: string;
    color: string; // 'sticky-pink' | 'sticky-yellow' | 'sticky-blue' | 'sticky-green' | 'sticky-orange'
    position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    rotation: number;
  };

  get positionClass(): string {
    return this.props?.position || 'bottom-left';
  }

  get rotationStyle(): string {
    const angle = this.props?.rotation !== undefined ? this.props.rotation : -4;
    return `rotate(${angle}deg)`;
  }
}
