# StyleSheet Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all NativeWind `className` props with React Native `StyleSheet.create()` and establish a shared theme file for colors, typography, and reusable style patterns.

**Architecture:** Create `src/theme/index.ts` as the single source of truth for colors, font families (platform-aware, from existing `src/constants/fonts.ts`), font sizes, spacing, border radii, and common shadow presets. Every screen and component then imports from this theme and uses `StyleSheet.create()` — no more `className` props anywhere.

**Tech Stack:** React Native `StyleSheet`, existing `fontFamilies` from `src/constants/fonts.ts`, no new dependencies.

## Global Constraints

- No new npm packages
- Keep `src/constants/fonts.ts` as-is — the theme re-exports from it
- Remove NativeWind `className` props entirely from every file (search `className=` must return 0 results after migration)
- All font references must use `fontFamilies.LATO.*` — never hardcoded `'Lato-Bold'` strings
- Colors must come from `theme.colors.*` — no inline hex strings in components
- `tailwind.config.js` and NativeWind can be removed from the project after migration (noted, not in scope of this plan's tasks — flag for follow-up)
- No logic changes — this is a pure styling migration

---

### Task 1: Create shared theme file

**Files:**
- Create: `src/theme/index.ts`

**Interfaces:**
- Consumes: `fontFamilies` from `../constants/fonts`
- Produces:
  - `theme.colors: { primary, primaryDark, primaryLight, background, surface, border, text, textSecondary, textMuted, white, error, success }`
  - `theme.fonts: { light, regular, medium, bold, black }` (platform-aware font family strings)
  - `theme.fontSize: { xs, sm, base, lg, xl, xxl }`
  - `theme.radius: { sm, md, lg, xl }`
  - `theme.spacing: { xs, sm, md, lg, xl }`
  - `theme.shadow: { card, button, input }` (iOS shadowColor/offset/opacity/radius + Android elevation)
  - `theme.common: { row, center, flex1 }` (shared layout style objects)

- [ ] **Step 1: Create `src/theme/index.ts`**

```ts
import {fontFamilies} from '../constants/fonts';

export const theme = {
  colors: {
    primary: '#0066B2',
    primaryDark: '#1D4889',
    primaryLight: '#EFF6FF',
    background: '#F7F7F7',
    surface: '#FFFFFF',
    border: '#EAEDF0',
    borderLight: '#EBEBEB',
    text: '#1A1A1A',
    textSecondary: '#667085',
    textMuted: '#9CA3AF',
    white: '#FFFFFF',
    error: '#EF4444',
    success: '#16A34A',
    overlay: 'rgba(0,0,0,0.4)',
  },
  fonts: {
    light: fontFamilies.LATO.light,
    regular: fontFamilies.LATO.regular,
    medium: fontFamilies.LATO.medium,
    bold: fontFamilies.LATO.bold,
    black: fontFamilies.LATO.black,
  },
  fontSize: {
    xs: 12,
    sm: 13,
    base: 15,
    md: 16,
    lg: 20,
    xl: 22,
    xxl: 24,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 20,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  shadow: {
    card: {
      shadowColor: '#101828',
      shadowOffset: {width: 1, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    button: {
      shadowColor: '#00467A',
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 1,
      shadowRadius: 7,
      elevation: 4,
    },
    fab: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
  },
  common: {
    row: {flexDirection: 'row' as const, alignItems: 'center' as const},
    center: {alignItems: 'center' as const, justifyContent: 'center' as const},
    flex1: {flex: 1},
  },
} as const;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/mbp/Documents/GitHub/BBB/bbb_smart_system && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing errors unrelated to `src/theme/index.ts`)

- [ ] **Step 3: Commit**

```bash
git add src/theme/index.ts
git commit -m "feat: add shared theme with colors, fonts, spacing, and shadows"
```

---

### Task 2: Migrate BottomSheet

**Files:**
- Modify: `src/components/BottomSheet.tsx`

**Interfaces:**
- Consumes: `theme` from `../theme`
- Produces: same `Props` interface, same behavior — only styling changes

- [ ] **Step 1: Replace the file content**

Replace the full file with:

```tsx
import React, {useEffect, useRef, useState} from 'react';
import {
  Modal,
  View,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {theme} from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetStyle?: ViewStyle;
}

const BottomSheet: React.FC<Props> = ({visible, onClose, children, sheetStyle}) => {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({finished}) => finished && setMounted(false));
    }
  }, [visible, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight || 1000, 0],
  });

  return (
    <Modal visible={mounted} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, {opacity: progress}]} />
        <Pressable style={styles.spacer} onPress={onClose} />
        <Animated.View
          onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            {paddingBottom: insets.bottom, transform: [{translateY}]},
            sheetStyle,
          ]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
  },
  spacer: {flex: 1},
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
});

