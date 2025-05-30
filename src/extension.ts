// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// 用于存储诊断集合
let diagnosticCollection: vscode.DiagnosticCollection;

// 用于存储装饰器类型
let inlineDecorator: vscode.TextEditorDecorationType;

// 用于跟踪折叠状态
let isFolded = true;

// 翻译配置接口
interface TranslateModule {
  prefix: string;
  content: { [key: string]: string };
}

// 获取工作区根目录
function getWorkspaceRoot(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri.fsPath;
  }
  return undefined;
}

// 将下划线格式转换为驼峰格式
function toCamelCase(str: string): string {
  return str
    .split("_")
    .map((word, index) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

// 将驼峰格式转换为下划线格式
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

// 更新 const_key.dart 文件
function updateConstKeyFile(config: TranslateModule[]): void {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return;
  }

  const constKeyPath = path.join(
    workspaceRoot,
    "lib",
    "i18n",
    "const_key.dart"
  );

  // 生成文件内容
  let content = "library i18n_const_key;\n\n";

  // 生成每个模块的类
  config.forEach((module) => {
    content += `class ${
      module.prefix.charAt(0).toUpperCase() + module.prefix.slice(1)
    } {\n`;
    Object.keys(module.content).forEach((key) => {
      const camelKey = toCamelCase(key);
      const snakeKey = toSnakeCase(key);
      content += `    static const k${camelKey} = "${module.prefix}_${snakeKey}";\n`;
    });
    content += "}\n\n";
  });

  // 生成 I18nKey 类
  content += "class I18nKey {\n";
  config.forEach((module) => {
    const className =
      module.prefix.charAt(0).toUpperCase() + module.prefix.slice(1);
    content += `    static final ${module.prefix} = ${className}();\n`;
  });
  content += "}\n";

  try {
    // 确保目录存在
    const dir = path.dirname(constKeyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(constKeyPath, content, "utf8");
  } catch (error) {
    console.error("更新 const_key.dart 失败:", error);
  }
}

// 读取翻译配置
function readTranslateConfig(): TranslateModule[] {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return [];
  }

  const configPath = path.join(workspaceRoot, "translate", "translate.json");
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("读取翻译配置失败:", error);
  }
  return [];
}

// 保存翻译配置
async function saveTranslateConfig(config: TranslateModule[]) {
  try {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
      vscode.window.showErrorMessage("请先打开工作区");
      return;
    }
    const configPath = path.join(workspaceRoot, "translate", "translate.json");
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // 根据配置决定是否生成 const_key.dart 文件
    const generateConstKeyFile = vscode.workspace
      .getConfiguration("ftools")
      .get("generateConstKeyFile", true);
    if (generateConstKeyFile) {
      await updateConstKeyFile(config);
    }
  } catch (error) {
    vscode.window.showErrorMessage("保存翻译配置失败：" + error);
  }
}

// 更新文件的诊断信息
function updateDiagnostics(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();

  // 匹配中文字符的正则表达式
  const chineseRegex = /(?:[\u4e00-\u9fa5]+[a-zA-Z]*[\u4e00-\u9fa5]*)+/g;
  let match;

  // 逐行处理文本
  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
    const line = document.lineAt(lineIndex);
    const lineText = line.text;

    // 检查该行是否包含注释
    const isComment =
      lineText.trim().startsWith("//") ||
      lineText.trim().startsWith("/*") ||
      lineText.trim().startsWith("*");

    // 如果不是注释行，则检查中文字符
    if (!isComment) {
      while ((match = chineseRegex.exec(lineText)) !== null) {
        const startPos = new vscode.Position(lineIndex, match.index);
        const endPos = new vscode.Position(
          lineIndex,
          match.index + match[0].length
        );
        const range = new vscode.Range(startPos, endPos);

        const diagnostic = new vscode.Diagnostic(
          range,
          "发现中文字符，建议添加翻译",
          vscode.DiagnosticSeverity.Information
        );

        diagnostic.code = "createTranslation";
        diagnostics.push(diagnostic);
      }
    }
  }

  diagnosticCollection.set(document.uri, diagnostics);
}

