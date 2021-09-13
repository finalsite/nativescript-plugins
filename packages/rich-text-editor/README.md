# @finalsite/rich-text-editor

```javascript
ns plugin add @finalsite/rich-text-editor
```

## Installation

Copy the assets folder to your project. You can choose to only copy the contenteditable or ckeditor4 files if your only going to use one or the other. Avoid updating these files in case of future updates. (The js file is the code that bridges the button commands to the chosen editor and the html file sets up the editor in the webview.)

### For NS8

Add the following to your `webpack.config.js`

```
  webpack.Utils.addCopyRule({
    from: '@finalsite/rich-text-editor/assets/html/default.html',
    to: 'assets/html',
    context: webpack.Utils.project.getProjectFilePath('node_modules'),
  });

  webpack.Utils.addCopyRule({
    from: '@finalsite/rich-text-editor/assets/js/contenteditable.js',
    to: 'assets/js',
    context: webpack.Utils.project.getProjectFilePath('node_modules'),
  });
```

### For NS7

e.g

```
cp node_modules/@finalsite/rich-text-editor/assets/html/contenteditable.html app/assets/html/
cp node_modules/@finalsite/rich-text-editor/assets/js/contenteditable.js app/assets/js/
```

### Using the default icon set

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

See demo for usage

## Usage (Angular)

// TODO

## Dependencies/Credit

Depends on https://github.com/Notalib/nativescript-webview-ext for communicating with the web view

## License

Apache License Version 2.0