export default BottomSheet;
```

- [ ] **Step 2: Verify no `className` remains**

```bash
grep -n "className" /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/components/BottomSheet.tsx
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/components/BottomSheet.tsx
git commit -m "refactor: migrate BottomSheet to StyleSheet"
```

---

### Task 3: Migrate LoadingOverlay

**Files:**
- Modify: `src/components/LoadingOverlay.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import React from 'react';
import {ActivityIndicator, View, Modal, Text, StyleSheet} from 'react-native';
import {theme} from '../theme';

interface Props {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<Props> = ({visible, message = 'Loading…'}) => (
  <Modal transparent animationType="fade" visible={visible}>
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  message: {
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.regular,
    color: '#374151',
    marginTop: theme.spacing.md,
  },
});

export default LoadingOverlay;
```

- [ ] **Step 2: Verify no `className` remains**

```bash
grep -n "className" /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/components/LoadingOverlay.tsx
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/components/LoadingOverlay.tsx
git commit -m "refactor: migrate LoadingOverlay to StyleSheet"
```

---

### Task 4: Migrate PositionModal

**Files:**
- Modify: `src/components/PositionModal.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {TaskItem} from '../types/program';
import BottomSheet from './BottomSheet';
import {theme} from '../theme';

interface Props {
  visible: boolean;
  tasks: TaskItem[];
  isLoading: boolean;
  programName: string;
  onSelect: (task: TaskItem) => void;
  onClose: () => void;
}

const PositionModal: React.FC<Props> = ({
  visible,
  tasks,
  isLoading,
  programName,
  onSelect,
  onClose,
}) => (
  <BottomSheet visible={visible} onClose={onClose} sheetStyle={{maxHeight: '70%'}}>
    <View style={styles.header}>
      <View style={theme.common.flex1}>
        <Text style={styles.title}>Select Position</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{programName}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>

    {isLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        <Text style={styles.loadingText}>Loading positions…</Text>
      </View>
    ) : (
      <FlatList
        data={tasks}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            style={styles.listItem}
            activeOpacity={0.7}>
            <Text style={styles.listItemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No positions available</Text>
          </View>
        }
      />
    )}
  </BottomSheet>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {padding: theme.spacing.xs},
  closeText: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.xs + 2,
  },
  listContent: {padding: theme.spacing.md},
  listItem: {
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: '#F7F9FC',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listItemText: {
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  emptyContainer: {padding: 32, alignItems: 'center'},
  emptyText: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs + 2,
  },
});

export default PositionModal;
```

- [ ] **Step 2: Verify no `className` remains**

```bash
grep -n "className" /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/components/PositionModal.tsx
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/components/PositionModal.tsx
git commit -m "refactor: migrate PositionModal to StyleSheet"
```

---

### Task 5: Migrate ShiftTimeModal

**Files:**
- Modify: `src/components/ShiftTimeModal.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator, StyleSheet} from 'react-native';
import BottomSheet from './BottomSheet';
import {theme} from '../theme';

interface Props {
  visible: boolean;
  isLoading: boolean;
  onConfirm: (startTime: Date, endTime: Date) => void;
  onClose: () => void;
  timeZone?: string;
}

const formatTime = (date: Date, timeZone?: string): string =>
  date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone,
  });

const formatDate = (date: Date, timeZone?: string): string =>
  date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  });

const ShiftTimeModal: React.FC<Props> = ({visible, isLoading, onConfirm, onClose, timeZone}) => {
  const [startTime] = useState(() => new Date());
  const [endTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 8);
    return d;
  });

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shift Hours</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.timeRow}>
          <View style={[styles.timeCard, styles.startCard]}>
            <Text style={[styles.timeLabel, {color: '#3B82F6'}]}>START TIME</Text>
            <Text style={[styles.timeValue, {color: theme.colors.primaryDark}]}>
              {formatTime(startTime, timeZone)}
            </Text>
            <Text style={styles.dateValue}>{formatDate(startTime, timeZone)}</Text>
          </View>
          <View style={[styles.timeCard, styles.endCard]}>
            <Text style={[styles.timeLabel, {color: theme.colors.success}]}>END TIME</Text>
            <Text style={[styles.timeValue, {color: '#15803D'}]}>
              {formatTime(endTime, timeZone)}
            </Text>
            <Text style={styles.dateValue}>{formatDate(endTime, timeZone)}</Text>
          </View>
        </View>

        <Text style={styles.hint}>8-hour shift starting now</Text>

        <TouchableOpacity
          onPress={() => onConfirm(startTime, endTime)}
          disabled={isLoading}
          style={[styles.confirmBtn, isLoading && styles.disabledBtn]}>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.confirmText}>Start Shift</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  closeBtn: {padding: theme.spacing.xs},
  closeText: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted,
  },
  body: {padding: theme.spacing.xl, gap: 16},
  timeRow: {flexDirection: 'row', gap: theme.spacing.md},
  timeCard: {
    flex: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
  },
  startCard: {backgroundColor: '#F0F5FF', borderColor: '#DBEAFE'},
  endCard: {backgroundColor: '#F0FFF4', borderColor: '#BBF7D0'},
  timeLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bold,
    marginBottom: theme.spacing.xs,
  },
  timeValue: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.bold,
  },
  dateValue: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.regular,
    color: '#6B7280',
    marginTop: 2,
  },
  hint: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledBtn: {opacity: 0.6},
  confirmText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
  },
});

