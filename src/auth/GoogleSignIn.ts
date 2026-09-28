export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdApi {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup';
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type: 'standard';
      theme: 'outline';
      size: 'large';
      text: 'continue_with';
      shape: 'rectangular';
      logo_alignment: 'left';
      width: number;
      locale: string;
    }
  ): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdApi;
      };
    };
  }
}

interface GoogleLoginResponse {
  ok: boolean;
  error?: string;
  user?: AuthenticatedUser;
}

interface GoogleButtonCallbacks {
  onStart(): void;
  onSuccess(user: AuthenticatedUser): void;
  onError(message: string): void;
}

let scriptPromise: Promise<void> | null = null;
let initializedClientId = '';
let credentialHandler: ((credential: string) => void) | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-hanahaku-google-signin]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Googleログインを読み込めませんでした。')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client?hl=ja';
    script.async = true;
    script.defer = true;
    script.dataset.hanahakuGoogleSignin = '1';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Googleログインを読み込めませんでした。')), { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function getPhpBaseUrl(): string {
  return (
    import.meta.env.VITE_PHP_BASE_URL ??
    'http://localhost/php/application-Hanahaku-main/php'
  ).replace(/\/$/, '');
}

async function authenticateWithGoogle(credential: string): Promise<AuthenticatedUser> {
  let response: Response;
  try {
    response = await fetch(`${getPhpBaseUrl()}/google-login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
  } catch {
    throw new Error('PHPへ接続できませんでした。接続先とサーバーを確認してください。');
  }

  const result = await response.json().catch(() => ({
    ok: false,
    error: 'PHPから正しい応答が返りませんでした。',
  })) as GoogleLoginResponse;

  if (!response.ok || !result.ok || !result.user) {
    throw new Error(result.error || 'Googleログインに失敗しました。');
  }

  return result.user;
}

export function saveCurrentUser(user: AuthenticatedUser): void {
  try {
    localStorage.setItem('hanahakuCurrentUser', JSON.stringify(user));
  } catch {
    // 保存できないブラウザでも、今回のログインは続行する。
  }
}

export function mountGoogleSignInButton(
  container: HTMLElement,
  callbacks: GoogleButtonCallbacks
): () => void {
  const defaultClientId =
    '459400588148-ko1ehqsnf6ve6mbu24v72gdg2t01vud4.apps.googleusercontent.com';
  const configuredClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();
  const clientId =
    !configuredClientId || configuredClientId.startsWith('YOUR_GOOGLE_CLIENT_ID')
      ? defaultClientId
      : configuredClientId;
  let active = true;

  if (!clientId || clientId.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
    container.classList.add('is-unavailable');
    container.textContent = 'GoogleクライアントIDを設定すると利用できます';
    return () => {
      active = false;
    };
  }

  const handleCredential = async (credential: string): Promise<void> => {
    if (!active) return;
    callbacks.onStart();
    try {
      const user = await authenticateWithGoogle(credential);
      if (active) callbacks.onSuccess(user);
    } catch (error) {
      if (active) {
        callbacks.onError(error instanceof Error ? error.message : 'Googleログインに失敗しました。');
      }
    }
  };

  void loadGoogleIdentityServices()
    .then(() => {
      if (!active || !window.google?.accounts.id) return;
      credentialHandler = (credential) => {
        void handleCredential(credential);
      };

      if (initializedClientId !== clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: (response) => {
            if (response.credential) credentialHandler?.(response.credential);
          },
        });
        initializedClientId = clientId;
      }

      container.replaceChildren();
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 360,
        locale: 'ja',
      });
    })
    .catch((error: unknown) => {
      if (active) {
        callbacks.onError(error instanceof Error ? error.message : 'Googleログインを読み込めませんでした。');
      }
    });

  return () => {
    active = false;
    credentialHandler = null;
  };
}
