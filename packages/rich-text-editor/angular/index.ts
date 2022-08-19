import { NgModule } from '@angular/core';
import { registerElement } from '@nativescript/angular';
import { RichTextEditor } from '@finalsite/rich-text-editor';
import {WebViewExtModule} from "@nota/nativescript-webview-ext/angular"

@NgModule({
    imports: [WebViewExtModule],
})
export class NativeScriptRichTextEditorModule {}

registerElement('RichTextEditor', () => RichTextEditor);
