import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { blogCollections, blogMeta, blogPosts } from "./content/index.js";
import { renderRichText, richTextToPlain, slugify } from "./richText.jsx";

const wordsPerMinute = 200;

// ---------- derived post data ----------

export const publishedPosts = blogPosts
  .filter((post) => !post.draft)
  .map((post) => ({
    ...post,
    readingMinutes: getReadingMinutes(post),
    headings: getHeadings(post),
    timestamp: parseDate(post.date).getTime()
  }))
  .sort((a, b) => b.timestamp - a.timestamp);

export function getPostBySlug(slug) {
  return publishedPosts.find((post) => post.slug === slug) ?? null;
}

// ---------- blog index ----------

export function BlogIndex() {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("");
  const [tag, setTag] = useState("");
  const [order, setOrder] = useState("newest");
  const [view, setView] = useState("index");
  const searchRef = useRef(null);

  const collections = useMemo(() => getCollections(publishedPosts), []);
  const tags = useMemo(() => getTags(publishedPosts), []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = publishedPosts.filter((post) => {
      if (collection && post.collection !== collection) return false;
      if (tag && !(post.tags ?? []).includes(tag)) return false;
      if (!needle) return true;
      return getSearchIndex(post).includes(needle);
    });

    return order === "newest" ? matched : [...matched].reverse();
  }, [query, collection, tag, order]);

  const pinned = filtered.find((post) => post.pinned) ?? null;
  const rest = pinned ? filtered.filter((post) => post !== pinned) : filtered;
  const isFiltered = Boolean(query || collection || tag);
  // Re-keying the list replays the staggered entry animation on every filter change.
  const listKey = `${collection}|${tag}|${order}|${view}|${query.trim()}`;

  // "/" jumps to the search field, the way a reader-oriented index should behave.
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const clearFilters = () => {
    setQuery("");
    setCollection("");
    setTag("");
  };

  return (
    <div className="blog-page">
      <BlogMasthead count={publishedPosts.length} collections={collections.length} />

      <div className="blog-shell">
        <aside className="blog-rail" aria-label="Filter writing">
          <div className="blog-rail-inner">
            <div className="blog-search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                placeholder="Search entries"
                aria-label="Search entries"
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd aria-hidden="true">/</kbd>
            </div>

            <div className="blog-rail-block">
              <h2>Collections</h2>
              <div className="collection-filter">
                <CollectionRow
                  label="All entries"
                  count={publishedPosts.length}
                  active={!collection}
                  onSelect={() => setCollection("")}
                />
                {collections.map((item) => (
                  <CollectionRow
                    key={item.name}
                    label={item.name}
                    count={item.count}
                    active={collection === item.name}
                    onSelect={() => setCollection(collection === item.name ? "" : item.name)}
                  />
                ))}
              </div>
            </div>

            {tags.length ? (
              <div className="blog-rail-block">
                <h2>Tags</h2>
                <div className="tag-filter">
                  {tags.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      className={`tag-chip${tag === item.name ? " is-active" : ""}`}
                      aria-pressed={tag === item.name}
                      onClick={() => setTag(tag === item.name ? "" : item.name)}
                    >
                      {item.name}
                      <span>{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="blog-rail-block">
              <h2>Arrange</h2>
              <div className="blog-controls">
                <div className="view-toggle" style={{ "--toggle-index": view === "index" ? 0 : 1 }}>
                  <span className="view-toggle-thumb" aria-hidden="true" />
                  <button
                    type="button"
                    className={view === "index" ? "is-active" : undefined}
                    aria-pressed={view === "index"}
                    onClick={() => setView("index")}
                  >
                    Index
                  </button>
                  <button
                    type="button"
                    className={view === "archive" ? "is-active" : undefined}
                    aria-pressed={view === "archive"}
                    onClick={() => setView("archive")}
                  >
                    Archive
                  </button>
                </div>
                <button
                  type="button"
                  className="order-button"
                  onClick={() => setOrder(order === "newest" ? "oldest" : "newest")}
                >
                  <i
                    className="fa-solid fa-arrow-down"
                    data-flipped={order === "oldest" ? "true" : "false"}
                    aria-hidden="true"
                  />
                  <span>{order === "newest" ? "Newest first" : "Oldest first"}</span>
                </button>
              </div>
            </div>

            {isFiltered ? (
              <button type="button" className="clear-filters" onClick={clearFilters}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
                <span>Clear filters</span>
              </button>
            ) : null}
          </div>
        </aside>

        <div className="blog-listing">
          <div className="blog-listing-head">
            <span className="blog-count">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              {collection ? ` in ${collection}` : ""}
              {tag ? ` tagged ${tag}` : ""}
            </span>
          </div>

          {filtered.length ? (
            <div className="blog-entries" key={listKey}>
              {pinned ? <PinnedEntry post={pinned} /> : null}
              {view === "index" ? (
                <div className="entry-list">
                  {rest.map((post, index) => (
                    <EntryCard key={post.slug} post={post} index={index + (pinned ? 2 : 1)} />
                  ))}
                </div>
              ) : (
                <ArchiveList posts={rest} />
              )}
            </div>
          ) : (
            <EmptyState onClear={clearFilters} />
          )}
        </div>
      </div>
    </div>
  );
}

function BlogMasthead({ count, collections }) {
  return (
    <header className="blog-masthead">
      <div className="blog-masthead-main">
        <span className="blog-kicker">{blogMeta.kicker}</span>
        <h1>{blogMeta.title}</h1>
        <p>{blogMeta.intro}</p>
      </div>
      <div className="blog-masthead-meta" aria-hidden="true">
        <span>
          <strong>{String(count).padStart(2, "0")}</strong> entries
        </span>
        <span>
          <strong>{String(collections).padStart(2, "0")}</strong> collections
        </span>
      </div>
      <span className="blog-masthead-rule" aria-hidden="true" />
    </header>
  );
}

function CollectionRow({ label, count, active, onSelect }) {
  return (
    <button type="button" className={`collection-row${active ? " is-active" : ""}`} aria-pressed={active} onClick={onSelect}>
      <span className="collection-tick" aria-hidden="true" />
      <span className="collection-name">{label}</span>
      <span className="collection-count">{String(count).padStart(2, "0")}</span>
    </button>
  );
}

function PinnedEntry({ post }) {
  return (
    <article className="pinned-entry" style={{ "--stagger": 0 }}>
      <div className="pinned-entry-head">
        <span className="entry-flag">Pinned</span>
        <span className="entry-date">{formatShortDate(post.date)}</span>
      </div>
      <a className="pinned-entry-body" href={`#/blog/${post.slug}`}>
        <h2>{post.title}</h2>
        <p>{post.summary}</p>
        <span className="entry-cta">
          Read entry
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </span>
      </a>
      <EntryMeta post={post} />
      <span className="pinned-entry-mark" aria-hidden="true" />
    </article>
  );
}

function EntryCard({ post, index }) {
  return (
    <article className="entry-card" style={{ "--stagger": index }}>
      <span className="entry-number" aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>
      <div className="entry-card-main">
        <span className="entry-date">{formatShortDate(post.date)}</span>
        <h2>
          <a href={`#/blog/${post.slug}`}>
            <span>{post.title}</span>
          </a>
        </h2>
        <p>{post.summary}</p>
        <EntryMeta post={post} />
      </div>
      <i className="entry-arrow fa-solid fa-arrow-right" aria-hidden="true" />
    </article>
  );
}

function EntryMeta({ post }) {
  return (
    <div className="entry-meta">
      <span className="entry-collection">{post.collection}</span>
      <span className="entry-dot" aria-hidden="true" />
      <span className="entry-time">{post.readingMinutes} min read</span>
      {post.tags?.length ? (
        <span className="entry-tags">
          {post.tags.slice(0, 3).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </span>
      ) : null}
    </div>
  );
}

function ArchiveList({ posts }) {
  const years = useMemo(() => groupByYear(posts), [posts]);

  return (
    <div className="archive">
      {years.map((year, yearIndex) => (
        <section className="archive-year" key={year.year} style={{ "--stagger": yearIndex }}>
          <h2>
            <span>{year.year}</span>
            <span className="archive-year-count">{String(year.posts.length).padStart(2, "0")}</span>
          </h2>
          <div className="archive-rows">
            {year.posts.map((post, index) => (
              <a
                className="archive-row"
                key={post.slug}
                href={`#/blog/${post.slug}`}
                style={{ "--stagger": yearIndex + index }}
              >
                <span className="archive-node" aria-hidden="true" />
                <time>{formatMonthDay(post.date)}</time>
                <span className="archive-title">{post.title}</span>
                <span className="archive-collection">{post.collection}</span>
                <span className="archive-summary">{post.summary}</span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyState({ onClear }) {
  return (
    <div className="blog-empty">
      <span className="blog-empty-mark" aria-hidden="true" />
      <h2>Nothing filed under that</h2>
      <p>No entry matches the current filters.</p>
      <button type="button" onClick={onClear}>
        Clear filters
      </button>
    </div>
  );
}

// ---------- single post ----------

export function BlogPost({ slug }) {
  const post = getPostBySlug(slug);
  const articleRef = useRef(null);
  const [activeHeading, setActiveHeading] = useState("");
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const index = post ? publishedPosts.indexOf(post) : -1;
  const newer = index > 0 ? publishedPosts[index - 1] : null;
  const older = index >= 0 && index < publishedPosts.length - 1 ? publishedPosts[index + 1] : null;

  useTocTracking(post, articleRef, setActiveHeading, setProgress);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  if (!post) {
    return (
      <div className="blog-page">
        <div className="blog-empty blog-empty-page">
          <span className="blog-empty-mark" aria-hidden="true" />
          <h2>Entry not found</h2>
          <p>That entry has moved or never existed.</p>
          <a href="#/blog">Back to writing</a>
        </div>
      </div>
    );
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/blog/${post.slug}`);
      setCopied(true);
    } catch {
      // Clipboard access is optional.
    }
  };

  return (
    <div className="blog-page post-page">
      <article className="post-shell">
        <aside className="post-rail" aria-label="Entry details">
          <div className="post-rail-inner">
            <a className="post-back" href="#/blog">
              <i className="fa-solid fa-arrow-left" aria-hidden="true" />
              <span>Writing</span>
            </a>

            <div className="post-rail-block">
              <h2>Filed under</h2>
              <p className="post-rail-collection">{post.collection}</p>
              <p className="post-rail-facts">
                {formatLongDate(post.date)} · {post.readingMinutes} min read
              </p>
            </div>

            {post.headings.length ? (
              <nav className="post-toc" aria-label="Entry contents">
                <h2>Contents</h2>
                <div className="post-toc-track" style={{ "--read-progress": progress }}>
                  <span className="post-toc-spine" aria-hidden="true" />
                  <span className="post-toc-fill" aria-hidden="true" />
                  <ul>
                    {post.headings.map((heading) => (
                      <li key={heading.id} className={activeHeading === heading.id ? "is-active" : undefined}>
                        <a href={`#${heading.id}`} onClick={(event) => scrollToHeading(event, heading.id)}>
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
            ) : null}

            {post.tags?.length ? (
              <div className="post-rail-block">
                <h2>Tags</h2>
                <div className="post-rail-tags">
                  {post.tags.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ) : null}

            <button type="button" className="post-copy" onClick={copyLink}>
              <i className={copied ? "fa-solid fa-check" : "fa-solid fa-link"} aria-hidden="true" />
              <span>{copied ? "Link copied" : "Copy link"}</span>
            </button>
          </div>
        </aside>

        <div className="post-main">
          <header className="post-header">
            <span className="post-kicker">
              {post.collection} · {formatShortDate(post.date)}
            </span>
            <h1>{post.title}</h1>
            {post.summary ? <p className="post-standfirst">{post.summary}</p> : null}
            <span className="post-rule" aria-hidden="true" />
          </header>

          <div className="post-body" ref={articleRef}>
            {post.body.map((block, blockIndex) => (
              <PostBlock key={blockIndex} block={block} isFirst={blockIndex === 0} />
            ))}
          </div>

          <footer className="post-footer">
            <div className="post-nav">
              {older ? (
                <a className="post-nav-link post-nav-prev" href={`#/blog/${older.slug}`}>
                  <span className="post-nav-label">
                    <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                    Older
                  </span>
                  <span className="post-nav-title">{older.title}</span>
                </a>
              ) : (
                <span />
              )}
              {newer ? (
                <a className="post-nav-link post-nav-next" href={`#/blog/${newer.slug}`}>
                  <span className="post-nav-label">
                    Newer
                    <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </span>
                  <span className="post-nav-title">{newer.title}</span>
                </a>
              ) : (
                <span />
              )}
            </div>
            <a className="post-index-link" href="#/blog">
              All entries
            </a>
          </footer>
        </div>
      </article>
    </div>
  );
}

function PostBlock({ block, isFirst }) {
  switch (block.type) {
    case "h2":
      return <h2 id={slugify(block.text)}>{block.text}</h2>;
    case "h3":
      return <h3 id={slugify(block.text)}>{block.text}</h3>;
    case "quote":
      return (
        <blockquote>
          <p>{renderRichText(block.text)}</p>
          {block.cite ? <cite>{block.cite}</cite> : null}
        </blockquote>
      );
    case "list":
      return block.ordered ? (
        <ol>
          {block.items.map((item, index) => (
            <li key={index}>{renderRichText(item)}</li>
          ))}
        </ol>
      ) : (
        <ul>
          {block.items.map((item, index) => (
            <li key={index}>{renderRichText(item)}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        <div className="post-code">
          {block.lang ? <span className="post-code-lang">{block.lang}</span> : null}
          <pre>
            <code>{block.code}</code>
          </pre>
        </div>
      );
    case "note":
      return (
        <aside className="post-note">
          <span className="post-note-label" aria-hidden="true">
            Note
          </span>
          <p>{renderRichText(block.text)}</p>
        </aside>
      );
    case "image":
      return (
        <figure className="post-figure">
          <img src={block.src} alt={block.alt ?? ""} loading="lazy" decoding="async" />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    case "divider":
      return <hr />;
    default:
      return <p className={isFirst ? "post-lede" : undefined}>{renderRichText(block.text)}</p>;
  }
}

// Tracks the heading in view and how far through the article the reader is,
// so the contents rail can fill its spine as the entry is read.
function useTocTracking(post, articleRef, setActiveHeading, setProgress) {
  useLayoutEffect(() => {
    if (!post?.headings.length) {
      setActiveHeading("");
      setProgress(0);
      return undefined;
    }

    let frame = 0;

    const measure = () => {
      frame = 0;
      const article = articleRef.current;
      if (!article) return;

      const scrolled = window.scrollY;
      const rect = article.getBoundingClientRect();
      const top = rect.top + scrolled;
      const span = Math.max(rect.height - window.innerHeight * 0.6, 1);
      setProgress(Math.min(Math.max((scrolled - top + 120) / span, 0), 1));

      const marker = scrolled + 160;
      let current = post.headings[0].id;
      post.headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (!element) return;
        if (element.getBoundingClientRect().top + scrolled <= marker) current = heading.id;
      });
      setActiveHeading(current);
    };

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [post, articleRef, setActiveHeading, setProgress]);
}

// The heading ids are plain anchors, so scrolling is handled here to avoid
// pushing a hash that the router would read as a route change.
function scrollToHeading(event, id) {
  // Always prevented: a bare "#heading" hash would be read as a home-page anchor.
  event.preventDefault();
  const element = document.getElementById(id);
  if (!element) return;
  window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 96 });
}

// ---------- home-page teaser ----------

export function WritingHighlights({ limit = 3 }) {
  const items = publishedPosts.slice(0, limit);
  if (!items.length) return null;

  return (
    <div className="writing-teaser">
      <div className="writing-teaser-list">
        {items.map((post) => (
          <a className="writing-teaser-row" key={post.slug} href={`#/blog/${post.slug}`}>
            <time>{formatShortDate(post.date)}</time>
            <span className="writing-teaser-main">
              <strong>{post.title}</strong>
              <span>{post.summary}</span>
            </span>
            <span className="writing-teaser-meta">{post.readingMinutes} min</span>
          </a>
        ))}
      </div>
      <a className="writing-teaser-all" href="#/blog">
        <span>All writing</span>
        <i className="fa-solid fa-arrow-right" aria-hidden="true" />
      </a>
    </div>
  );
}

// ---------- helpers ----------

function getCollections(items) {
  const counts = new Map();
  items.forEach((post) => {
    if (!post.collection) return;
    counts.set(post.collection, (counts.get(post.collection) ?? 0) + 1);
  });

  const preferred = blogCollections.map((item) => item.name).filter((name) => counts.has(name));
  const remaining = Array.from(counts.keys()).filter((name) => !preferred.includes(name)).sort();
  return [...preferred, ...remaining].map((name) => ({ name, count: counts.get(name) }));
}

function getTags(items) {
  const counts = new Map();
  items.forEach((post) => {
    (post.tags ?? []).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
  });
  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

function groupByYear(items) {
  const years = new Map();
  items.forEach((post) => {
    const year = post.date.slice(0, 4);
    if (!years.has(year)) years.set(year, []);
    years.get(year).push(post);
  });
  return Array.from(years, ([year, posts]) => ({ year, posts }));
}

function getSearchIndex(post) {
  return [post.title, post.summary, post.collection, ...(post.tags ?? [])].join(" ").toLowerCase();
}

function getHeadings(post) {
  return (post.body ?? [])
    .filter((block) => block.type === "h2")
    .map((block) => ({ id: slugify(block.text), text: block.text }));
}

function getReadingMinutes(post) {
  const words = (post.body ?? [])
    .map((block) => {
      if (block.type === "list") return block.items.map(richTextToPlain).join(" ");
      if (block.type === "code") return block.code ?? "";
      return richTextToPlain(block.text);
    })
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / wordsPerMinute));
}

// Parsed as local time; `new Date("YYYY-MM-DD")` is UTC and can shift the day.
function parseDate(value = "") {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year || 1970, (month || 1) - 1, day || 1);
}

function formatShortDate(value) {
  const [year, month] = value.split("-");
  return `${year}.${month}`;
}

function formatMonthDay(value) {
  const date = parseDate(value);
  return date.toLocaleDateString("en", { month: "short", day: "2-digit" });
}

function formatLongDate(value) {
  const date = parseDate(value);
  return date.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });
}
