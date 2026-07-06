/**
 * Icon.jsx — central icon registry.
 * Uses react-icons/md (Material Design) for full Material Symbols parity.
 *
 * Usage:
 *   <Icon name="menu_book" className="text-primary-container" size={24} />
 *
 * `filled` prop renders the "filled" variant where available.
 */

import {
  MdMenuBook,
  MdHome,
  MdLibraryBooks,
  MdCollectionsBookmark,
  MdFavorite,
  MdFavoriteBorder,
  MdHistory,
  MdSettings,
  MdLogout,
  MdSearch,
  MdNotifications,
  MdDashboard,
  MdInventory2,
  MdGroup,
  MdAnalytics,
  MdAdd,
  MdPersonAdd,
  MdClose,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdDownload,
  MdPrint,
  MdSync,
  MdArrowBack,
  MdArrowForward,
  MdPlayCircle,
  MdStar,
  MdStarBorder,
  MdAutoStories,
  MdBookmarkAdded,
  MdPriorityHigh,
  MdHistoryToggleOff,
  MdPerson,
  MdLock,
  MdTune,
  MdSearchOff,
  MdBarChart,
  MdExpandMore,
  MdImage,
  MdAssignment,
  MdAssignmentReturn,
  MdCheckCircle,
  MdCancel,
  MdWarning,
  MdPending,
  MdPayments,
  MdUpdate,
  MdFilterAlt,
  MdSort,
  MdError,
  MdInfo,
} from 'react-icons/md';

/**
 * Map Material Symbols icon names → react-icons components
 */
const ICON_MAP = {
  // Navigation & layout
  menu_book:            MdMenuBook,
  home:                 MdHome,
  library_books:        MdLibraryBooks,
  collections_bookmark: MdCollectionsBookmark,
  favorite:             MdFavorite,
  favorite_border:      MdFavoriteBorder,
  history:              MdHistory,
  settings:             MdSettings,
  logout:               MdLogout,
  expand_more:          MdExpandMore,
  image:                MdImage,

  // Header / search
  search:               MdSearch,
  notifications:        MdNotifications,

  // Admin nav
  dashboard:            MdDashboard,
  inventory_2:          MdInventory2,
  group:                MdGroup,
  analytics:            MdAnalytics,
  assignment:           MdAssignment,

  // Actions
  add:                  MdAdd,
  person_add:           MdPersonAdd,
  close:                MdClose,
  edit:                 MdEdit,
  delete:               MdDelete,
  refresh:              MdRefresh,
  download:             MdDownload,
  print:                MdPrint,
  sync:                 MdSync,
  arrow_back:           MdArrowBack,
  arrow_forward:        MdArrowForward,
  play_circle:          MdPlayCircle,
  star:                 MdStar,
  star_border:          MdStarBorder,
  auto_stories:         MdAutoStories,
  bookmark_added:       MdBookmarkAdded,
  priority_high:        MdPriorityHigh,
  history_toggle_off:   MdHistoryToggleOff,
  person:               MdPerson,
  lock:                 MdLock,
  tune:                 MdTune,
  search_off:           MdSearchOff,
  bar_chart:            MdBarChart,
  assignment_return:    MdAssignmentReturn,
  check_circle:         MdCheckCircle,
  cancel:               MdCancel,
  warning:              MdWarning,
  pending:              MdPending,
  payments:             MdPayments,
  update:               MdUpdate,
  filter_alt:           MdFilterAlt,
  sort:                 MdSort,
  error:                MdError,
  info:                 MdInfo,
};

/**
 * @param {string}  name       - Material Symbols icon name (snake_case)
 * @param {string}  className  - Tailwind classes
 * @param {number}  size       - px size (default 20)
 * @param {object}  style      - extra inline styles
 */
const Icon = ({ name, className = '', size = 20, style = {} }) => {
  const Component = ICON_MAP[name];

  if (!Component) {
    if (import.meta.env.DEV) {
      console.warn(`[Icon] Unknown icon name: "${name}"`);
    }
    return null;
  }

  return (
    <Component
      size={size}
      className={`inline-block align-middle flex-shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

export default Icon;

