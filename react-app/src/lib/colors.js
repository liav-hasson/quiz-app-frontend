/**
 * Centralized color palette
 * Maps to tailwind.config.js colors for consistency
 */

export const colors = {
  // Primary Neon Colors
  neonPink: '#f72585',
  raspberryPlum: '#b5179e',
  indigoBloom: '#7209b7',
  ultrasonic: '#560bad',
  trueAzure: '#480ca8',
  vividRoyal: '#3a0ca3',
  verdigris: '#159f91',
  turquoise: '#1bccba',
  turquoiseBright: '#1ee3cf',
  softCyan: '#92f2e8',

  // Dark Backgrounds
  darkBg: '#0a0e27',
  darkCard: '#1a1f3a',
}

/**
 * RGBA variants for transparency effects
 */
export const colorsRGBA = {
  neonPink: (opacity = 1) => `rgba(247, 37, 133, ${opacity})`,
  raspberryPlum: (opacity = 1) => `rgba(181, 23, 158, ${opacity})`,
  indigoBloom: (opacity = 1) => `rgba(114, 9, 183, ${opacity})`,
  ultrasonic: (opacity = 1) => `rgba(86, 10, 173, ${opacity})`,
  trueAzure: (opacity = 1) => `rgba(72, 12, 168, ${opacity})`,
  vividRoyal: (opacity = 1) => `rgba(58, 12, 163, ${opacity})`,
  verdigris: (opacity = 1) => `rgba(21, 159, 145, ${opacity})`,
  turquoise: (opacity = 1) => `rgba(27, 204, 186, ${opacity})`,
  turquoiseBright: (opacity = 1) => `rgba(30, 227, 207, ${opacity})`,
  softCyan: (opacity = 1) => `rgba(146, 242, 232, ${opacity})`,
  darkBg: (opacity = 1) => `rgba(10, 14, 39, ${opacity})`,
  darkCard: (opacity = 1) => `rgba(26, 31, 58, ${opacity})`,
}

/**
 * Gradient combinations for consistent visual effects
 */
export const gradients = {
  // Primary gradient - Pink to Turquoise
  primary: `linear-gradient(135deg, ${colors.neonPink} 0%, ${colors.turquoiseBright} 100%)`,

  // Neon pink to purple
  neonPurple: `linear-gradient(135deg, ${colors.neonPink} 0%, ${colors.indigoBloom} 100%)`,

  // Turquoise to pink (reverse)
  coolWarm: `linear-gradient(135deg, ${colors.turquoiseBright} 0%, ${colors.neonPink} 100%)`,

  // Animated border gradient
  borderAnimated: `linear-gradient(90deg, transparent, ${colorsRGBA.turquoiseBright(0.5)}, ${colorsRGBA.indigoBloom(0.5)}, transparent)`,

  // Mesh gradient foundation colors (for background)
  meshPink: colorsRGBA.neonPink(0.4),
  meshTurquoise: colorsRGBA.turquoiseBright(0.25),
  meshPurple: colorsRGBA.indigoBloom(0.3),
  meshRaspberry: colorsRGBA.raspberryPlum(0.25),
}

/**
 * Shadow colors for depth
 */
export const shadows = {
  neonPink: `shadow-lg shadow-neon-pink/30`,
  turquoise: `shadow-lg shadow-turquoise-bright/30`,
  purple: `shadow-lg shadow-indigo-bloom/30`,
}

/**
 * Border colors
 */
export const borders = {
  neonPink: `border-neon-pink/30`,
  turquoise: `border-turquoise-bright/30`,
  purple: `border-indigo-bloom/30`,
}

export default colors