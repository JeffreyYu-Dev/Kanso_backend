import ky from "ky";
const get_title_query = `
query($id: Int){
 Media(id: $id) {
  title {
    english
    romaji
    native
  }
 } 
}
`;

// TODO: this needs works beacuse some mapping will be off depending what words are in the title.
// remove any impurities
export function normalizeTitle(title: string): string {
  return (
    title
      .toLowerCase()
      // Remove special characters and punctuation
      .replace(/[^\w\s]/g, "")
      // Remove season indicators (various formats)
      .replace(
        /\s*(?:(?:s(?:eason)?\s*\d+)|(?:\d+(?:rd|nd|st|th)\s*(?:season)))\s*/g,
        ""
      )
      // Remove common anime title suffixes
      // Remove common words that might differ between versions
      .replace(/(the|anime|tv)/g, "")
      // Normalize spaces
      .trim()
      .replace(/\s+/g, " ")
  );
}

// calculate scores for both titles
export function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  // Convert edit distance to similarity score (0 to 1)
  const maxLen = Math.max(len1, len2);
  return 1 - matrix[len1][len2] / maxLen;
}

// get title based on id
export async function getTitle(showId: number) {
  return await ky
    .post("https://graphql.anilist.co", {
      json: {
        query: get_title_query,
        variables: {
          id: showId,
        },
      },
    })
    .json()
    .then((data: any) => data.data.Media.title.romaji);
}

// just removes any html, breaks, and any other weird stuff
export function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/[\n\r\t\f\v]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
