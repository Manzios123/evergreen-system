// components/ui/loading-spinner.tsx
interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    fullPage?: boolean;
    text?: string;
  }
  
  export default function LoadingSpinner({ size = 'md', fullPage = false, text }: LoadingSpinnerProps) {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    };
  
    const spinner = (
      <div className="flex flex-col items-center justify-center">
        <div className={`animate-spin rounded-full border-b-2 border-green-600 ${sizeClasses[size]}`}></div>
        {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
      </div>
    );
  
    if (fullPage) {
      return (
        <div className="fixed inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
          {spinner}
        </div>
      );
    }
  
    return spinner;
  }