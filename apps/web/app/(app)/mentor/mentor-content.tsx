"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

interface MentorAnswer {
  id: string;
  author: string;
  text: string;
  source: string;
  confidence: string;
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

export function MentorContent({ questions }: { questions: MentorQuestion[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
                    <div className="flex items-center justify-center py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        No answers yet. Add answers by editing{" "}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">lib/mentor-data.json</code>
                      </p>
                    </div>
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