export default ShiftTimeModal;
```

- [ ] **Step 2: Verify no `className` remains**

```bash
grep -n "className" /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/components/ShiftTimeModal.tsx
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/components/ShiftTimeModal.tsx
git commit -m "refactor: migrate ShiftTimeModal to StyleSheet"
```

---

### Task 6: Migrate LoginScreen

**Files:**
- Modify: `src/screens/LoginScreen.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {useAuth} from '../hooks/useAuth';
import LoadingOverlay from '../components/LoadingOverlay';
import {theme} from '../theme';

const LoginScreen: React.FC = () => {
  const {login, isLoading, error, dismissError} = useAuth();

  const [username, setUsername] = useState('0000waqas');
  const [password, setPassword] = useState('Test@!23');
  const [fieldErrors, setFieldErrors] = useState({username: '', password: ''});

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error, [{text: 'OK', onPress: dismissError}]);
    }
  }, [error, dismissError]);

  const validate = (): boolean => {
    const errs = {username: '', password: ''};
    if (!username.trim()) {
      errs.username = 'Username is required.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    setFieldErrors(errs);
    return !errs.username && !errs.password;
  };

  const handleLogin = () => {
    if (validate()) {
      login({username: username.trim(), password, login_type: 2});
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>BBB</Text>
          <Text style={styles.heroSubtitle}>SMART SYSTEM</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={[styles.input, fieldErrors.username ? styles.inputError : null]}
              placeholder="Enter your username"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={v => {
                setUsername(v);
                if (fieldErrors.username) {
                  setFieldErrors(p => ({...p, username: ''}));
                }
              }}
            />
            {fieldErrors.username ? (
              <Text style={styles.fieldError}>{fieldErrors.username}</Text>
            ) : null}
          </View>

          <View style={[styles.fieldGroup, styles.lastFieldGroup]}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={[styles.input, fieldErrors.password ? styles.inputError : null]}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={v => {
                setPassword(v);
                if (fieldErrors.password) {
                  setFieldErrors(p => ({...p, password: ''}));
                }
              }}
            />
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}>
            <Text style={styles.submitText}>Sign In</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>Demo: johndoe / password123</Text>
        </View>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Signing in…" />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F3F4F6'},
  scroll: {flexGrow: 1},
  hero: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: theme.spacing.xl + 4,
    paddingTop: 80,
    paddingBottom: 64,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontFamily: theme.fonts.black,
    color: theme.colors.white,
    letterSpacing: 6,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: theme.fonts.medium,
    color: 'rgba(255,255,255,0.6)',
    fontSize: theme.fontSize.sm,
    letterSpacing: 3,
  },
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg + 4,
    marginTop: -28,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.xl + 4,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.bold,
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.xs + 2,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl + 4,
  },
  fieldGroup: {marginBottom: theme.spacing.md},
  lastFieldGroup: {marginBottom: theme.spacing.xl + 4},
  fieldLabel: {
    fontSize: theme.fontSize.xs + 2,
    fontFamily: theme.fonts.bold,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.regular,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputError: {borderColor: theme.colors.error},
  fieldError: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledBtn: {opacity: 0.6},
  submitText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
  },
  hint: {
    textAlign: 'center',
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.lg + 4,
  },
});

