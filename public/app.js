const feed = document.querySelector('#feed');
const statusText = document.querySelector('#status');
const refreshButton = document.querySelector('#refresh');
const updatedText = document.querySelector('#updated');
const accountsText = document.querySelector('#accounts');
const accountsList = document.querySelector('#accounts-list');
const accountForm = document.querySelector('#account-form');
const usernameInput = document.querySelector('#username');
const accountStatus = document.querySelector('#account-status');
let accountBusy = false;

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function makePost(post) {
  const article = document.createElement('article');
  article.className = 'post-card';
  const imageLink = document.createElement('a');
  imageLink.className = 'post-image-wrap';
  imageLink.href = post.url || '#';
  imageLink.target = '_blank';
  imageLink.rel = 'noreferrer';
  if (post.imageUrl) {
    const image = document.createElement('img');
    image.src = post.imageUrl;
    image.alt = `Image from @${post.username}'s Instagram post`;
    image.loading = 'lazy';
    imageLink.append(image);
  } else {
    imageLink.classList.add('image-placeholder');
    imageLink.textContent = post.videoUrl ? 'VIDEO' : 'POST';
  }
  const content = document.createElement('div');
  content.className = 'post-content';
  const meta = document.createElement('div');
  meta.className = 'post-meta';
  const account = document.createElement('a');
  account.className = 'account-link';
  account.href = `https://www.instagram.com/${encodeURIComponent(post.username)}/`;
  account.target = '_blank';
  account.rel = 'noreferrer';
  account.textContent = `@${post.username}`;
  const date = document.createElement('span');
  date.textContent = formatDate(post.timestamp);
  meta.append(account, date);

  const summary = document.createElement('p');
  summary.className = 'summary';
  summary.textContent = post.summary;
  content.append(meta, summary);

  if (post.caption) {
    const details = document.createElement('details');
    const more = document.createElement('summary');
    more.textContent = 'Original caption';
    const caption = document.createElement('p');
    caption.className = 'caption';
    caption.textContent = post.caption;
    details.append(more, caption);
    content.append(details);
  }
  const source = document.createElement('a');
  source.className = 'source-link';
  source.href = post.url || `https://www.instagram.com/${encodeURIComponent(post.username)}/`;
  source.target = '_blank';
  source.rel = 'noreferrer';
  source.textContent = 'View on Instagram ↗';
  content.append(source);
  article.append(content, imageLink);
  return article;
}

function render(data) {
  feed.replaceChildren();
  if (data.items.length) {
    data.items.forEach((post) => feed.append(makePost(post)));
  } else {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const mark = document.createElement('span');
    mark.className = 'empty-mark';
    mark.textContent = '✳';
    const heading = document.createElement('h3');
    heading.textContent = 'A fresh start.';
    const copy = document.createElement('p');
    copy.textContent = 'Refresh to gather the latest public posts. Gemma will turn each one into a quick catch-up.';
    empty.append(mark, heading, copy);
    feed.append(empty);
  }
  updatedText.textContent = data.lastUpdated ? `Updated ${formatDate(data.lastUpdated)}` : '';
  accountsText.textContent = `${data.handles.length} public ${data.handles.length === 1 ? 'account' : 'accounts'} · daily at ${data.dailyAt} ${data.timeZone}`;
  accountsList.replaceChildren();
  for (const handle of data.handles) {
    const item = document.createElement('li');
    item.className = 'account-chip';
    const name = document.createElement('span');
    name.textContent = `@${handle}`;
    const remove = document.createElement('button');
    remove.className = 'remove-account';
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove @${handle}`);
    remove.disabled = accountBusy;
    remove.addEventListener('click', () => changeAccount('remove', handle));
    item.append(name, remove);
    accountsList.append(item);
  }
  usernameInput.disabled = accountBusy;
  accountForm.querySelector('button[type="submit"]').disabled = accountBusy;
  refreshButton.disabled = data.refreshing;
  refreshButton.innerHTML = data.refreshing ? '<span class="spin" aria-hidden="true">↻</span> Reading posts…' : '<span aria-hidden="true">↻</span> Refresh feed';
  if (data.refreshing) statusText.textContent = 'Gemma is catching up…';
  else if (data.lastError) statusText.textContent = `Refresh failed: ${data.lastError}`;
  else if (data.lastUpdated) statusText.textContent = 'You’re all caught up.';
  else statusText.textContent = 'Ready when you are.';
}

async function changeAccount(action, username) {
  if (accountBusy) return;
  accountBusy = true;
  accountStatus.textContent = action === 'add' ? 'Adding account…' : 'Removing account…';
  try {
    const response = await fetch('/api/accounts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, username }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not update accounts.');
    if (action === 'add') usernameInput.value = '';
    accountStatus.textContent = 'Saved on this computer.';
    await loadFeed();
  } catch (error) {
    accountStatus.textContent = error.message;
  } finally {
    accountBusy = false;
    usernameInput.disabled = false;
    accountForm.querySelector('button[type="submit"]').disabled = false;
    accountsList.querySelectorAll('button').forEach((button) => { button.disabled = false; });
  }
}

accountForm.addEventListener('submit', (event) => {
  event.preventDefault();
  changeAccount('add', usernameInput.value.trim());
});

async function loadFeed() {
  const response = await fetch('/api/feed', { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load your feed.');
  const data = await response.json();
  render(data);
  if (data.refreshing) setTimeout(loadFeed, 2000);
}

refreshButton.addEventListener('click', async () => {
  refreshButton.disabled = true;
  statusText.textContent = 'Gathering new public posts…';
  try {
    const response = await fetch('/api/refresh', { method: 'POST' });
    if (!response.ok && response.status !== 409) throw new Error((await response.json()).error || 'Could not start a refresh.');
    await loadFeed();
  } catch (error) {
    statusText.textContent = error.message;
    refreshButton.disabled = false;
  }
});

loadFeed().catch((error) => { statusText.textContent = error.message; });
