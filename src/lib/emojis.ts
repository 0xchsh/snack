// Curated list of emojis suitable for lists
export const LIST_EMOJIS = [
  '📝', '📋', '📌', '🔖', '📚', '📖', '📄', '📃', '📑', '🗂️',
  '📁', '📂', '🗃️', '🗄️', '📊', '📈', '📉', '📇', '🔍', '🔎',
  '💡', '🎯', '🎪', '🎨', '🎭', '🎪', '🎵', '🎶', '🎸', '🎹',
  '🍕', '🍔', '🍟', '🍿', '🍰', '🍪', '☕', '🍵', '🥤', '🍷',
  '✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏠', '🏢', '🏪', '🏬',
  '⭐', '🌟', '✨', '💫', '🌙', '☀️', '🌈', '🔥', '💎', '🎁',
  '🎉', '🎊', '🎈', '🎀', '🏆', '🥇', '🏅', '🎖️', '🏵️', '🌸',
  '🌺', '🌻', '🌷', '🌹', '🌼', '🌿', '🍀', '🌱', '🌳', '🌲',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🚀', '🛸', '🌍', '🌎', '🌏', '🗺️', '🧭', '⚡', '🔋', '💻'
];

export function getRandomEmoji(): string {
  return LIST_EMOJIS[Math.floor(Math.random() * LIST_EMOJIS.length)];
} 