import axios from 'axios';

export async function verifyRecaptcha(token) {
  if (!token) return { success: false, error: 'missing-input-response' };

  const secret = process.env.RECAPTCHA_SECRET || process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    // No secret configured — allow in non-production but return a warning
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'missing-input-secret' };
    }
    return { success: true, skipped: true };
  }

  try {
    const resp = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: { secret, response: token }
    });

    console.debug('🔐 reCAPTCHA verification response:', {
      success: resp.data.success,
      errorCodes: resp.data['error-codes'] || [],
      score: resp.data.score
    });

    // Log full response for debugging (will help identify domain/token issues)
    if (!resp.data.success) {
      console.error('❌ reCAPTCHA failed. Full response:', JSON.stringify(resp.data, null, 2));
    }

    return {
      success: !!resp.data.success,
      score: resp.data.score,
      action: resp.data.action,
      errorCodes: resp.data['error-codes'] || []
    };
  } catch (err) {
    return { success: false, error: 'network-or-service-error', details: err.message };
  }
}
