import { Observable, EventData, Page } from '@nativescript/core';
import { DemoSharedRichTextEditor } from '@demo/shared';
import {} from '@finalsite/rich-text-editor';

let page;
export function navigatingTo(args: EventData) {
	page = <Page>args.object;
	page.bindingContext = new DemoModel();
}

export function onTap(args: EventData) {
	alert(page.bindingContext.editorContent);
}

export class DemoModel extends DemoSharedRichTextEditor {
	public editorContent: string = '<img src="https://i.pinimg.com/564x/e5/88/57/e58857be554bfb1b6135c142d35d427d.jpg" style="float: left; width: 100px;" /> <p>Red leicester airedale babybel. Fromage halloumi smelly cheese cheddar fromage frais cream cheese bocconcini hard cheese. Chalk and cheese parmesan fromage cut the cheese halloumi airedale brie cheese and wine. Stinking bishop cheddar.</p>';
}
