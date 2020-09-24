import {
  DecorationRangeBehavior,
  window,
  TextEditor,
  Range,
  ThemeColor,
  DecorationOptions,
  MarkdownString,
  workspace,
  ExtensionContext,
  TextEditorSelectionChangeEvent
} from 'vscode';


import PackageInfoHelper from './packageInfoHelper';

const annotationDecoration = window.createTextEditorDecorationType({
  after: {
    margin: '0 3em 0 3em',
    textDecoration: 'none'
  },
  rangeBehavior: DecorationRangeBehavior.ClosedOpen
});
class DescHelper {

  private _currentLine = -1;

  private _editor: TextEditor | undefined;

  private package = new PackageInfoHelper();

  private ctx: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.ctx = context;
    this.initEventListener();
  }

  initEventListener() {
    // * Handle active file changed
    window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        this._editor = editor;
      }
    }, null, this.ctx.subscriptions);

    // * Handle file contents changed
    workspace.onDidChangeTextDocument(event => {
      // Trigger updates if the text was changed in the same document
      if (this._editor && event.document === this._editor.document) {
        this.updateAction(this._editor);
      } else {

      }
    }, null, this.ctx.subscriptions);


    window.onDidChangeTextEditorSelection((event: TextEditorSelectionChangeEvent) => {
      this.updateAction(this._editor);
    }, null, this.ctx.subscriptions);

  }

  async addDesc(editor: TextEditor | undefined) {
    if (!editor) {
      return;
    }
    this.clear(editor);

    let active = editor.selection.active;
    let line = editor.document.lineAt(active.line);
    let json = editor.document.getText();
    let matches = line.text.trim().match(/^['"](.*?)['"]:.*?['"](.*?)['"],?$/);
    if (!matches) {
      return;
    }
    let key = matches[1];
    if (!new RegExp(`"(dependencies|devDependencies)":\\s*?\\{[\\s\\S]*?${key.replace(/\//g, '\\/')}[\\s\\S]*?\\}`, 'gm').test(json)) {
      return;
    }
    try {
      this._editor = editor;

      this._currentLine = active.line;

      let packageInfo: any = await this.package.getPackageInfo(this._editor?.document, key, this._currentLine);

      if (!packageInfo) {
        return;
      }
      if (packageInfo.line !== this._currentLine) {
        return;
      }

      let md = new MarkdownString(`##### [${key}](${packageInfo.homepage})\n`);
      if (packageInfo.desc) {
        md.appendMarkdown(`##### ${packageInfo.description}\n`);
      }
      if (packageInfo.homepage) {
        md.appendMarkdown(`#### homepage: ${packageInfo.homepage}\n`);
      }
      if (packageInfo.author) {
        md.appendMarkdown(`#### author: ${JSON.stringify(packageInfo.author)}\n`);
      }


      let decoration: DecorationOptions = {
        renderOptions: {
          after: {
            color: new ThemeColor('packagejson.lineForegroundColor'),
            contentText: packageInfo.desc,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none'
          },
        },
        range: new Range(active.line, Number.MAX_SAFE_INTEGER, active.line, Number.MAX_SAFE_INTEGER),
        hoverMessage: md
      };

      editor.setDecorations(annotationDecoration, [decoration]);
    } catch (error) {
      console.log(error);
    }
  }

  clear(editor: TextEditor | undefined) {
    if (this._editor !== editor && this._editor !== undefined) {
      this.clearAnnotations(this._editor);
    }
    this.clearAnnotations(editor);
    this._editor = undefined;
  }


  clearAnnotations(editor: TextEditor | undefined) {
    if (editor === undefined || (editor as any)._disposed === true) { return; }
    editor.setDecorations(annotationDecoration, []);
  }

  updateAction(editor: TextEditor | undefined) {
    const showDecoration = workspace.getConfiguration().get('packageJsonHelper.showDecoration');
    if (!showDecoration || !editor) {
      return;
    }
    this._editor = editor;
    const uri = this?._editor?.document.uri;
    if (uri?.scheme !== 'file' || !uri?.path.endsWith('package.json')) {
      return;
    }
    this.triggerUpdate();
  }

  // Get the active editor for the first time and initialise the regex
  private timeout: any;
  triggerUpdate() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.addDesc(this._editor);
    }, 200);
  }
}

module.exports = function (context: any) {
  let helper = new DescHelper(context);
  if (window.activeTextEditor) {
    helper.updateAction(window.activeTextEditor);
  }
};