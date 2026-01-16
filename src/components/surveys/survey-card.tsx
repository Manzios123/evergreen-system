// src/components/surveys/survey-card.tsx
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import StatusBadge from '@/components/surveys/status-badge';
import SurveyTypeBadge from '@/components/surveys/survey-type-badge';
import { 
  CalendarIcon, 
  ClockIcon, 
  ArrowRightIcon,
  DocumentDuplicateIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SurveyCardProps {
  assignment: any;
  onClick?: () => void;
  showType?: boolean;
  showStatus?: boolean;
  showDueDate?: boolean;
}

export default function SurveyCard({ 
  assignment, 
  onClick,
  showType = true,
  showStatus = true,
  showDueDate = true 
}: SurveyCardProps) {
  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
  
  // Backend returns completed as 1/0, convert to boolean
  const isCompleted = assignment.completed === 1 || assignment.completed === true || assignment.status === 'completed';
  const isStudentSurvey = assignment.survey_type === 'student' || assignment.assignment_type === 'student_survey';
  const submissionCount = assignment.submission_count || 0;
  
  const isOverdue = dueDate && dueDate < new Date() && !isCompleted;
  const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const getDueDateColor = () => {
    if (!dueDate) return 'text-gray-600';
    if (isOverdue) return 'text-red-600';
    if (daysUntilDue && daysUntilDue <= 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getActionButton = () => {
    if (isCompleted) {
      if (isStudentSurvey) {
        // Student surveys can be submitted multiple times
        return (
          <Link href={`/volunteer/surveys/assignment/${assignment.id}`}>
            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
              {submissionCount > 0 ? `Submit Again` : 'Submit Survey'}
            </Button>
          </Link>
        );
      } else {
        // Volunteer surveys are one-time only
        return (
          <Link href={`/volunteer/surveys/assignment/${assignment.id}/responses`}>
            <Button variant="outline" size="sm">
              View Responses
            </Button>
          </Link>
        );
      }
    } else if (isOverdue) {
      return (
        <Link href={`/volunteer/surveys/assignment/${assignment.id}`}>
          <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700">
            Complete Now
          </Button>
        </Link>
      );
    } else if (assignment.status === 'in_progress') {
      return (
        <Link href={`/volunteer/surveys/assignment/${assignment.id}`}>
          <Button variant="default" size="sm" className="bg-yellow-600 hover:bg-yellow-700">
            Resume Survey
          </Button>
        </Link>
      );
    } else {
      return (
        <Link href={`/volunteer/surveys/assignment/${assignment.id}`}>
          <Button variant="default" size="sm">
            Start Survey
          </Button>
        </Link>
      );
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {showType && assignment.assignment_type && (
                <SurveyTypeBadge type={assignment.assignment_type} />
              )}
              {showStatus && (
                <StatusBadge 
                  status={isCompleted ? 'completed' : (isOverdue ? 'overdue' : assignment.status)} 
                />
              )}
              {isStudentSurvey && isCompleted && submissionCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {assignment.survey_name}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {assignment.survey_description || 'Please complete this survey to provide feedback'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center text-sm text-gray-500 mb-4">
          {showDueDate && dueDate && (
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span className={getDueDateColor()}>
                Due: {dueDate.toLocaleDateString()}
                {isOverdue && ' (Overdue)'}
                {daysUntilDue && daysUntilDue > 0 && daysUntilDue <= 3 && ` (${daysUntilDue} days)`}
              </span>
            </div>
          )}
          
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>
              {assignment.questions?.length 
                ? `${Math.ceil(assignment.questions.length * 0.5)} min`
                : '5-10 min'}
            </span>
          </div>

          {assignment.pilot_name && (
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
              {assignment.pilot_name}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {isCompleted ? (
              isStudentSurvey ? (
                `Last submitted: ${assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : 'Recently'}`
              ) : (
                `Completed: ${assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : 'Recently'}`
              )
            ) : (
              `Assigned by: ${assignment.assigned_by_name}`
            )}
          </div>
          {getActionButton()}
        </div>
      </div>
    </Card>
  );
}