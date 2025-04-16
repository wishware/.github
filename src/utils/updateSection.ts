export async function updateSection(sourceText: string, delimiters: Delimiters, updatedContent: string): Promise<string> {
  const { startTag, endTag } = delimiters;

  if (!sourceText?.trim()) {
    throw new Error('Source text cannot be empty');
  }

  if (!startTag?.trim() || !endTag?.trim()) {
    throw new Error('Delimiter tags cannot be empty');
  }

  const startPosition = sourceText.indexOf(startTag);
  const endPosition = sourceText.indexOf(endTag, startPosition + startTag.length);

  if (startPosition === -1) {
    throw new Error(`Start delimiter not found: "${startTag}"`);
  }

  if (endPosition === -1) {
    throw new Error(`End delimiter not found: "${endTag}" (must appear after start delimiter)`);
  }

  if (startPosition > endPosition) {
    throw new Error(`Invalid delimiter positions: end tag appears before start tag`);
  }

  const prefixContent = sourceText.slice(0, startPosition + startTag.length);
  const suffixContent = sourceText.slice(endPosition);
  const processedContent = updatedContent.trim();

  return `${prefixContent}\n${processedContent}\n${suffixContent}`;
}
