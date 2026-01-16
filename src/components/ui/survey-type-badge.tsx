// src/components/ui/survey-type-badge.tsx
import { cn } from '@/lib/utils';

type SurveyType = 'volunteer_personal' | 'student_survey';

interface SurveyTypeBadgeProps {
  type: SurveyType;
  className?: string;
}

export default function SurveyTypeBadge({ type, className }: SurveyTypeBadgeProps) {
  const typeConfig = {
    volunteer_personal: {
      label: 'Personal Survey',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    student_survey: {
      label: 'Student Activity',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
  };

  const config = typeConfig[type];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}