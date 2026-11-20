import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-espacio-menu',
  standalone: true,
  templateUrl: './espacio-menu.html',
  styleUrls: ['./espacio-menu.css']
})
export class EspacioMenu {
  @Input() props: {
    altura: number;
  } = {
    altura: 90
  };
}