// 更新文件的内联装饰
async function updateInlineDecorations(editor: vscode.TextEditor) {
  const document = editor.document;
  if (document.languageId !== "dart") {
    return;
  }

  const decorations: vscode.DecorationOptions[] = [];

  // 匹配 Ikey.模块名.k变量名.tr 的正则表达式
  const keyRegex = /Ikey\.(\w+)\.k([A-Z][a-zA-Z]+)\.tr/g;

  // 读取翻译配置
  const config = readTranslateConfig();

  // 逐行处理文本
  for (let line = 0; line < document.lineCount; line++) {
    const lineText = document.lineAt(line).text;
    let match;

    while ((match = keyRegex.exec(lineText)) !== null) {
      const modulePrefix = match[1];
      const camelKey = match[2];
      const snakeKey = toSnakeCase(camelKey);

      // 查找对应的翻译模块
      const module = config.find((m) => m.prefix === modulePrefix);
      if (module && module.content[snakeKey]) {
        const startPos = new vscode.Position(line, match.index);
        const endPos = new vscode.Position(line, match.index + match[0].length);

        // 创建装饰
        const decoration: vscode.DecorationOptions = {
          range: new vscode.Range(startPos, endPos),
          hoverMessage: `🌐 ${modulePrefix}.${snakeKey}: ${module.content[snakeKey]}`,
          renderOptions: {
            before: {
              contentText: `${module.content[snakeKey]}`,
              color: new vscode.ThemeColor("editorCodeLens.foreground"),
              margin: "0 4px",
              border: "1px solid #ffffff1a",
              backgroundColor: "#ffffff0a",
            },
          },
        };

        decorations.push(decoration);
      }
    }
  }

  // 应用装饰
  editor.setDecorations(inlineDecorator, decorations);
}

