interface KrcWord {
  text: string;
  startTime: number; // 相对行开始的偏移 (ms)
  duration: number; // 单词持续时间 (ms)
}

interface KrcLine {
  startTime: number; // 行开始绝对时间 (ms)
  duration: number; // 行总持续时间 (ms)
  words: KrcWord[];
  text: string; // 完整行文本
}

/**
 * 极简 KRC 逐字歌词解析器
 */
export function parseKrc(rawContent: string): KrcLine[] {
  if (!rawContent) return [];

  const lines = rawContent.split(/[\r\n]/);
  const result: KrcLine[] = [];

  for (const line of lines) {
    // 匹配 [开始时间,持续时间]
    const timeMatch = line.match(/^\[(\d+),(\d+)\]/);
    if (!timeMatch || !timeMatch[1] || !timeMatch[2]) continue;

    const lineStartTime = parseInt(timeMatch[1]);
    const lineDuration = parseInt(timeMatch[2]);
    const content = line.replace(timeMatch[0], "");

    // 匹配单词和时间标签: <相对偏移,持续时间,0>文本
    const wordRegex = /<(\d+),(\d+),\d+>([^<]*)/g;
    const words: KrcWord[] = [];
    let fullText = "";

    let match;
    while ((match = wordRegex.exec(content)) !== null) {
      if (!match[1] || !match[2]) continue;
      const startTime = parseInt(match[1]);
      const duration = parseInt(match[2]);
      const text = match[3] || "";

      words.push({ text, startTime, duration });
      fullText += text;
    }

    if (words.length > 0) {
      result.push({
        startTime: lineStartTime,
        duration: lineDuration,
        words,
        text: fullText.trim() || content.replace(/<[^>]+>/g, "").trim(),
      });
    }
  }

  return result.sort((a, b) => a.startTime - b.startTime);
}
