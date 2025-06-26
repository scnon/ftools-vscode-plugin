import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ChineseMatch, findChineseInLine } from "./utils";

// 中文匹配信息接口已移动到 utils.ts

// 文件中文信息接口
interface ChineseFileInfo {
  filePath: string;
  matches: ChineseMatch[];
}

// 树形视图项目
export class ChineseFileItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly filePath: string,
    public readonly chineseMatch?: ChineseMatch,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.None
  ) {
    super(label, collapsibleState);

    if (chineseMatch) {
      // 中文匹配项
      this.tooltip = `${chineseMatch.text} (第${chineseMatch.line + 1}行)`;
      this.description = `第${chineseMatch.line + 1}行`;
      this.command = {
        command: "ftools-vscode.openChineseLocation",
        title: "定位到中文位置",
        arguments: [filePath, chineseMatch.line, chineseMatch.column],
      };
      this.iconPath = new vscode.ThemeIcon("symbol-string");
    } else {
      // 文件项
      this.tooltip = filePath;
      this.description = path.basename(path.dirname(filePath));
      this.iconPath = new vscode.ThemeIcon("file");
    }
  }
}

// 树形数据提供者
export class ChineseFilesTreeDataProvider
  implements vscode.TreeDataProvider<ChineseFileItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ChineseFileItem | undefined | null | void
  > = new vscode.EventEmitter<ChineseFileItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    ChineseFileItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private chineseFiles: ChineseFileInfo[] = [];

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ChineseFileItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ChineseFileItem): Thenable<ChineseFileItem[]> {
    if (!element) {
      // 返回根级别的文件列表
      return Promise.resolve(
        this.chineseFiles.map(
          (fileInfo) =>
            new ChineseFileItem(
              `${path.basename(fileInfo.filePath)} (${
                fileInfo.matches.length
              })`,
              fileInfo.filePath,
              undefined,
              vscode.TreeItemCollapsibleState.Expanded
            )
        )
      );
    } else if (!element.chineseMatch) {
      // 返回文件中的中文匹配项
      const fileInfo = this.chineseFiles.find(
        (f) => f.filePath === element.filePath
      );
      if (fileInfo) {
        return Promise.resolve(
          fileInfo.matches.map(
            (match) =>
              new ChineseFileItem(`${match.text}`, element.filePath, match)
          )
        );
      }
    }
    return Promise.resolve([]);
  }

  // 扫描包含中文的文件
  async scanChineseFiles(): Promise<void> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) {
      this.chineseFiles = [];
      this.refresh();
      return;
    }

    // 获取配置
    const config = vscode.workspace.getConfiguration("ftools.chineseScan");
    const excludeDirs: string[] = config.get("excludeDirs", [
      ".git",
      "build",
      "node_modules",
      ".dart_tool",
    ]);
    const includeComments: boolean = config.get("includeComments", false);
    const fileExtensions: string[] = config.get("fileExtensions", [".dart"]);

    const result: ChineseFileInfo[] = [];
    await this.walk(root, result, excludeDirs, includeComments, fileExtensions);
    this.chineseFiles = result;
    this.refresh();

    const totalMatches = result.reduce(
      (sum, file) => sum + file.matches.length,
      0
    );
    vscode.window.showInformationMessage(
      `共找到 ${result.length} 个文件，${totalMatches} 处中文`
    );
  }

  // 递归遍历目录
  private async walk(
    dir: string,
    result: ChineseFileInfo[],
    excludeDirs: string[],
    includeComments: boolean,
    fileExtensions: string[]
  ) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // 检查是否在排除目录列表中
          // 支持路径匹配，例如 "lib/i18n" 会匹配 "/project/lib/i18n" 路径
          const shouldExclude = excludeDirs.some((excludeDir) => {
            // 如果排除项包含路径分隔符，进行路径匹配
            if (excludeDir.includes("/") || excludeDir.includes("\\")) {
              const normalizedExclude = excludeDir.replace(/[\\\/]/g, path.sep);
              const normalizedPath = fullPath.replace(/[\\\/]/g, path.sep);
              return (
                normalizedPath.endsWith(path.sep + normalizedExclude) ||
                normalizedPath.includes(path.sep + normalizedExclude + path.sep)
              );
            } else {
              // 否则只匹配目录名
              return entry.name === excludeDir;
            }
          });

          if (shouldExclude) continue;
          await this.walk(
            fullPath,
            result,
            excludeDirs,
            includeComments,
            fileExtensions
          );
        } else if (entry.isFile()) {
          // 检查文件扩展名
          const hasValidExtension = fileExtensions.some((ext) =>
            fullPath.endsWith(ext)
          );
          if (hasValidExtension) {
            const matches = await this.findChineseInFile(
              fullPath,
              includeComments
            );
            if (matches.length > 0) {
              result.push({
                filePath: fullPath,
                matches: matches,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("扫描目录时出错:", error);
    }
  }

  // 在文件中查找中文
  private async findChineseInFile(
    filePath: string,
    includeComments: boolean
  ): Promise<ChineseMatch[]> {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");
      const matches: ChineseMatch[] = [];

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const lineText = lines[lineIndex];
        const lineMatches = findChineseInLine(
          lineText,
          lineIndex,
          includeComments
        );
        matches.push(...lineMatches);
      }

      return matches;
    } catch (error) {
      console.error(`读取文件 ${filePath} 时出错:`, error);
      return [];
    }
  }

  // 打开配置
  async openConfig(): Promise<void> {
    await vscode.commands.executeCommand(
      "workbench.action.openSettings",
      "ftools.chineseScan"
    );
  }
}
