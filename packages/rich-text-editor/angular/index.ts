import { NgModule } from '@angular/core';
import { registerElement } from '@nativescript/angular';
import { RichTextEditor } from '@finalsite/rich-text-editor';


@NgModule()
export class NativeScriptRichTextEditorModule {}

registerElement('RichTextEditor', () => RichTextEditor);
