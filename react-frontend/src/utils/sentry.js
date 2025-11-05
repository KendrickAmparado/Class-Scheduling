/**
 * Sentry wrapper with lazy loading to prevent build-time errors
 * Uses a singleton pattern to store the Sentry module reference
 */

let SentryModule = null;
let isInitialized = false;

/**
 * Lazy load Sentry module
 */
const getSentry = async () => {
  if (SentryModule) {
    return SentryModule;
  }

  if (!process.env.REACT_APP_SENTRY_DSN) {
    return null;
  }

  try {
    const Sentry = await import('@sentry/react');
    SentryModule = Sentry;
    return Sentry;
  } catch (error) {
    console.error('Failed to load Sentry:', error);
    return null;
  }
};

/**
 * Initialize Sentry for React frontend error tracking
 */
export const initSentry = () => {
  const dsn = process.env.REACT_APP_SENTRY_DSN;

  if (!dsn) {
    console.log('⚠️ Sentry DSN not configured. Error tracking is disabled.');
    return false;
  }

  // Initialize asynchronously to prevent blocking
  getSentry()
    .then((Sentry) => {
      if (!Sentry || isInitialized) {
        return;
      }

      const environment = process.env.NODE_ENV || 'development';
      const tracesSampleRate = parseFloat(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || '0.1');

      try {
        Sentry.init({
          dsn,
          environment,
          
          // Performance Monitoring
          tracesSampleRate,
          
          // Session Replay
          replaysSessionSampleRate: 0.1, // 10% of sessions
          replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
          
          // Use minimal configuration to avoid integration issues
          integrations: [
            Sentry.replayIntegration({
              maskAllText: true,
              blockAllMedia: true,
            }),
          ],

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
            
            // Remove sensitive data from user context
            if (event.user) {
              delete event.user.ip_address;
            }
            
            return event;
          },

          // Ignore certain errors
          ignoreErrors: [
            // Browser extensions
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            'ChunkLoadError',
            // Network errors (can be noisy)
            'Network request failed',
            'NetworkError',
            'Failed to fetch',
            // Known React issues
            'canceled',
            'aborted',
          ],
        });

        isInitialized = true;
        console.log('✅ Sentry initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Sentry:', error.message);
      }
    })
    .catch((error) => {
      console.error('❌ Failed to load Sentry:', error.message);
    });

  return true;
};

/**
 * Capture an exception
 */
export const captureException = (error, context = {}) => {
  console.error('Error:', error);
  
  if (!process.env.REACT_APP_SENTRY_DSN) {
    return;
  }

  getSentry()
    .then((Sentry) => {
      if (!Sentry) return;
      
      Sentry.withScope((scope) => {
        // Add context
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
        
        Sentry.captureException(error);
      });
    })
    .catch(() => {
      // Sentry not available, just log
    });
};

/**
 * Capture a message
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (!process.env.REACT_APP_SENTRY_DSN) {
    return;
  }

  getSentry()
    .then((Sentry) => {
      if (!Sentry) return;
      
      Sentry.withScope((scope) => {
        scope.setLevel(level);
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
        
        Sentry.captureMessage(message, level);
      });
    })
    .catch(() => {
      // Sentry not available, just log
    });
};

/**
 * Set user context
 */
export const setUser = (user) => {
  if (!process.env.REACT_APP_SENTRY_DSN) {
    return;
  }

  getSentry()
    .then((Sentry) => {
      if (!Sentry) return;
      
      Sentry.setUser({
        id: user.id || user._id,
        email: user.email,
        username: user.username || user.name,
      });
    })
    .catch(() => {
      // Sentry not available
    });
};

/**
 * Clear user context
 */
export const clearUser = () => {
  if (!process.env.REACT_APP_SENTRY_DSN) {
    return;
  }

  getSentry()
    .then((Sentry) => {
      if (!Sentry) return;
      
      Sentry.setUser(null);
    })
    .catch(() => {
      // Sentry not available
    });
};
