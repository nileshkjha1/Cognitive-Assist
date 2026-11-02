export function generateMockSummary(transcript: string): { summary: string, topics: string[] } {
  if (!transcript || transcript.trim().length === 0) {
    return { summary: "No conversation recorded.", topics: [] };
  }

  // Simple heuristic for demo purposes (extracting key words / simulating LLM)
  const words = transcript.toLowerCase().replace(/[^a-z0-parse\s]/g, '').split(/\s+/);
  const commonWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "about", "as", "by", "is", "are", "was", "were", "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her", "their", "this", "that", "these", "those", "of"]);
  
  const wordCounts = new Map<string, number>();
  words.forEach(w => {
    if (w.length > 3 && !commonWords.has(w)) {
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
    }
  });

  const sortedTopics = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);

  let summary = "";
  if (transcript.length < 50) {
    summary = `Brief interaction: "${transcript.substring(0, 40)}..."`;
  } else {
    summary = `Discussed ${sortedTopics.join(", ") || "various topics"}.`;
  }

  return {
    summary: summary.charAt(0).toUpperCase() + summary.slice(1),
    topics: sortedTopics.map(t => t.charAt(0).toUpperCase() + t.slice(1))
  };
}
