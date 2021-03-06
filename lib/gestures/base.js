'use strict';

const {Emitter} = require('atom');

module.exports = class BaseGesture {
  constructor(editor, options) {
    this.editor = editor;
    this.buffer = editor.getBuffer();
    this.editorElement = atom.views.getView(editor);
    this.options = options || {};
    this.emitter = new Emitter();
  }

  dispose() {
    this.emitter.dispose();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  isActive() {
    return this.active;
  }

  activate(data) {
    if (this.active) { this.deactivate(); }

    this.active = true;
    if (!this.paused) {
      this.emitter.emit('did-activate', data);
    }
  }

  deactivate(data) {
    if (!this.active) { return; }

    this.active = false;
    if (!this.paused) { this.emitter.emit('did-deactivate', data); }
  }

  onDidActivate(listener) {
    return this.emitter.on('did-activate', listener);
  }

  onDidDeactivate(listener) {
    return this.emitter.on('did-deactivate', listener);
  }
};
