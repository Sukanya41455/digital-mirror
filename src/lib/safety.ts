/**
 * Safety utility to enforce conditional language in Team USA Digital Mirror results.
 */

export function enforceConditionalLanguage(text: string): string {
  if (!text) return text;

  const mapping = [
    { pattern: /\byou are\b/gi, replacement: "your profile could resemble" },
    { pattern: /\byou will\b/gi, replacement: "you could" },
    { pattern: /\byou should\b/gi, replacement: "you could consider" },
    { pattern: /\bbest sport\b/gi, replacement: "sport family worth exploring" },
    { pattern: /\bELITE MATCH\b/gi, replacement: "HISTORICAL ALIGNMENT" },
    { pattern: /\bguaranteed\b/gi, replacement: "may suggest" },
    { pattern: /\bguarantees\b/gi, replacement: "may suggest" },
    { pattern: /\bperfect match\b/gi, replacement: "strong historical resemblance" },
    { pattern: /\byou're\b/gi, replacement: "your profile looks like it could be" },
    { pattern: /\byou have\b/gi, replacement: "your profile could suggest" },
    { pattern: /\byou can\b/gi, replacement: "you could potentially" },
    { pattern: /\bdefinitely\b/gi, replacement: "historically" },
    { pattern: /\bis the match\b/gi, replacement: "could be a potential alignment" }
  ];

  let saferText = text;
  mapping.forEach(({ pattern, replacement }) => {
    saferText = saferText.replace(pattern, replacement);
  });

  return saferText;
}
