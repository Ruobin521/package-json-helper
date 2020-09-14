import {
  DecorationRangeBehavior,
  window,
  TextEditor,
  Range,
  ThemeColor,
  DecorationOptions,
  MarkdownString
} from 'vscode';


import PackageInfoHelper from './packageInfoHelper';

const annotationDecoration = window.createTextEditorDecorationType({
  after: {
    margin: '0 3em 0 3em',
    textDecoration: 'none'
  },
  rangeBehavior: DecorationRangeBehavior.ClosedOpen
});
export class DescHelper {

  private _currentLine = -1;

  private _editor: TextEditor | undefined;

  private package = new PackageInfoHelper();

  async addDesc(editor: TextEditor) {
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
}