export default LoginScreen;
```

- [ ] **Step 2: Verify no `className` remains**

```bash
grep -n "className" /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/screens/LoginScreen.tsx
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/screens/LoginScreen.tsx
git commit -m "refactor: migrate LoginScreen to StyleSheet"
```

---

### Task 7: Migrate HomeScreen

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GetSelectedProgram} from '../redux/program/selectors';
import {locationTracker} from '../utils/locationTracker';
import {theme} from '../theme';

const STAT_ICONS: Record<string, any> = {
  assigned: require('../assets/icons/stat_assigned.png'),
  unassign: require('../assets/icons/stat_unassign.png'),
  mywork: require('../assets/icons/stat_mywork.png'),
};

const StatCard = ({
  label,
  count,
  iconKey,
}: {
  label: string;
  count: number;
  iconKey: string;
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    <View style={styles.statRow}>
      <Text style={styles.statCount}>{count}</Text>
      <Image source={STAT_ICONS[iconKey]} style={styles.statIcon} />
    </View>
  </View>
);

const HomeScreen: React.FC = () => {
  const selectedProgram = GetSelectedProgram();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    const removeProgress = locationTracker.onUploadProgress(progress => {
      setSyncStatus(`Uploading… ${Math.round(progress)}%`);
    });
    const removeComplete = locationTracker.onUploadComplete(status => {
      setSyncStatus(status === 'completed' ? 'Sync complete' : 'Sync failed — will retry');
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    });
    return () => { removeProgress(); removeComplete(); };
  }, []);

  const handleSyncNow = useCallback(() => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus('Syncing…');
    locationTracker.syncNow();
  }, [isSyncing]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={[theme.common.row, styles.headerInner]}>
          <View style={[theme.common.flex1, styles.headerTextCol]}>
            <View style={[theme.common.row, styles.gap4]}>
              <Image
                source={require('../assets/icons/marker_pin.png')}
                style={[styles.icon20, {tintColor: theme.colors.white}]}
              />
              <Text style={styles.programName} numberOfLines={1}>
                {selectedProgram?.program_name ?? 'Akron Oh Downtown Akron Partnership 1350'}
              </Text>
            </View>
            <View style={[theme.common.row, styles.shiftRow]}>
              <Text style={styles.shiftLabel}>Shift Type:</Text>
              <Text style={styles.shiftLabel}>Cleaning</Text>
              <Image
                source={require('../assets/icons/chevron_left.png')}
                style={[styles.icon14, {tintColor: theme.colors.white}]}
              />
            </View>
          </View>

          <View style={styles.mapGrid}>
            <View style={styles.mapGridHLine} />
            <View style={styles.mapGridVLine} />
            <View style={styles.mapGridDot} />
          </View>
        </View>

        <View style={styles.searchBar}>
          <Image
            source={require('../assets/icons/search.png')}
            style={[styles.icon20, {tintColor: theme.colors.white}]}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search here..."
            placeholderTextColor="rgba(255,255,255,0.7)"
          />
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.statRow3}>
          <StatCard label="Assigned Work" count={0} iconKey="assigned" />
          <StatCard label="Unassign Work" count={0} iconKey="unassign" />
          <StatCard label="My Work" count={0} iconKey="mywork" />
        </View>

        <View style={styles.divider} />

        <View style={styles.emptyState}>
          <Image source={require('../assets/icons/empty_icon.png')} style={styles.emptyIcon} />
          <View style={styles.emptyTextGroup}>
            <Text style={styles.emptyTitle}>No work to show yet</Text>
            <Text style={styles.emptyBody}>
              Work appears when assigned by your supervisor, requested by a user, or created by you as needed.
            </Text>
          </View>
        </View>
      </View>

      {syncStatus && (
        <View style={styles.syncToast}>
          <Text style={styles.syncToastText}>{syncStatus}</Text>
        </View>
      )}

      <View style={styles.fabArea}>
        <TouchableOpacity
          onPress={handleSyncNow}
          disabled={isSyncing}
          style={[styles.fab, isSyncing && styles.fabDisabled, theme.shadow.fab]}
          activeOpacity={0.8}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Image
              source={require('../assets/icons/map.png')}
              style={[styles.icon20, {tintColor: theme.colors.primary}]}
            />
          )}
          <Text style={styles.fabText}>{isSyncing ? 'Syncing…' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.primary},
  header: {backgroundColor: theme.colors.primary, paddingBottom: theme.spacing.lg},
  headerInner: {
    paddingHorizontal: theme.spacing.lg,
    gap: 32,
  },
  headerTextCol: {gap: 4},
  gap4: {gap: 4},
  programName: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    lineHeight: 24,
  },
  shiftRow: {gap: 4, paddingLeft: 24},
  shiftLabel: {
    fontFamily: theme.fonts.regular,
    color: '#ECECEC',
    fontSize: theme.fontSize.xs,
  },
  icon20: {width: 20, height: 20},
  icon14: {width: 14, height: 14},
  mapGrid: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGridHLine: {
    position: 'absolute',
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    top: 17,
  },
  mapGridVLine: {
    position: 'absolute',
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    left: 17,
  },
  mapGridDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: theme.spacing.lg,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#0064AF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    padding: 0,
    lineHeight: 24,
  },
  body: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
  statRow3: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(186,186,186,0.25)',
    padding: 12,
    gap: 16,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.medium,
    color: '#656565',
  },
  statRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  statCount: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bold,
    color: '#3B3B3B',
  },
  statIcon: {width: 20, height: 20},
  divider: {height: 1, backgroundColor: '#DEDEDE', marginHorizontal: theme.spacing.lg, marginTop: 10},
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 40,
    gap: 24,
  },
  emptyIcon: {width: 60, height: 60},
  emptyTextGroup: {alignItems: 'center', gap: 10},
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBody: {
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs + 2,
    textAlign: 'center',
    lineHeight: 18,
  },
  syncToast: {
    position: 'absolute',
    bottom: 160,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: '#1F2937',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  syncToastText: {
    fontFamily: theme.fonts.medium,
    color: theme.colors.white,
    fontSize: theme.fontSize.xs + 2,
  },
  fabArea: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: 100,
    gap: 8,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,102,178,0.08)',
    borderRadius: theme.radius.xl,
  },
  fabDisabled: {opacity: 0.6},
  fabText: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
    lineHeight: 20,
  },
});

export default HomeScreen;
```

