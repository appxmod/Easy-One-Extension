const vscode = require('vscode');

const getLastSelection = () => {
	const { selections } = vscode.window.activeTextEditor;
	return selections[selections.length - 1];
};

const get1stSelection = () => {
	const { selections } = vscode.window.activeTextEditor;
	return selections[0];
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


	function isSepChar(c) {
		return !c || c!='_' && sep1.test(c);
	}
	
	var isSepSt0, isSepSt1;
	
	const search = (start, end) => {
		const range = new vscode.Range(start, end);
		const editor = vscode.window.activeTextEditor;
		const { document } = editor;
		const searchText = selectedText();
		// document_ documentElement _document xdocument 
		
		// ==x)y=  ==x)y=
		
		var text = document.getText(new vscode.Range(new vscode.Position(0, 0), range.end));
		var startIndex = document.offsetAt(range.start)
			, idx
			, len = searchText.length
			;
		var isSepC0=isSepSt0||isSepChar(searchText[0])
			, isSepC1=isSepSt1||isSepChar(searchText[searchText.length-1]);
		
		while((idx=text.indexOf(searchText, startIndex)) >= 0) {
			var st=text[idx-1], idx1=idx+len, ed=text[idx1]; // , c0=text[idx], c1=text[idx1-1]
			if((isSepC0||isSepChar(st) )
				&& (isSepC1||isSepChar(ed))) {
				addSelection(idx, idx + len);
				return true;
			}
			startIndex = idx+len;
		}
	};
	

	function error(msg) {
		throw new Error(msg);
	}
	
	const searchStartToFirst = () => {
		//error(JSON.stringify(vscode.workspace.getConfiguration('ez1ext').selectNextWrapped));
		if(true!==vscode.workspace.getConfiguration('ez1ext').selectNextWrapped) {
			return;
		}
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
		const { selections } = vscode.window.activeTextEditor;
		if (selections.length > 0) {
			var sel0 = selections[0];
			const editor = vscode.window.activeTextEditor;
			const { document } = editor;
			var startOutside = sel0.start.with(sel0.start.line, Math.max(sel0.start.character-1, 0))
				endOutside = sel0.end.translate(0, 1);
			var text = document.getText(new vscode.Range(startOutside, endOutside));
			isSepSt0= startOutside!=sel0.start && !isSepChar(text[0]);
			isSepSt1= endOutside!=sel0.end && !isSepChar(text[text.length-1]);
			// throw new Error("["+text+"], "+isSepSt0+", "+isSepSt1);
			// isSepSt1=isSepSt0=1;
			return searchLastToFirst() || searchLastToEnd() || searchStartToFirst();
		}
	};
	
	module.exports = addNext;
