module.exports = (webpack) => {
	webpack.Utils.addCopyRule({
		from: '@finalsite/rich-text-editor/assets/html/default.html',
		to: 'assets/html',
		context: webpack.Utils.project.getProjectFilePath('node_modules'),
	});

	webpack.Utils.addCopyRule({
		from: '@finalsite/rich-text-editor/assets/js/ckeditor4.js',
		to: 'assets/js',
		context: webpack.Utils.project.getProjectFilePath('node_modules'),
	});
};
