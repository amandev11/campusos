import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageSquare, Search, Send, ShieldAlert } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Avatar,
  Badge,
  EmptyState,
  IconButton,
  InlineNote,
  Panel,
  SectionHeader,
  StatusDot,
} from '@/components/ui/primitives';
import { SearchField, TextArea } from '@/components/ui/fields';
import { ModuleHero } from '@/features/shared';

export default function MessagesPage() {
  const [params, setParams] = useSearchParams();
  const { state, sendMessage, markThreadRead } = useApp();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const threads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.threads
      .filter((thread) => {
        if (needle.length === 0) return true;
        const haystack = `${thread.subject} ${thread.context} ${thread.messages.map((message) => message.body).join(' ')} ${thread.participants.map((p) => p.name).join(' ')}`.toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.sentAt ?? '';
        const bLast = b.messages[b.messages.length - 1]?.sentAt ?? '';
        return bLast.localeCompare(aLast);
      });
  }, [state.threads, query]);

  const activeId = params.get('thread') ?? threads[0]?.id ?? null;
  const active = state.threads.find((thread) => thread.id === activeId) ?? null;

  useEffect(() => {
    if (active) markThreadRead(active.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [active?.id, active?.messages.length]);

  const unread = state.threads.reduce((total, thread) => total + thread.unread, 0);

  function send() {
    if (!active || draft.trim().length === 0) return;
    sendMessage(active.id, draft);
    setDraft('');
  }

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Messages"
        title="Conversations in one place"
        description="Seller enquiries, faculty questions and office replies, kept together instead of scattered across personal phone numbers."
        meta={
          <>
            <Badge tone="accent">{state.threads.length} threads</Badge>
            {unread > 0 ? <Badge tone="warn">{unread} unread</Badge> : <Badge tone="ok">All read</Badge>}
          </>
        }
        aside={
          <SearchField
            value={query}
            onChange={setQuery}
            size="lg"
            placeholder="Search messages"
            label="Search messages"
          />
        }
      />

      {state.threads.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-5" aria-hidden="true" />}
          title="No conversations yet"
          description="Message a seller from a book listing, or answer a course notice, and the thread appears here."
          action={
            <Link
              to="/books"
              className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
            >
              Find a book to ask about
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
          <Panel padded={false} className="overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <p className="caps">Threads</p>
            </div>
            <ul className="max-h-[34rem] overflow-y-auto p-2">
              {threads.map((thread) => {
                const last = thread.messages[thread.messages.length - 1];
                const other = thread.participants.find((participant) => participant.id !== state.profile.id);
                const isActive = thread.id === activeId;
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => setParams({ thread: thread.id })}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'flex w-full gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                        isActive ? 'border-line bg-surface/70' : 'border-transparent hover:bg-surface/50',
                      )}
                    >
                      <Avatar name={other?.name ?? 'Unknown'} seed={other?.avatarSeed} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn('truncate text-[0.8125rem]', thread.unread > 0 ? 'font-medium text-fg' : 'text-fg-muted')}>
                            {thread.subject}
                          </span>
                          {thread.unread > 0 ? <StatusDot tone="accent" /> : null}
                        </span>
                        <span className="mt-0.5 block truncate text-[0.6875rem] text-fg-subtle">
                          {other?.name} · {last ? relativeTime(last.sentAt) : ''}
                        </span>
                        <span className="mt-1 block truncate text-[0.6875rem] text-fg-muted">
                          {last?.body ?? 'No messages yet'}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {active ? (
            <Panel padded={false} className="flex min-h-[34rem] flex-col overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[0.9375rem] font-medium text-fg">{active.subject}</p>
                  <p className="mt-0.5 text-[0.6875rem] text-fg-subtle">{active.context}</p>
                </div>
                <div className="flex items-center gap-2">
                  {active.participants
                    .filter((participant) => participant.id !== state.profile.id)
                    .map((participant) => (
                      <span key={participant.id} className="flex items-center gap-2">
                        <Avatar name={participant.name} seed={participant.avatarSeed} size="xs" />
                        <span className="text-[0.6875rem] text-fg-muted">{participant.name}</span>
                      </span>
                    ))}
                </div>
              </div>

              <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
                {active.messages.map((message) => {
                  const mine = message.authorId === state.profile.id;
                  const author = active.participants.find((participant) => participant.id === message.authorId);
                  return (
                    <div key={message.id} className={cn('flex gap-3', mine && 'flex-row-reverse')}>
                      <Avatar name={author?.name ?? 'Unknown'} seed={author?.avatarSeed} size="sm" />
                      <div className={cn('max-w-[80%] min-w-0', mine && 'items-end text-right')}>
                        <div
                          className={cn(
                            'rounded-2xl border px-3.5 py-2.5 text-[0.8125rem] leading-relaxed',
                            mine ? 'border-accent/35 bg-accent-soft text-fg' : 'border-line bg-surface/55 text-fg-muted',
                          )}
                        >
                          {message.body}
                        </div>
                        <p className="mt-1 text-[0.625rem] text-fg-subtle">
                          {author?.name} · {relativeTime(message.sentAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-line p-4">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <TextArea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={2}
                      aria-label="Write a message"
                      placeholder="Write a reply…"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          send();
                        }
                      }}
                    />
                  </div>
                  <IconButton
                    label="Send message"
                    variant="primary"
                    className="size-11 shrink-0"
                    onClick={send}
                    disabled={draft.trim().length === 0}
                  >
                    <Send className="size-4" aria-hidden="true" />
                  </IconButton>
                </div>
                <p className="mt-2 text-[0.625rem] text-fg-subtle">
                  Enter sends, Shift + Enter adds a line. Messages are stored in this browser only.
                </p>
              </div>
            </Panel>
          ) : null}
        </div>
      )}

      <Panel strength="quiet">
        <SectionHeader
          eyebrow="Safety"
          title="Keeping conversations on CampusOS"
          description="A short reminder before you agree to meet anyone."
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <InlineNote tone="neutral" className="sm:col-span-1">
            Meet in public campus locations during daylight where possible.
          </InlineNote>
          <InlineNote tone="neutral" className="sm:col-span-1">
            Never share bank details, OTPs or identity documents over messages.
          </InlineNote>
          <InlineNote tone="warn" className="sm:col-span-1" title="Report anything suspicious">
            <span className="flex items-center gap-2">
              <ShieldAlert className="size-3.5 shrink-0" aria-hidden="true" />
              Use the report action on the listing or opportunity.
            </span>
          </InlineNote>
        </div>
      </Panel>

      <p className="flex items-center gap-2 text-[0.6875rem] text-fg-subtle">
        <Search className="size-3" aria-hidden="true" />
        {threads.length} of {state.threads.length} threads shown
      </p>
    </div>
  );
}
