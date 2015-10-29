class window.Candru
  # Define a couple of useful helpers
  extend = (object, properties) ->
    for key, val of properties
      object[key] = val

    object

  addClass = (el, className) ->
    if (el.classList)
      el.classList.add(className)
    else
      el.className += ' ' + className

  removeClass = (el, className) ->
    if (el.classList)
      el.classList.remove(className)
    else
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')

  readableFileSize = (bytes) ->
    if bytes == 0
      return "0.00 B"

    e = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes/Math.pow(1024, e)).toFixed(2)+' '+' KMGTP'.charAt(e)+'B'

  constructor: (el, options = {}) ->
    defaults = {
      debug                 : false,
      overClass             : 'candru-over',
      cancelSelector        : '.cancel',
      uploadSuccessClass    : 'done',
      uploadFailedClass     : 'failed',
      uploadCancelledClass  : 'cancelled',
      allowedTypes          : [/^image\//, /^video\//], # array of regex
      maxFileSize           : 4294967296, # in bytes
      evaporate             : null,
      sanitizeFilename      : this.sanitizeFilename,
      overHandler           : this.overHandler,
      leaveHandler          : this.leaveHandler,
      dropHandler           : this.dropHandler,
      getMeterEl            : this.getMeterEl,
      getCancelEl           : this.getCancelEl,
      uploadHandler         : this.uploadHandler,
      uploadComplete        : this.uploadComplete,
      uploadProgress        : this.uploadProgress,
      uploadCancel          : this.uploadCancel,
      uploadInfo            : this.uploadInfo,
      uploadWarn            : this.uploadWarn,
      uploadError           : this.uploadError,
      createUploadItem      : this.createUploadItem
    }

    this._index = 0 # Keeps track of how many files we've uploaded
    this._complete = 0
    this._cancelled = 0
    this._failed = 0

    this.defaults = extend(defaults, options)
    this.el = window.document.querySelector(el)
    throw new Error('Could not find element for uploader.') unless this.el

    this.init()

  init: ->
    this.el.addEventListener('dragover', this.defaults.overHandler)
    this.el.addEventListener('dragleave', this.defaults.leaveHandler)
    this.el.addEventListener('drop', this.defaults.dropHandler)

  overHandler: (e) =>
    e.preventDefault()
    e.stopPropagation()

    addClass(this.el, this.defaults.overClass)

    false

  leaveHandler: (e) =>
    e.preventDefault()
    e.stopPropagation()

    removeClass(this.el, this.defaults.overClass)

    false

  fileTypeCheck: (file) ->
    acceptedType = false

    for type in this.defaults.allowedTypes
      if type.test(file.type)
        acceptedType = true
        break

    return acceptedType

  fileSizeCheck: (file) ->
    if file.size > this.defaults.maxFileSize
      false
    else
      true

  sanitizeFilename: (file) ->
    # Taken from https://github.com/parshap/node-sanitize-filename
    spacesRe = /\ /g
    illegalRe = /[\/\?<>\\:\*\|":]/g
    controlRe = /[\x00-\x1f\x80-\x9f]/g
    reservedRe = /^\.+$/
    windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i
    replacement = ''

    return file.name
      .replace(spacesRe, '_')
      .replace(illegalRe, replacement)
      .replace(controlRe, replacement)
      .replace(reservedRe, replacement)
      .replace(windowsReservedRe, replacement)

  getMeterEl: (index) =>
    uploadMeterSelector = ".candru [data-upload-id=\"#{index}\"] .meter"
    return this.el.querySelector(uploadMeterSelector)

  getCancelEl: (index) =>
    uploadMeterSelector = ".candru [data-upload-id=\"#{index}\"] .cancel"
    return this.el.querySelector(uploadMeterSelector)

  createUploadItem: (file, index) =>
    uploadItem = document.createElement('div')
    uploadItem.className = 'candru-upload clearfix'
    uploadItem.dataset.uploadId = index
    uploadItem.innerHTML = "\
      <span class='cancel left'>\
        <a href='#'>&cross;</a>\
      </span>\
      <span class='filename left'>\
        <label>\
            File:\
        </label>\
        #{file.name}\
      </span>\
      <span class='filesize left'>\
        <label>\
            Size:\
        </label>\
        #{readableFileSize(file.size)}\
      </span>\
      <div class='candru-progress right'>\
        <span class='meter'></span>\
      </div>"

    uploadItem.querySelector(this.defaults.cancelSelector).addEventListener('click', (e) =>
      ((index) =>
        this.defaults.uploadCancel(file, index)
      )(index))

    return uploadItem

  dropHandler: (e) =>
    e.preventDefault()
    e.stopPropagation()

    removeClass(this.el, this.defaults.overClass)

    files = e.dataTransfer.files
    for file in files
      if not this.fileTypeCheck(file)
        console.log('Skipping file of type: ', file.type)
        continue

      if not this.fileSizeCheck(file)
        console.log('Skipping file of size: ', file.size)
        continue

      uploadItem = this.defaults.createUploadItem(file, this._index)
      this.el.appendChild(uploadItem)

      this.defaults.uploadHandler(file, this._index)
      this._index++

    false

  uploadHandler: (file, index) =>
    throw new Error('Evaporate instance is null.') unless this.defaults.evaporate
    evap = this.defaults.evaporate

    evap.add({
      name: this.defaults.sanitizeFilename(file),
      file: file,
      complete: =>
        this.defaults.uploadComplete(file, index)
      progress: (progress) =>
        this.defaults.uploadProgress(progress, file, index)
      info: (message) =>
        this.defaults.uploadInfo(message, file, index)
      warn: (message) =>
        this.defaults.uploadWarn(message, file, index)
      error: (message) =>
        this.defaults.uploadError(message, file, index)
    })

  uploadComplete: (file, index) =>
    this._complete++

    uploadMeter = this.defaults.getMeterEl(index)
    uploadMeter.style.width = '100%' # Sometimes it goes so fast it doesn't get progress before it finishes
    addClass(uploadMeter, this.defaults.uploadSuccessClass)

    cancelEl = this.defaults.getCancelEl(index)
    addClass(cancelEl.querySelector('a'), 'hidden')

  uploadProgress: (progress, file, index) =>
    uploadMeter = this.defaults.getMeterEl(index)
    uploadMeter.style.width = "#{progress * 100.0}%"

  uploadCancel: (file, index) =>
    this._cancelled++

    throw new Error('Evaporate instance is null.') unless this.defaults.evaporate
    evap = this.defaults.evaporate

    uploadMeter = this.defaults.getMeterEl(index)
    addClass(uploadMeter, this.defaults.uploadCancelledClass)
    uploadMeter.style.width = '100%'

    cancelEl = this.defaults.getCancelEl(index)
    addClass(cancelEl.querySelector('a'), 'hidden')

    evap.cancel(index)

  uploadInfo: (message, file, index) =>
    if this.defaults.debug
      console.log('INFO: File:', file, 'Index:', index, 'Message:', message)

  uploadWarn: (message, file, index) =>
    if this.defaults.debug
      console.log('WARN: File:', file, 'Index:', index, 'Message:', message)

  uploadError: (message, file, index) =>
    if this.defaults.debug
      console.log('ERROR: File:', file, 'Index:', index, 'Message:', message)

    this._failed++

    uploadMeter = this.getMeterEl(index)
    addClass(uploadMeter, this.defaults.uploadFailedClass)

  getFileCount: ->
    return this._index

  allFilesFinished: ->
    return this._index == (this._complete + this._failed + this._cancelled)
