"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus,
  MessageCircleQuestion,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Question, Answer } from "@/lib/types";

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

export function MentorContent({ questions }: { questions: QuestionWithAnswers[] }) {
  const [qOpen, setQOpen] = useState(false);
  const [aOpen, setAOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const query = searchQuery.toLowerCase();
    return questions.filter(
      (q) =>
        q.question_text.toLowerCase().includes(query) ||
        q.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        q.answers.some((a) => a.answer_text.toLowerCase().includes(query))
    );
  }, [questions, searchQuery]);

  async function handleAddQuestion(formData: FormData) {
    const supabase = createClient();
    const tagsRaw = formData.get("tags") as string;
    const { error } = await supabase.from("questions").insert({
      question_text: formData.get("question") as string,
      tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()) : [],
    });
    if (error) {
      toast.error("Failed to add question: " + error.message);
      return;
    }
    toast.success("Question added");
    setQOpen(false);
    router.refresh();
  }

  async function handleAddAnswer(formData: FormData) {
    const supabase = createClient();
    const questionId = formData.get("question_id") as string;
    const { error } = await supabase.from("answers").insert({
      question_id: questionId,
      answer_text: formData.get("answer") as string,
      source_url: (formData.get("source_url") as string) || null,
      source_type: (formData.get("source_type") as string) || null,
      confidence: (formData.get("confidence") as string) || null,
    });
    if (error) {
      toast.error("Failed to add answer: " + error.message);
      return;
    }
    toast.success("Answer added");
    setAOpen(null);
    router.refresh();
  }

  async function handleDeleteQuestion(questionId: string) {
    const supabase = createClient();
    // Delete associated answers first, then the question
    const { error: answerError } = await supabase
      .from("answers")
      .delete()
      .eq("question_id", questionId);
    if (answerError) {
      toast.error("Failed to delete answers: " + answerError.message);
      return;
    }
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);
    if (error) {
      toast.error("Failed to delete question: " + error.message);
      return;
    }
    toast.success("Question deleted");
    if (expanded === questionId) setExpanded(null);
    router.refresh();
  }

  async function handleDeleteAnswer(answerId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("answers")
      .delete()
      .eq("id", answerId);
    if (error) {
      toast.error("Failed to delete answer: " + error.message);
      return;
    }
    toast.success("Answer deleted");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mentor Q&A</h1>
          <p className="text-muted-foreground">Store advice from experienced players</p>
        </div>
        <Dialog open={qOpen} onOpenChange={setQOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />Ask Question
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Question</DialogTitle></DialogHeader>
            <form action={handleAddQuestion} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <textarea
                  id="question"
                  name="question"
                  required
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder="What's the best way to..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" placeholder="gear, grinding, tips" />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search / Filter */}
      {questions.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search questions, tags, or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <div className="space-y-3">
        {filteredQuestions.map((q) => {
          const isExpanded = expanded === q.id;
          return (
            <Card key={q.id} className="transition-colors hover:border-primary/30">
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : q.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageCircleQuestion className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <CardTitle className="text-base truncate">{q.question_text}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant="secondary">{q.answers.length} {q.answers.length === 1 ? "answer" : "answers"}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(q.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
                {q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {q.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery(tag);
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-3">
                  {q.answers.length === 0 && (
                    <div className="flex flex-col items-center py-6 text-center">
                      <BookOpen className="mb-2 h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No answers yet. Be the first to add one!</p>
                    </div>
                  )}
                  {q.answers.map((a) => (
                    <div key={a.id} className="group relative rounded-lg border p-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDeleteAnswer(a.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                      <p className="text-sm pr-8">{a.answer_text}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {a.source_type && <Badge variant="outline" className="text-xs">{a.source_type}</Badge>}
                        {a.confidence && <Badge variant="secondary" className="text-xs">{a.confidence}</Badge>}
                        {a.source_url && (
                          <a
                            href={a.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Source
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  <Dialog open={aOpen === q.id} onOpenChange={(o) => setAOpen(o ? q.id : null)}>
                    <DialogTrigger render={<Button variant="outline" size="sm" />}>
                      <Plus className="mr-1 h-3 w-3" />Add Answer
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Answer</DialogTitle></DialogHeader>
                      <form action={handleAddAnswer} className="space-y-4">
                        <input type="hidden" name="question_id" value={q.id} />
                        <div className="space-y-2">
                          <Label htmlFor="answer">Answer</Label>
                          <textarea
                            id="answer"
                            name="answer"
                            required
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Source Type</Label>
                            <Select name="source_type">
                              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mentor">Mentor</SelectItem>
                                <SelectItem value="guide">Guide</SelectItem>
                                <SelectItem value="wiki">Wiki</SelectItem>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Confidence</Label>
                            <Select name="confidence">
                              <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="verified">Verified</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="source_url">Source URL</Label>
                          <Input id="source_url" name="source_url" type="url" />
                        </div>
                        <Button type="submit" className="w-full">Save Answer</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Empty states */}
        {questions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <HelpCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">No questions yet</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Record advice from mentors and experienced players by adding your first question.
            </p>
          </div>
        )}
        {questions.length > 0 && filteredQuestions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <Search className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground">No questions match "{searchQuery}"</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
