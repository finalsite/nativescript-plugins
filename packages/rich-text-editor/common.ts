import { knownFolders, Observable, View, Property, EventData, GridLayout, ContentView, AddChildFromBuilder, StackLayout, Button, PercentLength } from '@nativescript/core';
import { LoadFinishedEventData, ShouldOverrideUrlLoadEventData, WebViewEventData, WebViewExt } from '@nota/nativescript-webview-ext';

export const htmlProperty = new Property<RichTextEditorCommon, string>({
	name: 'html',
	defaultValue: '',
	affectsLayout: true,
	valueChanged: (target: RichTextEditorCommon, oldValue, newValue) => {
		if (target._setEventFromWebView) {
			return;
		}

		// TODO: the loaded state could probably be done cleaner with a promise here
		if (!target._loaded) {
			target._webView.on(WebViewExt.loadFinishedEvent, (args: LoadFinishedEventData) => {
				target._webView.emitToWebView('sourceChanged', newValue);
			});
		} else {
			target._webView.emitToWebView('sourceChanged', newValue);
		}

		target._setEventFromWebView = false;
	},
});

/*
 * Extend GridLayout so we can float the toolbar above the keyboard idea taken from https://github.com/EddyVerbruggen/nativescript-keyboard-toolbar
 */
export abstract class RichTextEditorCommon extends GridLayout {
	hasFocus: boolean;

	_loaded: boolean;
	_setEventFromWebView: boolean;
	_webView: WebViewExt;
	_toolbar: StackLayout;

	constructor() {
		super();
		const webViewSrc = encodeURI(`${knownFolders.currentApp().path}/assets/rich-text.html`);

		this._webView = new WebViewExt();
		this._toolbar = new StackLayout();
		this._loaded = false;
		this._setEventFromWebView = false;

		this._toolbar.orientation = 'horizontal';
		this._toolbar.backgroundColor = '#F2F2F7';
		this._toolbar.height = 40;

		// TODO: these buttons should be added elsewhere at some point, either a mapping json structure or xml view of some sort?
		const boldButton = new Button();
		boldButton.text = 'B';
		boldButton.on('tap', () => {
			this._webView.emitToWebView('bold', null);
		});
		this._toolbar.addChild(boldButton);

		const underlineButton = new Button();
		underlineButton.text = 'U';
		underlineButton.on('tap', () => {
			this._webView.emitToWebView('underline', null);
		});
		this._toolbar.addChild(underlineButton);

		const italicButton = new Button();
		italicButton.text = 'I';
		italicButton.on('tap', () => {
			this._webView.emitToWebView('italic', null);
		});
		this._toolbar.addChild(italicButton);

		this.addChild(this._webView);
		this.addChild(this._toolbar);

		this._webView.on(WebViewExt.loadFinishedEvent, (args: LoadFinishedEventData) => {
			this._loaded = true;
		});

		// prevent navigating to other urls on this webview
		this._webView.on(WebViewExt.shouldOverrideUrlLoadingEvent, (args: ShouldOverrideUrlLoadEventData) => {
			if (!args.url.includes(webViewSrc)) {
				args.cancel = true;
			}
		});

		// listen for change events on the webview and reflect them on the html property
		this._webView.on('input', (event: WebViewEventData) => {
			// TODO: there's probably a better way of doing this
			// we set this so we don't turn around and notify the change right back to the web view
			this._setEventFromWebView = true;
			this.set('html', event.data);
		});

		this._webView.on('focus', (event: WebViewEventData) => {
			this.notify({ eventName: 'focus', object: this });
		});

		this._webView.on('blur', (event: WebViewEventData) => {
			this.notify({ eventName: 'blur', object: this });
		});

		//TODO: setup controls

		this._webView.src = webViewSrc;
	}
}

htmlProperty.register(RichTextEditorCommon);
