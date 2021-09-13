# @finalsite/rich-text-editor

```javascript
ns plugin add @finalsite/rich-text-editor
```

## Installation

// TODO for NS8 we can probably recommend some webpack config lines to do this and keep them in sync?
Copy the assets folder to your project. You can choose to only copy the contenteditable or ckeditor4 files if your only going to use one or the other. Avoid updating these files in case of future updates. (The js file is the code that bridges the button commands to the chosen editor and the html file sets up the editor in the webview.)
e.g

```
cp node_modules/@finalsite/rich-text-editor/assets/html/contenteditable.html app/assets/html/
cp node_modules/@finalsite/rich-text-editor/assets/js/contenteditable.js app/assets/js/
```

If using the default icon set you'll need to copy the font file

```
cp node_modules/@finalsite/rich-text-editor/fonts/MaterialIcons-Regular.ttf app/fonts/
```

And include the css file

```
@import '~@finalsite/rich-text-editor/css/default.css';
```

## Goals

- Provide a native UI for editing html with a webview containing a contenteditable
- Flexible for use with other WYSIWIG editors (CKEditor, tinyMCE)
- Accessible

## Usage (Core)

_Important_ In order for the toolbar to display correctly you must use a GridLayout or RootLayout as your root layout

// TODO

## Usage (Angular)

// TODO

## Dependencies/Credit

Depends on https://github.com/Notalib/nativescript-webview-ext for communicating with the web view

## License

Apache License Version 2.0
