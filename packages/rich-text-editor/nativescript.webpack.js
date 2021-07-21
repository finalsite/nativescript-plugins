module.exports = (webpack) => {
	webpack.Utils.addCopyRule({
		from: '@finalsite/assets/rich-text.html',
		to: 'assets/www',
		context: webpack.Utils.project.getProjectFilePath('node_modules'),
	});
};
