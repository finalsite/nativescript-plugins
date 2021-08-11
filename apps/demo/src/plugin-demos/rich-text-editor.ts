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
	public editorContent: string =
		'<p>Red leicester airedale babybel. Fromage halloumi smelly cheese cheddar fromage frais cream cheese bocconcini hard cheese. <a href="https://starwars.fandom.com/wiki/Attack_of_the_Clones_(painting)">Hi, this is a link</a> Chalk and cheese parmesan fromage cut the cheese halloumi airedale brie cheese and wine. Stinking bishop cheddar.</p> <img src="https://pbs.twimg.com/media/E5HaitQUcAMWD1s?format=jpg&name=large" style="max-width: 100%; padding: 5px" /> <p>Red leicester airedale babybel. Fromage halloumi smelly cheese cheddar fromage frais cream cheese bocconcini hard cheese. Chalk and cheese parmesan fromage cut the cheese halloumi airedale brie cheese and wine. Stinking bishop cheddar.</p>';
}
