var Emitter, noop,
  slice = [].slice,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

noop = function() {};

Emitter = (function() {
  function Emitter() {}

  Emitter.prototype.addEventListener = Emitter.prototype.on;

  Emitter.prototype.on = function(event, fn) {
    this._callbacks = this._callbacks || {};
    if (!this._callbacks[event]) {
      this._callbacks[event] = [];
    }
    this._callbacks[event].push(fn);
    return this;
  };

  Emitter.prototype.emit = function() {
    var args, callback, callbacks, event, j, len;
    event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    this._callbacks = this._callbacks || {};
    callbacks = this._callbacks[event];
    if (callbacks) {
      for (j = 0, len = callbacks.length; j < len; j++) {
        callback = callbacks[j];
        callback.apply(this, args);
      }
    }
    return this;
  };

  Emitter.prototype.removeListener = Emitter.prototype.off;

  Emitter.prototype.removeAllListeners = Emitter.prototype.off;

  Emitter.prototype.removeEventListener = Emitter.prototype.off;

  Emitter.prototype.off = function(event, fn) {
    var callback, callbacks, i, j, len;
    if (!this._callbacks || arguments.length === 0) {
      this._callbacks = {};
      return this;
    }
    callbacks = this._callbacks[event];
    if (!callbacks) {
      return this;
    }
    if (arguments.length === 1) {
      delete this._callbacks[event];
      return this;
    }
    for (i = j = 0, len = callbacks.length; j < len; i = ++j) {
      callback = callbacks[i];
      if (callback === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    return this;
  };

  return Emitter;

})();

window.Candru = (function(superClass) {
  var addClass, extend, hasClass, readableFileSize, removeClass;

  extend1(Candru, superClass);

  extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };

  addClass = function(el, className) {
    if (el.classList) {
      return el.classList.add(className);
    } else {
      return el.className += ' ' + className;
    }
  };

  removeClass = function(el, className) {
    if (el.classList) {
      return el.classList.remove(className);
    } else {
      return el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  };

  hasClass = function(el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    } else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }
  };

  readableFileSize = function(bytes) {
    var e;
    if (bytes === 0) {
      return "0.00 B";
    }
    e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + ' ' + ' KMGTP'.charAt(e) + 'B';
  };

  function Candru(el, options) {
    var defaults;
    if (options == null) {
      options = {};
    }
    this.cancelAll = bind(this.cancelAll, this);
    this.processQueue = bind(this.processQueue, this);
    this.uploadError = bind(this.uploadError, this);
    this.uploadWarn = bind(this.uploadWarn, this);
    this.uploadInfo = bind(this.uploadInfo, this);
    this.uploadCancel = bind(this.uploadCancel, this);
    this.uploadProgress = bind(this.uploadProgress, this);
    this.uploadComplete = bind(this.uploadComplete, this);
    this.uploadHandler = bind(this.uploadHandler, this);
    this.dropHandler = bind(this.dropHandler, this);
    this.createUploadItem = bind(this.createUploadItem, this);
    this.getCancelEl = bind(this.getCancelEl, this);
    this.getMeterEl = bind(this.getMeterEl, this);
    this.leaveHandler = bind(this.leaveHandler, this);
    this.overHandler = bind(this.overHandler, this);
    defaults = {
      debug: false,
      queue: false,
      overClass: 'candru-over',
      cancelSelector: '.cancel',
      fileInputSelector: 'input[type="file"]',
      emptyTextSelector: '.empty-text',
      uploadSuccessClass: 'done',
      uploadFailedClass: 'failed',
      uploadCancelledClass: 'cancelled',
      allowedTypes: [/^image\//, /^video\//],
      maxFileSize: 4294967296,
      evaporate: null,
      sanitizeFilename: this.sanitizeFilename,
      renameFile: this.renameFile,
      overHandler: this.overHandler,
      leaveHandler: this.leaveHandler,
      dropHandler: this.dropHandler,
      getMeterEl: this.getMeterEl,
      getCancelEl: this.getCancelEl,
      uploadHandler: this.uploadHandler,
      uploadComplete: this.uploadComplete,
      uploadStartCallback: noop,
      uploadCompleteCallback: noop,
      uploadProgress: this.uploadProgress,
      uploadCancel: this.uploadCancel,
      uploadInfo: this.uploadInfo,
      uploadWarn: this.uploadWarn,
      uploadError: this.uploadError,
      createUploadItem: this.createUploadItem
    };
    this._index = 0;
    this._complete = 0;
    this._cancelled = 0;
    this._failed = 0;
    this._fileQueue = [];
    this.defaults = extend(defaults, options);
    this.el = window.document.querySelector(el);
    if (!this.el) {
      console.log('Could not find element for uploader.');
      return;
    }
    this.init();
  }

  Candru.prototype.init = function() {
    var fileInput;
    this.el.addEventListener('dragover', this.defaults.overHandler);
    this.el.addEventListener('dragleave', this.defaults.leaveHandler);
    this.el.addEventListener('drop', this.defaults.dropHandler);
    fileInput = this.el.querySelector(this.defaults.fileInputSelector);
    if (fileInput != null) {
      return fileInput.addEventListener('change', this.defaults.dropHandler);
    }
  };

  Candru.prototype.overHandler = function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.emit('candru-dragover', e);
    addClass(this.el, this.defaults.overClass);
    return false;
  };

  Candru.prototype.leaveHandler = function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.emit('candru-dragleave', e);
    removeClass(this.el, this.defaults.overClass);
    return false;
  };

  Candru.prototype.fileTypeCheck = function(file) {
    var acceptedType, j, len, ref, type;
    acceptedType = false;
    ref = this.defaults.allowedTypes;
    for (j = 0, len = ref.length; j < len; j++) {
      type = ref[j];
      if (type.test(file.type)) {
        acceptedType = true;
        break;
      }
    }
    return acceptedType;
  };

  Candru.prototype.fileSizeCheck = function(file) {
    if (file.size > this.defaults.maxFileSize) {
      return false;
    } else {
      return true;
    }
  };

  Candru.prototype.sanitizeFilename = function(file) {
    var controlRe, illegalRe, replacement, reservedRe, spacesRe, windowsReservedRe;
    spacesRe = /\ /g;
    illegalRe = /[\/\?<>\\:\*\|":]/g;
    controlRe = /[\x00-\x1f\x80-\x9f]/g;
    reservedRe = /^\.+$/;
    windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    replacement = '';
    return file.name.toLowerCase().replace(spacesRe, '_').replace(illegalRe, replacement).replace(controlRe, replacement).replace(reservedRe, replacement).replace(windowsReservedRe, replacement);
  };

  Candru.prototype.renameFile = function(file) {
    return file.name;
  };

  Candru.prototype.getMeterEl = function(index) {
    var uploadMeterSelector;
    uploadMeterSelector = ".candru [data-upload-id=\"" + index + "\"] .meter";
    return this.el.querySelector(uploadMeterSelector);
  };

  Candru.prototype.getCancelEl = function(index) {
    var uploadMeterSelector;
    uploadMeterSelector = ".candru [data-upload-id=\"" + index + "\"] .cancel";
    return this.el.querySelector(uploadMeterSelector);
  };

  Candru.prototype.createUploadItem = function(file, index) {
    var uploadItem;
    uploadItem = document.createElement('div');
    uploadItem.className = 'candru-upload clearfix';
    uploadItem.dataset.uploadId = index;
    uploadItem.innerHTML = "<button class='cancel left tiny'>Cancel</button>\n<span class='filename left'>\n  <label>\n      File:\n  </label>\n  " + file.name + "\n</span>\n<span class='filesize left'>\n  <label>\n      Size:\n  </label>\n  " + (readableFileSize(file.size)) + "\n</span>\n<div class='candru-progress right'>\n  <span class='meter'></span>\n</div>";
    uploadItem.querySelector(this.defaults.cancelSelector).addEventListener('click', (function(_this) {
      return function(e) {
        return (function(index) {
          return _this.defaults.uploadCancel(file, index);
        })(index);
      };
    })(this));
    return uploadItem;
  };

  Candru.prototype.dropHandler = function(e) {
    var emptyText, file, files, j, len, uploadItem;
    e.preventDefault();
    e.stopPropagation();
    this.emit('candru-drop', e);
    removeClass(this.el, this.defaults.overClass);
    emptyText = this.el.querySelector(this.defaults.emptyTextSelector);
    if (emptyText != null) {
      emptyText.parentNode.removeChild(emptyText);
    }
    files = (function() {
      if (e.dataTransfer != null) {
        return e.dataTransfer.files;
      } else if (e.currentTarget) {
        return e.currentTarget.files;
      } else {
        throw new Error('Could not find the files');
      }
    })();
    for (j = 0, len = files.length; j < len; j++) {
      file = files[j];
      if (!this.fileTypeCheck(file)) {
        console.log('Skipping file of type: ', file.type);
        continue;
      }
      if (!this.fileSizeCheck(file)) {
        console.log('Skipping file of size: ', file.size);
        continue;
      }
      uploadItem = this.defaults.createUploadItem(file, this._index);
      this.el.appendChild(uploadItem);
      file.uniqueId = Math.random().toString(36).substr(2, 16);
      file.sanitizedFileName = this.defaults.sanitizeFilename(file);
      file.uploadName = this.defaults.renameFile(file);
      if (this.defaults.queue) {
        this.emit('candru-queue-add', file, this._index, 'unprocessed');
        this._fileQueue.push({
          file: file,
          index: this._index,
          state: 'unprocessed'
        });
      } else {
        this.emit('candru-process', file, this._index);
        this.defaults.uploadHandler(file, this._index);
      }
      this._index++;
    }
    return false;
  };

  Candru.prototype.uploadHandler = function(file, index) {
    var evap;
    if (!this.defaults.evaporate) {
      throw new Error('Evaporate instance is null.');
    }
    evap = this.defaults.evaporate;
    this.defaults.uploadStartCallback(file, index, this.allFilesFinished());
    return evap.add({
      name: file.uploadName,
      file: file,
      complete: (function(_this) {
        return function(response) {
          var url;
          url = response.responseURL;
          file.awsPath = url.substr(0, url.lastIndexOf('?')).replace(/%2F/g, '/');
          _this.emit('candru-evaporate-complete', file, index);
          return _this.defaults.uploadComplete(file, index);
        };
      })(this),
      progress: (function(_this) {
        return function(progress) {
          _this.emit('candru-evaporate-complete', progress, file, index);
          return _this.defaults.uploadProgress(progress, file, index);
        };
      })(this),
      info: (function(_this) {
        return function(message) {
          _this.emit('candru-evaporate-info', message, file, index);
          return _this.defaults.uploadInfo(message, file, index);
        };
      })(this),
      warn: (function(_this) {
        return function(message) {
          _this.emit('candru-evaporate-warn', message, file, index);
          return _this.defaults.uploadWarn(message, file, index);
        };
      })(this),
      error: (function(_this) {
        return function(message) {
          _this.emit('candru-evaporate-error', message, file, index);
          return _this.defaults.uploadError(message, file, index);
        };
      })(this)
    });
  };

  Candru.prototype.uploadComplete = function(file, index) {
    var cancelEl, uploadMeter;
    this._complete++;
    uploadMeter = this.defaults.getMeterEl(index);
    uploadMeter.style.width = '100%';
    addClass(uploadMeter, this.defaults.uploadSuccessClass);
    cancelEl = this.defaults.getCancelEl(index);
    addClass(cancelEl, 'disabled');
    return this.defaults.uploadCompleteCallback(file, index, this.allFilesFinished());
  };

  Candru.prototype.uploadProgress = function(progress, file, index) {
    var uploadMeter;
    uploadMeter = this.defaults.getMeterEl(index);
    return uploadMeter.style.width = (progress * 100.0) + "%";
  };

  Candru.prototype.uploadCancel = function(file, index) {
    var cancelEl, evap, j, len, queuedFile, ref, uploadMeter;
    cancelEl = this.defaults.getCancelEl(index);
    if (!hasClass(cancelEl, 'disabled')) {
      this._cancelled++;
      if (!this.defaults.evaporate) {
        throw new Error('Evaporate instance is null.');
      }
      evap = this.defaults.evaporate;
      uploadMeter = this.defaults.getMeterEl(index);
      addClass(uploadMeter, this.defaults.uploadCancelledClass);
      uploadMeter.style.width = '100%';
      cancelEl = this.defaults.getCancelEl(index);
      addClass(cancelEl, 'disabled');
      if (this.defaults.queue) {
        ref = this._fileQueue;
        for (j = 0, len = ref.length; j < len; j++) {
          queuedFile = ref[j];
          if (queuedFile.index === index) {
            queuedFile.state = 'cancelled';
          }
        }
      }
      return evap.cancel(index);
    }
  };

  Candru.prototype.uploadInfo = function(message, file, index) {
    if (this.defaults.debug) {
      return console.log('INFO: File:', file, 'Index:', index, 'Message:', message);
    }
  };

  Candru.prototype.uploadWarn = function(message, file, index) {
    if (this.defaults.debug) {
      return console.log('WARN: File:', file, 'Index:', index, 'Message:', message);
    }
  };

  Candru.prototype.uploadError = function(message, file, index) {
    var uploadMeter;
    if (this.defaults.debug) {
      console.log('ERROR: File:', file, 'Index:', index, 'Message:', message);
    }
    this._failed++;
    uploadMeter = this.getMeterEl(index);
    return addClass(uploadMeter, this.defaults.uploadFailedClass);
  };

  Candru.prototype.processQueue = function() {
    var j, len, queuedFile, ref, results;
    if (!this.defaults.queue) {
      return false;
    }
    ref = this._fileQueue;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      queuedFile = ref[j];
      if (queuedFile.state === 'unprocessed') {
        this.defaults.uploadHandler(queuedFile.file, queuedFile.index);
        results.push(queuedFile.state = 'processed');
      } else {

      }
    }
    return results;
  };

  Candru.prototype.cancelAll = function() {
    var cancelTriggers, j, k, len, len1, queuedFile, ref, results, trigger;
    cancelTriggers = this.el.querySelectorAll(this.defaults.cancelSelector);
    for (j = 0, len = cancelTriggers.length; j < len; j++) {
      trigger = cancelTriggers[j];
      if (!hasClass(trigger, 'disabled')) {
        trigger.click();
      }
    }
    if (this.defaults.queue) {
      ref = this._fileQueue;
      results = [];
      for (k = 0, len1 = ref.length; k < len1; k++) {
        queuedFile = ref[k];
        if (queuedFile.state === 'unprocessed') {
          this.emit('candru-queue-cancelled', queuedFile.file, queuedFile.index, 'cancelled');
          results.push(queuedFile.state = 'cancelled');
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  Candru.prototype.getFileCount = function() {
    return this._index;
  };

  Candru.prototype.allFilesFinished = function() {
    return this._index === (this._complete + this._failed + this._cancelled);
  };

  return Candru;

})(Emitter);
