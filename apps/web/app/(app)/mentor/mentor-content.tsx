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
  Pencil,
  Trash2,
  X,
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

// Tag color mapping by category
const TAG_COLORS: Record<string, string> = {
  // PvP / Combat - red
  pvp: "bg-red-500/15 text-red-400 border-red-500/30",
  "arena-of-solare": "bg-red-500/15 text-red-400 border-red-500/30",
  grabs: "bg-red-500/15 text-red-400 border-red-500/30",
  cc: "bg-red-500/15 text-red-400 border-red-500/30",
  mechanics: "bg-red-500/15 text-red-400 border-red-500/30",
  protections: "bg-red-500/15 text-red-400 border-red-500/30",
  combos: "bg-red-500/15 text-red-400 border-red-500/30",
  practice: "bg-red-500/15 text-red-400 border-red-500/30",
  "battle-arena": "bg-red-500/15 text-red-400 border-red-500/30",
  // PvE - green
  pve: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  grinding: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  // Classes - purple
  ninja: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  kunoichi: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "class-comparison": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "class-choice": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  // Gear - blue
  gear: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  evasion: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  dr: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  endgame: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  // Progression / Economy - amber
  progression: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  priorities: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  workers: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  nodes: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  silver: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  tag: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  // Life skills - teal
  "life-skills": "bg-teal-500/15 text-teal-400 border-teal-500/30",
  // Meta / Learning - slate
  meta: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  learning: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const DEFAULT_TAG_COLOR = "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";

export function MentorContent({ questions: staticQuestions }: { questions: StaticQuestion[] }) {
  const [dbAnswers, setDbAnswers] = useState<DbMentorAnswer[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<MentorAnswer | null>(null);
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

  async function handleEditAnswer(answerId: string, author: string, text: string, source: string, confidence: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("mentor_answers")
      .update({
        author: author || "Anonymous",
        answer_text: text,
        source,
        confidence,
      })
      .eq("id", answerId);

    setSaving(false);
    if (error) {
      toast.error("Failed to update answer");
      return;
    }
    setDbAnswers((prev) =>
      prev.map((a) =>
        a.id === answerId
          ? { ...a, author: author || "Anonymous", answer_text: text, source, confidence }
          : a
      )
    );
    toast.success("Answer updated!");
    setEditingAnswer(null);
  }

  async function handleDeleteAnswer(answerId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("mentor_answers")
      .delete()
      .eq("id", answerId);

    if (error) {
      toast.error("Failed to delete answer");
      return;
    }
    setDbAnswers((prev) => prev.filter((a) => a.id !== answerId));
    toast.success("Answer deleted");
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
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {q.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border cursor-pointer transition-opacity hover:opacity-80 ${TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery(tag);
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardHeader>

              {expanded === q.id && (
                <CardContent className="space-y-3 pt-0">
                  {q.answers.length > 0 ? (
                    q.answers.map((a) =>
                      editingAnswer?.id === a.id ? (
                        <AnswerForm
                          key={a.id}
                          questionId={q.id}
                          isPending={saving}
                          initial={editingAnswer}
                          onSubmit={(author, text, source, confidence) => {
                            handleEditAnswer(a.id, author, text, source, confidence);
                          }}
                          onCancel={() => setEditingAnswer(null)}
                        />
                      ) : (
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                  onClick={() => setEditingAnswer(a)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteAnswer(a.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-line">{a.text}</p>
                          </CardContent>
                        </Card>
                      )
                    )
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
  initial,
  onSubmit,
  onCancel,
}: {
  questionId: string;
  isPending: boolean;
  initial?: MentorAnswer;
  onSubmit: (author: string, text: string, source: string, confidence: string) => void;
  onCancel: () => void;
}) {
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [text, setText] = useState(initial?.text ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [confidence, setConfidence] = useState(initial?.confidence ?? "medium");
  const isEdit = !!initial;

  return (
    <Card className="border-primary/30 bg-muted/10">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium">{isEdit ? "Edit answer" : "Add your answer"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
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
              ) : isEdit ? (
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              {isEdit ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
