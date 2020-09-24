import * as path from 'path';
import { TextDocument, TextEditor } from 'vscode';
import * as shell from 'shelljs';
import * as fs from 'fs';
class PackageInfoHelper {
  async getPackageInfo(document: TextDocument, packageName: string, line: number) {
    let fileName = document?.fileName || '';
    if (!fileName) {
      return;
    }
    let node_modules = fileName.replace('package.json', 'node_modules');
    if (!this.fsExistsSync(node_modules)) {
      let result: any = await this.execCmd(`npm info ${packageName} -json`);
      return this.generateResult(result, line, 1);
    }
    let packageFolder = path.join(node_modules, packageName);

    if (!this.fsExistsSync(packageFolder)) {
      return undefined;
    }

    let jsonFile = path.join(packageFolder, 'package.json');

    if (!this.fsExistsSync(jsonFile)) {
      return undefined;
    }
    let fileContent = fs.readFileSync(jsonFile, 'utf8');
    let data = this.generateResult(fileContent, line);
    return data;
  }

  /**
   * 
   * @param fileContent 
   * @param line 
   * @param from  info source : 0 local node_modules, 1 npm info
   */
  generateResult(fileContent: string, line: number, from = 0) {
    try {
      if (!fileContent) {
        return undefined;
      }
      let { version, description, author, ...others } = JSON.parse(fileContent);

      if (author && Object.prototype.toString.call(author) === '[object Object]') {
        author = this.getObjValue(author);
      }
      return {
        desc: 'version:' + version + (from ? '(from network)' : '') + ' @ ' + description,
        line,
        author,
        ...others,
        description,
        version
      };
    } catch (error) {
      return undefined;
    }
  }


  fsExistsSync(path: string) {
    try {
      fs.accessSync(path);
    } catch (error) {
      return false;
    }
    return true;
  }

  getObjValue(obj: any) {
    let result = '';
    let temp = Object.keys(obj).map(key => {
      return obj[key];
    });
    return temp.join(',');
  }

  execCmd(cmd: string) {
    return new Promise((resolve, reject) => {
      shell.exec(cmd, (code, stdout, stderr) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          resolve(null);
        }
      });
    });
  }
}

export default PackageInfoHelper;
