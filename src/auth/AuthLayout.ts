import { bindDomGui } from '../utils/ui/dom-layout';
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056
 * 氏名：武田優人、斎藤永聖
 * ================================== */
import Phaser from 'phaser';
import buttonImage from '../assets/ui/button1.png';
import backgroundImage from '../assets/images/background/auth-meadow.png';
import './auth-layout.css';

// Native inputs remain usable with touch keyboards and browser password managers.
export function mountAuthLayout(
  scene: Phaser.Scene, login: HTMLFormElement, register: HTMLFormElement,
  navigate: (destination: string) => void
): { focusLogin: () => void; googleButton: HTMLDivElement | null; googleMessage: HTMLParagraphElement } {
  /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
   * 処理内容 : 画像・文字・パネルを配置する
   * ================================== */
  const root = document.createElement('section');
  root.className = 'flower-auth-screen';
  root.setAttribute('aria-label', 'アカウント');
  root.style.setProperty('--auth-background', `url("${backgroundImage}")`);
  root.style.setProperty('--auth-button', `url("${buttonImage}")`);
  const panel = document.createElement('div');
  panel.className = 'flower-auth-panel';
  register.classList.add('flower-auth-register');
  const googleSection = document.createElement('details');
  googleSection.className = 'auth-google-option';
  googleSection.open = true;
  const summary = document.createElement('summary');
  summary.textContent = 'Googleアカウントで続ける';
  const google = login.querySelector('.google-auth-area');
  const googleButton = google?.querySelector<HTMLDivElement>('.google-signin-button') ?? null;
  const googleMessage = document.createElement('p');
  googleMessage.className = 'register-message';
  googleMessage.setAttribute('aria-live', 'polite');
  googleSection.append(summary);
  if (google) googleSection.append(google);
  googleSection.append(googleMessage);
  const section = (title: string, form: HTMLFormElement): HTMLElement => {
    const column = document.createElement('section');
    column.className = 'auth-column';
    const heading = document.createElement('h2');
    heading.textContent = title;
    column.append(heading, form);
    return column;
  };
  const loginColumn = section('ログイン', login);
  const registerColumn = section('アカウント作成', register);
  const switchButton = document.createElement('button');
  switchButton.type = 'button';
  switchButton.className = 'auth-route-link';
  const selectForm = (registration: boolean): void => {
    loginColumn.hidden = registration;
    registerColumn.hidden = !registration;
    switchButton.textContent = registration ? 'ログインへ戻る' : '初めての方はこちら ／ アカウント作成';
    root.scrollTop = 0;
  };
  switchButton.addEventListener('click', () => selectForm(registerColumn.hidden === true));
  panel.append(loginColumn, registerColumn, googleSection, switchButton);
  selectForm(false);
  panel.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((input, index) => {
    input.id = 'auth-password-' + index;
    const isConfirmation = input.name === 'passwordConfirm';
    const label = input.closest('label');
    if (label) label.htmlFor = input.id;
    const field = document.createElement('div');
    field.className = 'auth-password-field';
    // The toggle is outside the label so clicking it does not activate the input label.
    input.after(field);
    field.append(input);
    if (label) {
      const group = document.createElement('div');
      group.className = 'auth-password-group';
      label.before(group);
      group.append(label, field);
    }
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'auth-password-toggle';
    toggle.textContent = '表示';
    toggle.setAttribute('aria-label', isConfirmation ? '確認用パスワードを表示' : 'パスワードを表示');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.addEventListener('click', () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      toggle.textContent = visible ? '隠す' : '表示';
      toggle.setAttribute('aria-pressed', String(visible));
      toggle.setAttribute('aria-label', `${isConfirmation ? '確認用' : ''}パスワードを${visible ? '隠す' : '表示'}`);
    });
    field.append(toggle);
    input.form?.addEventListener('reset', () => { if (input.type === 'text') toggle.click(); });
  });
  for (const form of [login, register]) {
    const submit = form.querySelector('button[type="submit"]');
    if (!submit) continue;
    const fields = document.createElement('div');
    fields.className = 'auth-fields';
    fields.append(...Array.from(form.children).filter(child => child !== submit));
    form.prepend(fields);
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 画像・文字・パネルを配置する
   * ================================== */
  const back = document.createElement('button');
  back.type = 'button'; back.className = 'auth-back'; back.textContent = '‹ もどる';
  back.addEventListener('click', () => navigate('TitleScene'));
  root.append(panel, back);
  const position = (): void => {
    const { left, top, width, height } = scene.game.canvas.getBoundingClientRect();
    Object.assign(root.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
  };
  document.body.append(root);
  bindDomGui(panel, 'LoginScene');
  position();
  scene.scale.on(Phaser.Scale.Events.RESIZE, position);
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 画面終了時にフォームと入力イベントを取り除く
   * ================================== */
  const destroy = (): void => {
    root.remove();
    scene.scale.off(Phaser.Scale.Events.RESIZE, position);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, destroy);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);
  return {
    focusLogin: () => {
      selectForm(false);
      login.querySelector<HTMLInputElement>('[name="email"]')?.focus();
    },
    googleButton, googleMessage,
  };
}

