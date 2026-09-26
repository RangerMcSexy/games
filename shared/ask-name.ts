// "Who's playing?": asked once, the first time the games are opened on a
// device, so the title and cheers can use the child's name. Used by every
// game, and by the home page (scripts/build-site.mjs turns it into
// ask-name.js for it).
//
// The name lives only on this device, under one key every game reads.

const KEY = 'games.name';

/** The saved name, '' for "no name", or null if nobody has been asked yet. */
export function storedName(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    // Storage disabled: don't ask on every visit, just play without a name.
    return '';
  }
}

export function storeName(name: string) {
  try {
    localStorage.setItem(KEY, name.trim());
  } catch {
    // Storage disabled: the name lasts for this visit only.
  }
}

const CSS = `
.ask-name {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(90, 66, 114, 0.45);
  animation: askFade 0.3s ease-out;
}
.ask-card {
  width: min(460px, 100%);
  padding: 28px 24px 22px;
  border-radius: 28px;
  background: #fffaf0;
  border: 4px solid #fff;
  box-shadow: 0 10px 0 rgba(90, 66, 114, 0.18), 0 20px 40px rgba(90, 66, 114, 0.25);
  color: #5a4272;
  text-align: center;
  animation: askPop 0.4s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.ask-card h2 {
  margin: 0 0 4px;
  font-size: 34px;
  line-height: 1.1;
}
.ask-card p {
  margin: 0 0 18px;
  font-size: 16px;
  font-weight: 600;
  opacity: 0.8;
}
.ask-card input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 16px;
  border: 3px solid #e3d6f0;
  background: #fff;
  color: #5a4272;
  font: inherit;
  font-size: 26px;
  font-weight: 800;
  text-align: center;
  outline: none;
  user-select: text;
  -webkit-user-select: text;
}
.ask-card input:focus {
  border-color: #b58cff;
}
.ask-go {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  border: 0;
  border-radius: 999px;
  background: #7fcf6a;
  box-shadow: 0 6px 0 #5aa94a;
  color: #fff;
  font: inherit;
  font-size: 26px;
  font-weight: 800;
  cursor: pointer;
}
.ask-go:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #5aa94a;
}
.ask-skip {
  margin-top: 12px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  opacity: 0.7;
  text-decoration: underline;
  cursor: pointer;
}
@keyframes askFade {
  from { opacity: 0; }
}
@keyframes askPop {
  from { transform: scale(0.8); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .ask-name, .ask-card { animation: none; }
}
`;

/** Shows the card and resolves with the name typed ('' if skipped). */
export function askName(): Promise<string> {
  return new Promise((resolve) => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.append(style);

    const root = document.createElement('div');
    root.className = 'ask-name';
    root.innerHTML = `
      <form class="ask-card">
        <h2>Who’s playing?</h2>
        <p>Type the player’s name, and the games will cheer for them.</p>
        <input name="name" type="text" maxlength="20" autocomplete="off" autocapitalize="words" enterkeyhint="go" placeholder="Name" aria-label="Player’s name" />
        <button class="ask-go" type="submit">Let’s play!</button>
        <button class="ask-skip" type="button">Play without a name</button>
      </form>`;
    document.body.append(root);

    const form = root.querySelector('form')!;
    const input = form.querySelector('input')!;
    const done = (name: string) => {
      input.blur();
      storeName(name);
      root.remove();
      style.remove();
      resolve(name.trim());
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      done(input.value);
    });
    form.querySelector('.ask-skip')!.addEventListener('click', () => done(''));
    // Pointer handlers on the page must not swallow taps meant for the card.
    root.addEventListener('pointerdown', (e) => e.stopPropagation());
    setTimeout(() => input.focus(), 350);
  });
}