// 更新装饰器类型
function updateDecoratorType(context: vscode.ExtensionContext) {
  // 如果已存在，先销毁
  if (inlineDecorator) {
    inlineDecorator.dispose();
  }

  if (isFolded) {
    // 创建新的装饰器类型
    inlineDecorator = vscode.window.createTextEditorDecorationType({
      textDecoration: isFolded ? "none; display: none" : "none",
      opacity: isFolded ? "0.6" : "1",
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      before: isFolded
        ? {
            contentText: "",
          }
        : undefined,
    });
  }

  // 更新所有打开的编辑器
  vscode.window.visibleTextEditors.forEach((editor) => {
    if (editor.document.languageId === "dart") {
      updateInlineDecorations(editor);
    }
  });

  // 保存状态
  context.workspaceState.update("translationFolded", isFolded);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "ftools-vscode" is now active!');

  // 恢复折叠状态
  isFolded = context.workspaceState.get("translationFolded", true);

  // 创建诊断集合
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("ftools-vscode");

  // 初始化装饰器
  updateDecoratorType(context);

  // 注册文档变更事件监听器
  const changeDocumentListener = vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (event.document.languageId === "dart") {
        updateDiagnostics(event.document);
        // 更新当前编辑器的装饰
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === event.document) {
          updateInlineDecorations(editor);
        }
      }
    }
  );

  // 注册文档打开事件监听器
  const openDocumentListener = vscode.workspace.onDidOpenTextDocument(
    (document) => {
      if (document.languageId === "dart") {
        updateDiagnostics(document);
      }
    }
  );

  // 注册编辑器变更事件监听器
  const changeEditorListener = vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor && editor.document.languageId === "dart") {
        updateDiagnostics(editor.document);
        updateInlineDecorations(editor);
      }
    }
  );

  // 注册快速修复提供者
  const codeActionProvider = vscode.languages.registerCodeActionsProvider(
    { scheme: "file", language: "dart" },
    {
      provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext
      ) {
        const codeActions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
          if (diagnostic.code === "createTranslation") {
            const codeAction = new vscode.CodeAction(
              "创建翻译",
              vscode.CodeActionKind.QuickFix
            );

            codeAction.diagnostics = [diagnostic];
            codeAction.command = {
              command: "ftools-vscode.createTranslation",
              title: "创建翻译",
              arguments: [
                document,
                diagnostic.range,
                document.getText(diagnostic.range),
              ],
            };

            codeActions.push(codeAction);
          }
        }

        return codeActions;
      },
    },
    {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }
  );

  // 注册创建翻译命令
  const createTranslationCommand = vscode.commands.registerCommand(
    "ftools-vscode.createTranslation",
    async (
      document: vscode.TextDocument,
      range: vscode.Range,
      text: string
    ) => {
      // 读取翻译配置
      const config = readTranslateConfig();

      // 准备模块选项
      const moduleOptions = config.map((m) => m.prefix);
      moduleOptions.push("创建新模块");

      // 选择模块
      const selectedModule = await vscode.window.showQuickPick(moduleOptions, {
        placeHolder: "选择翻译模块或创建新模块",
      });

      if (!selectedModule) {
        return;
      }

      let modulePrefix: string;
      let moduleContent: { [key: string]: string };

      if (selectedModule === "创建新模块") {
        // 输入新模块名称
        modulePrefix =
          (await vscode.window.showInputBox({
            prompt: "请输入新模块名称",
            placeHolder: "例如: common, user, etc.",
          })) || "";

        if (!modulePrefix) {
          return;
        }

        moduleContent = {};
      } else {
        // 使用现有模块
        const module = config.find((m) => m.prefix === selectedModule);
        if (module) {
          modulePrefix = module.prefix;
          moduleContent = module.content;
        } else {
          return;
        }
      }

      // 输入翻译 key
      const translationKey = await vscode.window.showInputBox({
        prompt: "请输入翻译 key （下划线分割）",
        placeHolder: "例如: bills_title, account_address, etc.",
      });

      if (!translationKey) {
        return;
      }

      // 更新翻译配置
      moduleContent[translationKey] = text;

      if (selectedModule === "创建新模块") {
        config.push({
          prefix: modulePrefix,
          content: moduleContent,
        });
      } else {
        const moduleIndex = config.findIndex((m) => m.prefix === modulePrefix);
        if (moduleIndex !== -1) {
          config[moduleIndex].content = moduleContent;
        }
      }

      // 保存配置
      await saveTranslateConfig(config);

      // 创建编辑
      const edit = new vscode.WorkspaceEdit();
      const camelKey = toCamelCase(translationKey);
      const replacement = `Ikey.${modulePrefix}.k${camelKey}.tr`;

      // 获取整行文本以正确处理引号
      const line = document.lineAt(range.start.line);
      const lineText = line.text;

      // 检查选中文本前后的字符是否为引号
      let startChar = range.start.character;
      let endChar = range.end.character;

      // 向前检查是否有引号
      if (
        startChar > 0 &&
        (lineText[startChar - 1] === '"' || lineText[startChar - 1] === "'")
      ) {
        startChar -= 1;
      }

      // 向后检查是否有引号
      if (
        endChar < lineText.length &&
        (lineText[endChar] === '"' || lineText[endChar] === "'")
      ) {
        endChar += 1;
      }

      // 创建新的范围，包含引号
      const newRange = new vscode.Range(
        new vscode.Position(range.start.line, startChar),
        new vscode.Position(range.end.line, endChar)
      );

      // 使用新范围进行替换
      edit.replace(document.uri, newRange, replacement);

      // 应用编辑
      await vscode.workspace.applyEdit(edit);

      // 显示成功消息
      vscode.window.showInformationMessage(`翻译已添加到 ${modulePrefix} 模块`);
    }
  );

  // 注册切换折叠命令
  const toggleFoldCommand = vscode.commands.registerCommand(
    "ftools-vscode.toggleTranslationFold",
    () => {
      isFolded = !isFolded;
      updateDecoratorType(context);
      // 显示状态消息
      // vscode.window.showInformationMessage(
      //   `翻译文本已${isFolded ? "折叠" : "展开"}`
      // );
    }
  );

  // 初始化当前打开的文件
  if (vscode.window.activeTextEditor) {
    const editor = vscode.window.activeTextEditor;
    if (editor.document.languageId === "dart") {
      updateDiagnostics(editor.document);
      updateInlineDecorations(editor);
    }
  }

  context.subscriptions.push(
    changeDocumentListener,
    openDocumentListener,
    changeEditorListener,
    codeActionProvider,
    createTranslationCommand,
    toggleFoldCommand,
    inlineDecorator
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (diagnosticCollection) {
    diagnosticCollection.dispose();
  }
  if (inlineDecorator) {
    inlineDecorator.dispose();
  }
}
