export interface ScriptComponentReadability {
  heading: string;
  content: string;
  wordCount: number;
  readabilityScore: number;
  gradeLevel: number;
}

export interface ScriptReadabilityAnalysis {
  averageGradeLevel: string;
  passesThirdGradeTest: boolean;
  components: ScriptComponentReadability[];
}

const HEADING_REGEX = /\*\*([^*]+):\*\*/g;

export class ComponentReadabilityService {
  analyzeScriptComponents(script: string): ScriptReadabilityAnalysis {
    const components = this.extractComponents(script).map(({ heading, content }) => {
      const words = this.tokenize(content);
      const score = this.calculateReadabilityScore(content, words);
      const grade = this.scoreToGradeLevel(score);

      return {
        heading,
        content: content.trim(),
        wordCount: words.length,
        readabilityScore: score,
        gradeLevel: grade,
      };
    });

    const averageGrade = components.length
      ? components.reduce((sum, component) => sum + component.gradeLevel, 0) / components.length
      : 0;

    return {
      components,
      averageGradeLevel: averageGrade.toFixed(1),
      passesThirdGradeTest: averageGrade <= 3.5,
    };
  }

  private extractComponents(script: string): Array<{ heading: string; content: string }> {
    const sections: Array<{ heading: string; content: string }> = [];
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    let lastHeading = 'Introduction';

    const normalizedScript = script.replace(/\r\n/g, '\n');

    while ((match = HEADING_REGEX.exec(normalizedScript)) !== null) {
      const heading = match[1].trim();
      const startIndex = match.index + match[0].length;
      const content = normalizedScript.slice(lastIndex, match.index).trim();

      if (sections.length > 0) {
        sections[sections.length - 1].content = content;
      }

      sections.push({ heading, content: '' });
      lastHeading = heading;
      lastIndex = startIndex;
    }

    const trailingContent = normalizedScript.slice(lastIndex).trim();
    if (sections.length === 0) {
      sections.push({ heading: lastHeading, content: trailingContent || script });
    } else {
      sections[sections.length - 1].content = trailingContent;
    }

    return sections;
  }

  private tokenize(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  private scoreToGradeLevel(score: number): number {
    // Rough mapping from Flesch Reading Ease to grade level
    if (score >= 90) return 1;
    if (score >= 80) return 2;
    if (score >= 70) return 3;
    if (score >= 60) return 6;
    if (score >= 50) return 8;
    if (score >= 30) return 10;
    return 12;
  }

  private calculateReadabilityScore(content: string, words: string[]): number {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) {
      return 0;
    }

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private countSyllables(word: string): number {
    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;

    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        syllableCount += 1;
      }
      previousWasVowel = isVowel;
    }

    if (word.endsWith('e')) {
      syllableCount = Math.max(1, syllableCount - 1);
    }

    return Math.max(1, syllableCount);
  }
}

export default ComponentReadabilityService;
