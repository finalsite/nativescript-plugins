import { Component, NgZone } from '@angular/core';
import { DemoSharedRichTextEditor } from '@demo/shared';
import {} from '@finalsite/rich-text-editor';

@Component({
	selector: 'demo-rich-text-editor',
	templateUrl: 'rich-text-editor.component.html',
})
export class RichTextEditorComponent {
	demoShared: DemoSharedRichTextEditor;

	constructor(private _ngZone: NgZone) {}

	ngOnInit() {
		this.demoShared = new DemoSharedRichTextEditor();
	}
}
