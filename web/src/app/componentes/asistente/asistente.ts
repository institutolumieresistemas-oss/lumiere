import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { AsistenteService } from '../../servicios/asistente.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-asistente',
  standalone: true,
  templateUrl: './asistente.html',
  styleUrls: ['./asistente.css']
})
export class Asistente implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('petSvg', { read: ElementRef, static: false }) petSvg!: ElementRef;

  private subSaludar!: Subscription;
  private subCelebrar!: Subscription;
  private subPensar!: Subscription;

  private floatTween?: gsap.core.Tween;
  private blinkTimeline?: gsap.core.Timeline;

  constructor(private asistenteService: AsistenteService) {}

  ngOnInit() {
    this.subSaludar = this.asistenteService.saludar$.subscribe(() => this.saludar());
    this.subCelebrar = this.asistenteService.celebrar$.subscribe(() => this.celebrar());
    this.subPensar = this.asistenteService.pensar$.subscribe(() => this.pensar());
  }

  ngAfterViewInit() {
    this.startIdleAnimations();
  }

  ngOnDestroy() {
    if (this.subSaludar) this.subSaludar.unsubscribe();
    if (this.subCelebrar) this.subCelebrar.unsubscribe();
    if (this.subPensar) this.subPensar.unsubscribe();
    this.killAllAnimations();
  }

  private killAllAnimations() {
    if (this.floatTween) this.floatTween.kill();
    if (this.blinkTimeline) this.blinkTimeline.kill();

    gsap.killTweensOf('#pet-character');
    gsap.killTweensOf('#pet-eye-left');
    gsap.killTweensOf('#pet-eye-right');
    gsap.killTweensOf('#pet-arm-left');
    gsap.killTweensOf('#pet-arm-right');
    gsap.killTweensOf('#pet-head-group');
  }

  startIdleAnimations() {
    this.killAllAnimations();

    // Reset positions to default values
    gsap.set(['#pet-character', '#pet-eye-left', '#pet-eye-right', '#pet-arm-left', '#pet-arm-right', '#pet-head-group'], {
      x: 0, y: 0, rotation: 0, scaleY: 1, scaleX: 1
    });

    // 1. Flotación Suave (Infinito)
    this.floatTween = gsap.to('#pet-character', {
      y: -35,
      rotation: 1,
      duration: 2.2,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1
    });

    // 2. Pestañeo normal
    this.startBlinkTimeline(4);
  }

  private startBlinkTimeline(repeatDelaySeconds: number) {
    if (this.blinkTimeline) {
      this.blinkTimeline.kill();
    }
    this.blinkTimeline = gsap.timeline({ repeat: -1, repeatDelay: repeatDelaySeconds });
    this.blinkTimeline
      .to(['#pet-eye-left', '#pet-eye-right'], {
        scaleY: 0.1,
        duration: 0.1,
        transformOrigin: 'center center',
        ease: 'power2.inOut'
      })
      .to(['#pet-eye-left', '#pet-eye-right'], {
        scaleY: 1,
        duration: 0.15,
        transformOrigin: 'center center',
        ease: 'power2.inOut'
      });
  }

  saludar() {
    // Detener flotación y animaciones conflictivas temporalmente
    if (this.floatTween) this.floatTween.kill();
    gsap.killTweensOf('#pet-character');
    gsap.killTweensOf('#pet-mouth');
    gsap.killTweensOf('#pet-brow-right');
    gsap.killTweensOf('#pet-brow-left');

    // EXPRESIÓN DE ENOJADO (Invertir boca y bajar cejas)
    gsap.timeline()
      // Cejas enojadas (inclinadas hacia el centro)
      .to('#pet-brow-right', { rotation: -25, y: 20, transformOrigin: 'center center', duration: 0.3 })
      .to('#pet-brow-left', { rotation: 25, y: 20, transformOrigin: 'center center', duration: 0.3 }, '<')
      // Boca volteada / enojada
      .to('#pet-mouth', { scaleY: -0.8, y: -20, transformOrigin: 'center center', duration: 0.3 }, '<')
      
      // Mantiene el enojo 1.2 segundos
      .to({}, { duration: 1.2 })
      
      // REGRESO A SONRIENTE / ALEGRE
      .to('#pet-brow-right', { rotation: 0, y: 0, duration: 0.4, ease: 'power2.out' })
      .to('#pet-brow-left', { rotation: 0, y: 0, duration: 0.4, ease: 'power2.out' }, '<')
      .to('#pet-mouth', { scaleY: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }, '<')
      .call(() => {
        this.startIdleAnimations();
      });
  }

  celebrar() {
    this.killAllAnimations();

    // Salta repetidamente de forma energética y parpadea rápido
    gsap.timeline({
      onComplete: () => {
        this.startIdleAnimations();
      }
    })
      // Salto 1
      .to('#pet-character', { y: -90, scaleY: 1.1, duration: 0.3, ease: 'power2.out' })
      .to('#pet-character', { y: 0, scaleY: 0.9, duration: 0.25, ease: 'power2.in' })
      .to('#pet-character', { scaleY: 1, duration: 0.05 })
      // Salto 2
      .to('#pet-character', { y: -90, scaleY: 1.1, duration: 0.3, ease: 'power2.out' })
      .to('#pet-character', { y: 0, scaleY: 0.9, duration: 0.25, ease: 'power2.in' })
      .to('#pet-character', { scaleY: 1, duration: 0.05 });

    // Parpadeo rápido
    this.startBlinkTimeline(0.8);
  }

  pensar() {
    // Detiene flotación y posiciona cabeza inclinada levemente hacia un lado
    gsap.killTweensOf('#pet-head-group');

    gsap.to('#pet-head-group', {
      rotation: -10,
      transformOrigin: '1400px 1400px',
      duration: 0.5,
      ease: 'power2.out'
    });
  }
}
