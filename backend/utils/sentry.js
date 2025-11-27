import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config();

// Track if Sentry is initialized
let isSentryInitialized = false;

/**
 * Initialize Sentry for error tracking and monitoring
 * @returns {boolean} True if Sentry was successfully initialized
 */
export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');
  const profilesSampleRate = parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1');

  if (!dsn) {
    console.log('⚠️ Sentry DSN not configured. Error tracking is disabled.');
    isSentryInitialized = false;
    return false;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      
      // Performance Monitoring
      tracesSampleRate,
      
      // Profiling (optional - requires @sentry/profiling-node to be properly installed)
      // Note: Profiling integration is disabled by default due to import issues
      // To enable: uncomment the profiling integration code below
      // profilesSampleRate,

      // Before sending event
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          
          // Remove sensitive query params
          if (event.request.query_string) {
            const query = new URLSearchParams(event.request.query_string);
            query.delete('token');
            query.delete('password');
            query.delete('secret');
            event.request.query_string = query.toString();
          }
        }
        
        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        // Network errors
        'Network request failed',
        'NetworkError',
        // Known issues
        'ChunkLoadError',
      ],
    });

    isSentryInitialized = true;
    console.log('✅ Sentry initialized successfully');
    return true;
  } catch (error) {
    isSentryInitialized = false;
    console.error('❌ Failed to initialize Sentry:', error.message);
    return false;
  }
};

/**
 * Check if Sentry is initialized and handlers are available
 * @returns {boolean} True if Sentry handlers can be used
 */
export const isSentryReady = () => {
  return isSentryInitialized && Sentry && Sentry.Handlers;
};

/**
 * Capture an exception
 */
export const captureException = (error, context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      // Add context
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      
      Sentry.captureException(error);
    });
  }
  console.error('Error:', error);
};

/**
 * Capture a message
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      
      Sentry.captureMessage(message, level);
    });
  }
};

/**
 * Set user context
 */
export const setUser = (user) => {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser({
      id: user.id || user._id,
      email: user.email,
      username: user.username || user.name,
    });
  }
};

/**
 * Clear user context
 */
export const clearUser = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

export default Sentry;

/**
 * Flush pending Sentry events (useful during shutdown)
 * @param {number} timeoutMs
 */
export const flushSentry = async (timeoutMs = 2000) => {
  try {
    if (isSentryInitialized && Sentry && typeof Sentry.flush === 'function') {
      await Sentry.flush(timeoutMs);
    }
  } catch (e) {
    // ignore flush errors
  }
};

