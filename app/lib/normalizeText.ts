/**
 * Normalize stylized Unicode text to regular text
 * Converts characters like 🆃🅾🅲🅺🆃🅰🅲🅺 to TOCTACK
 */
export function normalizeStylizedText(text: string): string {
  if (!text) return text

  // Mapping of stylized Unicode characters to regular ASCII
  const stylizedMap: Record<string, string> = {
    // Enclosed Alphanumerics (🆃, 🅾, etc.)
    '🆃': 'T', // Squared Latin Capital Letter T
    '🆂': 'S', // Squared Latin Capital Letter S
    '🅾': 'O', // Squared Latin Capital Letter O
    '🅰': 'A', // Squared Latin Capital Letter A
    '🅱': 'B', // Squared Latin Capital Letter B
    '🅲': 'C', // Squared Latin Capital Letter C
    '🅳': 'D', // Squared Latin Capital Letter D
    '🅴': 'E', // Squared Latin Capital Letter E
    '🅵': 'F', // Squared Latin Capital Letter F
    '🅶': 'G', // Squared Latin Capital Letter G
    '🅷': 'H', // Squared Latin Capital Letter H
    '🅸': 'I', // Squared Latin Capital Letter I
    '🅹': 'J', // Squared Latin Capital Letter J
    '🅺': 'K', // Squared Latin Capital Letter K
    '🅻': 'L', // Squared Latin Capital Letter L
    '🅼': 'M', // Squared Latin Capital Letter M
    '🅽': 'N', // Squared Latin Capital Letter N
    '🅿': 'P', // Squared Latin Capital Letter P
    '🆀': 'Q', // Squared Latin Capital Letter Q
    '🆁': 'R', // Squared Latin Capital Letter R
    '🆄': 'U', // Squared Latin Capital Letter U
    '🆅': 'V', // Squared Latin Capital Letter V
    '🆆': 'W', // Squared Latin Capital Letter W
    '🆇': 'X', // Squared Latin Capital Letter X
    '🆈': 'Y', // Squared Latin Capital Letter Y
    '🆉': 'Z', // Squared Latin Capital Letter Z

    // Fullwidth characters
    '\uFF21': 'A', '\uFF22': 'B', '\uFF23': 'C', '\uFF24': 'D', '\uFF25': 'E',
    '\uFF26': 'F', '\uFF27': 'G', '\uFF28': 'H', '\uFF29': 'I', '\uFF2A': 'J',
    '\uFF2B': 'K', '\uFF2C': 'L', '\uFF2D': 'M', '\uFF2E': 'N', '\uFF2F': 'O',
    '\uFF30': 'P', '\uFF31': 'Q', '\uFF32': 'R', '\uFF33': 'S', '\uFF34': 'T',
    '\uFF35': 'U', '\uFF36': 'V', '\uFF37': 'W', '\uFF38': 'X', '\uFF39': 'Y',
    '\uFF3A': 'Z',
    '\uFF41': 'a', '\uFF42': 'b', '\uFF43': 'c', '\uFF44': 'd', '\uFF45': 'e',
    '\uFF46': 'f', '\uFF47': 'g', '\uFF48': 'h', '\uFF49': 'i', '\uFF4A': 'j',
    '\uFF4B': 'k', '\uFF4C': 'l', '\uFF4D': 'm', '\uFF4E': 'n', '\uFF4F': 'o',
    '\uFF50': 'p', '\uFF51': 'q', '\uFF52': 'r', '\uFF53': 's', '\uFF54': 't',
    '\uFF55': 'u', '\uFF56': 'v', '\uFF57': 'w', '\uFF58': 'x', '\uFF59': 'y',
    '\uFF5A': 'z',
  }

  // Apply mapping
  let result = text
  for (const [stylized, normal] of Object.entries(stylizedMap)) {
    result = result.replace(new RegExp(stylized, 'gu'), normal)
  }

  // Normalize Unicode combining characters
  result = result.normalize('NFKC')

  // Remove any remaining combining marks (for accented characters, etc.)
  result = result.replace(/[\u0300-\u036f]/g, '')

  return result
}

/**
 * Check if text contains stylized Unicode characters
 */
export function hasStylizedText(text: string): boolean {
  // Check for Enclosed Alphanumerics U+1F100-U+1F1FF
  const enclosedRegex = /\u{1F100}-\u{1F1FF}/u
  if (enclosedRegex.test(text)) return true

  // Check for Halfwidth and Fullwidth Forms U+FF00-U+FFEF
  const fullwidthRegex = /\uFF00-\uFFEF/
  if (fullwidthRegex.test(text)) return true

  // Check for Mathematical Alphanumeric Symbols U+1D400-U+1D7FF
  const mathRegex = /\u{1D400}-\u{1D7FF}/u
  if (mathRegex.test(text)) return true

  return false
}