- [ ] **Step 2: Verify no `className` remains**

```bash
grep -n "className" /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/screens/HomeScreen.tsx
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "refactor: migrate HomeScreen to StyleSheet"
```

---

### Task 8: Migrate MaintenanceScreen

**Files:**
- Modify: `src/screens/MaintenanceScreen.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {theme} from '../theme';

const FILTER_CHIPS = [
  'Type', 'Business Name', 'Priority', 'Status',
  'Date Range', 'Completed By', 'Assigned To',
];

const MaintenanceScreen: React.FC = () => {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Maintenance</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>0</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.addBtn, theme.shadow.button]} activeOpacity={0.8}>
            <Image
              source={require('../assets/icons/plus.png')}
              style={[styles.icon24, {tintColor: theme.colors.white}]}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.filterSection}>
          <View style={[styles.searchBar, theme.shadow.card]}>
            <Image
              source={require('../assets/icons/search.png')}
              style={[styles.icon20, {tintColor: theme.colors.textSecondary}]}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search maintenance..."
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}>
            {FILTER_CHIPS.map(chip => (
              <TouchableOpacity key={chip} style={styles.chip} activeOpacity={0.7}>
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Image
              source={require('../assets/icons/maintenance_tools.png')}
              style={styles.emptyIcon}
            />
          </View>
          <View style={styles.emptyTextGroup}>
            <Text style={styles.emptyTitle}>No maintenance to show yet</Text>
            <Text style={styles.emptyBody}>
              Maintenance will appear when assigned by your supervisor, and you can also create it as needed.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  headerSafe: {backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: '#EEE'},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 12,
    paddingTop: 4,
  },
  titleRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  title: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    lineHeight: 28,
  },
  badge: {
    backgroundColor: 'rgba(0,102,178,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 3,
  },
  badgeText: {
    fontFamily: theme.fonts.bold,
    color: '#131316',
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
  },
  addBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon20: {width: 20, height: 20},
  icon24: {width: 24, height: 24},
  scroll: {flex: 1},
  scrollContent: {paddingTop: 12, paddingBottom: 8},
  filterSection: {paddingHorizontal: theme.spacing.lg, gap: 8},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
    padding: 0,
    lineHeight: 24,
    marginLeft: 8,
  },
  chipsRow: {gap: 8},
  chip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontFamily: theme.fonts.medium,
    color: '#454545',
    fontSize: theme.fontSize.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 64,
    gap: 24,
  },
  emptyIconWrap: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,102,178,0.1)',
  },
  emptyIcon: {width: 28, height: 28},
  emptyTextGroup: {alignItems: 'center', gap: 10},
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBody: {
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs + 2,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default MaintenanceScreen;
```

- [ ] **Step 2: Verify no `className` remains**

```bash
grep -n "className" /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/screens/MaintenanceScreen.tsx
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/screens/MaintenanceScreen.tsx
git commit -m "refactor: migrate MaintenanceScreen to StyleSheet"
```

---

### Task 9: Migrate SelectProgramScreen

**Files:**
- Modify: `src/screens/SelectProgramScreen.tsx`

Note: The screen has complex logic — only replace `className` props with equivalent `StyleSheet` styles. Do not alter any logic.

- [ ] **Step 1: Add StyleSheet import and theme import**

At the top of the file, replace:
```tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
```
with:
```tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
```

And add after the last import line:
```tsx
import {theme} from '../theme';
```

- [ ] **Step 2: Replace `renderItem` function**

