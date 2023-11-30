'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const addNext = require('./addNext');
let t = null;
exports.activate = function (context) {
    // console.log(vscode.window);
    // global.addEventListener('exec_', (e)=>{
    //     console.log('exec_', e);
    //     dispatchEvent(new CustomEvent('log_', {detail:e.detail}))
    // }, 1)
    if (t == null) {
        t = new AdamsTool();
        t.Setup();
        
        let disposable = vscode.commands.registerCommand('ez.toggleWrapTab', () => {
            //vscode.window.showInformationMessage('Hello World!');
            const config = vscode.workspace.getConfiguration();
            var sec='workbench.editor.wrapTabs';
            return config.update(
                sec,
               ! config.get(sec),
                vscode.ConfigurationTarget.Workspace
            );
        });
        context.subscriptions.push(disposable);
    }
    context.subscriptions.push(t);
    activateAutoSelect(context);
    context.subscriptions.push(vscode.commands.registerCommand('ez.duplicateTab', duplicateTab));
    
    context.subscriptions.push(vscode.commands.registerCommand('ez.fullpath', ()=>{
        const currentFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
        if (currentFilePath) {
            vscode.env.clipboard.writeText(currentFilePath).then(() => {
                vscode.window.showInformationMessage('Full path copied to clipboard!');
            }, (error) => {
                vscode.window.showErrorMessage('Failed to copy the full path to clipboard.');
            });
        }
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand('ez.selectNxt', addNext));
    context.subscriptions.push(vscode.commands.registerCommand('ez.unselect', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selections = editor.selections;
            if (selections.length > 1) {
                selections.pop(); // Remove the last selection
                editor.selections = selections;
            }
        }
    }));
};
// http://anandganesh2005.blogspot.com/2019/03/visual-studio-code-icon-names.html
// https://code.visualstudio.com/api/references/icons-in-labels
class AdamsTool {
    pushBtn(label, tip, cmd, right, clr, sep){
        if (!this.btns) this.btns={};
        if (!this.btns[cmd]) {
            var e=vscode.window.createStatusBarItem(right?vscode.StatusBarAlignment.Right:vscode.StatusBarAlignment.Left);
            this.btns[cmd]=e;
            e.text = label;
            e.tooltip = tip;
            if(!sep)e.command = cmd;
            e.color = (clr||'yellow');
            e.show();
        }
    }
    pushSep(n){
        this.pushBtn(' ', '', 'sep'+n,0,0,1);
    }
    Setup() {
        var spc=0;
        this.pushBtn('$(word-wrap)', '自动换行', 'editor.action.toggleWordWrap');

        this.pushBtn('$(bookmark)', '切换书签', 'bookmarks.toggle');
        this.pushSep(spc++);
        this.pushBtn('$(marker-navigation-previous)', '上一书签', 'bookmarks.jumpToPrevious');
        this.pushBtn('$(marker-navigation-next)', '下一书签', 'bookmarks.jumpToNext');

        this.pushSep(spc++);
        this.pushBtn('$(code)', '匹配括号', 'editor.action.jumpToBracket');

        
        this.pushSep(spc++);
        this.pushBtn('$(arrow-left)', '后退', 'workbench.action.navigateBack');
        this.pushBtn('$(arrow-right)', '前进', 'workbench.action.navigateForward');

        this.pushSep(spc++);
        this.pushBtn('$(extensions-view-icon)', '多行标签页', 'ez.toggleWrapTab');

        this.pushSep(spc++);
        this.pushBtn('$(save)', '保存', 'workbench.action.files.save');

        
        this.pushBtn('$(arrow-up)', '上一光标位置', 'workbench.action.navigateLast', true);
        this.pushBtn('$(browser)', '控制台', 'workbench.action.toggleDevTools', true);
        this.pushBtn('$(terminal-view-icon)', '终端', 'workbench.action.terminal.new', true);
        this.pushBtn('$(triangle-right)', '调试', 'workbench.action.debug.start', true);
        this.pushBtn('$(diff-added)', '折叠全部', 'editor.foldAll', true);
        this.pushBtn('$(diff-removed)', '展开全部', 'editor.unfoldAll', true);
        this.pushBtn('$(testing-show-as-list-icon)', '小地图', 'editor.action.toggleMinimap', true);
    }
    dispose() {
        this.btns.forEach(e => {
            e.dispose();
        });
    }
}
exports.deactivate = function deactivate() {
    t = null;
};


function activateAutoSelect(context) {
    // Create an output channel for logging extension-related activities
    // const outputChannel = vscode.window.createOutputChannel("AutoSelectPastedText");
    // Function to handle conditional logging based on the enableLogging setting
    const log = (message) => {
        // const enableLogging = vscode.workspace.getConfiguration('autoSelectPastedText').get('enableLogging');
        // if (enableLogging) {
        //     outputChannel.appendLine(message);
        // }
    };
    
    context.subscriptions.push(vscode.commands.registerCommand('ez.pasteAndSelect', async () => {
        const editor = vscode.window.activeTextEditor;
        if(!editor/*  || !editor.focused */) {
            return;// vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        }
        const enableAutoSelection = true;//vscode.workspace.getConfiguration('autoSelectPastedText').get('enableAutoSelection');
        const enableManualSelection = vscode.workspace.getConfiguration('autoSelectPastedText').get('enableManualSelection');

        log('Paste command executed.');
        // Read content from clipboard
        const clipboardContent = await vscode.env.clipboard.readText();
        if (clipboardContent) {
            let targetSelection;
            // Determine the target for the paste: either append after the current selection or replace it
            if (/* autoSelected */false || enableManualSelection) {
                const currentPosition = editor.selection.end;
                targetSelection = new vscode.Selection(currentPosition, currentPosition);
            }
            else {
                targetSelection = editor.selection;
            }
            // Split content by lines to calculate the selection end position later
            const linesPasted = clipboardContent.split('\n');
            const lastLineLength = linesPasted[linesPasted.length - 1].length;
            editor.edit((editBuilder) => {
                // Replace the determined target selection with the clipboard content
                editBuilder.replace(targetSelection, clipboardContent);
            }).then((success) => {
                if (success) {
                    // outputChannel.appendLine("Content pasted successfully.");
                    // Determine the end position for the selection post-paste
                    const endLine = targetSelection.start.line + linesPasted.length - 1;
                    const endCharacter = (linesPasted.length === 1) ? (targetSelection.start.character + lastLineLength) : lastLineLength;
                    const endPosition = new vscode.Position(endLine, endCharacter);
                    if (enableAutoSelection) {
                        // Adjust the selection to cover the pasted content
                        editor.selection = new vscode.Selection(targetSelection.start, endPosition);
                        // autoSelected = true;
                    }
                    // Reveal the pasted content in the editor
                    editor.revealRange(new vscode.Range(targetSelection.start, endPosition), vscode.TextEditorRevealType.Default);
                }
                else {
                    // outputChannel.appendLine('Clipboard is empty.');
                }
            });
        }
    }));
}

function duplicateTab() {
    const currentSelection = vscode.window.activeTextEditor?.document.getText() || '';
    const currentFileName = vscode.window.activeTextEditor?.document.fileName;
    var setting = vscode.Uri.parse('untitled:' + currentFileName + '-duplicated');
    vscode.workspace.openTextDocument(setting).then((a) => {
        vscode.window.showTextDocument(a, 1, false).then(e => {
            e.edit(edit => {
                edit.insert(new vscode.Position(0, 0), currentSelection);
            });
        });
    }, (error) => {
        vscode.window.showErrorMessage("Cannot duplicate tab");
    });
}