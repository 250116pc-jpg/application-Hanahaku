import './style.css';
import { getPhpBaseUrl } from '../src/auth/PhpBaseUrl';
import formation from '../php/flower/formation.json';
import catalog from '../php/shop/items.json';
import trainingRules from '../php/flower/training.json';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  coin: number;
}

interface OwnedFlower {
  flowerId: number;
  level: number;
  exp: string;
  skillLevel: number;
  skillExp: string;
}

interface AdminState {
  user: AdminUser;
  items: Record<string, number>;
  flowers: OwnedFlower[];
  completedStageIds: number[];
}

interface AdminHistory {
  id: string;
  adminUserId: number;
  adminName: string;
  targetUserId: number;
  targetName: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
}

interface AdminResponse {
  ok: boolean;
  error?: string;
  character?: 'male' | 'female';
  users?: AdminUser[];
  state?: AdminState;
  added?: boolean;
  reset?: boolean;
  history?: AdminHistory[];
}

interface FlowerChange {
  flowerId: number;
  level: number;
  skillLevel: number;
}

interface PendingChanges {
  coin?: number;
  items: Array<{ itemId: number; quantity: number }>;
  flowers: FlowerChange[];
}

type AdminAction = 'addItem' | 'addFlower' | 'resetStage';

const stages = [
  { id: 2, name: '1-1' },
  { id: 4, name: '1-2' },
  { id: 6, name: '1-3' },
  { id: 8, name: '1-4' },
  { id: 10, name: '1-5' },
];

function requiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`管理画面の要素が見つかりません: ${selector}`);
  return element;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}

const userSelect = requiredElement<HTMLSelectElement>('#target-user');
const userSearch = requiredElement<HTMLInputElement>('#user-search');
const accessPanel = requiredElement<HTMLElement>('#access-blocked');
const accessStatus = requiredElement<HTMLParagraphElement>('#access-status');
const adminContent = requiredElement<HTMLDivElement>('#admin-content');
const addItemSelect = requiredElement<HTMLSelectElement>('form[data-action="addItem"] select[name="itemId"]');
const addFlowerSelect = requiredElement<HTMLSelectElement>('form[data-action="addFlower"] select[name="flowerId"]');
const statusElement = requiredElement<HTMLParagraphElement>('#status');
const dashboard = requiredElement<HTMLElement>('#account-dashboard');
const userTitle = requiredElement<HTMLHeadingElement>('#user-title');
const userMeta = requiredElement<HTMLParagraphElement>('#user-meta');
const metricsElement = requiredElement<HTMLDivElement>('#account-metrics');
const inventoryRows = requiredElement<HTMLTableSectionElement>('#inventory-rows');
const flowerRows = requiredElement<HTMLTableSectionElement>('#flower-rows');
const emptyFlowers = requiredElement<HTMLParagraphElement>('#empty-flowers');
const stageRows = requiredElement<HTMLTableSectionElement>('#stage-rows');
const saveButton = requiredElement<HTMLButtonElement>('#save-changes');
const historyStatus = requiredElement<HTMLParagraphElement>('#history-status');
const historyRows = requiredElement<HTMLTableSectionElement>('#history-rows');
const maleCharacterButton = requiredElement<HTMLButtonElement>('#select-male-character');
const femaleCharacterButton = requiredElement<HTMLButtonElement>('#select-female-character');
const playerCharacterStatus = requiredElement<HTMLParagraphElement>('#player-character-status');

let selectedState: AdminState | undefined;
let busy = false;
let allUsers: AdminUser[] = [];
let selectedPlayerCharacter: 'male' | 'female' = 'male';
let playerCharacterBusy = false;

function populateSelect<T extends { id: number; name: string }>(
  select: HTMLSelectElement,
  values: readonly T[],
  placeholder: string,
): void {
  select.replaceChildren();
  const option = element('option', placeholder);
  option.value = '';
  select.append(option);
  values.forEach(value => {
    const option = element('option', `${value.name}（ID: ${value.id}）`);
    option.value = String(value.id);
    select.append(option);
  });
}