Replace the `renderItem` function:
```tsx
const renderItem = ({ item }: { item: Program }) => {
  const isSelected = selectedProgram?.id === item.id;
  return (
    <TouchableOpacity
      className={`mx-4 mb-2.5 rounded-xl px-4 py-4 flex-row justify-between items-center border ${
        isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 bg-white'
      }`}
      onPress={() => handleProgramSelect(item)}
      activeOpacity={0.7}
    >
      <Text
        className={`flex-1 text-[15px] ${
          isSelected ? 'text-primary font-semibold' : 'text-gray-900'
        }`}
        numberOfLines={1}
      >
        {item.program_name}
      </Text>
      {isSelected && (
        <Text className="text-primary font-bold text-lg ml-3">✓</Text>
      )}
    </TouchableOpacity>
  );
};
```

with:
```tsx
const renderItem = ({item}: {item: Program}) => {
  const isSelected = selectedProgram?.id === item.id;
  return (
    <TouchableOpacity
      style={[styles.programItem, isSelected ? styles.programItemSelected : null]}
      onPress={() => handleProgramSelect(item)}
      activeOpacity={0.7}>
      <Text
        style={[styles.programName, isSelected ? styles.programNameSelected : null]}
        numberOfLines={1}>
        {item.program_name}
      </Text>
      {isSelected && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
};
```

- [ ] **Step 3: Replace the JSX return**

Replace the `return (` block (starting from `<SafeAreaView className="flex-1 bg-white">`) with:

```tsx
return (
  <SafeAreaView style={styles.root}>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Select A Program</Text>
      <TouchableOpacity style={styles.closeBtn} onPress={() => dispatch(logout())}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.searchContainer}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Program Name"
        placeholderTextColor={theme.colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {search.length > 0 && (
        <TouchableOpacity onPress={() => setSearch('')}>
          <Text style={styles.searchClearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>

    {selectedProgram && !search && (
      <View style={styles.selectedBanner}>
        <View style={theme.common.flex1}>
          <Text style={styles.selectedBannerLabel}>Selected Program</Text>
          <Text style={styles.selectedBannerName} numberOfLines={1}>
            {selectedProgram.program_name}
          </Text>
        </View>
        <Text style={styles.checkmarkLarge}>✓</Text>
      </View>
    )}

    {isLoading && programs.length === 0 ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        <Text style={styles.loadingText}>Loading programs…</Text>
      </View>
    ) : (
      <FlatList
        data={filteredPrograms}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={() => (
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              {filteredPrograms.length} Available Program
              {filteredPrograms.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No programs found</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    )}

    <PositionModal
      visible={showPositionModal}
      tasks={taskList}
      isLoading={isTaskLoading}
      programName={activeProgramItem?.program_name ?? ''}
      onSelect={handlePositionSelect}
      onClose={() => setShowPositionModal(false)}
    />

    <ShiftTimeModal
      visible={showShiftModal}
      isLoading={isShiftLoading}
      timeZone={activeProgramItem?.timezone_str ?? 'America/New_York'}
      onConfirm={handleShiftConfirm}
      onClose={() => setShowShiftModal(false)}
    />
  </SafeAreaView>
);
```

- [ ] **Step 4: Add StyleSheet block at the bottom of the file (before `export default`)**

```tsx
const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.surface},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg + 4,
    paddingTop: theme.spacing.lg,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fonts.bold,
    color: '#111827',
  },
  closeBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: theme.fonts.bold,
    color: '#6B7280',
    fontSize: theme.fontSize.md,
  },
  searchContainer: {
    marginHorizontal: theme.spacing.lg,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
  },
  searchIcon: {color: '#9CA3AF', marginRight: 8, fontSize: theme.fontSize.md},
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.regular,
    color: '#111827',
  },
  searchClearText: {color: '#9CA3AF', fontSize: theme.fontSize.md},
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.lg,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
  },
  selectedBannerLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  selectedBannerName: {
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.medium,
    color: '#111827',
  },
  checkmarkLarge: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.primaryDark,
    fontSize: theme.fontSize.xl,
    marginLeft: 12,
  },
  loadingContainer: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {
    fontFamily: theme.fonts.regular,
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: theme.fontSize.xs + 2,
  },
  listHeader: {paddingHorizontal: theme.spacing.lg, paddingVertical: 12},
  listHeaderText: {
    fontFamily: theme.fonts.medium,
    color: '#6B7280',
    fontSize: theme.fontSize.xs + 2,
  },
  listContent: {paddingBottom: 32},
  emptyContainer: {alignItems: 'center', justifyContent: 'center', paddingVertical: 64},
  emptyText: {
    fontFamily: theme.fonts.regular,
    color: '#9CA3AF',
    fontSize: theme.fontSize.md,
  },
  programItem: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: 10,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: theme.colors.surface,
  },
  programItemSelected: {
    borderColor: theme.colors.primaryDark,
    backgroundColor: '#EFF6FF',
  },
  programName: {
    flex: 1,
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.regular,
    color: '#111827',
  },
  programNameSelected: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.primaryDark,
  },
  checkmark: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.primaryDark,
    fontSize: theme.fontSize.lg,
    marginLeft: 12,
  },
});
```

