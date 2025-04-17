# Ftools VSCode Plugin

一个用于 Flutter/Dart 项目的 VSCode 插件，提供国际化文本管理功能。

## ✨ 功能特性

1. 🔍 自动检测中文字符
   - 在 Dart 文件中自动检测中文字符
   - 使用蓝色波浪线标注需要翻译的文本
   - 提供快速修复选项

2. 🌐 快速创建翻译
   - 通过快速修复菜单创建翻译
   - 支持创建新的翻译模块
   - 自动生成规范的翻译 key

3. 📝 翻译文本管理
   - 自动生成 `const_key.dart` 文件
   - 维护 `translate.json` 配置文件
   - 支持多模块管理

4. 👀 内联翻译预览
   - 在代码中直接显示中文翻译
   - 使用快捷键切换显示/隐藏翻译文本
   - 悬停显示翻译 key 信息

## 🚀 安装

1. 在 VS Code 中打开扩展面板 (Ctrl+Shift+X / Cmd+Shift+X)
2. 搜索 "Ftools"
3. 点击 "Install" 安装插件

## 📖 使用说明

### 检测中文文本
- 插件会自动检测 Dart 文件中的中文字符
- 检测到的中文文本会显示蓝色波浪线
- 将鼠标悬停在标注处可以看到提示信息

### 创建翻译
1. 将光标放在带有波浪线的中文文本上
2. 点击快速修复图标或使用快捷键 (Ctrl+. / Cmd+.)
3. 选择 "创建翻译" 选项
4. 选择或创建翻译模块
5. 输入翻译 key（使用下划线分割，如：`hello_world`）

### 翻译文本预览
- 使用快捷键 `Ctrl+Alt+T`（Mac：`Cmd+Alt+T`）切换翻译文本的显示/隐藏
- 将鼠标悬停在翻译文本上可以查看原始的 key

### 文件结构
```
your_project/
  ├── lib/
  │   └── i18n/
  │       └── const_key.dart  // 自动生成的常量文件
  └── translate/
      └── translate.json      // 翻译配置文件
```

### 配置文件格式

#### translate.json
```json
[
  {
    "prefix": "common",
    "content": {
      "hello_world": "你好世界",
      "submit": "提交"
    }
  },
  {
    "prefix": "user",
    "content": {
      "login": "登录",
      "register": "注册"
    }
  }
]
```

#### const_key.dart
```dart
library i18n_const_key;

class Common {
    static const kHelloWorld = "common_hello_world";
    static const kSubmit = "common_submit";
}

class User {
    static const kLogin = "user_login";
    static const kRegister = "user_register";
}

class I18nKey {
    static final common = Common();
    static final user = User();
}
```

## ⌨️ 快捷键

| 功能 | Windows/Linux | macOS |
|------|---------------|-------|
| 切换翻译文本显示 | `Ctrl+Alt+T` | `Cmd+Alt+T` |
| 显示快速修复菜单 | `Ctrl+.` | `Cmd+.` |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