populateSelect(addItemSelect, catalog, 'アイテムを選択してください');
populateSelect(addFlowerSelect, formation.characters, '追加する花を選択してください');

async function request(body: Record<string, unknown>): Promise<AdminResponse> {
  const response = await fetch(`${getPhpBaseUrl()}/admin/manage.php`, {
    method: 'POST',
    credentials: 'omit',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json() as AdminResponse;
  if (!response.ok || !result.ok) throw new Error(result.error ?? '管理APIを利用できません。');
  return result;
}

function setStatus(message: string, isError = false): void {
  statusElement.textContent = message;
  statusElement.classList.toggle('is-error', isError);
}

function setHistoryStatus(message: string, isError = false): void {
  historyStatus.textContent = message;
  historyStatus.classList.toggle('is-error', isError);
}

function setAccessStatus(message: string, isError = false): void {
  accessStatus.textContent = message;
  accessStatus.classList.toggle('is-error', isError);
}

function setPlayerCharacterStatus(message: string, isError = false): void {
  playerCharacterStatus.textContent = message;
  playerCharacterStatus.classList.toggle('is-error', isError);
}

function renderPlayerCharacter(): void {
  maleCharacterButton.setAttribute('aria-pressed', String(selectedPlayerCharacter === 'male'));
  femaleCharacterButton.setAttribute('aria-pressed', String(selectedPlayerCharacter === 'female'));
  maleCharacterButton.disabled = busy || playerCharacterBusy;
  femaleCharacterButton.disabled = busy || playerCharacterBusy;
}

async function loadPlayerCharacter(): Promise<void> {
  setPlayerCharacterStatus('主人公の設定を読み込んでいます…');
  try {
    const result = await request({ action: 'playerCharacter' });
    if (result.character !== 'male' && result.character !== 'female') {
      throw new Error('主人公の設定形式が正しくありません。');
    }
    selectedPlayerCharacter = result.character;
    renderPlayerCharacter();
    setPlayerCharacterStatus(`${selectedPlayerCharacter === 'male' ? '男' : '女'}主人公を使用中です。`);
  } catch (error) {
    setPlayerCharacterStatus(error instanceof Error ? error.message : '主人公の設定を読み込めませんでした。', true);
  }
}

async function selectPlayerCharacter(character: 'male' | 'female'): Promise<void> {
  if (busy || playerCharacterBusy || selectedPlayerCharacter === character) return;
  playerCharacterBusy = true;
  renderPlayerCharacter();
  setPlayerCharacterStatus('主人公の設定を保存しています…');
  try {
    const result = await request({ action: 'setPlayerCharacter', character });
    if (result.character !== character) throw new Error('主人公の設定を確認できませんでした。');
    selectedPlayerCharacter = character;
    setPlayerCharacterStatus(`${character === 'male' ? '男' : '女'}主人公に切り替えました。ゲームを再読み込みしてください。`);
  } catch (error) {
    setPlayerCharacterStatus(error instanceof Error ? error.message : '主人公を切り替えられませんでした。', true);
  } finally {
    playerCharacterBusy = false;
    renderPlayerCharacter();
  }
}

function showAdminView(): void {
  accessPanel.hidden = true;
  adminContent.hidden = false;
  void loadUsers();
  void loadHistory();
  void loadPlayerCharacter();
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(value);
}

function currentValueFor(input: HTMLInputElement): number | undefined {
  if (!selectedState) return undefined;
  const [kind, id, field] = (input.dataset.changeKey ?? '').split(':');
  if (kind === 'coin') return selectedState.user.coin;
  if (kind === 'item') return selectedState.items[id] ?? 0;
  if (kind === 'flower') {
    const flower = selectedState.flowers.find(value => value.flowerId === Number(id));
    if (!flower) return undefined;
    return field === 'skillLevel' ? flower.skillLevel : flower.level;
  }
  return undefined;
}

function hasPendingChanges(): boolean {
  return Array.from(dashboard.querySelectorAll<HTMLInputElement>('input[data-change-key]'))
    .some(input => input.value !== String(currentValueFor(input)));
}

function updateSaveButton(): void {
  saveButton.disabled = busy || !selectedState || !hasPendingChanges();
}

function createStepper(
  key: string,
  label: string,
  value: number,
  step: number,
  min: number,
  max: number,
): HTMLDivElement {
  const wrapper = element('div', undefined, 'stepper');
  const decrement = element('button', '−', 'stepper-button');
  decrement.type = 'button';
  decrement.dataset.delta = String(-step);
  decrement.setAttribute('aria-label', `${label}を${step}減らす`);
  const input = element('input');
  input.type = 'number';
  input.min = String(min);
  input.max = String(max);
  input.step = '1';
  input.value = String(value);
  input.dataset.changeKey = key;
  input.setAttribute('aria-label', `${label}の変更後の値`);
  const increment = element('button', '＋', 'stepper-button');
  increment.type = 'button';
  increment.dataset.delta = String(step);
  increment.setAttribute('aria-label', `${label}を${step}増やす`);
  wrapper.append(decrement, input, increment);
  return wrapper;
}

function renderMetrics(state: AdminState): void {
  metricsElement.replaceChildren();
  const totalItems = Object.values(state.items).reduce((total, count) => total + count, 0);
  const values = [
    { label: 'コイン', value: formatNumber(state.user.coin) },
    { label: 'アイテム合計', value: formatNumber(totalItems) },
    { label: '所持花', value: `${state.flowers.length}種` },
    { label: 'クリア済み', value: `${state.completedStageIds.length} / ${stages.length}` },
  ];
  values.forEach(({ label, value }) => {
    const metric = element('div', undefined, 'metric');
    metric.append(element('span', label, 'metric-label'), element('strong', value, 'metric-value'));
    metricsElement.append(metric);
  });
}

function renderInventory(state: AdminState): void {
  inventoryRows.replaceChildren();
  const coinRow = element('tr');
  coinRow.append(
    element('th', 'コイン', 'row-label'),
    element('td', `${formatNumber(state.user.coin)} 枚`, 'current-count'),
  );
  const coinInput = element('td');
  coinInput.append(createStepper('coin', 'コイン', state.user.coin, 100, 0, 2147483647));
  coinRow.append(coinInput);
  inventoryRows.append(coinRow);

  catalog.forEach(item => {
    const count = state.items[String(item.id)] ?? 0;
    const row = element('tr');
    row.append(
      element('th', item.name, 'row-label'),
      element('td', `${formatNumber(count)} 個`, 'current-count'),
    );
    const valueCell = element('td');
    valueCell.append(createStepper(`item:${item.id}`, item.name, count, 1, 0, 2147483647));
    row.append(valueCell);
    inventoryRows.append(row);
  });
}

function renderFlowers(state: AdminState): void {
  flowerRows.replaceChildren();
  state.flowers.forEach(flower => {
    const definition = formation.characters.find(value => value.id === flower.flowerId);
    const name = definition?.name ?? `花 ID ${flower.flowerId}`;
    const row = element('tr');
    const nameCell = element('th', undefined, 'row-label');
    nameCell.append(element('span', name), element('small', `EXP ${flower.exp} / スキルEXP ${flower.skillExp}`));
    const levelCell = element('td');
    levelCell.append(
      element('span', `現在 Lv.${flower.level}`, 'current-level'),
      createStepper(`flower:${flower.flowerId}:level`, `${name}の花レベル`, flower.level, 1, 1, trainingRules.maxLevel),
    );
    const skillCell = element('td');
    skillCell.append(
      element('span', `現在 Lv.${flower.skillLevel}`, 'current-level'),
      createStepper(
        `flower:${flower.flowerId}:skillLevel`,
        `${name}のスキルレベル`,
        flower.skillLevel,
        1,
        1,
        trainingRules.skill.thresholds.length,
      ),
    );
    row.append(nameCell, levelCell, skillCell);
    flowerRows.append(row);
  });
  emptyFlowers.hidden = state.flowers.length > 0;
}

function renderStages(state: AdminState): void {
  stageRows.replaceChildren();
  stages.forEach(stage => {
    const cleared = state.completedStageIds.includes(stage.id);
    const row = element('tr');
    row.append(
      element('th', stage.name, 'row-label'),
      element('td', cleared ? 'クリア済み' : '未クリア', cleared ? 'stage-cleared' : 'stage-not-cleared'),
    );
    const actionCell = element('td');
    const resetButton = element('button', 'リセット', 'button button-danger button-small');
    resetButton.type = 'button';
    resetButton.dataset.stageId = String(stage.id);
    resetButton.disabled = busy || !cleared;
    resetButton.setAttribute('aria-label', `${stage.name}のクリア記録をリセット`);
    actionCell.append(resetButton);
    row.append(actionCell);
    stageRows.append(row);
  });
}

function renderState(state: AdminState): void {
  selectedState = state;
  dashboard.hidden = false;
  userTitle.textContent = `#${state.user.id} ${state.user.name}`;
  userMeta.textContent = state.user.email;
  renderMetrics(state);
  renderInventory(state);
  renderFlowers(state);
  renderStages(state);
  const selectedOption = userSelect.selectedOptions[0];
  if (selectedOption) selectedOption.textContent = `#${state.user.id} ${state.user.name} / ${state.user.email}`;
  updateSaveButton();
}

function renderUserOptions(preferredId = userSelect.value): void {
  const query = userSearch.value.trim().toLocaleLowerCase();
  const filtered = allUsers.filter(user =>
    String(user.id).includes(query)
    || user.name.toLocaleLowerCase().includes(query)
    || user.email.toLocaleLowerCase().includes(query),
  );
  userSelect.replaceChildren();
  const placeholder = element('option', filtered.length ? 'ユーザーを選択してください' : '一致するユーザーがいません');
  placeholder.value = '';
  userSelect.append(placeholder);
  filtered.forEach(user => {
    const option = element('option', `#${user.id} ${user.name} / ${user.email}`);
    option.value = String(user.id);
    userSelect.append(option);
  });
  userSelect.disabled = busy || allUsers.length === 0;
  if (filtered.some(user => String(user.id) === preferredId)) userSelect.value = preferredId;
}

async function loadUsers(): Promise<void> {
  setStatus('管理者権限を確認しています…');
  userSelect.disabled = true;
  try {
    const result = await request({ action: 'users' });
    if (!result.users) throw new Error('ユーザー一覧の形式を読み取れませんでした。');
    const previousId = userSelect.value;
    allUsers = result.users;
    renderUserOptions(previousId);
    if (userSelect.value) await loadState();
    else {
      await loadState();
      setStatus(allUsers.length ? '対象ユーザーを選択してください。' : 'ユーザーが登録されていません。');
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'ユーザー一覧を読み込めませんでした。', true);
    userSelect.disabled = true;
  }
}

async function loadState(): Promise<void> {
  if (!userSelect.value) {
    selectedState = undefined;
    dashboard.hidden = true;
    updateSaveButton();
    setStatus(allUsers.length ? '対象ユーザーを選択してください。' : 'ユーザーが登録されていません。');
    return;
  }
  const requestedUserId = Number(userSelect.value);
  selectedState = undefined;
  dashboard.hidden = true;
  updateSaveButton();
  setStatus('アカウント情報を読み込んでいます…');
  try {
    const result = await request({ action: 'state', userId: requestedUserId });
    if (Number(userSelect.value) !== requestedUserId) return;
    if (!result.state) throw new Error('ユーザー情報の形式を読み取れませんでした。');
    renderState(result.state);
    setStatus(`${result.state.user.name}さんのデータを読み込みました。`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'ユーザー情報を読み込めませんでした。', true);
  }
}

function parseChangeInput(input: HTMLInputElement, min: number, max: number, label: string): number {
  const raw = input.value.trim();
  if (!/^\d+$/.test(raw)) throw new Error(`${label}は整数で指定してください。`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${label}は${formatNumber(min)}～${formatNumber(max)}の範囲で指定してください。`);
  }
  return value;
}

function collectChanges(): PendingChanges {
  if (!selectedState) throw new Error('対象ユーザーを選択してください。');
  const changes: PendingChanges = { items: [], flowers: [] };
  const inputs = dashboard.querySelectorAll<HTMLInputElement>('input[data-change-key]');
  inputs.forEach(input => {
    const current = currentValueFor(input);
    if (current === undefined || input.value === String(current)) return;
    const [kind, id, field] = (input.dataset.changeKey ?? '').split(':');
    if (kind === 'coin') {
      changes.coin = parseChangeInput(input, 0, 2147483647, 'コイン数');
    } else if (kind === 'item') {
      changes.items.push({
        itemId: Number(id),
        quantity: parseChangeInput(input, 0, 2147483647, 'アイテム所持数'),
      });
    } else if (kind === 'flower') {
      const flowerId = Number(id);
      let change = changes.flowers.find(value => value.flowerId === flowerId);
      if (!change) {
        const flower = selectedState?.flowers.find(value => value.flowerId === flowerId);
        if (!flower) throw new Error('変更対象の花が見つかりません。画面を再読み込みしてください。');
        change = { flowerId, level: flower.level, skillLevel: flower.skillLevel };
        changes.flowers.push(change);
      }
      if (field === 'skillLevel') {
        change.skillLevel = parseChangeInput(input, 1, trainingRules.skill.thresholds.length, 'スキルレベル');
      } else {
        change.level = parseChangeInput(input, 1, trainingRules.maxLevel, '花レベル');
      }
    }
  });
  return changes;
}

async function saveChanges(): Promise<void> {
  if (busy || !selectedState) return;
  let changes: PendingChanges;
  try {
    changes = collectChanges();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '入力内容を確認してください。', true);
    return;
  }
  if (changes.coin === undefined && changes.items.length === 0 && changes.flowers.length === 0) return;

  setBusy(true);
  setStatus('変更を保存しています…');
  try {
    const result = await request({
      action: 'saveChanges',
      userId: selectedState.user.id,
      changes,
    });
    if (!result.state) throw new Error('更新結果を読み取れませんでした。');
    renderState(result.state);
    setStatus('変更を保存しました。');
    await loadHistory();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '変更を保存できませんでした。', true);
  } finally {
    setBusy(false);
    updateSaveButton();
  }
}

function historyDescription(entry: AdminHistory): string {
  const detail = entry.details;
  if (entry.action === 'saveChanges') {
    const descriptions: string[] = [];
    const coin = detail.coin as { before?: unknown; after?: unknown } | undefined;
    if (coin) descriptions.push(`コイン ${String(coin.before)} → ${String(coin.after)}`);
    const items = Array.isArray(detail.items) ? detail.items as Array<Record<string, unknown>> : [];
    items.forEach(itemChange => {
      const item = catalog.find(value => value.id === Number(itemChange.itemId));
      descriptions.push(`${item?.name ?? `アイテム ID ${String(itemChange.itemId)}`} ${String(itemChange.before)}個 → ${String(itemChange.after)}個`);
    });
    const flowers = Array.isArray(detail.flowers) ? detail.flowers as Array<Record<string, unknown>> : [];
    flowers.forEach(flowerChange => {
      const flower = formation.characters.find(value => value.id === Number(flowerChange.flowerId));
      descriptions.push(`${flower?.name ?? `花 ID ${String(flowerChange.flowerId)}`}：Lv.${String(flowerChange.levelBefore)} → Lv.${String(flowerChange.levelAfter)}／スキル Lv.${String(flowerChange.skillLevelBefore)} → Lv.${String(flowerChange.skillLevelAfter)}`);
    });
    return descriptions.join('、') || '変更なし';
  }
  if (entry.action === 'addCoin') {
    return `コイン ${String(detail.before)} → ${String(detail.after)}`;
  }
  if (entry.action === 'addItem') {
    const item = catalog.find(value => value.id === Number(detail.itemId));
    return `${item?.name ?? `アイテム ID ${String(detail.itemId)}`} ${String(detail.before)}個 → ${String(detail.after)}個`;
  }
  const flowerId = Number(detail.flowerId);
  const flower = formation.characters.find(value => value.id === flowerId);
  const flowerName = flower?.name ?? `花 ID ${String(detail.flowerId)}`;
  if (entry.action === 'addFlower') return `${flowerName}を所持花に追加`;
  if (entry.action === 'resetStage') {
    const stage = stages.find(value => value.id === Number(detail.stageId));
    return `${stage?.name ?? `ステージ ID ${String(detail.stageId)}`}のクリア記録をリセット`;
  }
  return JSON.stringify(detail);
}

function historyActionName(action: string): string {
  const labels: Record<string, string> = {
    addCoin: 'コイン追加',
    addItem: 'アイテム追加',
    addFlower: '花を追加',
    saveChanges: 'データを一括保存',
    resetStage: 'ステージクリア記録リセット',
  };
  return labels[action] ?? action;
}

async function loadHistory(): Promise<void> {
  historyRows.replaceChildren();
  const loadingRow = element('tr');
  const loadingCell = element('td', '読み込み中...');
  loadingCell.colSpan = 5;
  loadingRow.append(loadingCell);
  historyRows.append(loadingRow);
  setHistoryStatus('');
  try {
    const result = await request({ action: 'history' });
    if (!result.history) throw new Error('操作履歴の形式を読み取れませんでした。');
    historyRows.replaceChildren();
    if (result.history.length === 0) {
      const row = element('tr');
      const cell = element('td', '操作履歴はありません。');
      cell.colSpan = 5;
      row.append(cell);
      historyRows.append(row);
    } else {
      result.history.forEach(entry => {
        const row = element('tr');
        [
          entry.createdAt,
          entry.adminUserId === 0 ? entry.adminName : `#${entry.adminUserId} ${entry.adminName}`,
          `#${entry.targetUserId} ${entry.targetName}`,
          historyActionName(entry.action),
          historyDescription(entry),
        ].forEach(value => row.append(element('td', value)));
        historyRows.append(row);
      });
    }
    setHistoryStatus(`直近 ${result.history.length} 件を表示しています。`);
  } catch (error) {
    historyRows.replaceChildren();
    const row = element('tr');
    const cell = element('td', '操作履歴を表示できません。');
    cell.colSpan = 5;
    row.append(cell);
    historyRows.append(row);
    setHistoryStatus(error instanceof Error ? error.message : '操作履歴を読み込めませんでした。', true);
  }
}