- [ ] **Step 5: Verify no `className` remains**

```bash
grep -n "className" /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/screens/SelectProgramScreen.tsx
```

Expected: no output

- [ ] **Step 6: Commit**

```bash
git add src/screens/SelectProgramScreen.tsx
git commit -m "refactor: migrate SelectProgramScreen to StyleSheet"
```

---

### Task 10: Migrate IncidentScreen, FixtureScreen, ProfileScreen, MoreScreen

**Files:**
- Modify: `src/screens/IncidentScreen.tsx`
- Modify: `src/screens/FixtureScreen.tsx`
- Modify: `src/screens/ProfileScreen.tsx`
- Modify: `src/screens/MoreScreen.tsx`

IncidentScreen and FixtureScreen are stubs — tiny changes. ProfileScreen and MoreScreen already use inline `style={{}}` — just move them into `StyleSheet.create()` and use `theme` values.

- [ ] **Step 1: Replace IncidentScreen**

```tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {theme} from '../theme';

const IncidentScreen: React.FC = () => (
  <SafeAreaView style={styles.root}>
    <View style={[styles.root, theme.common.center]}>
      <Text style={styles.heading}>Incident</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F3F4F6'},
  heading: {fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bold, color: '#9CA3AF'},
  sub: {fontSize: theme.fontSize.xs + 2, fontFamily: theme.fonts.regular, color: '#9CA3AF', marginTop: 4},
});

export default IncidentScreen;
```

- [ ] **Step 2: Replace FixtureScreen**

```tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {theme} from '../theme';

const FixtureScreen: React.FC = () => (
  <SafeAreaView style={styles.root}>
    <View style={[styles.root, theme.common.center]}>
      <Text style={styles.heading}>Fixture</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F3F4F6'},
  heading: {fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bold, color: '#9CA3AF'},
  sub: {fontSize: theme.fontSize.xs + 2, fontFamily: theme.fonts.regular, color: '#9CA3AF', marginTop: 4},
});

export default FixtureScreen;
```

- [ ] **Step 3: Replace ProfileScreen**

```tsx
import React from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppDispatch} from '../redux/store';
import {logout} from '../redux/auth/actions';
import {GetUser} from '../redux/selectors';
import {theme} from '../theme';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = GetUser();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logout())},
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>⊙</Text>
          </View>
          <View style={theme.common.flex1}>
            <Text style={styles.userName}>{user?.name ?? '—'}</Text>
            <Text style={styles.userHandle}>@{user?.username ?? '—'}</Text>
            <Text style={styles.userId}>ID: {user?.id ?? '—'}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.signOutRow}>
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F3F4F6'},
  pageHeader: {paddingHorizontal: theme.spacing.lg, paddingTop: 12, paddingBottom: 8},
  pageTitle: {fontSize: theme.fontSize.xl, fontFamily: theme.fonts.bold, color: '#111827'},
  content: {padding: theme.spacing.lg},
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarIcon: {fontSize: theme.fontSize.xl},
  userName: {fontSize: theme.fontSize.md, fontFamily: theme.fonts.bold, color: '#111827'},
  userHandle: {fontSize: theme.fontSize.sm, fontFamily: theme.fonts.regular, color: '#6B7280', marginTop: 2},
  userId: {fontSize: theme.fontSize.xs, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, marginTop: 4},
  signOutRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutIcon: {fontSize: 18, marginRight: 12},
  signOutText: {flex: 1, fontSize: theme.fontSize.base, fontFamily: theme.fonts.medium, color: theme.colors.error},
  rowArrow: {fontSize: 18, color: theme.colors.textMuted},
});

export default ProfileScreen;
```

- [ ] **Step 4: Replace MoreScreen**

The MoreScreen is already using inline `style={{}}` — move all inline styles to a `StyleSheet` and use `theme` values. Replace the full file:

