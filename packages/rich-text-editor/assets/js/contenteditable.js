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
	const editorInstance = document.getElementById('editor');

	nsWebViewBridge.on('sourceChanged', function (data) {
		editorInstance.innerHTML = data;
	});

	nsWebViewBridge.on('done', function () {
		editorInstance.blur();
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

	editorInstance.addEventListener(
		'blur',
		function (event) {
			nsWebViewBridge.emit('blur', editorInstance.innerHTML);
		},
		false
	);

	editorInstance.addEventListener(
		'focus',
		function (event) {
			nsWebViewBridge.emit('focus', editorInstance.innerHTML);
		},
		false
	);

	editorInstance.addEventListener(
		'input',
		function (event) {
			nsWebViewBridge.emit('input', editorInstance.innerHTML);
		},
		false
	);
}
