const vscode = require('vscode');

const getLastSelection = () => {
	const { selections } = vscode.window.activeTextEditor;
	return selections[selections.length - 1];
};

const selectedText = () => {
	const { document, selection } = vscode.window.activeTextEditor;
	return document.getText(selection);
};

const revealLastSelection = () => {
	const editor = vscode.window.activeTextEditor;
	const { start, end } = getLastSelection();
	editor.revealRange(new vscode.Range(start, end));
};

const addSelection = (startIndex, endIndex) => {
	const editor = vscode.window.activeTextEditor;
	const { document, selections } = editor;
	const bounds = [
		document.positionAt(startIndex),
		document.positionAt(endIndex),
	];
	if (selections[0].isReversed) {
		bounds.reverse();
	}
	const newSelection = new vscode.Selection(...bounds);
	editor.selections = [...selections, newSelection];
	revealLastSelection();
};

const  sep1 = /[\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u2000-\u2bff\u3000-\u303f\u4dc0-\u4dff\ufb00-\ufe0f\ufe20-\uffff]/;

	const search = (start, end) => {
		const range = new vscode.Range(start, end);
		const editor = vscode.window.activeTextEditor;
		const { document } = editor;
		const searchText = selectedText();
		
		var text = document.getText(new vscode.Range(new vscode.Position(0, 0), range.end));
		var startIndex = document.offsetAt(range.start)
			, idx
			, len = searchText.length
			;
		while((idx=text.indexOf(searchText, startIndex)) >= 0) {
			var st=text[idx-1], idx1=idx+len, ed=text[idx1];
			if((!st||sep1.test(st)) && (!ed||sep1.test(ed))) {
				addSelection(idx, idx + len);
				return true;
			}
			startIndex = idx+len;
		}
	};
	
	const searchStartToFirst = () => {
		const { selections } = vscode.window.activeTextEditor;
		const start = new vscode.Position(0, 0);
		const end = selections[0].start;
		return search(start, end);
	};
	
	const searchLastToEnd = () => {
		const { document } = vscode.window.activeTextEditor;
		const start = getLastSelection().end;
		const end = document.lineAt(document.lineCount - 1).range.end;
		return search(start, end);
	};
	
	const searchLastToFirst = () => {
		const { selections } = vscode.window.activeTextEditor;
		if (selections.length > 1) {
			const start = getLastSelection().end;
			const end = selections[0].start;
			
			if (start.isBefore(end)) {
				search(start, end);
				return true;
			}
		}
	};
	
	const addNext = () => {
		searchLastToFirst() || searchLastToEnd() || searchStartToFirst();
	};
	
	module.exports = addNext;
