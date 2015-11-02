noop = ->

# Borrowing the Emitter from dropzone
# https://raw.githubusercontent.com/enyo/dropzone/master/src/dropzone.coffee
class Emitter
  addEventListener: @::on
  on: (event, fn) ->
    @_callbacks = @_callbacks || {}
    # Create namespace for this event
    @_callbacks[event] = [] unless @_callbacks[event]
    @_callbacks[event].push fn
    return @


  emit: (event, args...) ->
    @_callbacks = @_callbacks || {}
    callbacks = @_callbacks[event]

    if callbacks
      callback.apply @, args for callback in callbacks

    return @

  removeListener: @::off
  removeAllListeners: @::off
  removeEventListener: @::off
  off: (event, fn) ->
    if !@_callbacks || arguments.length == 0
      @_callbacks = {}
      return @

    # specific event
    callbacks = @_callbacks[event]
    return @ unless callbacks

    # remove all handlers
    if arguments.length == 1
      delete @_callbacks[event]
      return @

    # remove specific handler
    for callback, i in callbacks
      if callback == fn
        callbacks.splice i, 1
        break

    return @

class window.Candru extends Emitter
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

  hasClass = (el, className) ->
    if (el.classList)
      el.classList.contains(className)
    else
      new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className)

  readableFileSize = (bytes) ->
    if bytes == 0
      return "0.00 B"

    e = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes/Math.pow(1024, e)).toFixed(2)+' '+' KMGTP'.charAt(e)+'B'

  constructor: (el, options = {}) ->
    defaults = {
      debug                 : false,
      queue                 : false,
      overClass             : 'candru-over',
      cancelSelector        : '.cancel',
      fileInputSelector     : 'input[type="file"]',
      emptyTextSelector     : '.empty-text',
      uploadSuccessClass    : 'done',
      uploadFailedClass     : 'failed',
      uploadCancelledClass  : 'cancelled',
      allowedTypes          : [/^image\//, /^video\//], # array of regex
      maxFileSize           : 4294967296, # in bytes
      evaporate             : null,
      sanitizeFilename      : @sanitizeFilename,
      renameFile            : @renameFile,
      overHandler           : @overHandler,
      leaveHandler          : @leaveHandler,
      dropHandler           : @dropHandler,
      getMeterEl            : @getMeterEl,
      getCancelEl           : @getCancelEl,
      uploadHandler         : @uploadHandler,
      uploadComplete        : @uploadComplete,
      uploadStartCallback   : noop,
      uploadCompleteCallback: noop,
      uploadProgress        : @uploadProgress,
      uploadCancel          : @uploadCancel,
      uploadInfo            : @uploadInfo,
      uploadWarn            : @uploadWarn,
      uploadError           : @uploadError,
      createUploadItem      : @createUploadItem
    }

    @_index = 0 # Keeps track of how many files we've uploaded
    @_complete = 0
    @_cancelled = 0
    @_failed = 0

    @_fileQueue = []

    @defaults = extend(defaults, options)
    @el = window.document.querySelector(el)

    if not @el
      console.log('Could not find element for uploader.')
      return

    @init()

  init: ->
    @el.addEventListener('dragover', @defaults.overHandler)
    @el.addEventListener('dragleave', @defaults.leaveHandler)
    @el.addEventListener('drop', @defaults.dropHandler)

    # Also let people click to add files
    fileInput = @el.querySelector(@defaults.fileInputSelector)
    if fileInput?
      fileInput.addEventListener('change', @defaults.dropHandler)

  overHandler: (e) =>
    e.preventDefault()
    e.stopPropagation()

    @emit('candru-dragover', e)
    addClass(@el, @defaults.overClass)

    false

  leaveHandler: (e) =>
    e.preventDefault()
    e.stopPropagation()

    @emit('candru-dragleave', e)
    removeClass(@el, @defaults.overClass)

    false

  fileTypeCheck: (file) ->
    acceptedType = false

    for type in @defaults.allowedTypes
      if type.test(file.type)
        acceptedType = true
        break

    return acceptedType

  fileSizeCheck: (file) ->
    if file.size > @defaults.maxFileSize
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
    .toLowerCase()
    .replace(spacesRe, '_')
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement)

  renameFile: (file) ->
    file.name

  getMeterEl: (index) =>
    uploadMeterSelector = ".candru [data-upload-id=\"#{index}\"] .meter"
    return @el.querySelector(uploadMeterSelector)

  getCancelEl: (index) =>
    uploadMeterSelector = ".candru [data-upload-id=\"#{index}\"] .cancel"
    return @el.querySelector(uploadMeterSelector)

  createUploadItem: (file, index) =>
    uploadItem = document.createElement('div')
    uploadItem.className = 'candru-upload clearfix'
    uploadItem.dataset.uploadId = index
    uploadItem.innerHTML = """
      <button class='cancel left tiny'>Cancel</button>
      <span class='filename left'>
        <label>
            File:
        </label>
        #{file.name}
      </span>
      <span class='filesize left'>
        <label>
            Size:
        </label>
        #{readableFileSize(file.size)}
      </span>
      <div class='candru-progress right'>
        <span class='meter'></span>
      </div>
      """

    uploadItem.querySelector(@defaults.cancelSelector).addEventListener('click', (e) =>
      ((index) =>
        @defaults.uploadCancel(file, index)
      )(index))

    return uploadItem

  dropHandler: (e) =>
    e.preventDefault()
    e.stopPropagation()

    @emit('candru-drop', e)
    removeClass(@el, @defaults.overClass)

    emptyText = @el.querySelector(@defaults.emptyTextSelector)
    emptyText.parentNode.removeChild(emptyText) if emptyText?

    files = if e.dataTransfer?
      e.dataTransfer.files
    else if e.currentTarget
      e.currentTarget.files
    else
      throw new Error('Could not find the files')

    for file in files
      if not @fileTypeCheck(file)
        console.log('Skipping file of type: ', file.type)
        continue

      if not @fileSizeCheck(file)
        console.log('Skipping file of size: ', file.size)
        continue

      uploadItem = @defaults.createUploadItem(file, @_index)
      @el.appendChild(uploadItem)

      file.uniqueId = Math.random().toString(36).substr(2,16)
      file.sanitizedFileName = @defaults.sanitizeFilename(file)
      file.uploadName = @defaults.renameFile(file)

      if @defaults.queue
        @emit('candru-queue-add', file, @_index, 'unprocessed')
        @_fileQueue.push({
          file: file,
          index: @_index,
          state: 'unprocessed'
        })
      else
        @emit('candru-process', file, @_index)
        @defaults.uploadHandler(file, @_index)

      @_index++

    false

  uploadHandler: (file, index) =>
    throw new Error('Evaporate instance is null.') unless @defaults.evaporate
    evap = @defaults.evaporate

    @defaults.uploadStartCallback(file, index, @allFilesFinished())

    evap.add({
      name: file.uploadName,
      file: file,
      complete: =>
        @emit('candru-evaporate-complete', file, index)
        @defaults.uploadComplete(file, index)
      progress: (progress) =>
        @emit('candru-evaporate-complete', progress, file, index)
        @defaults.uploadProgress(progress, file, index)
      info: (message) =>
        @emit('candru-evaporate-info', message, file, index)
        @defaults.uploadInfo(message, file, index)
      warn: (message) =>
        @emit('candru-evaporate-warn', message, file, index)
        @defaults.uploadWarn(message, file, index)
      error: (message) =>
        @emit('candru-evaporate-error', message, file, index)
        @defaults.uploadError(message, file, index)
    })

  uploadComplete: (file, index) =>
    @_complete++

    uploadMeter = @defaults.getMeterEl(index)
    uploadMeter.style.width = '100%' # Sometimes it goes so fast it doesn't get progress before it finishes
    addClass(uploadMeter, @defaults.uploadSuccessClass)

    cancelEl = @defaults.getCancelEl(index)
    addClass(cancelEl, 'disabled')

    @defaults.uploadCompleteCallback(file, index, @allFilesFinished())

  uploadProgress: (progress, file, index) =>
    uploadMeter = @defaults.getMeterEl(index)
    uploadMeter.style.width = "#{progress * 100.0}%"

  uploadCancel: (file, index) =>
    cancelEl = @defaults.getCancelEl(index)

    if not hasClass(cancelEl, 'disabled')
      @_cancelled++

      throw new Error('Evaporate instance is null.') unless @defaults.evaporate
      evap = @defaults.evaporate

      uploadMeter = @defaults.getMeterEl(index)
      addClass(uploadMeter, @defaults.uploadCancelledClass)
      uploadMeter.style.width = '100%'

      cancelEl = @defaults.getCancelEl(index)
      addClass(cancelEl, 'disabled')

      if @defaults.queue
        for queuedFile in @_fileQueue
          if queuedFile.index is index
            queuedFile.state = 'cancelled'

      evap.cancel(index)

  uploadInfo: (message, file, index) =>
    if @defaults.debug
      console.log('INFO: File:', file, 'Index:', index, 'Message:', message)

  uploadWarn: (message, file, index) =>
    if @defaults.debug
      console.log('WARN: File:', file, 'Index:', index, 'Message:', message)

  uploadError: (message, file, index) =>
    if @defaults.debug
      console.log('ERROR: File:', file, 'Index:', index, 'Message:', message)

    @_failed++

    uploadMeter = @getMeterEl(index)
    addClass(uploadMeter, @defaults.uploadFailedClass)

  processQueue: =>
    return false unless @defaults.queue

    for queuedFile in @_fileQueue
      if queuedFile.state is 'unprocessed'
        @defaults.uploadHandler(queuedFile.file, queuedFile.index)
        queuedFile.state = 'processed'
      else

  cancelAll: =>
    cancelTriggers = @el.querySelectorAll(@defaults.cancelSelector)

    # Fake the cancel click
    for trigger in cancelTriggers
      trigger.click() unless hasClass(trigger, 'disabled')

    # Clear up the queue
    if @defaults.queue
      for queuedFile in @_fileQueue
        if queuedFile.state is 'unprocessed'
          @emit('candru-queue-cancelled', queuedFile.file, queuedFile.index, 'cancelled')
          queuedFile.state = 'cancelled'

  getFileCount: ->
    return @_index

  allFilesFinished: ->
    return @_index == (@_complete + @_failed + @_cancelled)
