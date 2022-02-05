export default class Popup {
  constructor(title) {
    this._popupDiv = null;
    this._popupBg = null; // Background element which blocks interactions to page
    this._title = title;
  }
  static popupsOpen() { return Popup._openPopups.length; }
  /** Get top-most popup */
  static getTopmostPopup() { return Popup._openPopups.length == 0 ? undefined : Popup._openPopups[Popup._openPopups.length - 1]; }
  getTitle() { return this._title; }
  setTitle(title) {
    this._title = title.toString();
    return this;
  }
  /** Get this popup's body */
  getContent() { return this._htmlContent; }
  /** Set this popup's body */
  setContent(content) {
    this._htmlContent = content;
    return this;
  }
  /** Insert an element into the popup's body */
  insertAdjacentElement(position, child) {
    if (!this._htmlContent)
      this._htmlContent = document.createElement('div');
    this._htmlContent.insertAdjacentElement(position, child);
    return this;
  }
  /** Insert HTML into the popup's body */
  insertAdjacentHTML(position, html) {
    if (!this._htmlContent)
      this._htmlContent = document.createElement('div');
    this._htmlContent.insertAdjacentHTML(position, html);
    return this;
  }
  /** Insert text into the popup's body */
  insertAdjacentText(position, text) {
    if (!this._htmlContent)
      this._htmlContent = document.createElement('div');
    this._htmlContent.insertAdjacentText(position, text);
    return this;
  }
  /** Function which executes just before popup is closed. Return <false> to cancel closure. */
  setCloseCallback(callback) {
    this._onCloseCallback = callback;
    return this;
  }
  /** Is the popup currently open? */
  isOpen() {
    return this._popupDiv !== null;
  }
  /** Show this popup (append to document) */
  show() {
    if (!this.isOpen()) {
      // Create backdrop
      this._popupBg = document.createElement("div");
      this._popupBg.classList.add("popup-bg");
      this._popupBg.addEventListener('click', () => {
        let close = typeof this._onCloseCallback == 'function' ? this._onCloseCallback(this) !== false : true;
        if (close)
          this.hide();
      });
      document.body.insertAdjacentElement('beforeend', this._popupBg);
      // Create popups
      let container = document.createElement('div');
      container.classList.add("popup-container");
      this._popupDiv = container;
      let body = document.createElement("div");
      body.classList.add("popup-body");
      container.appendChild(body);
      body.insertAdjacentHTML('beforeend', `<h2>${this._title}</h2>`);
      if (this._htmlContent == undefined)
        this._htmlContent = document.createElement('div');
      this._htmlContent.classList.add('popup-dynamic-content');
      body.insertAdjacentElement('beforeend', this._htmlContent);
      let btn = document.createElement('button');
      btn.classList.add('popup-close');
      btn.innerText = 'Close';
      btn.addEventListener('click', () => {
        let close = typeof this._onCloseCallback == 'function' ? this._onCloseCallback(this) !== false : true;
        if (close)
          this.hide();
      });
      body.insertAdjacentHTML('beforeend', '<br>');
      body.insertAdjacentElement('beforeend', btn);
      document.body.insertAdjacentElement('beforeend', container);
      Popup._openPopups.push(this);
      return this;
    }
  }
  /** Hide this popup (if open) */
  hide() {
    if (this.isOpen()) {
      this._popupDiv.remove();
      this._popupDiv = null;
      let i = Popup._openPopups.indexOf(this);
      Popup._openPopups.splice(i, 1);
      this._popupBg.remove();
      this._popupBg = null;
    }
    return this;
  }
}
Popup._openPopups = [];