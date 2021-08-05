// bridge interface for a regular content editable div

const nsWebViewBridge = window.nsWebViewBridge;

if (nsWebViewBridge) {
	initBridge();
} else {
	window.addEventListener('ns-bridge-ready', function (e) {
		const nsWebViewBridge = e.detail;
		initBridge();
	});
}

function initBridge() {
	const editorDiv = document.getElementById('editor');
	editorDiv.setAttribute('contenteditable', true);

	// disable UI things that we're replacing with native buttons
	const editorInstance = CKEDITOR.inline('editor', {
		removePlugins: 'toolbar',
		allowedContent: true,
		toolbar: [],
	});
	editorInstance.on(
		'doubleclick',
		function (evt) {
			// TODO: emit this to the native side maybe?
			return false;
		},
		null,
		null,
		1
	); // last param gives this priority

	editorInstance.on('focus', function (event) {
		nsWebViewBridge.emit('focus');
	});

	editorInstance.on('blur', function (event) {
		nsWebViewBridge.emit('blur');
	});

	editorInstance.on('change', function (event) {
		nsWebViewBridge.emit('input', editorInstance.getData());
	});

	nsWebViewBridge.on('sourceChanged', function (data) {
		editorInstance.setData(data);
	});

	nsWebViewBridge.on('done', function (data) {
		editorInstance.focusManager.blur(true);
		editorDiv.blur();
	});

	nsWebViewBridge.on('bold', function () {
		document.execCommand('bold');
	});

	nsWebViewBridge.on('underline', function () {
		document.execCommand('underline');
	});

	nsWebViewBridge.on('italic', function () {
		document.execCommand('italic');
	});
}