```tsx
import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MenuItem} from '../types/navigation';
import {locationTracker, SmoothingFilter} from '../utils/locationTracker';
import {theme} from '../theme';

const ICON_MAP: Record<string, string> = {
  home: '⌂',
  maintenance: '✂',
  fixture: '⋈',
  incident: 'ⓘ',
  profile: '⊙',
};

interface MoreScreenProps {
  items: MenuItem[];
  onSelect: (screen: string) => void;
}

const MoreScreen: React.FC<MoreScreenProps> = ({items, onSelect}) => {
  const [filter, setFilter] = useState<SmoothingFilter>('gaussian');

  useEffect(() => {
    locationTracker.getSmoothingFilter().then(setFilter);
  }, []);

  const selectFilter = (value: SmoothingFilter) => {
    setFilter(value);
    locationTracker.setSmoothingFilter(value);
  };

  const handleShareGpsLog = async () => {
    const ok = await locationTracker.shareGpsLog();
    if (!ok) {
      Alert.alert('No GPS log', 'No GPS log file has been recorded yet.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.menuCard}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.screen_name)}
              style={[styles.menuRow, index < items.length - 1 && styles.menuRowBorder]}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>{ICON_MAP[item.menu_icon] ?? '○'}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.menu_name}</Text>
              <Text style={styles.rowArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DEBUG</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity onPress={handleShareGpsLog} style={styles.menuRow}>
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>⇪</Text>
            </View>
            <Text style={styles.menuLabel}>Share GPS Log</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>

          <View style={[styles.menuRow, styles.menuRowBorderTop, styles.filterRow]}>
            <Text style={styles.menuLabel}>GPS Smoothing</Text>
            <View style={styles.filterBtns}>
              {(['gaussian', 'kalman', 'none'] as SmoothingFilter[]).map(value => {
                const selected = filter === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => selectFilter(value)}
                    style={[styles.filterBtn, selected && styles.filterBtnSelected]}>
                    <Text style={[styles.filterBtnText, selected && styles.filterBtnTextSelected]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F3F4F6'},
  pageHeader: {paddingHorizontal: theme.spacing.lg, paddingTop: 12, paddingBottom: 8},
  pageTitle: {fontSize: theme.fontSize.xl, fontFamily: theme.fonts.bold, color: '#111827'},
  scroll: {padding: theme.spacing.lg},
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
  },
  menuRowBorder: {borderBottomWidth: 1, borderBottomColor: '#F3F4F6'},
  menuRowBorderTop: {borderTopWidth: 1, borderTopColor: '#F3F4F6'},
  filterRow: {flexWrap: 'wrap'},
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuIconText: {fontSize: 18, color: theme.colors.primaryDark},
  menuLabel: {flex: 1, fontSize: theme.fontSize.base, fontFamily: theme.fonts.medium, color: '#111827'},
  rowArrow: {fontSize: 18, color: theme.colors.textMuted},
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xxl,
    marginBottom: 8,
    marginLeft: 4,
  },
  filterBtns: {flexDirection: 'row', gap: 8},
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
  },
  filterBtnSelected: {backgroundColor: theme.colors.primaryDark},
  filterBtnText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primaryDark,
    textTransform: 'capitalize',
  },
  filterBtnTextSelected: {color: theme.colors.white},
});

export default MoreScreen;
```

- [ ] **Step 5: Verify no `className` in any of the four files**

```bash
grep -rn "className" \
  /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/screens/IncidentScreen.tsx \
  /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/screens/FixtureScreen.tsx \
  /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/screens/ProfileScreen.tsx \
  /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/screens/MoreScreen.tsx
```

Expected: no output

- [ ] **Step 6: Commit**

```bash
git add src/screens/IncidentScreen.tsx src/screens/FixtureScreen.tsx src/screens/ProfileScreen.tsx src/screens/MoreScreen.tsx
git commit -m "refactor: migrate remaining screens to StyleSheet"
```

---

### Task 11: Final verification and cleanup

**Files:**
- Modify: `tailwind.config.js` (empty out to minimal stub — keeps the file for if NativeWind is added back)
- Check: `babel.config.js` / `metro.config.js` for NativeWind references (read-only check)

- [ ] **Step 1: Verify zero `className` props remain in all source files**

```bash
grep -rn "className=" /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/src/
```

Expected: no output

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/mbp/Documents/GitHub/BBB/bbb_smart_system && npx tsc --noEmit 2>&1
```

Expected: no new errors (only pre-existing ones are acceptable)

- [ ] **Step 3: Check babel/metro for NativeWind config**

```bash
grep -rn "nativewind" \
  /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/babel.config.js \
  /Users/mbp/Documents/GitHub/BBB/bbb_smart_system/metro.config.js 2>/dev/null
```

If results appear, note them — they may need removal in a follow-up (NativeWind plugin in babel/metro can be left as a no-op until the package is actually uninstalled).

- [ ] **Step 4: Commit**

```bash
git add -p
git commit -m "refactor: complete StyleSheet migration, remove NativeWind className usage"
```
