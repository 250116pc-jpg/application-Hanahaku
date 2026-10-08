import Phaser from 'phaser';
import { SCENE_KEYS } from '../sceneKeys';
import { bindLoginForm, createLoginForm } from './loginForm';
import { createLoginScreen } from './loginScreen';

export class LoginScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.LOGIN);
  }

  create(): void {
    const screen = createLoginScreen(this);
    const form = createLoginForm();
    const dom = this.add.dom(screen.formX, screen.formY, form.element);

    const disposeLoginForm = bindLoginForm(form, {
      onAuthenticated: () => {
        this.time.delayedCall(700, () => {
          dom.destroy();
          this.scene.start(SCENE_KEYS.HOME);
        });
      },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeLoginForm);

    screen.backButton.on('pointerup', () => {
      dom.destroy();
      this.scene.start(SCENE_KEYS.TITLE);
    });

    screen.registerLink.on('pointerup', () => {
      dom.destroy();
      this.scene.start(SCENE_KEYS.REGISTER);
    });
  }
}
