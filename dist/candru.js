var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

window.Candru = (function() {
  var addClass, extend, hasClass, readableFileSize, removeClass;

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
      uploadSuccessClass: 'done',
      uploadFailedClass: 'failed',
      uploadCancelledClass: 'cancelled',
      allowedTypes: [/^image\//, /^video\//],
      maxFileSize: 4294967296,
      evaporate: null,
      sanitizeFilename: this.sanitizeFilename,
      overHandler: this.overHandler,
      leaveHandler: this.leaveHandler,
      dropHandler: this.dropHandler,
      getMeterEl: this.getMeterEl,
      getCancelEl: this.getCancelEl,
      uploadHandler: this.uploadHandler,
      uploadComplete: this.uploadComplete,
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
      throw new Error('Could not find element for uploader.');
    }
    this.init();
  }

  Candru.prototype.init = function() {
    this.el.addEventListener('dragover', this.defaults.overHandler);
    this.el.addEventListener('dragleave', this.defaults.leaveHandler);
    return this.el.addEventListener('drop', this.defaults.dropHandler);
  };

  Candru.prototype.overHandler = function(e) {
    e.preventDefault();
    e.stopPropagation();
    addClass(this.el, this.defaults.overClass);
    return false;
  };

  Candru.prototype.leaveHandler = function(e) {
    e.preventDefault();
    e.stopPropagation();
    removeClass(this.el, this.defaults.overClass);
    return false;
  };

  Candru.prototype.fileTypeCheck = function(file) {
    var acceptedType, i, len, ref, type;
    acceptedType = false;
    ref = this.defaults.allowedTypes;
    for (i = 0, len = ref.length; i < len; i++) {
      type = ref[i];
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
    return file.name.replace(spacesRe, '_').replace(illegalRe, replacement).replace(controlRe, replacement).replace(reservedRe, replacement).replace(windowsReservedRe, replacement);
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
    uploadItem.innerHTML = "<span class='cancel left'><a href='#'>&cross;</a></span><span class='filename left'><label>File:</label>" + file.name + "</span><span class='filesize left'><label>Size:</label>" + (readableFileSize(file.size)) + "</span><div class='candru-progress right'><span class='meter'></span></div>";
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
    var file, files, i, len, uploadItem;
    e.preventDefault();
    e.stopPropagation();
    removeClass(this.el, this.defaults.overClass);
    files = e.dataTransfer.files;
    for (i = 0, len = files.length; i < len; i++) {
      file = files[i];
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
      if (this.defaults.queue) {
        this._fileQueue.push({
          file: file,
          index: this._index,
          state: 'unprocessed'
        });
      } else {
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
    return evap.add({
      name: this.defaults.sanitizeFilename(file),
      file: file,
      complete: (function(_this) {
        return function() {
          return _this.defaults.uploadComplete(file, index);
        };
      })(this),
      progress: (function(_this) {
        return function(progress) {
          return _this.defaults.uploadProgress(progress, file, index);
        };
      })(this),
      info: (function(_this) {
        return function(message) {
          return _this.defaults.uploadInfo(message, file, index);
        };
      })(this),
      warn: (function(_this) {
        return function(message) {
          return _this.defaults.uploadWarn(message, file, index);
        };
      })(this),
      error: (function(_this) {
        return function(message) {
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
    return addClass(cancelEl.querySelector('a'), 'hidden');
  };

  Candru.prototype.uploadProgress = function(progress, file, index) {
    var uploadMeter;
    uploadMeter = this.defaults.getMeterEl(index);
    return uploadMeter.style.width = (progress * 100.0) + "%";
  };

  Candru.prototype.uploadCancel = function(file, index) {
    var cancelEl, evap, i, len, queuedFile, ref, uploadMeter;
    this._cancelled++;
    if (!this.defaults.evaporate) {
      throw new Error('Evaporate instance is null.');
    }
    evap = this.defaults.evaporate;
    uploadMeter = this.defaults.getMeterEl(index);
    addClass(uploadMeter, this.defaults.uploadCancelledClass);
    uploadMeter.style.width = '100%';
    cancelEl = this.defaults.getCancelEl(index);
    addClass(cancelEl.querySelector('a'), 'hidden');
    if (this.defaults.queue) {
      ref = this._fileQueue;
      for (i = 0, len = ref.length; i < len; i++) {
        queuedFile = ref[i];
        if (queuedFile.index === index) {
          queuedFile.state = 'cancelled';
        }
      }
    }
    return evap.cancel(index);
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
    var i, len, queuedFile, ref, results;
    if (!this.defaults.queue) {
      return false;
    }
    ref = this._fileQueue;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      queuedFile = ref[i];
      if (queuedFile.state === 'unprocessed') {
        this.defaults.uploadHandler(queuedFile.file, queuedFile.index);
        results.push(queuedFile.state = 'processed');
      } else {

      }
    }
    return results;
  };

  Candru.prototype.cancelAll = function() {
    var cancelTriggers, i, j, len, len1, queuedFile, ref, results, trigger;
    cancelTriggers = this.el.querySelectorAll(this.defaults.cancelSelector + ' a');
    for (i = 0, len = cancelTriggers.length; i < len; i++) {
      trigger = cancelTriggers[i];
      console.log(trigger, hasClass(trigger, 'hidden'));
      if (!hasClass(trigger, 'hidden')) {
        trigger.click();
      }
    }
    if (this.defaults.queue) {
      ref = this._fileQueue;
      results = [];
      for (j = 0, len1 = ref.length; j < len1; j++) {
        queuedFile = ref[j];
        if (queuedFile.state === 'unprocessed') {
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

})();
