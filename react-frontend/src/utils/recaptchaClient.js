// Helper to execute reCAPTCHA with retries when grecaptcha.execute fails (BROWSER_ERROR)
export async function executeRecaptchaWithRetry(recaptchaRef, { maxAttempts = 4, baseDelay = 400 } = {}) {
  if (!recaptchaRef || !recaptchaRef.current) {
    throw new Error('reCAPTCHA ref not available');
  }

  let attempt = 0;
  let lastErr = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      // Prefer executeAsync (react-google-recaptcha exposes it when available)
      if (typeof recaptchaRef.current.executeAsync === 'function') {
        const token = await recaptchaRef.current.executeAsync();
        if (token) return token;
      } else if (typeof recaptchaRef.current.execute === 'function') {
        // For widgets that only expose execute(), call it and wait for onChange to resolve
        // The consumer should also attach an onChange handler to capture the token
        // We'll call execute() and then wait a short time for grecaptcha to call onChange.
        recaptchaRef.current.execute();
        // Wait for token to be populated by onChange handler in the component.
        // Here we poll for presence of the lastResponse property if the component provides it.
        // Fallback: wait a fixed short delay and assume the onChange handler will set the token state.
        await new Promise((resolve) => setTimeout(resolve, 800));
        // There's no guaranteed way to read the token from the ref for all recaptcha wrappers,
        // so caller should read its local state after this resolves.
        return null;
      } else {
        throw new Error('reCAPTCHA execute not available');
      }
    } catch (err) {
      lastErr = err;
      // If grecaptcha returned a BROWSER_ERROR or similar transient error, retry
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastErr || new Error('Failed to execute reCAPTCHA');
}

export default executeRecaptchaWithRetry;
