const ADMIN_FIELD_FOCUS_CLASS =
  "focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900"

export const ADMIN_INPUT_CLASS =
  `transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm ${ADMIN_FIELD_FOCUS_CLASS}`

export const ADMIN_TEXTAREA_CLASS = `${ADMIN_INPUT_CLASS} scroll-hidden`

export const ADMIN_SELECT_TRIGGER_CLASS = `w-full ${ADMIN_INPUT_CLASS}`

export const ADMIN_SELECT_CONTENT_CLASS =
  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"

export const ADMIN_NATIVE_SELECT_CLASS =
  "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"

export const ADMIN_MUTED_INPUT_CLASS =
  `transition-colors bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm ${ADMIN_FIELD_FOCUS_CLASS}`
