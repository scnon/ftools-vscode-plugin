# Ftools VSCode Extension

Flutter/Dart 项目的国际化文本管理工具

## 功能特性

### 🔍 中文扫描

- **智能扫描**：递归扫描项目中包含中文的文件
- **精确定位**：点击列表项直接跳转到具体中文位置并高亮显示
- **树形展示**：分层显示文件和其中的中文内容
- **灵活配置**：支持自定义排除目录、文件类型等

### 🌐 翻译管理

- **快速创建翻译**：右键中文文本快速创建翻译条目
- **内联显示**：在代码中直接显示翻译内容
- **模块化管理**：支持按模块组织翻译内容
- **自动生成**：自动生成 const_key.dart 文件

## 使用方法

### 中文扫描

1. **打开侧边栏**：在资源管理器中找到"中文扫描"面板
2. **开始扫描**：点击搜索图标 🔍 开始扫描项目
3. **查看结果**：
   - 文件名后显示中文数量：`main.dart (3)`
   - 展开文件查看具体中文内容
   - 点击中文条目直接跳转并高亮

4. **配置扫描**：点击设置图标 ⚙️ 打开配置面板

### 配置选项

在 VSCode 设置中搜索 `ftools.chineseScan` 可以找到以下配置：

```json
{
  // 排除的目录列表
  "ftools.chineseScan.excludeDirs": [
    ".git", "build", "node_modules", ".dart_tool", 
    ".vscode", "ios", "android", "web", 
    "linux", "macos", "windows", "lib/i18n"
  ],
  
  // 是否扫描注释中的中文
  "ftools.chineseScan.includeComments": false,
  
  // 要扫描的文件扩展名
  "ftools.chineseScan.fileExtensions": [".dart"]
}
```

### 翻译管理

1. **创建翻译**：
   - 选中中文文本
   - 右键选择"创建翻译"
   - 选择或创建翻译模块
   - 输入翻译键名

2. **查看翻译**：
   - 翻译键会在代码中显示对应的中文内容
   - 使用 `Ctrl+Alt+T` (Mac: `Cmd+Alt+T`) 切换显示/隐藏

## 快捷键

- `Ctrl+Alt+T` (Mac: `Cmd+Alt+T`): 切换翻译文本折叠

## 配置选项

```json
{
  // 是否自动生成 const_key.dart 文件
  "ftools.generateConstKeyFile": true,
  
  // 中文扫描排除目录
  "ftools.chineseScan.excludeDirs": [
    ".git", "build", "node_modules", ".dart_tool",
    ".vscode", "ios", "android", "web", 
    "linux", "macos", "windows", "lib/i18n"
  ],
  
  // 是否扫描注释中的中文
  "ftools.chineseScan.includeComments": false,
  
  // 扫描的文件扩展名
  "ftools.chineseScan.fileExtensions": [".dart"]
}
```

## 更新日志

### v0.1.4

- ✨ 新增中文扫描功能
- 🎯 支持精确定位到中文位置
- ⚙️ 添加可配置的扫描选项
- 🌲 树形结构展示扫描结果
- 📁 支持自定义排除目录
- 💬 支持选择是否扫描注释

### 之前版本

- 翻译管理功能
- 内联翻译显示
- 自动生成常量文件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
