import {
  AlertTriangleIcon,
  BellIcon,
  BoxIcon,
  ClockIcon,
  CubeIcon,
  HandymanIcon,
  MessageSquareIcon,
  RefreshIcon,
  SprayCanIcon,
  UserPlusIcon,
} from '../../components/icons';
import {NotificationIcon, NotificationModule} from '../../types/notification';
import {theme} from '../../theme';

type IconComponent = React.FC<{size?: number; color?: string}>;

interface ModuleMeta {
  /** Uppercased by the badge's own style — stored in sentence case. */
  label: string;
  accent: string;
  tint: string;
  Icon: IconComponent;
}

/**
 * Colours and glyphs are presentation, so they live here rather than in the
 * SDL. Accents are the export's own CSS custom properties (`--m-maint` and
 * friends); every glyph already existed in the icon barrel.
 */
export const MODULE_META: Record<NotificationModule, ModuleMeta> = {
  Maintenance: {
    label: 'Maintenance',
    accent: '#AD6800',
    tint: '#FFF7E6',
    Icon: HandymanIcon,
  },
  Incident: {
    label: 'Incident',
    accent: '#D4380D',
    tint: '#FFF1EC',
    Icon: AlertTriangleIcon,
  },
  Fixture: {
    label: 'Fixture',
    accent: '#722ED1',
    tint: '#F7F0FF',
    Icon: CubeIcon,
  },
  Equipment: {
    label: 'Equipment',
    accent: '#2B4ACB',
    tint: '#EEF2FF',
    Icon: BoxIcon,
  },
  Cleaning: {
    label: 'Cleaning',
    accent: '#0A7EA4',
    tint: '#E6F7FB',
    Icon: SprayCanIcon,
  },
  POI: {
    label: 'POI',
    accent: '#3F9425',
    tint: '#F0FAEC',
    Icon: UserPlusIcon,
  },
  System: {
    label: 'System',
    accent: theme.colors.primary,
    tint: '#E6F4FF',
    Icon: RefreshIcon,
  },
};

const ICON_OVERRIDE: Record<NotificationIcon, IconComponent> = {
  Sync: RefreshIcon,
  Comment: MessageSquareIcon,
  Clock: ClockIcon,
  Bell: BellIcon,
};

/** The per-notification glyph wins; the module's is the fallback. */
export function notificationIcon(
  module: NotificationModule,
  icon: NotificationIcon | null,
): IconComponent {
  return icon ? ICON_OVERRIDE[icon] : MODULE_META[module].Icon;
}
