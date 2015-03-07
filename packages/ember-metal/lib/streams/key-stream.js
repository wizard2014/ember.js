import Ember from 'ember-metal/core';

import merge from "ember-metal/merge";
import create from 'ember-metal/platform/create';
import { get } from "ember-metal/property_get";
import { set } from "ember-metal/property_set";
import {
  addObserver,
  removeObserver
} from "ember-metal/observer";
import Stream from "ember-metal/streams/stream";
import { isStream, read } from "ember-metal/streams/utils";

function KeyStream(source, key) {
  Ember.assert("KeyStream error: source must be a stream", isStream(source));
  Ember.assert("KeyStream error: key must be a non-empty string", typeof key === 'string' && key.length > 0);
  Ember.assert("KeyStream error: key must not have a '.'", key.indexOf('.') === -1);

  this.init();
  this.source = source;
  this.obj = undefined;
  this.key = key;
}

KeyStream.prototype = create(Stream.prototype);

merge(KeyStream.prototype, {
  compute() {
    if (this.obj) {
      return get(this.obj, this.key);
    }
  },

  becameActive() {
    if (this.obj && typeof this.obj === 'object') {
      addObserver(this.obj, this.key, this, this.notify);
    }

    if (nextObj) {
      return get(nextObj, this.key);
    }
  },

  setValue(value) {
    if (this.obj) {
      set(this.obj, this.key, value);
    }
  },

  setSource(nextSource) {
    Ember.assert("KeyStream error: source must be a stream", isStream(nextSource));

    var prevSource = this.source;

    if (nextSource !== prevSource) {
      this.update(function() {
        this.dependency.replace(nextSource);
        this.source = nextSource;
        this.obj = read(nextSource);
      });
    }

    this.notify();
  },

  _didChange: function() {
    this.notify();
  },

  _super$destroy: Stream.prototype.destroy,

  destroy() {
    if (this._super$destroy()) {
      if (isStream(this.source)) {
        this.source.unsubscribe(this._didChange, this);
      }

      if (this.obj && typeof this.obj === 'object') {
        removeObserver(this.obj, this.key, this, this._didChange);
      }

      this.source = undefined;
      this.obj = undefined;
      return true;
    }
  }
});

export default KeyStream;