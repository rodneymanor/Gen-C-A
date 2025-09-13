export interface ReadabilityScore {
  score: number;
  level: "easy" | "medium" | "hard";
  description: string;
  suggestions: string[];
  gradeLevel: string;
}

export interface ReadabilityAnalysis {
  overall: ReadabilityScore;
  sentences: Array<{
    text: string;
    score: number;
    level: "easy" | "medium" | "hard";
    issues: string[];
    startIndex: number;
    endIndex: number;
  }>;
  statistics: {
    totalWords: number;
    totalSentences: number;
    averageWordsPerSentence: number;
    averageSyllablesPerWord: number;
    complexWords: number;
    passiveVoiceCount: number;
    adverbCount: number;
  };
}

export interface ReadabilitySettings {
  algorithm: "flesch" | "gunning-fog" | "coleman-liau" | "automated";
  thresholds: {
    easy: number;
    medium: number;
    hard: number;
  };
  enabledChecks: {
    sentenceLength: boolean;
    syllableComplexity: boolean;
    passiveVoice: boolean;
    adverbs: boolean;
    readingLevel: boolean;
  };
  customWeights: {
    wordLength: number;
    sentenceLength: number;
    syllableCount: number;
    passiveVoice: number;
  };
}

class EnhancedReadabilityService {
  private settings: ReadabilitySettings;

  constructor(settings: ReadabilitySettings) {
    this.settings = settings;
  }

  updateSettings(newSettings: ReadabilitySettings) {
    this.settings = newSettings;
  }

  analyzeText(text: string): ReadabilityAnalysis {
    const sentences = this.splitIntoSentences(text);
    const words = this.extractWords(text);

    const sentenceAnalyses = sentences.map((sentence) => this.analyzeSentence(sentence, text));

    const statistics = this.calculateStatistics(text, words, sentences);
    const overallScore = this.calculateOverallScore(statistics);

    return {
      overall: overallScore,
      sentences: sentenceAnalyses,
      statistics,
    };
  }

  private splitIntoSentences(text: string): Array<{ text: string; startIndex: number; endIndex: number }> {
    const sentences: Array<{ text: string; startIndex: number; endIndex: number }> = [];
    const sentenceRegex = /[.!?]+/g;
    let lastIndex = 0;
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const endIndex = match.index + match[0].length;
      const sentenceText = text.slice(lastIndex, endIndex).trim();

      if (sentenceText.length > 0) {
        sentences.push({
          text: sentenceText,
          startIndex: lastIndex,
          endIndex: endIndex,
        });
      }

      lastIndex = endIndex;
    }

