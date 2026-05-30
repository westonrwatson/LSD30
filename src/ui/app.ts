import type { DayPlan, PersistedState } from '../content/schema';
import { loadAllDays, buildWordIndex, getDayNumbers } from '../content/loader';
import { loadState, saveState } from '../lib/storage';
import { getNextAvailableDay } from '../session/orchestrator';
import { renderPlanView } from './plan-view';
import { renderStudyView, renderHome } from './study-view';

type AppMode = 'home' | 'plan' | 'study';

export class App {
  private root: HTMLElement;
  private days: DayPlan[];
  private state: PersistedState;
  private wordIndex: Map<string, import('../content/schema').Word>;
  private mode: AppMode = 'home';
  private studyDay: number | null = null;
  private shell: HTMLElement | null = null;
  private mainInnerEl: HTMLElement | null = null;
  private studyLink: HTMLButtonElement | null = null;
  private planLink: HTMLButtonElement | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.days = loadAllDays();
    this.state = loadState(getDayNumbers(this.days));
    this.wordIndex = buildWordIndex(this.days);
    this.render();
  }

  private setMode(mode: AppMode, studyDay?: number): void {
    this.mode = mode;
    this.studyDay = studyDay ?? null;
    this.render();
  }

  private createLogoWrap(): HTMLElement {
    const logoWrap = document.createElement('div');
    logoWrap.className = 'logo-wrap';

    for (let i = 0; i < 3; i++) {
      const logoCircle = document.createElement('span');
      logoCircle.className = 'logo-circle';
      logoCircle.setAttribute('aria-hidden', 'true');
      logoWrap.appendChild(logoCircle);
    }

    const logoBtn = document.createElement('button');
    logoBtn.className = 'logo';
    logoBtn.type = 'button';
    logoBtn.textContent = 'Povtori';
    logoBtn.addEventListener('click', () => this.setMode('home'));

    logoWrap.appendChild(logoBtn);
    return logoWrap;
  }

  private buildShell(): void {
    this.root.innerHTML = '';

    const shell = document.createElement('div');
    shell.className = 'app-shell';

    const header = document.createElement('header');
    header.className = 'site-header';

    const headerInner = document.createElement('div');
    headerInner.className = 'site-header-inner';

    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Main');

    const navList = document.createElement('ul');
    navList.className = 'nav-list';

    const studyItem = document.createElement('li');
    const studyLink = document.createElement('button');
    studyLink.type = 'button';
    studyLink.className = 'nav-link';
    studyLink.innerHTML =
      '<span class="nav-arrow" aria-hidden="true"></span><span class="nav-label">Study</span>';
    studyLink.addEventListener('click', () => this.setMode('home'));
    studyItem.appendChild(studyLink);

    const planItem = document.createElement('li');
    const planLink = document.createElement('button');
    planLink.type = 'button';
    planLink.className = 'nav-link';
    planLink.innerHTML =
      '<span class="nav-arrow" aria-hidden="true"></span><span class="nav-label">Plan</span>';
    planLink.addEventListener('click', () => this.setMode('plan'));
    planItem.appendChild(planLink);

    navList.appendChild(studyItem);
    navList.appendChild(planItem);
    nav.appendChild(navList);
    headerInner.appendChild(this.createLogoWrap());
    headerInner.appendChild(nav);
    header.appendChild(headerInner);
    shell.appendChild(header);

    const main = document.createElement('main');
    main.className = 'main';

    const mainInner = document.createElement('div');
    mainInner.className = 'main-inner';
    main.appendChild(mainInner);
    shell.appendChild(main);

    const footerRule = document.createElement('hr');
    footerRule.className = 'rule';
    shell.appendChild(footerRule);

    const footer = document.createElement('footer');
    footer.className = 'site-footer';

    const footerInner = document.createElement('div');
    footerInner.className = 'site-footer-inner';

    const footerLogoCol = document.createElement('div');
    footerLogoCol.className = 'footer-col footer-col-logo';
    footerLogoCol.appendChild(this.createLogoWrap());

    const footerAboutCol = document.createElement('div');
    footerAboutCol.className = 'footer-col footer-col-about';
    footerAboutCol.innerHTML = `
      <p class="footer-title">Povtori</p>
      <p class="footer-location">San Diego, California</p>
      <p class="footer-quote">Thirty minutes of Russian, every day — built for the slow consistency that actually sticks.</p>
      <p class="footer-credit">Site designed and built by <a class="footer-credit-link" href="https://westonwatson.com" target="_blank" rel="noopener noreferrer">West</a>.</p>
      <div class="footer-social">
        <a class="footer-social-link" href="https://www.linkedin.com/in/westonrwatson/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="3.5" width="17" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="0.75"></rect>
            <path d="M8 10v7" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"></path>
            <circle cx="8" cy="7.25" r="1.1" fill="none" stroke="currentColor" stroke-width="0.75"></circle>
            <path d="M12 10v7" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"></path>
            <path d="M12 13.5c0-1.8 1.2-2.5 2.4-2.5 1.4 0 2.1.9 2.1 2.7V17" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"></path>
          </svg>
        </a>
        <a class="footer-social-link" href="https://www.instagram.com/weston.watson/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="0.75"></rect>
            <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="0.75"></circle>
            <circle cx="17.1" cy="6.9" r="0.85" fill="currentColor" stroke="none"></circle>
          </svg>
        </a>
      </div>
    `;

    footerInner.appendChild(footerLogoCol);
    footerInner.appendChild(footerAboutCol);
    footer.appendChild(footerInner);
    shell.appendChild(footer);

    this.root.appendChild(shell);
    this.shell = shell;
    this.mainInnerEl = mainInner;
    this.studyLink = studyLink;
    this.planLink = planLink;
  }

  private updateNav(): void {
    if (!this.studyLink || !this.planLink) return;

    const studyActive = this.mode === 'home' || this.mode === 'study';
    this.studyLink.classList.toggle('active', studyActive);
    this.planLink.classList.toggle('active', this.mode === 'plan');
  }

  private renderMain(): void {
    if (!this.mainInnerEl) return;

    this.mainInnerEl.replaceChildren();

    if (this.mode === 'home') {
      const nextDayNum = getNextAvailableDay(this.state);
      const nextDay = nextDayNum ? this.days.find((d) => d.day === nextDayNum) ?? null : null;
      this.mainInnerEl.appendChild(
        renderHome(
          nextDay,
          this.state,
          () => {
            if (nextDay) this.setMode('study', nextDay.day);
          },
        ),
      );
    } else if (this.mode === 'plan') {
      this.mainInnerEl.appendChild(
        renderPlanView(this.days, this.state, {
          onStartDay: (day) => {
            const entry = this.state.planDays[day];
            if (entry?.status === 'locked') {
              const next = {
                ...this.state,
                planDays: {
                  ...this.state.planDays,
                  [day]: { ...entry, status: 'available' as const },
                },
              };
              this.state = next;
              saveState(next);
            }
            this.setMode('study', day);
          },
          onStateChange: (state) => {
            this.state = state;
            this.render();
          },
        }),
      );
    } else if (this.mode === 'study' && this.studyDay) {
      const dayPlan = this.days.find((d) => d.day === this.studyDay);
      if (dayPlan) {
        this.mainInnerEl.appendChild(
          renderStudyView(dayPlan, this.state, this.wordIndex, {
            onComplete: (state) => {
              this.state = state;
              this.setMode('home');
            },
            onExit: (state) => {
              this.state = state;
              this.setMode('home');
            },
          }),
        );
      }
    }
  }

  private render(): void {
    if (!this.shell) {
      this.buildShell();
    }

    this.shell?.classList.toggle('app-shell--study', this.mode === 'study');
    document.body.classList.toggle('study-active', this.mode === 'study');

    this.updateNav();
    this.renderMain();
  }
}
