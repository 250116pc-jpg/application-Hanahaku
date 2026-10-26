import Phaser from 'phaser';
import buttonImage from '../assets/ui/button1.png';
import backgroundImage from '../assets/images/background/auth-meadow.png';
import './auth-layout.css';

// Native inputs remain usable with touch keyboards and browser password managers.
export function mountAuthLayout(
  scene: Phaser.Scene, form: HTMLFormElement, title: string, link: string, target: string
): { destroy: () => void } {
  const root = document.createElement('section');
  root.className = 'flower-auth-screen';
  root.setAttribute('aria-label', title);
  root.style.setProperty('--auth-background', `url("${backgroundImage}")`);
  root.style.setProperty('--auth-button', `url("${buttonImage}")`);
  const panel = document.createElement('div');
  panel.className = 'flower-auth-panel';
  const heading = document.createElement('h1');
  heading.textContent = title;
  panel.append(heading);
  const flourish = document.createElement('div');
  flourish.className = 'auth-flourish';
  flourish.textContent = '❀';
  flourish.setAttribute('aria-hidden', 'true');
  panel.append(flourish);
  const google = form.querySelector('.google-auth-area');
  const separator = form.querySelector('.auth-separator');
  separator?.remove();
  if (google) {
    const googleSection = document.createElement('details');
    googleSection.className = 'auth-google-option';
    googleSection.open = true;
    const summary = document.createElement('summary');
    summary.textContent = 'Googleアカウントで続ける';
    googleSection.append(summary, google);
    form.append(googleSection);
  }
  form.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((input, index) => {
    input.id = `${scene.scene.key}-password-${index}`;
    const label = input.closest('label');
    if (label) label.htmlFor = input.id;
    const field = document.createElement('div');
    field.className = 'auth-password-field';
    // The toggle is outside the label so clicking it does not activate the input label.
    input.after(field);
    field.append(input);
    label?.after(field);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'auth-password-toggle';
    toggle.textContent = '表示';
    toggle.setAttribute('aria-label', index === 1 ? '確認用パスワードを表示' : 'パスワードを表示');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.addEventListener('click', () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      toggle.textContent = visible ? '隠す' : '表示';
      toggle.setAttribute('aria-pressed', String(visible));
      toggle.setAttribute('aria-label', `${index === 1 ? '確認用' : ''}パスワードを${visible ? '隠す' : '表示'}`);
    });
    field.append(toggle);
  });
  const navigate = (destination: string): void => { scene.scene.start(destination); };
  const next = document.createElement('button');
  next.type = 'button'; next.className = 'auth-route-link'; next.textContent = `${link} ›`;
  next.addEventListener('click', () => navigate(target));
  panel.append(form, next);
  const back = document.createElement('button');
  back.type = 'button'; back.className = 'auth-back'; back.textContent = '‹ もどる';
  back.addEventListener('click', () => navigate('TitleScene'));
  root.append(panel, back);
  document.body.append(root);
  const destroy = (): void => {
    root.remove();
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, destroy);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);
  return { destroy };
}
