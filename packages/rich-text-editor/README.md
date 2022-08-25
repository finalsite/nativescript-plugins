# @finalsite/rich-text-editor

![Demo](https://cdn-std.droplr.net/files/acc_703718/GBLTsM)

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

In your component's component file, initialize your editor's html:

```
editorContent: string = '<p><img alt="leonardo" height="249" src="https://upload.wikimedia.org/wikipedia/en/e/ed/Leonardo_%28Teenage_Mutant_Ninja_Turtles%29.jpg" style="float:right; margin: 1em" width="150" /></p><h1><strong>Leonardo</strong></h1>;
```

_Ensure that there your app is wrapped in a GridLayout. See demo for an example_
Include the xmlns:

```
xmlns:RIE="@finalsite/rich-text-editor"
```

Then, include the text editor & editor's html in your component's html file:

```
<RIE:rich-text-editor width="90%" height="200" html="{{ editorContent }}"/>
```

#### Add Custom Toolbar Buttons

```
<RichTextEditor  width="90%"  height="200"  html="{{ editorContent }}">
  <Button text="&#xe965;" editorCommand="undo" class="custom_button" />
  <Button text="&#xe966;" editorCommand="redo" class="custom_button" />
</RichTextEditor>
```

#### Use a custom editor

```
<RichTextEditor width="90%" height="200" html="{{ editorContent }}" bridge="~/assets/js/ckeditor4.js" headAssets="https://cdn.ckeditor.com/4.16.1/standard-all/ckeditor.js"></RichTextEditor>
```

See demo for usage

## Usage (Angular)

### Setup

Run `npm install @nota/nativescript-webview-ext@8.0.2`.
<br />
In your component's `app.module.ts`, import & setup `@nota/nativescript-webview-ext/angular`

```
import { NgModule, NO_ERRORS_SCHEMA } from  '@angular/core';
import { NativeScriptModule } from  '@nativescript/angular';

import {WebViewExtModule} from  "@nota/nativescript-webview-ext/angular" <-- Add here
...

@NgModule({
	imports: [...YourImports, WebViewExtModule] <-- Add here
})
export  class  AppModule {}
```

In your component's module file, import and include the NativeScriptRichTextEditorModule:

```
import { NativeScriptRichTextEditorModule } from  '@finalsite/rich-text-editor/angular'

...

@NgModule({
	imports: [NativeScriptRichTextEditorModule, ...otherModules],
	declarations: [YourComponents],
	schemas: [YourSchemas],
})
```

_View the demo-angular folder to see an angular demo_

## Usage (Vue)

In your apps `app.js` (entry file), include the following two lines:

    import RichTextEditor from "@finalsite/rich-text-editor/vue";
    RichTextEditor.install(Vue);

_View the demo-vue folder to see a vue demo_
_To run it, `cd apps/demo-vue && ns run ios`_

## Dependencies/Credit

Depends on https://github.com/Notalib/nativescript-webview-ext for communicating with the web view

## License

Apache License Version 2.0
