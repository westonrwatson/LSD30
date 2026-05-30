import './style.css';
import { App } from './ui/app';

const appRoot = document.querySelector<HTMLElement>('#app');
if (appRoot) {
  new App(appRoot);
}
