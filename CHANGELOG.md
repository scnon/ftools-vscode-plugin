# Change Log

All notable changes to the "ftools-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
