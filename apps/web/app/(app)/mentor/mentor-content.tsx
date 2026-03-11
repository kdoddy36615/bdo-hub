"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircleQuestion,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  ShieldCheck,
  Plus,
  Loader2,
  Send,
  Pencil,
  Trash2,
  X,
  MessageSquareReply,
  LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/* ---------- Types ---------- */

interface DbMentorAnswer {
  id: string;
  question_key: string;
  author: string;
  answer_text: string;
  source: string;
  confidence: string;
  created_at: string;
}

interface DbQuestion {
  id: string;
  user_id: string;
  question_text: string;
  tags: string[];
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
  isStatic?: boolean;
}

/* ---------- Constants ---------- */

const CONFIDENCE_COLORS: Record<string, string> = {
  verified: "bg-green-600",
  high: "bg-blue-600",
  medium: "bg-yellow-600",
  low: "bg-zinc-600",
};

const CONFIDENCE_OPTIONS = ["low", "medium", "high", "verified"] as const;

const TAG_COLORS: Record<string, string> = {
  pvp: "bg-red-500/15 text-red-400 border-red-500/30",
  "arena-of-solare": "bg-red-500/15 text-red-400 border-red-500/30",
  grabs: "bg-red-500/15 text-red-400 border-red-500/30",
  cc: "bg-red-500/15 text-red-400 border-red-500/30",
  mechanics: "bg-red-500/15 text-red-400 border-red-500/30",
  protections: "bg-red-500/15 text-red-400 border-red-500/30",
  combos: "bg-red-500/15 text-red-400 border-red-500/30",
  practice: "bg-red-500/15 text-red-400 border-red-500/30",
  "battle-arena": "bg-red-500/15 text-red-400 border-red-500/30",
  pve: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  grinding: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ninja: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  kunoichi: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "class-comparison": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "class-choice": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  gear: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  evasion: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  dr: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  endgame: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  progression: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  priorities: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  workers: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  nodes: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  silver: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  tag: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "life-skills": "bg-teal-500/15 text-teal-400 border-teal-500/30",
  meta: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  learning: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const DEFAULT_TAG_COLOR = "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";

const ALL_TAGS = Object.keys(TAG_COLORS);

/* ---------- Main Component ---------- */

export function MentorContent({ questions: staticQuestions }: { questions: StaticQuestion[] }) {
  const [dbAnswers, setDbAnswers] = useState<DbMentorAnswer[]>([]);
  const [dbQuestions, setDbQuestions] = useState<DbQuestion[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<MentorAnswer | null>(null);
  const [addingQuestion, setAddingQuestion] = useState(false);
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
    supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setDbQuestions(data as DbQuestion[]);
      });
  }, []);

  const questions: MentorQuestion[] = useMemo(() => {
    const mapAnswers = (questionKey: string) =>
      dbAnswers
        .filter((a) => a.question_key === questionKey)
        .map((a) => ({
          id: a.id,
          author: a.author,
          text: a.answer_text,
          source: a.source,
          confidence: a.confidence,
        }));

    const fromStatic: MentorQuestion[] = staticQuestions.map((q) => ({
      ...q,
      isStatic: true,
      answers: [...q.answers, ...mapAnswers(q.id)],
    }));

    const fromDb: MentorQuestion[] = dbQuestions.map((q) => ({
      id: q.id,
      question: q.question_text,
      tags: q.tags ?? [],
      isStatic: false,
      answers: mapAnswers(q.id),
    }));

    return [...fromStatic, ...fromDb];
  }, [staticQuestions, dbQuestions, dbAnswers]);

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

  async function handleAddQuestion(questionText: string, tags: string[]) {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to add questions");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("questions")
      .insert({
        user_id: user.id,
        question_text: questionText,
        tags,
      })
      .select()
      .single();

    setSaving(false);
    if (error) {
      toast.error("Failed to add question");
      return;
    }
    setDbQuestions((prev) => [...prev, data as DbQuestion]);
    toast.success("Question added!");
    setAddingQuestion(false);
  }

  async function handleDeleteQuestion(questionId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      toast.error("Failed to delete question");
      return;
    }
    setDbQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setDbAnswers((prev) => prev.filter((a) => a.question_key !== questionId));
    if (expanded === questionId) setExpanded(null);
    toast.success("Question deleted");
  }

  async function handleAddAnswer(
    questionId: string,
    author: string,
    text: string,
    source: string,
    confidence: string
  ) {
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

  async function handleEditAnswer(
    answerId: string,
    author: string,
    text: string,
    source: string,
    confidence: string
  ) {
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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mentor Q&A</h1>
          <p className="text-muted-foreground mt-1">
            {questions.length} question{questions.length !== 1 ? "s" : ""} &middot; Ask anything about BDO
          </p>
        </div>
        <Button
          onClick={() => setAddingQuestion(!addingQuestion)}
          className="shrink-0"
          variant={addingQuestion ? "outline" : "default"}
        >
          {addingQuestion ? (
            <>
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-4 w-4" />
              Ask a Question
            </>
          )}
        </Button>
      </div>

      {/* Context blurb */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">My goals:</span>{" "}
          Ranked Arena of Solare is the main focus &mdash; I come from R1 WoW arena so competitive PvP is the priority.
          I also want to grief endgame players in open world. Class choice (Ninja vs Kuno) isn&apos;t as important
          as finding a good griefing character. Ideally one that can PvE <span className="italic">and</span> PvP
          so I can get even more practice in while grinding.
        </p>
        <p className="mt-2">
          I generally hate large-scale PvP in other games, but I&apos;d be open to trying it in BDO &mdash; just
          don&apos;t factor it into class/main recommendations or anything else.
        </p>
      </div>

      {/* Add Question Form */}
      {addingQuestion && (
        <QuestionForm
          isPending={saving}
          onSubmit={handleAddQuestion}
          onCancel={() => setAddingQuestion(false)}
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search questions, tags, or answers..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q, idx) => {
            const isOpen = expanded === q.id;
            return (
              <div key={q.id} className="group">
                {/* Question Thread */}
                <div
                  className={`rounded-xl border bg-card transition-all ${
                    isOpen
                      ? "border-primary/40 shadow-sm shadow-primary/5"
                      : "border-border hover:border-primary/20"
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex">
                    <button
                      className="flex-1 text-left p-4 sm:p-5 min-w-0"
                      onClick={() => setExpanded(isOpen ? null : q.id)}
                    >
                      <div className="flex gap-3">
                        {/* Question number */}
                        <div className="shrink-0 mt-0.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isOpen ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            {idx + 1}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-medium leading-snug pr-2">
                            {q.question}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {q.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border cursor-pointer hover:opacity-80 ${
                                  TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchQuery(tag);
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            <span className="text-xs text-muted-foreground/60 ml-1">
                              {q.answers.length} {q.answers.length === 1 ? "reply" : "replies"}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center">
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Delete button - always visible on right edge */}
                    {!q.isStatic && (
                      <div className="shrink-0 flex items-start pt-4 pr-3 sm:pr-4">
                        <button
                          className="p-1.5 rounded-md text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Delete question"
                          onClick={() => handleDeleteQuestion(q.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Answers Thread */}
                  {isOpen && (
                    <div className="border-t border-border">
                      {q.answers.length > 0 ? (
                        <div className="divide-y divide-border">
                          {q.answers.map((a) =>
                            editingAnswer?.id === a.id ? (
                              <div key={a.id} className="p-4 sm:p-5">
                                <AnswerForm
                                  isPending={saving}
                                  initial={editingAnswer}
                                  onSubmit={(author, text, source, confidence) => {
                                    handleEditAnswer(a.id, author, text, source, confidence);
                                  }}
                                  onCancel={() => setEditingAnswer(null)}
                                />
                              </div>
                            ) : (
                              <div key={a.id} className="p-4 sm:p-5 group/answer">
                                <div className="flex gap-3">
                                  {/* Author avatar */}
                                  <div className="shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                                      {a.author.charAt(0)}
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    {/* Author + meta */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold">{a.author}</span>
                                      {a.confidence && (
                                        <Badge className={`text-[10px] px-1.5 py-0 h-5 ${CONFIDENCE_COLORS[a.confidence] ?? ""}`}>
                                          <ShieldCheck className="mr-0.5 h-2.5 w-2.5" />
                                          {a.confidence}
                                        </Badge>
                                      )}
                                      {a.source && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
                                          <LinkIcon className="h-2.5 w-2.5" />
                                          {a.source}
                                        </span>
                                      )}
                                      {/* Actions - visible on hover */}
                                      <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover/answer:opacity-100 transition-opacity">
                                        <button
                                          className="p-1 rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors"
                                          onClick={() => setEditingAnswer(a)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-colors"
                                          onClick={() => handleDeleteAnswer(a.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                    {/* Answer text */}
                                    <p className="text-sm leading-relaxed whitespace-pre-line">
                                      {a.text}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="px-5 py-8 text-center">
                          <MessageSquareReply className="mx-auto h-8 w-8 text-muted-foreground/20 mb-2" />
                          <p className="text-sm text-muted-foreground/60">
                            No answers yet
                          </p>
                        </div>
                      )}

                      {/* Add Answer */}
                      <div className="border-t border-border p-4 sm:p-5">
                        {answeringId === q.id ? (
                          <AnswerForm
                            isPending={saving}
                            onSubmit={(author, text, source, confidence) => {
                              handleAddAnswer(q.id, author, text, source, confidence);
                            }}
                            onCancel={() => setAnsweringId(null)}
                          />
                        ) : (
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground/60 hover:border-primary/30 hover:text-muted-foreground transition-colors"
                            onClick={() => setAnsweringId(q.id)}
                          >
                            <Plus className="h-4 w-4" />
                            Write a reply...
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HelpCircle className="mb-3 h-10 w-10 text-muted-foreground/20" />
            {searchQuery ? (
              <>
                <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">No questions yet. Ask one!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Question Form ---------- */

function QuestionForm({
  isPending,
  onSubmit,
  onCancel,
}: {
  isPending: boolean;
  onSubmit: (question: string, tags: string[]) => void;
  onCancel: () => void;
}) {
  const [questionText, setQuestionText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const visibleTags = showAllTags ? ALL_TAGS : ALL_TAGS.slice(0, 12);

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.02] p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
          <MessageCircleQuestion className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold">New Question</span>
      </div>

      <textarea
        placeholder="What do you want to know about BDO?"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        rows={3}
        autoFocus
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
      />

      {/* Tags */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">Tags</span>
        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all ${
                  isSelected
                    ? TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR
                    : "border-border/50 text-muted-foreground/50 hover:text-muted-foreground hover:border-border"
                }`}
              >
                {tag}
              </button>
            );
          })}
          {!showAllTags && ALL_TAGS.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAllTags(true)}
              className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground px-2 py-0.5"
            >
              +{ALL_TAGS.length - 12} more
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSubmit(questionText.trim(), selectedTags)}
          disabled={isPending || !questionText.trim()}
        >
          {isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-3.5 w-3.5" />
          )}
          Ask
        </Button>
      </div>
    </div>
  );
}

/* ---------- Answer Form ---------- */

function AnswerForm({
  isPending,
  initial,
  onSubmit,
  onCancel,
}: {
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">
          {author ? author.charAt(0) : "?"}
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {isEdit ? "Editing reply" : "Your reply"}
        </span>
      </div>

      <textarea
        placeholder="Share your knowledge or experience..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoFocus
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="Your name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <Input
          placeholder="Source (Discord, guide URL, etc.)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          {CONFIDENCE_OPTIONS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setConfidence(level)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                confidence === level
                  ? `text-white ${CONFIDENCE_COLORS[level]}`
                  : "bg-muted text-muted-foreground/60 hover:text-muted-foreground"
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
            {isEdit ? "Update" : "Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
