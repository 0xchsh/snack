// Curated emoji pool for lists
const EMOJI_POOL = [
  // Places & Travel
  '🗽', '🏛️', '🏰', '🏗️', '🌁', '🌉', '🏙️', '🌃', '🎡', '🎢', '🎠', '🏖️', 
  '🏔️', '🗻', '🏕️', '🏞️', '🌋', '🏜️', '🏝️', '🚁', '✈️', '🚢', '⛵', '🗺️',
  
  // Food & Drinks
  '🍕', '🍔', '🌮', '🍜', '🍝', '🍣', '🍤', '🧆', '🥙', '🍰', '🧁', '🍩', 
  '☕', '🍺', '🍷', '🥂', '🍸', '🧋', '🥤', '🍯', '🫖', '🥘',
  
  // Activities & Entertainment
  '🎭', '🎪', '🎨', '🎵', '🎸', '🎬', '📚', '⚽', '🏀', '🎮', '🎲', '🎯',
  '🎳', '🎪', '🎊', '🎉', '🎈', '🎁', '🎀', '🎄', '🎃', '💐',
  
  // Objects & Tools
  '📱', '💻', '📷', '🔧', '🎒', '👜', '🎓', '💍', '⌚', '🕶️', '👑', '💎',
  '🔑', '💰', '🛍️', '📝', '📊', '📈', '🏆', '🥇', '🎖️', '⭐',
  
  // Nature & Animals
  '🌸', '🌺', '🌻', '🌹', '🌷', '🌿', '🍀', '🌱', '🌳', '🌲', '🦋', '🐝',
  '🐢', '🐠', '🐙', '🦄', '🐘', '🦁', '🐯', '🐼', '🦊', '🐻',
  
  // Weather & Space
  '☀️', '🌙', '⭐', '🌟', '⚡', '🌈', '❄️', '🔥', '💫', '🌍', '🌎', '🌏',
  
  // Symbols & Misc
  '💫', '✨', '🔮', '💖', '💯', '🎯', '🚀', '⚡', '🌟', '💡', '🔥', '❤️'
]

/**
 * Generates a random emoji from the curated pool
 * @returns A random emoji string
 */
export function getRandomEmoji(): string {
  const randomIndex = Math.floor(Math.random() * EMOJI_POOL.length)
  return EMOJI_POOL[randomIndex] || '🎯'
}

/**
 * Gets multiple random emojis for selection
 * @param count Number of emojis to return (default: 8)
 * @returns Array of random emoji strings
 */
export function getRandomEmojis(count: number = 8): string[] {
  const shuffled = [...EMOJI_POOL].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

/**
 * Checks if a string is a valid emoji
 * @param emoji The emoji string to validate
 * @returns boolean indicating if the emoji is valid
 */
export function isValidEmoji(emoji: string): boolean {
  return EMOJI_POOL.includes(emoji) || /\p{Emoji}/u.test(emoji)
}

/**
 * Gets all available emojis grouped by category
 * @returns Object with emoji categories
 */
export function getEmojiCategories() {
  return {
    places: EMOJI_POOL.slice(0, 24),
    food: EMOJI_POOL.slice(24, 46),
    activities: EMOJI_POOL.slice(46, 68),
    objects: EMOJI_POOL.slice(68, 90),
    nature: EMOJI_POOL.slice(90, 112),
    weather: EMOJI_POOL.slice(112, 124),
    symbols: EMOJI_POOL.slice(124)
  }
}