function setBusy(next: boolean): void {
  busy = next;
  document.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = next; });
  document.querySelectorAll<HTMLSelectElement>('select').forEach(select => { select.disabled = next; });
  document.querySelectorAll<HTMLInputElement>('input').forEach(input => { input.disabled = next; });
  userSelect.disabled = next || allUsers.length === 0;
  renderStagesIfAvailable();
  renderPlayerCharacter();
  updateSaveButton();
}

function renderStagesIfAvailable(): void {
  if (selectedState) renderStages(selectedState);
}

async function submitAction(action: AdminAction, form: HTMLFormElement, stageId?: number): Promise<void> {
  if (busy || !userSelect.value) {
    if (!userSelect.value) setStatus('先に対象ユーザーを選択してください。', true);
    return;
  }

  const body: Record<string, unknown> = { action, userId: Number(userSelect.value) };
  let description = '';
  const data = new FormData(form);
  if (action === 'addItem') {
    const itemId = Number(data.get('itemId'));
    const quantity = Number(data.get('quantity'));
    if (!catalog.some(item => item.id === itemId)
      || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000) {
      setStatus('アイテムと追加数（1～1,000,000）を確認してください。', true);
      return;
    }
    body.itemId = itemId;
    body.quantity = quantity;
    description = `${catalog.find(item => item.id === itemId)?.name ?? 'アイテム'}を${quantity}個追加`;
  } else if (action === 'addFlower') {
    const flowerId = Number(data.get('flowerId'));
    if (!formation.characters.some(flower => flower.id === flowerId)) {
      setStatus('追加する花を選択してください。', true);
      return;
    }
    body.flowerId = flowerId;
    description = `${formation.characters.find(flower => flower.id === flowerId)?.name ?? '花'}を所持花に追加`;
  } else {
    if (!stageId || !stages.some(stage => stage.id === stageId)) return;
    body.stageId = stageId;
    description = `${stages.find(stage => stage.id === stageId)?.name ?? 'ステージ'}のクリア記録をリセット（再クリア時は報酬を再獲得できます）`;
  }

  setBusy(true);
  setStatus('DBを更新しています…');
  try {
    const result = await request(body);
    if (!result.state) throw new Error('更新結果を読み取れませんでした。');
    renderState(result.state);
    setStatus(action === 'addFlower' && !result.added
      ? 'この花はすでに所持花に登録されています。'
      : action === 'resetStage' && !result.reset
        ? 'このステージはクリア済みではありません。'
        : `${description}しました。`);
    if (action === 'addItem') {
      const quantityInput = form.querySelector<HTMLInputElement>('input[name="quantity"]');
      if (quantityInput) quantityInput.value = '1';
    }
    await loadHistory();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'データを更新できませんでした。', true);
  } finally {
    setBusy(false);
  }
}

