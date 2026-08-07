import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {PrimaryButton} from './ui';
import {logger} from '../utils/logger';
import {theme} from '../theme';

interface Props {
  /** Names the boundary in logs — 'root', 'Maintenance', … */
  label: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render and lifecycle throws below it so one bad screen shows a
 * recovery card instead of white-screening the whole app. Still a class
 * component because there is no hook equivalent of componentDidCatch.
 *
 * "Try again" clears the error, which remounts the subtree — Apollo refetches
 * on the remounted screen's own mount, so nothing extra is needed here.
 */
class ErrorBoundary extends React.Component<Props, State> {
  state: State = {error: null};

  static getDerivedStateFromError(error: Error): State {
    return {error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // logger is a no-op in release builds today; this is the single call site
    // to point at Crashlytics/Sentry when one is added.
    logger.error(
      'ErrorBoundary',
      `${this.props.label} crashed: ${error.message}`,
      error,
      info.componentStack,
    );
  }

  private handleReset = () => {
    this.setState({error: null});
  };

  render() {
    const {error} = this.state;
    if (!error) {
      return this.props.children;
    }
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          {__DEV__ ? error.message : 'This screen ran into a problem.'}
        </Text>
        <PrimaryButton
          label="Try again"
          onPress={this.handleReset}
          style={styles.button}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  button: {alignSelf: 'stretch'},
});

export default ErrorBoundary;
