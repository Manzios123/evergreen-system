// components/ui/form/textarea.tsx
import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={3}
          className={`
            block w-full rounded-md border bg-card text-card-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500
            min-h-24 py-2 px-3 text-base sm:text-sm
            ${error ? 'border-red-300 dark:border-red-500 text-red-900 dark:text-red-200' : 'border-input'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helpText && !error && <p className="mt-1 text-sm text-gray-500">{helpText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
