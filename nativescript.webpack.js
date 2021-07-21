module.exports = (webpack) => {
	webpack.Utils.addCopyRule({
		from: '@finalsite/rich-text-editor/assets/rich-text.html',
		to: 'assets',
		context: webpack.Utils.project.getProjectFilePath('node_modules'),
	});
};
