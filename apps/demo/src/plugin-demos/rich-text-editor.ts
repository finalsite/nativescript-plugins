import { Observable, EventData, Page } from '@nativescript/core';
import { DemoSharedRichTextEditor } from '@demo/shared';
import {} from '@finalsite/rich-text-editor';

export function navigatingTo(args: EventData) {
	const page = <Page>args.object;
	page.bindingContext = new DemoModel();
}

export class DemoModel extends DemoSharedRichTextEditor {}
