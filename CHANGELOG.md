# Change Log

All notable changes to the "ftools-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.5] - 2025-06-26

### Added

- 新增：侧边栏中文扫描功能，支持扫描整个 Flutter 项目中包含中文的文件
- 新增：树形结构展示扫描结果，显示文件及其中的中文内容
- 新增：点击中文条目可直接跳转到具体位置并高亮显示
- 新增：工具栏按钮（扫描、刷新、配置）
- 新增：可配置的排除目录列表（默认排除 .git, build, node_modules 等）
- 新增：可配置的文件扩展名过滤
- 新增：可配置是否包含注释中的中文

### Fixed

- 修复：行尾注释检测逻辑，正确处理字符串中包含 "//" 的情况（如 "<https://api.com"）>
- 修复：注释中的中文在设置为忽略注释时能被正确过滤
- 修复：中文检测正则表达式，支持以英文开头的中文句子（如 "avatarUrl和textName不能同时为空"）
- 修复：包含标点符号的中文句子被错误拆分的问题，现在能正确识别完整句子

### Improved

- 重构：提取公共代码到 utils.ts，统一中文检测和注释处理逻辑
- 优化：减少约 150 行重复代码，提高代码可维护性
- 优化：统一正则表达式定义，确保两个功能模块的一致性
- 优化：改进中文正则表达式，更准确地匹配包含中英文混合、标点符号的完整句子

## [0.1.4] - 2025-06-25

- 优化：创建翻译时，替换内容的 k模块名称会自动将 snake_case 转为 snakCase（如 user_center -> userCenter）。

## [0.1.3] - 2025-06-25

### Changed

- 优化：查找翻译模块时，兼容 snake_case 和 camelCase 的模块名称（如 user_center、userCenter 都能正确匹配 user_center 模块）。

## [0.1.2] - 2025-05-30

### Added

- 添加了 logo

## [0.1.1] - 2025-05-30

### Fixed

- 修复了中英文混合字符串（如"中文A中文"）被错误拆分的问题，现在会将其作为一个整体进行处理

## [0.1.0]

- Initial release
