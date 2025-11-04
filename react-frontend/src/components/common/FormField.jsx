import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  icon,
  disabled = false,
  minLength,
  maxLength,
  pattern,
  validate,
}) => {
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) onBlur(e);
    
    // Ensure value is a string for validation
    const valueStr = String(value || '');
    
    // Client-side validation
    if (required && !valueStr.trim()) {
      setLocalError(`${label || name} is required`);
    } else if (minLength && valueStr.length < minLength) {
      setLocalError(`${label || name} must be at least ${minLength} characters`);
    } else if (maxLength && valueStr.length > maxLength) {
      setLocalError(`${label || name} must be no more than ${maxLength} characters`);
    } else if (pattern && valueStr && !new RegExp(pattern).test(valueStr)) {
      setLocalError(`Invalid ${label || name} format`);
    } else if (validate && valueStr) {
      const validationError = validate(valueStr);
      if (validationError) {
        setLocalError(validationError);
      } else {
        setLocalError('');
      }
    } else {
      setLocalError('');
    }
  };

  const displayError = error || (touched && localError);

  return (
    <div style={{ marginBottom: '20px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151',
        }}>
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: displayError ? '#ef4444' : '#94a3b8',
            zIndex: 1,
          }}>
            <FontAwesomeIcon icon={icon} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          style={{
            width: '100%',
            padding: icon ? '12px 16px 12px 48px' : '12px 16px',
            border: `2px solid ${displayError ? '#ef4444' : '#e5e7eb'}`,
            borderRadius: '10px',
            fontSize: '15px',
            background: disabled ? '#f9fafb' : '#ffffff',
            color: '#1f2937',
            transition: 'all 0.2s',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = displayError ? '#ef4444' : '#3b82f6';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = displayError ? '#ef4444' : '#e5e7eb';
            handleBlur(e);
          }}
        />
      </div>
      {displayError && (
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '13px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: '12px' }} />
          {displayError}
        </p>
      )}
    </div>
  );
};

export default FormField;

