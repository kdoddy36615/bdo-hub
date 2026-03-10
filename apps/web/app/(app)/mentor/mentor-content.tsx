"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircleQuestion,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  User,
  ShieldCheck,
  Plus,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface DbMentorAnswer {
  id: string;
  question_key: string;
  author: string;
  answer_text: string;
  source: string;
  confidence: string;
  created_at: string;
}

interface MentorAnswer {
  id: string;
  author: string;
  text: string;
  source: string;
  confidence: string;
}

interface StaticQuestion {
  id: string;
  question: string;
  tags: string[];
  answers: MentorAnswer[];
}

interface MentorQuestion {
  id: string;
  question: string;
  tags: string[];
  answers: MentorAnswer[];
}

const CONFIDENCE_COLORS: Record<string, string> = {
  verified: "bg-green-600",
  high: "bg-blue-600",
  medium: "bg-yellow-600",
  low: "bg-zinc-500",
};

const CONFIDENCE_OPTIONS = ["low", "medium", "high", "verified"] as const;

export function MentorContent({ questions: staticQuestions }: { questions: StaticQuestion[] }) {
  const [dbAnswers, setDbAnswers] = useState<DbMentorAnswer[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("mentor_answers")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setDbAnswers(data as DbMentorAnswer[]);
      });
  }, []);

  // Merge static JSON questions with Supabase answers
  const questions: MentorQuestion[] = useMemo(() => {
    return staticQuestions.map((q) => ({
      ...q,
      answers: [
        ...q.answers,
        ...dbAnswers
          .filter((a) => a.question_key === q.id)
          .map((a) => ({
            id: a.id,
            author: a.author,
            text: a.answer_text,
            source: a.source,
            confidence: a.confidence,
          })),
      ],
    }));
  }, [staticQuestions, dbAnswers]);

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const query = searchQuery.toLowerCase();
    return questions.filter(
      (q) =>
        q.question.toLowerCase().includes(query) ||
        q.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        q.answers.some((a) => a.text.toLowerCase().includes(query))
    );
  }, [questions, searchQuery]);

  async function handleAddAnswer(questionId: string, author: string, text: string, source: string, confidence: string) {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("mentor_answers")
      .insert({
        question_key: questionId,
        author: author || "Anonymous",
        answer_text: text,
        source,
        confidence,
      })
      .select()
      .single();

    setSaving(false);
    if (error) {
      toast.error("Failed to save answer");
      return;
    }
    setDbAnswers((prev) => [...prev, data as DbMentorAnswer]);
    toast.success("Answer saved!");
    setAnsweringId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mentor Q&A</h1>
        <p className="text-muted-foreground">
          Store advice from experienced players &mdash; {questions.length} questions
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search questions, tags, or answers..."
          className="h-8 pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q) => (
            <Card key={q.id} className="transition-colors hover:border-primary/30">
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageCircleQuestion className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <CardTitle className="text-base leading-snug">
                      {q.question}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant="secondary">
                      {q.answers.length} {q.answers.length === 1 ? "answer" : "answers"}
                    </Badge>
                    {expanded === q.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {q.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery(tag);
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              {expanded === q.id && (
                <CardContent className="space-y-3 pt-0">
                  {q.answers.length > 0 ? (
                    q.answers.map((a) => (
                      <Card key={a.id} className="bg-muted/30">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm font-medium">{a.author}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {a.confidence && (
                                <Badge className={`text-xs ${CONFIDENCE_COLORS[a.confidence] ?? ""}`}>
                                  <ShieldCheck className="mr-1 h-3 w-3" />
                                  {a.confidence}
                                </Badge>
                              )}
                              {a.source && (
                                <Badge variant="outline" className="text-xs">
                                  {a.source}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-line">{a.text}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No answers yet &mdash; be the first to answer!
                      </p>
                    </div>
                  )}

                  {answeringId === q.id ? (
                    <AnswerForm
                      questionId={q.id}
                      isPending={saving}
                      onSubmit={(author, text, source, confidence) => {
                        handleAddAnswer(q.id, author, text, source, confidence);
                      }}
                      onCancel={() => setAnsweringId(null)}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setAnsweringId(q.id)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Answer
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <HelpCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
              {searchQuery ? (
                <>
                  <p className="text-sm font-medium text-muted-foreground">
                    No results for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-muted-foreground">No questions yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Add questions by editing lib/mentor-data.json
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AnswerForm({
  questionId,
  isPending,
  onSubmit,
  onCancel,
}: {
  questionId: string;
  isPending: boolean;
  onSubmit: (author: string, text: string, source: string, confidence: string) => void;
  onCancel: () => void;
}) {
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [confidence, setConfidence] = useState("medium");

  return (
    <Card className="border-primary/30 bg-muted/10">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium">Add your answer</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Your name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="h-8"
          />
          <Input
            placeholder="Source (e.g. Discord, guide URL)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-8"
          />
        </div>
        <textarea
          placeholder="Write your answer..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            {CONFIDENCE_OPTIONS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setConfidence(level)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  confidence === level
                    ? `text-white ${CONFIDENCE_COLORS[level]}`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onSubmit(author, text, source, confidence)}
              disabled={isPending || !text.trim()}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
