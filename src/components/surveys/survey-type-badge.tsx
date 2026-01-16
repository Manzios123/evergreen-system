// src/components/ui/survey-type-badge.tsx
interface SurveyTypeBadgeProps {
    type: string;
  }
  
  export default function SurveyTypeBadge({ type }: SurveyTypeBadgeProps) {
    const getTypeColor = () => {
      const typeLower = type?.toLowerCase() || '';
      if (typeLower.includes('volunteer') || typeLower.includes('personal')) {
        return 'bg-purple-100 text-purple-800';
      }
      if (typeLower.includes('student') || typeLower.includes('activity')) {
        return 'bg-indigo-100 text-indigo-800';
      }
      if (typeLower.includes('pre_pilot') || typeLower.includes('pre')) {
        return 'bg-green-100 text-green-800';
      }
      if (typeLower.includes('post_pilot') || typeLower.includes('post')) {
        return 'bg-orange-100 text-orange-800';
      }
      return 'bg-gray-100 text-gray-800';
    };
  
    const getTypeText = () => {
      const typeLower = type?.toLowerCase() || '';
      if (typeLower.includes('volunteer_personal') || typeLower.includes('volunteer')) {
        return 'Volunteer';
      }
      if (typeLower.includes('student_survey') || typeLower.includes('student')) {
        return 'Student';
      }
      if (typeLower.includes('pre_pilot')) {
        return 'Pre-Pilot';
      }
      if (typeLower.includes('post_pilot')) {
        return 'Post-Pilot';
      }
      return type || 'Survey';
    };
  
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor()}`}>
        {getTypeText()}
      </span>
    );
  }