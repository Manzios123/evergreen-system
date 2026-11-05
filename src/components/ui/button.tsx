// components/ui/button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        outline: 'border border-input bg-card hover:bg-accent text-card-foreground focus-visible:ring-green-500',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent focus-visible:ring-gray-500',
        ghost: 'text-foreground hover:bg-accent hover:text-foreground focus-visible:ring-gray-500',
        link: 'text-green-700 dark:text-green-300 underline-offset-4 hover:underline focus-visible:ring-green-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  className,
  variant,
  size,
  loading = false,
  icon,
  children,
  disabled,
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonVariants({ variant, size, className })} ${fullWidth ? 'w-full' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

export { buttonVariants };