import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule, NativeScriptRouterModule } from '@nativescript/angular';
import { RichTextEditorComponent } from './rich-text-editor.component';
import {NativeScriptRichTextEditorModule} from '@finalsite/rich-text-editor/angular'

@NgModule({
	imports: [NativeScriptCommonModule, NativeScriptRichTextEditorModule, NativeScriptRouterModule.forChild([{ path: '', component: RichTextEditorComponent }])],
	declarations: [RichTextEditorComponent],
	schemas: [NO_ERRORS_SCHEMA],
})
export class RichTextEditorModule {}
