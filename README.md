Candru - The unopinionated HTML5 Drag and Drop Uploader
=======================================================

### Why?
All the other HTML5 Drag & Drop uploaders seem to be very opinionated and hard to hook into. Candru aims to be easy to
plug in to as well as easy to modify. Having an easy way to add support for
[EvaporateJS](https://github.com/TTLabs/EvaporateJS) was also important.

## Set up Candru
Include candru.js and candru.css in your page. Candru has no other requirements but if you plan on using Evaporate,
make sure it's included.

    <script language="javascript" type="text/javascript" src="../candru.js"></script>
    <link rel="stylesheet" href="../candru.css">

    <div id="my-uploader" class="candru">
      <input type="file" multiple>
      <h5 class="empty-text text-center">Click or Drag Files to Upload</h5>
    </div>

## Use Candru

### new Candru()

`var candru = new Candru(element, options)`

`element` is a require parameter and is a valid css selector

`options` overrides the default selectors and functions

* **debug**: default = `false`, Outputs info, warn, and error messages to console.log if `true`
* **queue**: default = `false`, If `false`, items upload as soon as they are added,  if `true` they are queued until "processQueue" is called
* **overClass**: default = 'candru-over', The class applied to the element when an item is dragged over
* **cancelSelector**: default = '.cancel', The class of the element used to cancel uploads
* **fileInputSelector**: defaults = 'input[type="file"]', The class of the standard <input type="file"> to attach to if desired
* **emptyTextSelector**: default = '.empty-text', The class of the empty text to remove when starting uploads.
* **uploadSuccessClass**: default = 'done', The class applied to the progress bar when an upload finishes
* **uploadFailedClass**: default = 'failed', The class applied to the progress bar when an upload fails
* **uploadCancelledClass**: default = 'cancelled', The class applied to the progress bar when an upload is cancelled.
* **allowedTypes**: default = [/^image\//, /^video\//], An array of regexs to match the file type against
* **maxFileSize**: default = 4294967296, Maximum file size in bytes
* **evaporate**: default = null, An EvaporateJS instance to use for file uploads. You will need to provide a different upload handler if this doesn't exist.
* **sanitizeFilename**: default = this.sanitizeFilename, A function passed in the file used to clean up the file name, needs to return a string
* **renameFile**: default = this.renameFile, A function passed in the file, by default just returns the file name
* **overHandler**: default = this.overHandler, A function passed in the event, should preventDefault/stopPropagation
* **leaveHandler**: default = this.leaveHandler, A function passed in the event, should preventDefault/stopPropagation
* **dropHandler**: default = this.dropHandler, A function passed in the event, should preventDefault/stopPropagation, handles calling everything
* **getMeterEl**: default = this.getMeterEl, A function passed in index, returns element for progress meter
* **getCancelEl**: default = this.getCancelEl, A function passed in index, returns element for cancel button
* **uploadHandler**: default = this.uploadHandler, A function passed in the file and index, handles putting the file on the remote
* **uploadComplete**: default = this.uploadComplete, A function passed in the file and index, handles setting a file as complete
* **uploadStartCallback**: default = noop, A callback function passed in the file, index, and true/false if all files have finished.
* **uploadCompleteCallback**: default = noop, A callback function passed in the file, index, and true/false if all files have finished.
* **uploadProgress**: default = this.uploadProgress, A function passed in the progress (0.0 - 1.0), the file, and the index, handles updating the progress.
* **uploadCancel**: default = this.uploadCancel, A function passed in the the file, and the index, handles updating the progress.
* **uploadInfo**: default = this.uploadInfo, A function passed in the message, the file, and the index, handles updating the progress.
* **uploadWarn**: default = this.uploadWarn, A function passed in the message, the file, and the index, handles updating the progress.
* **uploadError**: default = this.uploadError, A function passed in the message, the file, and the index, handles updating the progress.
* **createUploadItem**: default = this.createUploadItem A function passed in file and index, needs to return html element

### getFileCount - Return the number of total files

`var candru = new Candru(element, options)`

`candru.getFileCount()`

### allFilesFinished - Return true if all files have finished uploading, false otherwise

`var candru = new Candru(element, options)`

`candru.allFilesFinished()`

### allFilesFinished - Process all queued items. Does nothing if the queued option is set to false.

`var candru = new Candru(element, options)`

`candru.processQueue()`

### cancelAll - Cancels all unprocessed items.

`var candru = new Candru(element, options)`

`candru.cancelAll()`

## Overriding the template
Simply supply a different "createUploadItem" function in the options that returns an HTMLElement. The default structure looks like:

        <div class="candru-upload clearfix' data-upload-id=0>
          <button class='cancel left tiny'></button>
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
        </div>

Your outermost item should have data-upload-id set to the index that is passed in as the second parameter to the function.
If you chose to rename cancel, simply update the "cancelSelector" in the options hash. File name, size, and even a thumbnail
can be pulled from the first function parameter.

## Renaming the File

      // Make all filenames lowercase
      var candru = new Candru(element, {
        renameFile: function (file) {
          return file.sanitizedFileName.toLowerCase()
        }
      })

## Changes to the file object
A few additional fields are made available on each file object for convenience.

`file.sanitizedFileName` - The name of the file after it's been run through the sanitization function

`file.uniqueId` - A unique random string generated for each file

`file.uploadName` - The name of the file after both sanitization and renaming.

## TODO

* Add a demo
* Add AMD/CommonJS/RequireJS Support
* Add in XHR/AJAX Uploads
* Add in a way to chose between XHR/AJAX and EvaporateJS
* Use Event triggering

## Building

    brew install node
    npm install
    gulp
