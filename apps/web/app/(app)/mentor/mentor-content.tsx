"use client";

import { useState, useMemo, useEffect } from "react";
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
  Reply,
  CornerDownRight,
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
  parent_answer_id: string | null;
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
  parentId: string | null;
  createdAt: string;
}

interface StaticQuestion {
  id: string;
  question: string;
  tags: string[];
  answers: { id: string; author: string; text: string; source: string; confidence: string }[];
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

/* ---------- Helpers ---------- */

function buildReplyTree(answers: MentorAnswer[]): Map<string | null, MentorAnswer[]> {
  const tree = new Map<string | null, MentorAnswer[]>();
  for (const a of answers) {
    const key = a.parentId;
    if (!tree.has(key)) tree.set(key, []);
    tree.get(key)!.push(a);
  }
  return tree;
}

function countAllReplies(tree: Map<string | null, MentorAnswer[]>, parentId: string | null): number {
  const children = tree.get(parentId) ?? [];
  let count = children.length;
  for (const child of children) {
    count += countAllReplies(tree, child.id);
  }
  return count;
}

/* ---------- Main Component ---------- */

export function MentorContent({ questions: staticQuestions }: { questions: StaticQuestion[] }) {
  const [dbAnswers, setDbAnswers] = useState<DbMentorAnswer[]>([]);
  const [dbQuestions, setDbQuestions] = useState<DbQuestion[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ questionId: string; parentAnswerId: string | null } | null>(null);
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
    const mapAnswers = (questionKey: string): MentorAnswer[] =>
      dbAnswers
        .filter((a) => a.question_key === questionKey)
        .map((a) => ({
          id: a.id,
          author: a.author,
          text: a.answer_text,
          source: a.source,
          confidence: a.confidence,
          parentId: a.parent_answer_id,
          createdAt: a.created_at,
        }));

    const fromStatic: MentorQuestion[] = staticQuestions.map((q) => ({
      ...q,
      isStatic: true,
      answers: [
        ...q.answers.map((a) => ({ ...a, parentId: null, createdAt: "" })),
        ...mapAnswers(q.id),
      ],
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

  /* ---------- Handlers ---------- */

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
      .insert({ user_id: user.id, question_text: questionText, tags })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error("Failed to add question"); return; }
    setDbQuestions((prev) => [...prev, data as DbQuestion]);
    toast.success("Question added!");
    setAddingQuestion(false);
  }

  async function handleDeleteQuestion(questionId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("questions").delete().eq("id", questionId);
    if (error) { toast.error("Failed to delete question"); return; }
    setDbQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setDbAnswers((prev) => prev.filter((a) => a.question_key !== questionId));
    if (expanded === questionId) setExpanded(null);
    toast.success("Question deleted");
  }

  async function handleAddAnswer(questionId: string, parentAnswerId: string | null, author: string, text: string, source: string, confidence: string) {
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
        parent_answer_id: parentAnswerId,
      })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error("Failed to save reply"); return; }
    setDbAnswers((prev) => [...prev, data as DbMentorAnswer]);
    toast.success("Reply posted!");
    setReplyingTo(null);
  }

  async function handleEditAnswer(answerId: string, author: string, text: string, source: string, confidence: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("mentor_answers")
      .update({ author: author || "Anonymous", answer_text: text, source, confidence })
      .eq("id", answerId);
    setSaving(false);
    if (error) { toast.error("Failed to update reply"); return; }
    setDbAnswers((prev) =>
      prev.map((a) => a.id === answerId ? { ...a, author: author || "Anonymous", answer_text: text, source, confidence } : a)
    );
    toast.success("Reply updated!");
    setEditingAnswer(null);
  }

  async function handleDeleteAnswer(answerId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("mentor_answers").delete().eq("id", answerId);
    if (error) { toast.error("Failed to delete reply"); return; }
    // Cascade: remove the answer and all its children
    const toRemove = new Set<string>();
    function collectChildren(id: string) {
      toRemove.add(id);
      for (const a of dbAnswers) {
        if (a.parent_answer_id === id) collectChildren(a.id);
      }
    }
    collectChildren(answerId);
    setDbAnswers((prev) => prev.filter((a) => !toRemove.has(a.id)));
    toast.success("Reply deleted");
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
            <><X className="mr-1.5 h-4 w-4" />Cancel</>
          ) : (
            <><Plus className="mr-1.5 h-4 w-4" />Ask a Question</>
          )}
        </Button>
      </div>

      {/* Context blurb */}
      <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5 text-sm leading-relaxed text-muted-foreground space-y-2">
        <p>
          <span className="font-semibold text-foreground">Background:</span>{" "}
          Former R1 WoW arena player. My primary goal is <span className="text-foreground font-medium">ranked Arena of Solare</span>.
          I love 1v1 and 1vX &mdash; I also want to grief endgame players in open world.
        </p>
        <p>
          <span className="font-semibold text-foreground">Class:</span>{" "}
          Still deciding on a main &mdash; considering <span className="text-foreground">Ninja</span>,{" "}
          <span className="text-foreground">Kunoichi</span>, and <span className="text-foreground">Mystic</span>.
          The specific class matters less than finding something that&apos;s good at griefing and can PvE{" "}
          <span className="italic">and</span> PvP so I can practice while grinding.
          Currently on <span className="text-foreground">Maegu</span> finishing MSQ and family AP/DP.
        </p>
        <p>
          <span className="font-semibold text-foreground">Life skills:</span>{" "}
          I only AFK fish, but I&apos;m open to hearing about life skills that are required for things
          you can&apos;t get any other way. Long-term goal of a <span className="text-foreground">Krogdalo mount</span> (low priority).
        </p>
        <p>
          <span className="font-semibold text-foreground">Large-scale PvP:</span>{" "}
          Generally hate it in other games, but open to trying it in BDO. Don&apos;t factor it into recommendations.
        </p>
      </div>

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

      {/* Add Question Form */}
      {addingQuestion && (
        <QuestionForm
          isPending={saving}
          onSubmit={handleAddQuestion}
          onCancel={() => setAddingQuestion(false)}
        />
      )}

      {/* Questions */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q, idx) => {
            const isOpen = expanded === q.id;
            const toggle = () => setExpanded(isOpen ? null : q.id);
            const tree = buildReplyTree(q.answers);
            const topLevelCount = countAllReplies(tree, null);

            return (
              <div key={q.id} className="group">
                <div className={`rounded-xl border bg-card transition-all ${isOpen ? "border-primary/40 shadow-sm shadow-primary/5" : "border-border hover:border-primary/20"}`}>
                  {/* Question header */}
                  <div className="flex">
                    <button className="flex-1 text-left p-4 sm:p-5 min-w-0" onClick={toggle}>
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isOpen ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {idx + 1}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-medium leading-snug pr-2">{q.question}</p>
                          <TagRow tags={q.tags} answerCount={topLevelCount} onTagClick={setSearchQuery} />
                        </div>
                        <div className="shrink-0 flex items-center">
                          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </button>
                    {!q.isStatic && (
                      <div className="shrink-0 flex items-start pt-4 pr-3 sm:pr-4">
                        <button className="p-1.5 rounded-md text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete question" onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded thread */}
                  {isOpen && (
                    <div className="border-t border-border">
                      {(tree.get(null) ?? []).length > 0 ? (
                        <div className="p-4 sm:p-5 space-y-0">
                          {(tree.get(null) ?? []).map((answer) => (
                            <AnswerThread
                              key={answer.id}
                              answer={answer}
                              tree={tree}
                              depth={0}
                              questionId={q.id}
                              replyingTo={replyingTo}
                              setReplyingTo={setReplyingTo}
                              editingAnswer={editingAnswer}
                              setEditingAnswer={setEditingAnswer}
                              saving={saving}
                              onAddReply={handleAddAnswer}
                              onEdit={handleEditAnswer}
                              onDelete={handleDeleteAnswer}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="px-5 py-8 text-center">
                          <MessageSquareReply className="mx-auto h-8 w-8 text-muted-foreground/20 mb-2" />
                          <p className="text-sm text-muted-foreground/60">No answers yet</p>
                        </div>
                      )}

                      {/* Top-level reply */}
                      <div className="border-t border-border p-4 sm:p-5">
                        {replyingTo?.questionId === q.id && replyingTo.parentAnswerId === null ? (
                          <AnswerForm
                            isPending={saving}
                            onSubmit={(author, text, source, confidence) => handleAddAnswer(q.id, null, author, text, source, confidence)}
                            onCancel={() => setReplyingTo(null)}
                          />
                        ) : (
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground/60 hover:border-primary/30 hover:text-muted-foreground transition-colors"
                            onClick={() => setReplyingTo({ questionId: q.id, parentAnswerId: null })}
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
                <p className="text-sm text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearchQuery("")}>
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

/* ================================================================
   REDDIT-STYLE THREADED ANSWERS
   ================================================================ */

const MAX_NESTING_DEPTH = 5;

function AnswerThread({
  answer,
  tree,
  depth,
  questionId,
  replyingTo,
  setReplyingTo,
  editingAnswer,
  setEditingAnswer,
  saving,
  onAddReply,
  onEdit,
  onDelete,
}: {
  answer: MentorAnswer;
  tree: Map<string | null, MentorAnswer[]>;
  depth: number;
  questionId: string;
  replyingTo: { questionId: string; parentAnswerId: string | null } | null;
  setReplyingTo: (v: { questionId: string; parentAnswerId: string | null } | null) => void;
  editingAnswer: MentorAnswer | null;
  setEditingAnswer: (a: MentorAnswer | null) => void;
  saving: boolean;
  onAddReply: (qid: string, parentId: string | null, author: string, text: string, source: string, confidence: string) => void;
  onEdit: (aid: string, author: string, text: string, source: string, confidence: string) => void;
  onDelete: (aid: string) => void;
}) {
  const children = tree.get(answer.id) ?? [];
  const isReplying = replyingTo?.questionId === questionId && replyingTo?.parentAnswerId === answer.id;
  const isEditing = editingAnswer?.id === answer.id;
  const canNest = depth < MAX_NESTING_DEPTH;

  return (
    <div className={depth > 0 ? "ml-8 sm:ml-10 border-l-2 border-primary/30 pl-3 sm:pl-4" : ""}>
      <div className="py-3 group/answer">
        {isEditing ? (
          <AnswerForm
            isPending={saving}
            initial={editingAnswer}
            onSubmit={(author, text, source, confidence) => onEdit(answer.id, author, text, source, confidence)}
            onCancel={() => setEditingAnswer(null)}
          />
        ) : (
          <>
            {/* Author line */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                {answer.author.charAt(0)}
              </div>
              <span className="text-xs font-semibold">{answer.author}</span>
              {answer.confidence && (
                <Badge className={`text-[9px] px-1.5 py-0 h-4 ${CONFIDENCE_COLORS[answer.confidence] ?? ""}`}>
                  <ShieldCheck className="mr-0.5 h-2.5 w-2.5" />
                  {answer.confidence}
                </Badge>
              )}
              {answer.source && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
                  <LinkIcon className="h-2.5 w-2.5" />
                  {answer.source}
                </span>
              )}
            </div>

            {/* Answer text */}
            <p className="text-sm leading-relaxed whitespace-pre-line ml-8">{answer.text}</p>

            {/* Action bar */}
            <div className="flex items-center gap-3 ml-8 mt-1.5">
              {canNest && (
                <button
                  className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-primary transition-colors"
                  onClick={() => setReplyingTo({ questionId, parentAnswerId: answer.id })}
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
              )}
              <button
                className="flex items-center gap-1 text-[11px] text-muted-foreground/40 hover:text-foreground transition-colors opacity-0 group-hover/answer:opacity-100"
                onClick={() => setEditingAnswer(answer)}
              >
                <Pencil className="h-2.5 w-2.5" />
                Edit
              </button>
              <button
                className="flex items-center gap-1 text-[11px] text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover/answer:opacity-100"
                onClick={() => onDelete(answer.id)}
              >
                <Trash2 className="h-2.5 w-2.5" />
                Delete
              </button>
              {children.length > 0 && (
                <span className="text-[10px] text-muted-foreground/40 ml-auto">
                  {children.length} {children.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
          </>
        )}

        {/* Inline reply form */}
        {isReplying && (
          <div className="ml-8 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mb-2">
              <CornerDownRight className="h-3 w-3" />
              Replying to <span className="font-semibold text-foreground">{answer.author}</span>
            </div>
            <AnswerForm
              isPending={saving}
              onSubmit={(author, text, source, confidence) => onAddReply(questionId, answer.id, author, text, source, confidence)}
              onCancel={() => setReplyingTo(null)}
            />
          </div>
        )}
      </div>

      {/* Child replies */}
      {children.map((child) => (
        <AnswerThread
          key={child.id}
          answer={child}
          tree={tree}
          depth={canNest ? depth + 1 : depth}
          questionId={questionId}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          editingAnswer={editingAnswer}
          setEditingAnswer={setEditingAnswer}
          saving={saving}
          onAddReply={onAddReply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

/* ================================================================
   SHARED COMPONENTS
   ================================================================ */

function TagRow({ tags, answerCount, onTagClick }: { tags: string[]; answerCount: number; onTagClick: (t: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border cursor-pointer hover:opacity-80 ${TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR}`}
          onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
        >
          {tag}
        </span>
      ))}
      <span className="text-xs text-muted-foreground/60 ml-1">
        {answerCount} {answerCount === 1 ? "reply" : "replies"}
      </span>
    </div>
  );
}

/* ---------- Question Form ---------- */

function QuestionForm({ isPending, onSubmit, onCancel }: {
  isPending: boolean;
  onSubmit: (question: string, tags: string[]) => void;
  onCancel: () => void;
}) {
  const [questionText, setQuestionText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
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

      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">Tags</span>
        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all ${
                selectedTags.includes(tag)
                  ? TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR
                  : "border-border/50 text-muted-foreground/50 hover:text-muted-foreground hover:border-border"
              }`}
            >
              {tag}
            </button>
          ))}
          {!showAllTags && ALL_TAGS.length > 12 && (
            <button type="button" onClick={() => setShowAllTags(true)} className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground px-2 py-0.5">
              +{ALL_TAGS.length - 12} more
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>Cancel</Button>
        <Button size="sm" onClick={() => onSubmit(questionText.trim(), selectedTags)} disabled={isPending || !questionText.trim()}>
          {isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
          Ask
        </Button>
      </div>
    </div>
  );
}

/* ---------- Answer Form ---------- */

function AnswerForm({ isPending, initial, onSubmit, onCancel }: {
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
      <textarea
        placeholder="Share your knowledge or experience..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoFocus
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Your name" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <Input placeholder="Source (Discord, guide URL, etc.)" value={source} onChange={(e) => setSource(e.target.value)} />
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
                confidence === level ? `text-white ${CONFIDENCE_COLORS[level]}` : "bg-muted text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>Cancel</Button>
          <Button size="sm" onClick={() => onSubmit(author, text, source, confidence)} disabled={isPending || !text.trim()}>
            {isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : isEdit ? <Pencil className="mr-1.5 h-3.5 w-3.5" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
            {isEdit ? "Update" : "Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