userSelect.addEventListener('change', () => {
  void loadState();
});
userSearch.addEventListener('input', () => {
  const selectedId = selectedState?.user.id;
  renderUserOptions(selectedId === undefined ? userSelect.value : String(selectedId));
  if (selectedId !== undefined && userSelect.value !== String(selectedId)) {
    void loadState();
  }
});
requiredElement<HTMLButtonElement>('#refresh-users').addEventListener('click', () => {
  void loadUsers();
});
requiredElement<HTMLButtonElement>('#refresh-history').addEventListener('click', () => { void loadHistory(); });
saveButton.addEventListener('click', () => { void saveChanges(); });
maleCharacterButton.addEventListener('click', () => { void selectPlayerCharacter('male'); });
femaleCharacterButton.addEventListener('click', () => { void selectPlayerCharacter('female'); });
dashboard.addEventListener('input', event => {
  if ((event.target as HTMLElement).matches('input[data-change-key]')) updateSaveButton();
});
dashboard.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const stepButton = target.closest<HTMLButtonElement>('button[data-delta]');
  if (stepButton) {
    const input = stepButton.parentElement?.querySelector<HTMLInputElement>('input[data-change-key]');
    if (!input) return;
    const min = Number(input.min);
    const max = Number(input.max);
    const current = Number(input.value);
    const next = Math.min(max, Math.max(min, (Number.isSafeInteger(current) ? current : min) + Number(stepButton.dataset.delta)));
    input.value = String(next);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  const stageButton = target.closest<HTMLButtonElement>('button[data-stage-id]');
  if (stageButton) {
    const stageId = Number(stageButton.dataset.stageId);
    const form = document.createElement('form');
    void submitAction('resetStage', form, stageId);
  }
});
document.querySelectorAll<HTMLFormElement>('form[data-action]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const action = form.dataset.action;
    if (action === 'addItem' || action === 'addFlower') void submitAction(action, form);
  });
});

async function initializeAdminAccess(): Promise<void> {
  accessPanel.hidden = true;
  adminContent.hidden = true;
  setAccessStatus('localhost接続を確認しています…');
  try {
    await request({ action: 'adminStatus' });
    showAdminView();
  } catch (error) {
    accessPanel.hidden = false;
    setAccessStatus(error instanceof Error ? error.message : 'ローカル接続を確認できません。', true);
  }
}

void initializeAdminAccess();
