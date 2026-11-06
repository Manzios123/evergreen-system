// components/ui/form/select.tsx
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: Array<{ value: string; label: string }>;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helpText, options, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            block w-full rounded-md border bg-card text-card-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500
            min-h-11 py-2 pl-3 pr-10 text-base sm:text-sm
            ${error ? 'border-red-300 dark:border-red-500 text-red-900 dark:text-red-200' : 'border-input'}
            ${className}
          `}
          {...props}
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helpText && !error && <p className="mt-1 text-sm text-gray-500">{helpText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
