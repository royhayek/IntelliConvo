import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export function SuggestedQuestions({
  questions,
  onQuestionClick,
  disabled = false,
  title = "Suggested Questions",
  className,
}: SuggestedQuestionsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="ghost"
            onClick={() => onQuestionClick(question)}
            className="w-full justify-start text-left p-2 text-sm h-auto font-normal"
            disabled={disabled}
          >
            {question}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
