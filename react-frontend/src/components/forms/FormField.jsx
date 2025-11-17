import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

/**
 * Enhanced FormField component with validation support
 * Works with React Hook Form
 */
export const FormField = ({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  required = false,
  helperText,
  icon,
  register,
  validation,
  className = '',
  disabled = false,
  ...props
}) => {
  const hasError = !!error;
  const isValid = !hasError && props.value && props.value.length > 0;

  return (
    <div className={`form-field ${className}`} style={{ marginBottom: '20px' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: hasError ? '#ef4444' : '#374151',
          }}
        >
          {label}
          {required && (
            <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: hasError ? '#ef4444' : '#6b7280',
            zIndex: 2,
          }}>
            <FontAwesomeIcon icon={icon} />
          </div>
        )}

        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: icon ? '12px 16px 12px 45px' : '12px 16px',
            border: `2px solid ${hasError ? '#ef4444' : isValid ? '#10b981' : '#e5e7eb'}`,
            borderRadius: '10px',
            fontSize: '15px',
            outline: 'none',
            transition: 'all 0.2s ease',
            background: disabled ? '#f9fafb' : 'white',
            color: disabled ? '#6b7280' : '#1f2937',
            ...(props.style || {}),
          }}
          onFocus={(e) => {
            if (!hasError) {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = 'none';
            if (!hasError && !isValid) {
              e.target.style.borderColor = '#e5e7eb';
            }
          }}
          {...(register ? register(name, validation) : {})}
          {...props}
        />

        {hasError && (
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#ef4444',
            zIndex: 2,
          }}>
            <FontAwesomeIcon icon={faExclamationCircle} />
          </div>
        )}

        {isValid && !hasError && (
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#10b981',
            zIndex: 2,
          }}>
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
        )}
      </div>

      {hasError && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <FontAwesomeIcon icon={faExclamationCircle} style={{ fontSize: '12px' }} />
          {error.message || error}
        </p>
      )}

      {helperText && !hasError && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: '#6b7280',
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
};

/**
 * FormSelect - Enhanced select field with validation
 */
export const FormSelect = ({
  label,
  name,
  options = [],
  placeholder = 'Select an option',
  error,
  required = false,
  helperText,
  register,
  validation,
  disabled = false,
  ...props
}) => {
  const hasError = !!error;
  const isValid = !hasError && props.value && props.value.length > 0;

  return (
    <div className="form-field" style={{ marginBottom: '20px' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: hasError ? '#ef4444' : '#374151',
          }}
        >
          {label}
          {required && (
            <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <select
          id={name}
          name={name}
          required={required}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '12px 16px',
            paddingRight: '40px',
            border: `2px solid ${hasError ? '#ef4444' : isValid ? '#10b981' : '#e5e7eb'}`,
            borderRadius: '10px',
            fontSize: '15px',
            outline: 'none',
            transition: 'all 0.2s ease',
            background: disabled ? '#f9fafb' : 'white',
            color: disabled ? '#6b7280' : '#1f2937',
            cursor: disabled ? 'not-allowed' : 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            ...(props.style || {}),
          }}
          onFocus={(e) => {
            if (!hasError) {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = 'none';
            if (!hasError && !isValid) {
              e.target.style.borderColor = '#e5e7eb';
            }
          }}
          {...(register ? register(name, validation) : {})}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => {
            if (typeof option === 'string') {
              return (
                <option key={option} value={option}>
                  {option}
                </option>
              );
            }
            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            );
          })}
        </select>

        {hasError && (
          <div style={{
            position: 'absolute',
            right: '40px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#ef4444',
            pointerEvents: 'none',
          }}>
            <FontAwesomeIcon icon={faExclamationCircle} />
          </div>
        )}
      </div>

      {hasError && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <FontAwesomeIcon icon={faExclamationCircle} style={{ fontSize: '12px' }} />
          {error.message || error}
        </p>
      )}

      {helperText && !hasError && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: '#6b7280',
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
};

/**
 * FormTextarea - Enhanced textarea field with validation
 */
export const FormTextarea = ({
  label,
  name,
  placeholder,
  error,
  required = false,
  helperText,
  rows = 4,
  register,
  validation,
  disabled = false,
  ...props
}) => {
  const hasError = !!error;
  const isValid = !hasError && props.value && props.value.length > 0;

  return (
    <div className="form-field" style={{ marginBottom: '20px' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: hasError ? '#ef4444' : '#374151',
          }}
        >
          {label}
          {required && (
            <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: `2px solid ${hasError ? '#ef4444' : isValid ? '#10b981' : '#e5e7eb'}`,
          borderRadius: '10px',
          fontSize: '15px',
          outline: 'none',
          transition: 'all 0.2s ease',
          background: disabled ? '#f9fafb' : 'white',
          color: disabled ? '#6b7280' : '#1f2937',
          resize: 'vertical',
          fontFamily: 'inherit',
          ...(props.style || {}),
        }}
        onFocus={(e) => {
          if (!hasError) {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = 'none';
          if (!hasError && !isValid) {
            e.target.style.borderColor = '#e5e7eb';
          }
        }}
        {...(register ? register(name, validation) : {})}
        {...props}
      />

      {hasError && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <FontAwesomeIcon icon={faExclamationCircle} style={{ fontSize: '12px' }} />
          {error.message || error}
        </p>
      )}

      {helperText && !hasError && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: '#6b7280',
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormField;

