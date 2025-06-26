// 公共工具函数

/**
 * 中文匹配结果接口
 */
export interface ChineseMatch {
  text: string;
  line: number;
  column: number;
  lineText: string;
}

/**
 * 中文字符正则表达式（匹配包含中文的完整词组或句子）
 */
export const CHINESE_REGEX =
  /[a-zA-Z0-9]*[\u4e00-\u9fa5][\u4e00-\u9fa5a-zA-Z0-9\s，。！？、；：""''（）【】《》〈〉「」『』〔〕［］｛｝～—–\-_]*|[\u4e00-\u9fa5]/g;

/**
 * 检查行是否为完整的注释行
 * @param lineText 行文本
 * @returns 是否为注释行
 */
export function isFullCommentLine(lineText: string): boolean {
  const trimmedLine = lineText.trim();
  return (
    trimmedLine.startsWith("//") ||
    trimmedLine.startsWith("/*") ||
    trimmedLine.startsWith("*")
  );
}

/**
 * 找到真正的行尾注释位置（不在字符串内的 //）
 * @param lineText 行文本
 * @returns 注释开始位置，如果没有注释返回 -1
 */
export function findRealCommentIndex(lineText: string): number {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let i = 0; i < lineText.length - 1; i++) {
    const char = lineText[i];
    const nextChar = lineText[i + 1];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (
      char === "/" &&
      nextChar === "/" &&
      !inSingleQuote &&
      !inDoubleQuote
    ) {
      return i;
    }
  }

  return -1;
}

/**
 * 从文本中提取去除注释后的代码部分
 * @param lineText 行文本
 * @param includeComments 是否包含注释
 * @returns 处理后的文本
 */
export function extractCodeOnlyText(
  lineText: string,
  includeComments: boolean
): string {
  if (includeComments) {
    return lineText;
  }

  // 检查是否是完整的注释行
  if (isFullCommentLine(lineText)) {
    return "";
  }

  // 找到真正的行尾注释位置
  const commentIndex = findRealCommentIndex(lineText);
  if (commentIndex !== -1) {
    return lineText.substring(0, commentIndex);
  }

  return lineText;
}

/**
 * 在文本中查找中文匹配项
 * @param text 要搜索的文本
 * @param lineIndex 行索引
 * @param originalLineText 原始行文本（用于显示）
 * @returns 中文匹配项数组
 */
export function findChineseMatches(
  text: string,
  lineIndex: number,
  originalLineText: string
): ChineseMatch[] {
  const matches: ChineseMatch[] = [];
  const regex = new RegExp(CHINESE_REGEX.source, CHINESE_REGEX.flags);
  let match;

  regex.lastIndex = 0; // 重置正则表达式状态
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      text: match[0],
      line: lineIndex,
      column: match.index,
      lineText: originalLineText.trim(),
    });
  }

  return matches;
}

/**
 * 在行文本中查找中文，支持注释过滤
 * @param lineText 行文本
 * @param lineIndex 行索引
 * @param includeComments 是否包含注释中的中文
 * @returns 中文匹配项数组
 */
export function findChineseInLine(
  lineText: string,
  lineIndex: number,
  includeComments: boolean
): ChineseMatch[] {
  const codeOnlyText = extractCodeOnlyText(lineText, includeComments);

  // 如果是注释行且不包含注释，返回空数组
  if (codeOnlyText === "") {
    return [];
  }

  return findChineseMatches(codeOnlyText, lineIndex, lineText);
}
