import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { GeneralesService } from './generales.service';

/**
 * Bloquea globalmente dobles clics y reenvíos rápidos sobre botones, enlaces,
 * iconos de acción y formularios en toda la aplicación, preservando los
 * elementos que utilizan `(dblclick)` intencionalmente.
 */
@Injectable({
  providedIn: 'root'
})
export class AntiDobleClickService implements OnDestroy {
  private readonly cooldownMs = 650;
  private readonly submitCooldownMs = 900;
  private readonly ultimoClickElemento = new WeakMap<Element, number>();
  private readonly ultimoSubmitForm = new WeakMap<HTMLFormElement, number>();
  private iniciado = false;

  private readonly selectorControlPrincipal =
    'button, input[type="submit"], input[type="button"], input[type="reset"], a, [role="button"], .btn';

  private readonly selectorAccionSecundaria =
    'app-titulo, i, .amo, .amor, .clicable, .manita, .imagen-seleccionable, li, app-texto';

  private readonly selectorEntradaTexto =
    'input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), textarea, select, option';

  private readonly onClickCapture = (event: MouseEvent): void => {
    if (!event.isTrusted) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    if (target.closest(this.selectorEntradaTexto)) {
      return;
    }

    if (target.closest('.pagination, .page-item, .page-link')) {
      return;
    }

    const dblClickHost = target.closest('[data-allow-dblclick], [ondblclick]');
    if (dblClickHost) {
      const accionInterna = target.closest('button, input[type="submit"], input[type="button"], input[type="reset"], a, [role="button"], .btn, app-titulo');
      if (!accionInterna || !dblClickHost.contains(accionInterna) || accionInterna === dblClickHost) {
        return;
      }
    }

    const elemento = target.closest(this.selectorControlPrincipal) || target.closest(this.selectorAccionSecundaria);
    if (!elemento) {
      return;
    }

    if (this.esEnlaceDescarga(elemento)) {
      return;
    }

    // No interferir con etiquetas <label> de checkboxes/radios salvo que sea un botón real
    if (target.closest('label') && !elemento.matches('button, input, a, [role="button"], .btn')) {
      return;
    }

    if (this.estaDeshabilitado(elemento) || this.generales.cargando()) {
      this.bloquearEvento(event);
      return;
    }

    const ahora = performance.now();
    const ultimo = this.ultimoClickElemento.get(elemento) ?? 0;

    if (event.detail >= 2 || (ahora - ultimo) < this.cooldownMs) {
      this.bloquearEvento(event);
      return;
    }

    this.ultimoClickElemento.set(elemento, ahora);
  };

  private readonly onSubmitCapture = (event: SubmitEvent): void => {
    if (!event.isTrusted) {
      return;
    }

    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) {
      return;
    }

    if (this.generales.cargando()) {
      this.bloquearEvento(event);
      return;
    }

    const ahora = performance.now();
    const ultimo = this.ultimoSubmitForm.get(form) ?? 0;
    if ((ahora - ultimo) < this.submitCooldownMs) {
      this.bloquearEvento(event);
      return;
    }

    this.ultimoSubmitForm.set(form, ahora);
  };

  private readonly onKeydownCapture = (event: KeyboardEvent): void => {
    if (!event.isTrusted || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    const esControlAccion = target.closest('button, input[type="submit"], input[type="button"], a, [role="button"]');
    if (esControlAccion) {
      if (event.repeat || this.estaDeshabilitado(esControlAccion) || this.generales.cargando()) {
        this.bloquearEvento(event);
        return;
      }
      const ahora = performance.now();
      const ultimo = this.ultimoClickElemento.get(esControlAccion) ?? 0;
      if ((ahora - ultimo) < this.cooldownMs) {
        this.bloquearEvento(event);
      }
      return;
    }

    if (event.key === 'Enter' && !target.closest('textarea')) {
      const form = target.closest('form');
      if (form && (event.repeat || this.generales.cargando())) {
        this.bloquearEvento(event);
      }
    }
  };

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone,
    private generales: GeneralesService
  ) {}

  iniciar(): void {
    if (this.iniciado) {
      return;
    }
    this.iniciado = true;

    this.ngZone.runOutsideAngular(() => {
      this.document.addEventListener('click', this.onClickCapture, true);
      this.document.addEventListener('submit', this.onSubmitCapture, true);
      this.document.addEventListener('keydown', this.onKeydownCapture, true);
    });
  }

  ngOnDestroy(): void {
    if (!this.iniciado) {
      return;
    }
    this.document.removeEventListener('click', this.onClickCapture, true);
    this.document.removeEventListener('submit', this.onSubmitCapture, true);
    this.document.removeEventListener('keydown', this.onKeydownCapture, true);
    this.iniciado = false;
  }

  private esEnlaceDescarga(elemento: Element): boolean {
    if (!(elemento instanceof HTMLAnchorElement)) {
      return false;
    }
    const href = (elemento.getAttribute('href') || '').trim().toLowerCase();
    return elemento.hasAttribute('download') || href.startsWith('blob:') || href.startsWith('data:');
  }

  private estaDeshabilitado(elemento: Element): boolean {
    return (
      elemento.hasAttribute('disabled') ||
      elemento.getAttribute('aria-disabled') === 'true' ||
      elemento.classList.contains('disabled')
    );
  }

  private bloquearEvento(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
}
