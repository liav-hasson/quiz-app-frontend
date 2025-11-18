import { colors, colorsRGBA } from './colors'

/**
 * Centralized toast notification configuration
 * Used across the app for consistent toast styling
 */
export const toastOptions = {
  style: {
    background: colors.darkCard,
    color: colors.softCyan,
    border: `1px solid ${colorsRGBA.turquoiseBright(0.3)}`,
  },
}

/**
 * Toast position configuration
 */
export const toastPosition = 'top-right'

/**
 * Full toaster props for convenience
 * Usage: <Toaster {...toasterProps} />
 */
export const toasterProps = {
  position: toastPosition,
  toastOptions,
}

export default toasterProps
