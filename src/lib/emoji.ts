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

/**
 * Simple mapping of common emojis to their 3D equivalents
 * Using a curated list of popular emojis that we know exist in the ms-3d-emoji-picker
 */
const EMOJI_3D_MAP: Record<string, { url: string; name: string }> = {
  '😀': { url: 'https://cdn.emoji.yajihum.dev/smilieys/1.png', name: 'grinning face' },
  '😃': { url: 'https://cdn.emoji.yajihum.dev/smilieys/2.png', name: 'grinning face with big eyes' },
  '😄': { url: 'https://cdn.emoji.yajihum.dev/smilieys/3.png', name: 'grinning face with smiling eyes' },
  '😁': { url: 'https://cdn.emoji.yajihum.dev/smilieys/4.png', name: 'beaming face with smiling eyes' },
  '😆': { url: 'https://cdn.emoji.yajihum.dev/smilieys/5.png', name: 'grinning squinting face' },
  '😅': { url: 'https://cdn.emoji.yajihum.dev/smilieys/6.png', name: 'grinning face with sweat' },
  '🤣': { url: 'https://cdn.emoji.yajihum.dev/smilieys/7.png', name: 'rolling on the floor laughing' },
  '😂': { url: 'https://cdn.emoji.yajihum.dev/smilieys/8.png', name: 'face with tears of joy' },
  '🙂': { url: 'https://cdn.emoji.yajihum.dev/smilieys/9.png', name: 'slightly smiling face' },
  '🙃': { url: 'https://cdn.emoji.yajihum.dev/smilieys/10.png', name: 'upside-down face' },
  '😉': { url: 'https://cdn.emoji.yajihum.dev/smilieys/12.png', name: 'winking face' },
  '😊': { url: 'https://cdn.emoji.yajihum.dev/smilieys/13.png', name: 'smiling face with smiling eyes' },
  '😇': { url: 'https://cdn.emoji.yajihum.dev/smilieys/14.png', name: 'smiling face with halo' },
  '🥰': { url: 'https://cdn.emoji.yajihum.dev/smilieys/15.png', name: 'smiling face with hearts' },
  '😍': { url: 'https://cdn.emoji.yajihum.dev/smilieys/16.png', name: 'smiling face with heart-eyes' },
  '🤩': { url: 'https://cdn.emoji.yajihum.dev/smilieys/17.png', name: 'star-struck' },
  '😘': { url: 'https://cdn.emoji.yajihum.dev/smilieys/18.png', name: 'face blowing a kiss' },
  '😗': { url: 'https://cdn.emoji.yajihum.dev/smilieys/19.png', name: 'kissing face' },
  '☺️': { url: 'https://cdn.emoji.yajihum.dev/smilieys/20.png', name: 'smiling face' },
  '😚': { url: 'https://cdn.emoji.yajihum.dev/smilieys/21.png', name: 'kissing face with closed eyes' },
  '😙': { url: 'https://cdn.emoji.yajihum.dev/smilieys/22.png', name: 'kissing face with smiling eyes' },
  '🥲': { url: 'https://cdn.emoji.yajihum.dev/smilieys/23.png', name: 'smiling face with tear' },
  '😋': { url: 'https://cdn.emoji.yajihum.dev/smilieys/24.png', name: 'face savoring food' },
  '😛': { url: 'https://cdn.emoji.yajihum.dev/smilieys/25.png', name: 'face with tongue' },
  '😜': { url: 'https://cdn.emoji.yajihum.dev/smilieys/26.png', name: 'winking face with tongue' },
  '🤪': { url: 'https://cdn.emoji.yajihum.dev/smilieys/27.png', name: 'zany face' },
  '😝': { url: 'https://cdn.emoji.yajihum.dev/smilieys/28.png', name: 'squinting face with tongue' },
  '🤑': { url: 'https://cdn.emoji.yajihum.dev/smilieys/29.png', name: 'money-mouth face' },
  '🤗': { url: 'https://cdn.emoji.yajihum.dev/smilieys/30.png', name: 'smiling face with open hands' },
  
  // Food
  '🍕': { url: 'https://cdn.emoji.yajihum.dev/food/5.png', name: 'pizza' },
  '🍔': { url: 'https://cdn.emoji.yajihum.dev/food/4.png', name: 'hamburger' },
  '🌮': { url: 'https://cdn.emoji.yajihum.dev/food/6.png', name: 'taco' },
  '🍜': { url: 'https://cdn.emoji.yajihum.dev/food/10.png', name: 'steaming bowl' },
  '🍝': { url: 'https://cdn.emoji.yajihum.dev/food/11.png', name: 'spaghetti' },
  '🍣': { url: 'https://cdn.emoji.yajihum.dev/food/13.png', name: 'sushi' },
  '🍰': { url: 'https://cdn.emoji.yajihum.dev/food/74.png', name: 'shortcake' },
  '🧁': { url: 'https://cdn.emoji.yajihum.dev/food/75.png', name: 'cupcake' },
  '🍩': { url: 'https://cdn.emoji.yajihum.dev/food/73.png', name: 'doughnut' },
  '🥨': { url: 'https://cdn.emoji.yajihum.dev/food/41.png', name: 'pretzel' },
  '☕': { url: 'https://cdn.emoji.yajihum.dev/food/89.png', name: 'hot beverage' },
  
  // Animals and Nature
  '🦋': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/148.png', name: 'butterfly' },
  '🐝': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/142.png', name: 'honeybee' },
  '🐢': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/45.png', name: 'turtle' },
  '🐙': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/66.png', name: 'octopus' },
  '🦄': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/1.png', name: 'unicorn' },
  '🐘': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/22.png', name: 'elephant' },
  '🦁': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/9.png', name: 'lion' },
  '🐯': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/12.png', name: 'tiger face' },
  '🐼': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/3.png', name: 'panda' },
  '🦊': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/7.png', name: 'fox' },
  '🐻': { url: 'https://cdn.emoji.yajihum.dev/animals-and-nature/4.png', name: 'bear' },
  
  // Objects
  '📱': { url: 'https://cdn.emoji.yajihum.dev/objects/1.png', name: 'mobile phone' },
  '💻': { url: 'https://cdn.emoji.yajihum.dev/objects/2.png', name: 'laptop computer' },
  '📷': { url: 'https://cdn.emoji.yajihum.dev/objects/4.png', name: 'camera' },
  '🎒': { url: 'https://cdn.emoji.yajihum.dev/objects/80.png', name: 'backpack' },
  '⌚': { url: 'https://cdn.emoji.yajihum.dev/objects/78.png', name: 'watch' },
  '🔑': { url: 'https://cdn.emoji.yajihum.dev/objects/51.png', name: 'key' },
  '💰': { url: 'https://cdn.emoji.yajihum.dev/objects/53.png', name: 'money bag' },
  '🏆': { url: 'https://cdn.emoji.yajihum.dev/objects/91.png', name: 'trophy' },
  '⭐': { url: 'https://cdn.emoji.yajihum.dev/objects/93.png', name: 'star' },
  
  // Activity 
  '🎮': { url: 'https://cdn.emoji.yajihum.dev/activity/28.png', name: 'video game' },
  '🎯': { url: 'https://cdn.emoji.yajihum.dev/activity/25.png', name: 'bullseye' },
  '🎨': { url: 'https://cdn.emoji.yajihum.dev/activity/40.png', name: 'artist palette' },
  '🎵': { url: 'https://cdn.emoji.yajihum.dev/activity/44.png', name: 'musical note' },
  '🎸': { url: 'https://cdn.emoji.yajihum.dev/activity/47.png', name: 'guitar' },
  '⚽': { url: 'https://cdn.emoji.yajihum.dev/activity/1.png', name: 'soccer ball' },
  '🏀': { url: 'https://cdn.emoji.yajihum.dev/activity/2.png', name: 'basketball' },
  
  // Symbols  
  '❤️': { url: 'https://cdn.emoji.yajihum.dev/symbols/142.png', name: 'red heart' },
  '💫': { url: 'https://cdn.emoji.yajihum.dev/symbols/72.png', name: 'dizzy' },
  '✨': { url: 'https://cdn.emoji.yajihum.dev/symbols/71.png', name: 'sparkles' },
  '🚀': { url: 'https://cdn.emoji.yajihum.dev/travel-and-place/57.png', name: 'rocket' },
  '🔥': { url: 'https://cdn.emoji.yajihum.dev/symbols/102.png', name: 'fire' },
  '💡': { url: 'https://cdn.emoji.yajihum.dev/objects/31.png', name: 'light bulb' },
  '🌟': { url: 'https://cdn.emoji.yajihum.dev/symbols/73.png', name: 'glowing star' },
}

/**
 * Gets a random emoji with its 3D equivalent
 * @returns Object with unicode and 3D data
 */
export function getRandomEmoji3D() {
  const availableEmojis = Object.keys(EMOJI_3D_MAP)
  const randomEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)]
  const emoji3D = EMOJI_3D_MAP[randomEmoji]
  
  return {
    unicode: randomEmoji,
    url: emoji3D.url,
    name: emoji3D.name
  }
}

/**
 * Gets 3D data for a specific emoji if available
 * @param emoji The emoji unicode character
 * @returns 3D emoji data or null if not available
 */
export function getEmoji3D(emoji: string) {
  const emoji3D = EMOJI_3D_MAP[emoji]
  if (!emoji3D) return null
  
  return {
    unicode: emoji,
    url: emoji3D.url,
    name: emoji3D.name
  }
}

/**
 * Gets the default pretzel emoji for new lists
 * @returns Default 3D emoji data
 */
export function getDefaultEmoji3D() {
  return {
    unicode: '🥨',
    url: 'https://cdn.emoji.yajihum.dev/food/41.png',
    name: 'pretzel'
  }
}