    // Handle remaining text if no ending punctuation
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex).trim();
      if (remainingText.length > 0) {
        sentences.push({
          text: remainingText,
          startIndex: lastIndex,
          endIndex: text.length,
        });
      }
    }

    return sentences;
  }

  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  private analyzeSentence(sentence: { text: string; startIndex: number; endIndex: number }, fullText: string) {
    const words = this.extractWords(sentence.text);
    const issues: string[] = [];

    // Check sentence length
    if (this.settings.enabledChecks.sentenceLength && words.length > 20) {
      issues.push(`Long sentence (${words.length} words). Consider breaking it up.`);
    }

    // Check for passive voice
    if (this.settings.enabledChecks.passiveVoice && this.hasPassiveVoice(sentence.text)) {
      issues.push("Contains passive voice. Consider using active voice.");
    }

    // Check for adverbs
    if (this.settings.enabledChecks.adverbs) {
      const adverbs = this.findAdverbs(sentence.text);
      if (adverbs.length > 0) {
        issues.push(`Contains ${adverbs.length} adverb(s): ${adverbs.join(", ")}. Consider stronger verbs.`);
      }
    }

    // Check syllable complexity
    if (this.settings.enabledChecks.syllableComplexity) {
      const avgSyllables = this.calculateAverageSyllables(words);
      if (avgSyllables > 1.8) {
        issues.push("Complex words detected. Consider simpler alternatives.");
      }
    }

    const score = this.calculateSentenceScore(sentence.text, words, issues);
    const level = this.determineLevel(score);

    return {
      text: sentence.text,
      score,
      level,
      issues,
      startIndex: sentence.startIndex,
      endIndex: sentence.endIndex,
    };
  }

  private calculateSentenceScore(sentenceText: string, words: string[], issues: string[]): number {
    let score = 100;

    // Penalize based on sentence length
    if (words.length > 15) {
      score -= (words.length - 15) * this.settings.customWeights.sentenceLength;
    }

    // Penalize based on word complexity
    const avgSyllables = this.calculateAverageSyllables(words);
    if (avgSyllables > 1.5) {
      score -= (avgSyllables - 1.5) * this.settings.customWeights.syllableCount * 10;
    }

    // Penalize for passive voice
    if (this.hasPassiveVoice(sentenceText)) {
      score -= this.settings.customWeights.passiveVoice;
    }

    // Penalize for each issue
    score -= issues.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateStatistics(
    text: string,
    words: string[],
    sentences: Array<{ text: string; startIndex: number; endIndex: number }>,
  ) {
    const totalWords = words.length;
    const totalSentences = sentences.length;
    const averageWordsPerSentence = totalWords / totalSentences;

    const syllableCounts = words.map((word) => this.countSyllables(word));
    const totalSyllables = syllableCounts.reduce((sum, count) => sum + count, 0);
    const averageSyllablesPerWord = totalSyllables / totalWords;

    const complexWords = words.filter((word) => this.countSyllables(word) >= 3).length;
    const passiveVoiceCount = sentences.filter((s) => this.hasPassiveVoice(s.text)).length;
    const adverbCount = sentences.reduce((count, s) => count + this.findAdverbs(s.text).length, 0);

    return {
      totalWords,
      totalSentences,
      averageWordsPerSentence,
      averageSyllablesPerWord,
      complexWords,
      passiveVoiceCount,
      adverbCount,
    };
  }

  private calculateOverallScore(statistics: any): ReadabilityScore {
    let score: number;

    switch (this.settings.algorithm) {
      case "flesch":
        score = this.calculateFleschScore(statistics);
        break;
      case "gunning-fog":
        score = this.calculateGunningFogScore(statistics);
        break;
      case "coleman-liau":
        score = this.calculateColemanLiauScore(statistics);
        break;
      case "automated":
        score = this.calculateAutomatedScore(statistics);
        break;
      default:
        score = this.calculateFleschScore(statistics);
    }

    const level = this.determineLevel(score);
    const description = this.getScoreDescription(score, this.settings.algorithm);
    const suggestions = this.generateSuggestions(statistics, level);
    const gradeLevel = this.calculateGradeLevel(score, this.settings.algorithm);

    return {
      score,
      level,
      description,
      suggestions,
      gradeLevel,
    };
  }

  private calculateFleschScore(stats: any): number {
    const { averageWordsPerSentence, averageSyllablesPerWord } = stats;
    return 206.835 - 1.015 * averageWordsPerSentence - 84.6 * averageSyllablesPerWord;
  }

  private calculateGunningFogScore(stats: any): number {
    const { averageWordsPerSentence, complexWords, totalWords } = stats;
    const complexWordPercentage = (complexWords / totalWords) * 100;
    return 0.4 * (averageWordsPerSentence + complexWordPercentage);
  }

  private calculateColemanLiauScore(stats: any): number {
    const { totalWords, totalSentences } = stats;
    const avgLettersPerWord = 5; // Approximation
    const L = (avgLettersPerWord / totalWords) * 100;
    const S = (totalSentences / totalWords) * 100;
    return 0.0588 * L - 0.296 * S - 15.8;
  }

  private calculateAutomatedScore(stats: any): number {
    const { totalWords, totalSentences } = stats;
    const avgLettersPerWord = 5; // Approximation
    return 4.71 * (avgLettersPerWord / totalWords) + 0.5 * (totalWords / totalSentences) - 21.43;
  }

  private determineLevel(score: number): "easy" | "medium" | "hard" {
    if (score >= this.settings.thresholds.easy) return "easy";
    if (score >= this.settings.thresholds.medium) return "medium";
    return "hard";
  }

  private getScoreDescription(score: number, algorithm: string): string {
    const level = this.determineLevel(score);
    const algorithmName = algorithm.charAt(0).toUpperCase() + algorithm.slice(1);

    switch (level) {
      case "easy":
        return `${algorithmName} score: ${score.toFixed(1)} - Easy to read`;
      case "medium":
        return `${algorithmName} score: ${score.toFixed(1)} - Moderately difficult`;
      case "hard":
        return `${algorithmName} score: ${score.toFixed(1)} - Difficult to read`;
    }
  }

  private calculateGradeLevel(score: number, algorithm: string): string {
    switch (algorithm) {
      case "flesch":
        return this.fleschToGradeLevel(score);
      case "gunning-fog":
        return this.gunningFogToGradeLevel(score);
      case "coleman-liau":
        return this.colemanLiauToGradeLevel(score);
      case "automated":
        return this.automatedToGradeLevel(score);
      default:
        return this.fleschToGradeLevel(score);
    }
  }

  private fleschToGradeLevel(score: number): string {
    if (score >= 90) return "5th Grade";
    if (score >= 80) return "6th Grade";
    if (score >= 70) return "7th Grade";
    if (score >= 60) return "8th-9th Grade";
    if (score >= 50) return "10th-12th Grade";
    if (score >= 30) return "College Level";
    return "Graduate Level";
  }

  private gunningFogToGradeLevel(score: number): string {
    if (score <= 6) return "Elementary";
    if (score <= 9) return "6th-9th Grade";
    if (score <= 13) return "High School";
    if (score <= 17) return "College Level";
    return "Graduate Level";
  }

  private colemanLiauToGradeLevel(score: number): string {
    if (score <= 6) return "Elementary";
    if (score <= 9) return "6th-9th Grade";
    if (score <= 13) return "High School";
    if (score <= 17) return "College Level";
    return "Graduate Level";
  }

  private automatedToGradeLevel(score: number): string {
    if (score <= 6) return "Elementary";
    if (score <= 9) return "6th-9th Grade";
    if (score <= 13) return "High School";
    if (score <= 17) return "College Level";
    return "Graduate Level";
  }

  private generateSuggestions(stats: any, level: "easy" | "medium" | "hard"): string[] {
    const suggestions: string[] = [];

    if (level === "hard" || level === "medium") {
      if (stats.averageWordsPerSentence > 20) {
        suggestions.push("Break up long sentences for better readability");
      }

      if (stats.complexWords / stats.totalWords > 0.15) {
        suggestions.push("Replace complex words with simpler alternatives");
      }

      if (stats.passiveVoiceCount > 0) {
        suggestions.push("Convert passive voice to active voice");
      }

      if (stats.adverbCount > stats.totalSentences * 0.1) {
        suggestions.push("Reduce adverbs and use stronger verbs");
      }
    }

    if (suggestions.length === 0) {
      suggestions.push("Great job! Your text is clear and readable.");
    }

    return suggestions;
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = "aeiouy";
    let syllableCount = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent 'e'
    if (word.endsWith("e") && syllableCount > 1) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }

  private calculateAverageSyllables(words: string[]): number {
    const totalSyllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    return totalSyllables / words.length;
  }

  private hasPassiveVoice(sentence: string): boolean {
    const passivePatterns = [
      /\b(am|is|are|was|were|being|been|be)\s+\w+ed\b/i,
      /\b(am|is|are|was|were|being|been|be)\s+\w+en\b/i,
      /\bby\s+\w+\b/i,
    ];

    return passivePatterns.some((pattern) => pattern.test(sentence));
  }

  private findAdverbs(sentence: string): string[] {
    const adverbPattern = /\b\w+ly\b/gi;
    const matches = sentence.match(adverbPattern) || [];

    // Filter out common words that end in 'ly' but aren't adverbs
    const nonAdverbs = ["early", "only", "likely", "lovely", "friendly", "family"];
    return matches.filter((word) => !nonAdverbs.includes(word.toLowerCase()));
  }
}

export const defaultReadabilitySettings: ReadabilitySettings = {
  algorithm: "flesch",
  thresholds: {
    easy: 70,
    medium: 40,
    hard: 0,
  },
  enabledChecks: {
    sentenceLength: true,
    syllableComplexity: true,
    passiveVoice: true,
    adverbs: true,
    readingLevel: true,
  },
  customWeights: {
    wordLength: 1.0,
    sentenceLength: 2.0,
    syllableCount: 1.5,
    passiveVoice: 10.0,
  },
};

export { EnhancedReadabilityService };
