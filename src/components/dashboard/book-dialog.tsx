"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { createBookAction } from "@/lib/actions";
import { idleFormState } from "@/lib/form-state";
import { notifyAdded } from "@/lib/notify";
import { useActionSuccess } from "@/lib/use-action-feedback";
import type { BookCandidate, BookSearchResult } from "@/lib/books/search";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PendingSweep, PixelSpinner } from "@/components/wild/feedback-popup";
import {
  Field,
  FormMessage,
  NativeSelect,
  TextInput,
} from "@/components/wild/field";

export function BookDialog({
  triggerLabel = "Tambah buku",
  triggerVariant = "outline",
}: {
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant={triggerVariant} />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <PendingSweep active={pending} label="Menambahkan buku ke rak..." />
        <DialogHeader>
          <DialogTitle>Tambah buku</DialogTitle>
          <DialogDescription>
            Cari judulnya dulu, lalu penulis, total halaman, genre, dan sampul
            terisi sendiri. Semua isian masih bisa diubah sebelum disimpan.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <BookForm
            onDone={() => {
              setPending(false);
              setOpen(false);
            }}
            onPendingChange={setPending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface Draft {
  title: string;
  author: string;
  category: string;
  totalPages: string;
  coverUrl: string;
}

const EMPTY_DRAFT: Draft = {
  title: "",
  author: "",
  category: "",
  totalPages: "",
  coverUrl: "",
};

function draftFrom(candidate: BookCandidate): Draft {
  return {
    title: candidate.title,
    author: candidate.authors.join(", "),
    category: candidate.categories[0] ?? "",
    totalPages: candidate.pageCount ? String(candidate.pageCount) : "",
    coverUrl: candidate.coverUrl ?? "",
  };
}

function BookForm({
  onDone,
  onPendingChange,
}: {
  onDone: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    createBookAction,
    idleFormState,
  );
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [filledFrom, setFilledFrom] = useState<string | null>(null);

  useEffect(() => {
    onPendingChange(pending);
  }, [pending, onPendingChange]);

  useActionSuccess(state, (message) => {
    notifyAdded(message);
    onDone();
  });

  const patch = (changes: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setFilledFrom(null);
  };

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col">
      <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
        <BookSearch
          onPick={(candidate) => {
            setDraft(draftFrom(candidate));
            setFilledFrom(candidate.title);
          }}
        />

        {filledFrom ? (
          <p role="status" className="border-l-2 border-ink pl-3 text-[13px] leading-snug">
            Isian di bawah diambil dari &ldquo;{filledFrom}&rdquo;. Periksa total
            halaman sebelum menyimpan.
          </p>
        ) : null}

        <Field label="Judul" htmlFor="book-title">
          <TextInput
            id="book-title"
            name="title"
            required
            placeholder="Kebiasaan Kecil"
            value={draft.title}
            onChange={(event) => patch({ title: event.target.value })}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Penulis" htmlFor="book-author">
            <TextInput
              id="book-author"
              name="author"
              required
              placeholder="Nara Pustaka"
              value={draft.author}
              onChange={(event) => patch({ author: event.target.value })}
            />
          </Field>
          <Field label="Genre" hint="opsional" htmlFor="book-category">
            <TextInput
              id="book-category"
              name="category"
              placeholder="Non-fiksi"
              value={draft.category}
              onChange={(event) => patch({ category: event.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Total halaman" htmlFor="book-pages">
            <TextInput
              id="book-pages"
              name="totalPages"
              type="number"
              inputMode="numeric"
              min={1}
              required
              placeholder="320"
              value={draft.totalPages}
              onChange={(event) => patch({ totalPages: event.target.value })}
            />
          </Field>
          <Field label="Rak" htmlFor="book-status">
            <NativeSelect id="book-status" name="status" defaultValue="READING">
              <option value="READING">Sedang dibaca</option>
              <option value="WANT_TO_READ">Ingin dibaca</option>
              <option value="FINISHED">Selesai dibaca</option>
              <option value="DNF">Berhenti</option>
            </NativeSelect>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_88px]">
          <Field label="URL sampul" hint="opsional" htmlFor="book-cover">
            <TextInput
              id="book-cover"
              name="coverUrl"
              type="url"
              placeholder="https://..."
              value={draft.coverUrl}
              onChange={(event) => patch({ coverUrl: event.target.value })}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <span className="label text-ink">Pratinjau</span>
            <div className="relative aspect-[2/3] w-[88px] overflow-hidden border border-line bg-ink">
              {draft.coverUrl ? (
                <Image
                  src={draft.coverUrl}
                  alt="Pratinjau sampul"
                  fill
                  sizes="88px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="label-sm absolute inset-0 flex items-center justify-center px-1 text-center text-paper/70">
                  Belum ada
                </span>
              )}
            </div>
          </div>
        </div>

        <FormMessage status={state.status} message={state.message} />
      </div>

      <DialogFooter>
        <DialogClose
          render={<Button variant="ghost" type="button" disabled={pending} />}
        >
          Batal
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <PixelSpinner />
              <span>Menambahkan...</span>
            </>
          ) : (
            "Tambah ke rak"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: BookSearchResult }
  | { status: "failed"; message: string };

function BookSearch({ onPick }: { onPick: (candidate: BookCandidate) => void }) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState<SearchState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const run = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setLookup({
        status: "failed",
        message: "Tulis minimal dua huruf judul atau nama penulis.",
      });
      return;
    }

    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLookup({ status: "loading" });

    try {
      const response = await fetch(
        `/api/books/search?q=${encodeURIComponent(trimmed)}`,
        { signal: current.signal },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as BookSearchResult;
      if (current.signal.aborted) return;
      setLookup({ status: "done", result });
    } catch {
      if (current.signal.aborted) return;
      setLookup({
        status: "failed",
        message:
          "Pencarian gagal dihubungi. Coba lagi sebentar, atau isi datanya manual.",
      });
    }
  };

  return (
    <div className="border border-line p-4">
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="label text-ink">
          Cari buku
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              // Enter belongs to the lookup, not to the surrounding book form.
              event.preventDefault();
              void run();
            }}
            placeholder="Judul atau penulis"
            className="h-11 w-full rounded-[6px] border border-line bg-paper px-3 font-sans text-[15px] text-ink placeholder:text-muted-foreground transition-colors hover:border-ink/30 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void run()}
            disabled={lookup.status === "loading"}
            className="shrink-0"
          >
            {lookup.status === "loading" ? (
              <>
                <PixelSpinner />
                <span>Mencari...</span>
              </>
            ) : (
              "Cari"
            )}
          </Button>
        </div>
        <p className="text-[12px] leading-snug text-muted-foreground">
          Sumber Google Books, dialihkan ke Open Library saat kuota Google
          habis. Total halaman tetap perlu kamu cek.
        </p>
      </div>

      <div aria-live="polite" className="mt-3">
        {lookup.status === "idle" ? null : lookup.status === "loading" ? (
          <div className="flex flex-col gap-2">
            <PendingSweep active label="Mencari buku..." />
            <p className="label-sm text-muted-foreground">Mencari buku...</p>
          </div>
        ) : lookup.status === "failed" ? (
          <p
            role="alert"
            className="border-l-2 border-danger-fill pl-3 text-[13px] leading-snug text-danger"
          >
            {lookup.message}
          </p>
        ) : (
          <SearchResults result={lookup.result} onPick={onPick} />
        )}
      </div>
    </div>
  );
}

function SearchResults({
  result,
  onPick,
}: {
  result: BookSearchResult;
  onPick: (candidate: BookCandidate) => void;
}) {
  return (
    <div>
      {result.notice ? (
        <p className="mb-3 border-l-2 border-ink pl-3 text-[12px] leading-snug text-muted-foreground">
          {result.notice}
        </p>
      ) : null}

      {result.items.length === 0 ? (
        <p className="text-[13px] leading-snug text-muted-foreground">
          Tidak ada yang cocok. Coba kata kunci lain, atau isi manual di bawah.
        </p>
      ) : (
        <ul className="flex flex-col">
          {result.items.map((item) => {
            const meta = [
              item.authors.join(", ") || "Penulis tidak tercatat",
              item.pageCount ? `${item.pageCount} hal` : "halaman tidak tercatat",
              item.publishedYear ? String(item.publishedYear) : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <li
                key={item.key}
                className="border-t border-line-soft first:border-t-0"
              >
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="flex min-h-11 w-full items-start gap-3 py-2.5 text-left transition-colors hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="relative mt-0.5 aspect-[2/3] w-8 shrink-0 overflow-hidden border border-line bg-ink">
                    {item.coverUrl ? (
                      <Image
                        src={item.coverUrl}
                        alt=""
                        fill
                        sizes="32px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-sans text-[14px] font-semibold leading-snug text-ink">
                      {item.title}
                    </span>
                    <span className="num mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                      {meta}
                    </span>
                    {item.pageCount === null ? (
                      <span className="label-sm mt-1 block text-danger">
                        Total halaman perlu diisi manual
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
