import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import GeometricBackground from "./GeometricBackground.jsx";
import { BlogIndex, BlogPost, WritingHighlights, getPostBySlug } from "./Blog.jsx";
import { renderRichText, slugify } from "./richText.jsx";
import {
  awards,
  education,
  experience,
  news,
  profile,
  projects,
  publicationGroups,
  publications,
  services,
  sections,
  siteMeta,
  talks,
  teaching
} from "./content/index.js";
import { getActionIcon, newsShapeMap, profileIconMap } from "./icons.js";

const chartColors = ["#111111", "#3d3d3d", "#666666", "#8c8c8c", "#b0b0b0", "#cfcfcf", "#e4e4e4"];
const githubStatsCacheTtl = 1000 * 60 * 5;
const themeStorageKey = "theme-preference";
// Stable identity so the scroll-tracking effect does not re-subscribe per render.
const emptySectionIds = [];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const route = useHashRoute();
  const isBlogRoute = route.name === "blog" || route.name === "post";
  const githubStatsSources = useMemo(() => [publications, projects], []);
  const githubStats = useGithubRepoStats(githubStatsSources);
  const stats = useMemo(() => getPublicationStats(publications), []);
  const groups = useMemo(() => getPublicationGroups(publications, publicationGroups), []);
  const visibleSections = useMemo(() => sections.filter((section) => section.enabled !== false), []);
  const navItems = useMemo(
    () => visibleSections
      .filter((section) => section.nav !== false)
      .map((section) => ({ href: `#${section.id}`, label: section.nav ?? section.title })),
    [visibleSections]
  );
  const homeSectionIds = useMemo(() => navItems.map((item) => item.href.slice(1)), [navItems]);
  const sectionIds = isBlogRoute ? emptySectionIds : homeSectionIds;
  const progressRef = useRef(null);
  const activeSection = useScrollTracking(sectionIds, progressRef);
  const routeKey = route.name === "post" ? `post:${route.slug}` : route.name;

  useRevealOnScroll(routeKey);
  useRouteScroll(route);

  const sectionContent = {
    about: (
      <div className="intro-copy">
        {profile.about.map((paragraph, index) => (
          <p key={index}>{renderRichText(paragraph)}</p>
        ))}
      </div>
    ),
    metrics: <MetricsDashboard stats={stats} />,
    news: (
      <div className="news-list">
        {news.map((item) => (
          <a className="news-row" href={item.href} key={`${item.date}-${item.text}`} target="_blank" rel="noreferrer">
            <time>{item.date}</time>
            <span className="news-marker" data-shape={newsShapeMap[item.icon] ?? "square"} aria-hidden="true" />
            <span className="news-text">{item.text}</span>
            <i className="news-external fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
          </a>
        ))}
      </div>
    ),
    publications: groups.map((group) => (
      <PublicationGroup
        key={group}
        title={group}
        papers={publications.filter((paper) => paper.group === group)}
        githubStats={githubStats}
      />
    )),
    projects: <ProjectList items={projects} githubStats={githubStats} />,
    teaching: <Timeline items={teaching} />,
    talks: <Timeline items={talks} />,
    education: <Timeline items={education} />,
    experience: <Timeline items={experience} />,
    awards: <HonorsList items={awards} />,
    service: <ServiceList items={services} />,
    writing: <WritingHighlights />
  };

  useEffect(() => {
    const post = route.name === "post" ? getPostBySlug(route.slug) : null;
    if (post) {
      document.title = `${post.title} — ${siteMeta.brand}`;
    } else if (route.name === "blog") {
      document.title = `Writing — ${siteMeta.brand}`;
    } else {
      document.title = siteMeta.title;
    }
  }, [route]);

  // Layout effect so the canvas backdrop reads the new palette after the swap, not before.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      // A stored choice wins over the system preference.
      if (readStoredTheme()) return;
      setTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    storeTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <>
      <GeometricBackground theme={theme} />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#about" aria-label={`${siteMeta.brand} home`}>
          <span className="brand-mark" aria-hidden="true">{getInitials(siteMeta.brand)}</span>
          <span>{siteMeta.brand}</span>
        </a>
        <nav className={`primary-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = !isBlogRoute && activeSection === item.href.slice(1);
            return (
              <a
                key={item.href}
                href={item.href}
                className={isActive ? "is-active" : undefined}
                aria-current={isActive ? "true" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            );
          })}
          <a
            className={`nav-route${isBlogRoute ? " is-active" : ""}`}
            href="#/blog"
            aria-current={isBlogRoute ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            <span>Blog</span>
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </a>
        </nav>
        <div className="header-actions">
          <button
            className="theme-button"
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            onClick={toggleTheme}
          >
            <i className={theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon"} aria-hidden="true" />
          </button>
          <button
            className="menu-button"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <i className={menuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"} aria-hidden="true" />
          </button>
        </div>
        <span className="scroll-progress" ref={progressRef} aria-hidden="true" />
      </header>

      {isBlogRoute ? (
        <main className="blog-route" id="main-content" key={routeKey}>
          {route.name === "post" ? <BlogPost slug={route.slug} /> : <BlogIndex />}
        </main>
      ) : (
      <div className="page-shell">
        <aside className="profile-sidebar" aria-label="Profile">
          <SidebarProfile />
        </aside>

        <main className="content-main" id="main-content">
          {visibleSections.map((section, index) => {
            const content = sectionContent[section.id];
            if (!content) return null;

            return (
              <section
                className={`section reveal${section.id === "about" ? " about-section" : ""}`}
                id={section.id}
                key={section.id}
              >
                <SectionTitle title={section.title} note={section.note} index={index + 1} />
                {content}
              </section>
            );
          })}
        </main>
      </div>
      )}

      <footer className="site-footer">
        <div className="section footer-inner">
          <span>
            {siteMeta.brand} — {new Date().getFullYear()}
          </span>
          <div className="footer-links">
            {siteMeta.repositoryUrl ? (
              <a href={siteMeta.repositoryUrl} target="_blank" rel="noreferrer">
                <i className="fa-brands fa-github" aria-hidden="true" />
                <span>Source</span>
              </a>
            ) : null}
            {profile.email ? <a href={`mailto:${profile.email}`}>{profile.email}</a> : null}
          </div>
        </div>
      </footer>
    </>
  );
}

function SidebarProfile() {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="sidebar-card reveal">
      <div className="sidebar-avatar-frame">
        {profile.avatar ? (
          <img
            className="sidebar-avatar"
            src={profile.avatar}
            width="192"
            height="192"
            decoding="async"
            fetchPriority="high"
            alt={profile.name}
          />
        ) : (
          <div className="sidebar-avatar sidebar-avatar-placeholder" aria-hidden="true">
            {getInitials(profile.name)}
          </div>
        )}
      </div>
      <div className="sidebar-identity">
        <h1>{profile.name}</h1>
        {profile.nativeName ? <p>{profile.nativeName}</p> : null}
        {profile.affiliations?.length ? (
          <div className="sidebar-affiliations">
            {profile.affiliations.map((affiliation, index) => (
              <div className="sidebar-affiliation" key={affiliation.status ?? index}>
                <div className="sidebar-affiliation-status">
                  <span>{affiliation.status}</span>
                  {affiliation.info ? (
                    <InfoPopover
                      id={`affiliation-info-${index}`}
                      label={`More information about: ${affiliation.status}`}
                      text={affiliation.info}
                    />
                  ) : null}
                </div>
                {affiliation.institution || affiliation.timeline ? (
                  <div className="sidebar-affiliation-institution">
                    {[affiliation.institution, affiliation.timeline].filter(Boolean).join(" · ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="sidebar-meta">
        {profile.location ? (
          <span>
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            {profile.location}
          </span>
        ) : null}
        {profile.email ? (
          <a href={`mailto:${profile.email}`}>
            <i className="fa-solid fa-envelope" aria-hidden="true" />
            {profile.email}
          </a>
        ) : null}
      </div>
      <ProfileLinks />

      <button
        className="sidebar-toggle"
        type="button"
        aria-controls="profile-details"
        aria-expanded={detailsOpen}
        onClick={() => setDetailsOpen((value) => !value)}
      >
        <span>Profile Details</span>
        <i className={`fa-solid fa-chevron-${detailsOpen ? "up" : "down"}`} aria-hidden="true" />
      </button>

      <div id="profile-details" className={`sidebar-collapsible${detailsOpen ? " is-open" : ""}`}>
        {profile.focus?.length ? (
          <div className="sidebar-block">
            <h2>Research Focus</h2>
            <TagList items={profile.focus} className="focus-row" />
          </div>
        ) : null}

        {news.length ? (
          <div className="sidebar-block">
            <h2>Recent News</h2>
            <div className="sidebar-news">
              {news.slice(0, 4).map((item) => (
                <a href={item.href} key={`${item.date}-${item.text}`} target="_blank" rel="noreferrer">
                  <time>{item.date}</time>
                  <span className="sidebar-news-text">{item.text}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InfoPopover({ id, label, text }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <span className="info-popover" ref={rootRef}>
      <button
        type="button"
        className={`info-trigger${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-describedby={id}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">i</span>
      </button>
      <span className={`info-bubble${open ? " is-open" : ""}`} role="tooltip" id={id}>
        {text}
      </span>
    </span>
  );
}

function MetricsDashboard({ stats }) {
  return (
    <div className="metrics-dashboard">
      <div className="metric-card-grid">
        <MetricCard label="Publications" value={stats.total} />
        <MetricCard label="Selected" value={stats.featured} />
        <MetricCard label="Open Artifacts" value={stats.openArtifacts} />
        <MetricCard label="Research Areas" value={stats.byGroup.length} />
      </div>
      <div className="chart-grid">
        <HorizontalBarChart title="Publications by Year" data={stats.byYear} />
        <DonutChart title="Research Areas" data={stats.byGroup} />
        <HorizontalBarChart title="Publication Types" data={stats.byType} />
        <HorizontalBarChart title="Venue Families" data={stats.byVenueFamily} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <strong>{formatNumber(value)}</strong>
      <span>{label}</span>
    </div>
  );
}

function HorizontalBarChart({ title, data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <article className="chart-card">
      <h3>{title}</h3>
      <div className="bar-chart">
        {data.map((item, index) => {
          const percent = Math.max((item.value / max) * 100, 4);
          return (
            <div className="bar-row" key={item.label}>
              <span className="bar-label">{item.label}</span>
              <span
                className="bar-track"
                style={{ "--bar-value": `${percent}%`, "--chart-color": chartColors[index % chartColors.length] }}
              >
                <span className="bar-fill" />
              </span>
              <span className="bar-value">{item.value}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function DonutChart({ title, data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let start = 0;
  const gradient = total
    ? `conic-gradient(${data
        .map((item, index) => {
          const end = start + (item.value / total) * 360;
          const segment = `${chartColors[index % chartColors.length]} ${start}deg ${end}deg`;
          start = end;
          return segment;
        })
        .join(", ")})`
    : "var(--surface-strong)";

  return (
    <article className="chart-card chart-card-donut">
      <h3>{title}</h3>
      <div className="donut-layout">
        <div className="donut-chart" style={{ "--donut-gradient": gradient }}>
          <span>{total}</span>
        </div>
        <div className="chart-legend">
          {data.map((item, index) => (
            <span key={item.label}>
              <i style={{ "--chart-color": chartColors[index % chartColors.length] }} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function PublicationGroup({ title, papers, githubStats }) {
  const highlighted = papers.filter((paper) => paper.featured);
  const compact = papers.filter((paper) => !paper.featured);

  return (
    <section className="publication-group" aria-labelledby={`group-${slugify(title)}`}>
      <h3 id={`group-${slugify(title)}`}>
        <span>{title}</span>
      </h3>
      {highlighted.length ? (
        <div className="highlight-list">
          {highlighted.map((paper) => (
            <FeaturedPaper key={paper.title} paper={paper} githubStats={githubStats} />
          ))}
        </div>
      ) : null}
      {compact.length ? (
        <div className="compact-paper-list">
          {compact.map((paper) => (
            <CompactPaper key={paper.title} paper={paper} githubStats={githubStats} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FeaturedPaper({ paper, githubStats }) {
  return (
    <article className="featured-paper">
      <PublicationVisual paper={paper} />
      <div className="featured-paper-copy">
        <PublicationMeta paper={paper} />
        <h4>{paper.title}</h4>
        <p className="authors">{highlightAuthors(paper.authors)}</p>
        {paper.summary ? <p>{paper.summary}</p> : null}
        {paper.tags?.length ? <TagList items={paper.tags} className="paper-tags" /> : null}
        <ActionLinks links={paper.links} githubStats={githubStats} />
      </div>
    </article>
  );
}

function PublicationVisual({ paper }) {
  if (!paper.image) {
    return (
      <div className="paper-figure paper-figure-fallback">
        <span>{paper.group ?? paper.type ?? "Research"}</span>
      </div>
    );
  }

  return (
    <div className="paper-figure">
      <picture>
        {isRasterImage(paper.image) ? <source srcSet={toWebpPath(paper.image)} type="image/webp" /> : null}
        <img src={paper.image} alt={`${paper.title} visual summary`} loading="lazy" decoding="async" />
      </picture>
    </div>
  );
}

function CompactPaper({ paper, githubStats }) {
  return (
    <article className="compact-paper-row">
      <PublicationMeta paper={paper} compact />
      <div className="compact-main">
        <h4>{paper.title}</h4>
        <p className="authors">{highlightAuthors(paper.authors)}</p>
        {paper.tags?.length ? <TagList items={paper.tags.slice(0, 4)} className="paper-tags" /> : null}
      </div>
      <ActionLinks links={paper.links} githubStats={githubStats} />
    </article>
  );
}

function PublicationMeta({ paper, compact = false }) {
  const className = compact ? "compact-venue" : "paper-venue-line";

  return (
    <span className={className}>
      <span>{paper.venue}</span>
      {paper.year ? <time>{paper.year}</time> : null}
      {paper.type ? <span className="venue-type">{paper.type}</span> : null}
    </span>
  );
}

function ProjectList({ items, githubStats }) {
  return (
    <div className="project-grid" role="region" aria-label="Projects" tabIndex={0}>
      {items.map((project) => (
        <article className="project-card" key={project.title}>
          <div className="project-card-head">
            <h3>{project.title}</h3>
            {project.status ? <span className="project-status">{project.status}</span> : null}
          </div>
          <p>{project.summary}</p>
          {project.tags?.length ? <TagList items={project.tags} className="project-tags" /> : null}
          <ActionLinks links={project.links} githubStats={githubStats} />
        </article>
      ))}
    </div>
  );
}

function ProfileLinks() {
  return (
    <div className="profile-links">
      {profile.links.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} title={link.label}>
          <i className={profileIconMap[link.icon] ?? profileIconMap.Website} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

function SectionTitle({ title, note, index }) {
  return (
    <div className="section-title">
      <h2>
        {index ? (
          <span className="section-index" aria-hidden="true">
            {String(index).padStart(2, "0")}
          </span>
        ) : null}
        <span>{title}</span>
      </h2>
      {note ? <p>{note}</p> : null}
    </div>
  );
}

function TagList({ items, className }) {
  return (
    <div className={className}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function ActionLinks({ links, githubStats = {} }) {
  if (!links?.length) return null;

  return (
    <div className="action-links">
      {links.map((link) => {
        const githubRepo = getGithubRepo(link.href);
        const showStats = Boolean(githubRepo && shouldShowGithubStats(link));
        const stats = showStats
          ? mergeGithubStats(githubStats[githubRepo], getGithubStatsFallback(link))
          : null;

        return (
          <a key={`${link.label}-${link.href}`} href={link.href} target="_blank" rel="noreferrer">
            <i className={getActionIcon(link)} aria-hidden="true" />
            <span>{link.label}</span>
            {showStats ? <GithubRepoStats stats={stats} /> : null}
          </a>
        );
      })}
    </div>
  );
}

function GithubRepoStats({ stats }) {
  if (!stats || typeof stats.stars !== "number") return null;

  return (
    <span className="repo-stats">
      <span className="repo-stat" title={`${stats.stars.toLocaleString()} GitHub stars`}>
        <i className="fa-solid fa-star" aria-hidden="true" />
        {formatGithubCount(stats.stars)}
      </span>
    </span>
  );
}

function Timeline({ items }) {
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <div className="timeline-item" key={`${item.period}-${item.title}-${index}`}>
          <div className="timeline-main">
            <strong>{item.title}</strong>
            {item.href ? (
              <a className="timeline-place" href={item.href} target="_blank" rel="noreferrer">
                {item.place}
              </a>
            ) : (
              <span className="timeline-place">{item.place}</span>
            )}
            {item.detail ? <p>{renderRichText(item.detail)}</p> : null}
          </div>
          <time>{item.period}</time>
        </div>
      ))}
    </div>
  );
}

function HonorsList({ items }) {
  return (
    <div className="honor-list">
      {items.map((item) => {
        const { title, year } = splitTrailingYear(item);

        return (
          <div className="honor-row" key={item}>
            <span>{title}</span>
            {year ? <time>{year}</time> : null}
          </div>
        );
      })}
    </div>
  );
}

function ServiceList({ items }) {
  return (
    <div className="service-groups">
      {items.map((group) => (
        <section className="service-group" key={group.category}>
          <h3>
            <span>{group.category}</span>
          </h3>
          <div className="service-chip-grid">
            {group.items.map((item) => {
              const { title, year } = splitServiceYears(item);

              return (
                <span className="service-chip" key={item}>
                  <span>{title}</span>
                  {year ? <time>{year}</time> : null}
                </span>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function getPublicationGroups(papers, preferredOrder) {
  const found = new Set(papers.map((paper) => paper.group).filter(Boolean));
  const ordered = preferredOrder.filter((group) => found.has(group));
  const remaining = Array.from(found).filter((group) => !ordered.includes(group)).sort();
  return [...ordered, ...remaining];
}

function getPublicationStats(papers) {
  const byYear = countBy(papers, (paper) => paper.year || "Unknown").sort((a, b) => b.label.localeCompare(a.label));
  const byGroup = countBy(papers, (paper) => paper.group || "Other").sort((a, b) => b.value - a.value);
  const byType = countBy(papers, (paper) => paper.type || "Publication").sort((a, b) => b.value - a.value);
  const byVenueFamily = countBy(papers, getVenueFamily).sort((a, b) => b.value - a.value);
  const openArtifacts = papers.filter((paper) =>
    paper.links?.some((link) => /code|dataset|demo|project|site|documentation/i.test(link.label))
  ).length;

  return {
    total: papers.length,
    featured: papers.filter((paper) => paper.featured).length,
    openArtifacts,
    byYear,
    byGroup,
    byType,
    byVenueFamily
  };
}

function countBy(items, getLabel) {
  const counts = new Map();
  items.forEach((item) => {
    const label = getLabel(item);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts, ([label, value]) => ({ label, value }));
}

function getVenueFamily(paper) {
  const value = `${paper.type ?? ""} ${paper.venue ?? ""}`.toLowerCase();
  if (value.includes("journal") || value.includes("jmlr") || value.includes("joss")) return "Journal";
  if (value.includes("dataset") || value.includes("benchmark")) return "Dataset";
  if (value.includes("report") || value.includes("preprint") || value.includes("technical")) return "Report";
  if (value.includes("workshop")) return "Workshop";
  return "Conference";
}

function useGithubRepoStats(collections) {
  const repos = useMemo(() => {
    const found = new Set();
    collections.forEach((items) => {
      items.forEach((item) => {
        item.links?.forEach((link) => {
          const repo = getGithubRepo(link.href);
          if (repo && shouldShowGithubStats(link)) {
            found.add(repo);
          }
        });
      });
    });
    return Array.from(found);
  }, [collections]);
  const [repoStats, setRepoStats] = useState({});

  useEffect(() => {
    if (!repos.length) {
      setRepoStats({});
      return undefined;
    }

    let cancelled = false;
    const now = Date.now();
    const cachedByRepo = Object.fromEntries(
      repos.map((repo) => [repo, readGithubStatsCache(repo)])
    );

    const cachedEntries = repos.flatMap((repo) => {
      const cached = cachedByRepo[repo];
      return cached ? [[repo, cached]] : [];
    });

    if (cachedEntries.length) {
      setRepoStats(Object.fromEntries(cachedEntries));
    }

    const reposToRefresh = repos.filter((repo) => {
      const cached = cachedByRepo[repo];
      // Template placeholder repos render fallback counts without noisy API errors.
      if (isPlaceholderGithubRepo(repo)) return false;
      return !cached || now - cached.checkedAt >= githubStatsCacheTtl;
    });

    if (!reposToRefresh.length) return undefined;

    const loadStats = async () => {
      const entries = await Promise.all(
        reposToRefresh.map(async (repo) => {
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 3500);
          try {
            const response = await fetch(`https://api.github.com/repos/${repo}`, {
              headers: { Accept: "application/vnd.github+json" },
              signal: controller.signal
            });
            if (!response.ok) {
              markGithubStatsCacheChecked(repo, cachedByRepo[repo]);
              return null;
            }
            const data = await response.json();
            const stats = normalizeGithubStats({ stars: data.stargazers_count });
            if (!stats) return null;
            writeGithubStatsCache(repo, stats);
            return [repo, stats];
          } catch {
            markGithubStatsCacheChecked(repo, cachedByRepo[repo]);
            return null;
          } finally {
            window.clearTimeout(timeout);
          }
        })
      );

      const liveEntries = entries.filter(Boolean);
      if (!cancelled && liveEntries.length) {
        setRepoStats((currentStats) => ({
          ...currentStats,
          ...Object.fromEntries(liveEntries)
        }));
      }
    };

    let cleanupIdle = () => {};
    const cleanupLoad = runAfterInitialLoad(() => {
      cleanupIdle = runWhenIdle(loadStats, 1200);
    });

    return () => {
      cancelled = true;
      cleanupLoad();
      cleanupIdle();
    };
  }, [repos]);

  return repoStats;
}

function readGithubStatsCache(repo) {
  const key = getGithubStatsCacheKey(repo);
  const legacyKey = getLegacyStarCacheKey(repo);
  return readGithubStatsCacheStorage("localStorage", key)
    ?? readGithubStatsCacheStorage("sessionStorage", key)
    ?? readGithubStatsCacheStorage("localStorage", legacyKey)
    ?? readGithubStatsCacheStorage("sessionStorage", legacyKey);
}

function writeGithubStatsCache(repo, stats) {
  const now = Date.now();
  writeGithubStatsCacheEntry(repo, { ...stats, updatedAt: now, checkedAt: now });
}

function markGithubStatsCacheChecked(repo, cached) {
  if (!cached) return;
  writeGithubStatsCacheEntry(repo, { ...cached, checkedAt: Date.now() });
}

function writeGithubStatsCacheEntry(repo, entry) {
  const key = getGithubStatsCacheKey(repo);
  if (writeGithubStatsCacheStorage("localStorage", key, entry)) return;
  if (!writeGithubStatsCacheStorage("sessionStorage", key, entry)) {
    // Optional cache only.
  }
}

function readGithubStatsCacheStorage(storageName, key) {
  try {
    const storage = window[storageName];
    const cached = JSON.parse(storage.getItem(key));
    const stats = normalizeGithubStats({ stars: cached?.stars ?? cached?.count });
    const updatedAt = Number(cached?.updatedAt ?? cached?.timestamp);
    const checkedAt = Number(cached?.checkedAt ?? updatedAt);
    if (!stats || !Number.isFinite(updatedAt) || !Number.isFinite(checkedAt)) return null;
    return { ...stats, updatedAt, checkedAt };
  } catch {
    return null;
  }
}

function writeGithubStatsCacheStorage(storageName, key, entry) {
  try {
    window[storageName].setItem(key, JSON.stringify(entry));
    return true;
  } catch {
    return false;
  }
}

function getGithubStatsCacheKey(repo) {
  return `github-repo-stats:${repo}`;
}

function getLegacyStarCacheKey(repo) {
  return `github-stars:${repo}`;
}

function shouldShowGithubStats(link) {
  if (link.showGithubStats === false || link.stats === false) return false;
  if (link.showGithubStats === true || link.stats === true) return true;
  const label = String(link.label ?? "").toLowerCase();
  return ["code", "github", "repo", "repository"].some((keyword) => label.includes(keyword));
}

function getGithubStatsFallback(link) {
  return normalizeGithubStats({ stars: link.stars });
}

function mergeGithubStats(liveStats, fallbackStats) {
  return normalizeGithubStats({ stars: liveStats?.stars ?? fallbackStats?.stars });
}

function normalizeGithubStats(stats) {
  const stars = Number(stats?.stars);
  return Number.isFinite(stars) ? { stars } : null;
}

function getGithubRepo(href) {
  try {
    const url = new URL(href);
    if (url.hostname !== "github.com") return null;
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    return `${owner}/${repo.replace(/\.git$/, "")}`;
  } catch {
    return null;
  }
}

function isPlaceholderGithubRepo(repo) {
  return repo.split("/")[0]?.toLowerCase() === "example";
}

function highlightAuthors(authors = "") {
  const names = profile.highlightNames?.length ? profile.highlightNames : [profile.name].filter(Boolean);
  if (!names.length) return authors;

  const nameSet = new Set(names);
  const pattern = new RegExp(`(${names.map(escapeRegExp).join("|")})`, "g");
  return authors.split(pattern).map((part, index) => (
    nameSet.has(part) ? <strong key={`${part}-${index}`}>{part}</strong> : <span key={`${part}-${index}`}>{part}</span>
  ));
}

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = readStoredTheme();
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Preference persistence is optional.
  }
}

// Drives the header progress bar imperatively and the nav highlight through state,
// so scrolling never re-renders the page for the progress bar alone.
function useScrollTracking(sectionIds, progressRef) {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const scrolled = window.scrollY;

      if (progressRef.current) {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(scrolled / scrollable, 1) : 0;
        progressRef.current.style.setProperty("--scroll-progress", progress.toFixed(4));
      }

      if (sectionIds.length) {
        const marker = scrolled + 150;
        let current = sectionIds[0];
        sectionIds.forEach((id) => {
          const element = document.getElementById(id);
          if (!element) return;
          const top = element.getBoundingClientRect().top + scrolled;
          if (top <= marker) current = id;
        });
        setActiveSection(current);
      }
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
  }, [sectionIds, progressRef]);

  return activeSection;
}

// Hash routing: "#/blog" and "#/blog/<slug>" are pages, every other hash is a
// section anchor on the home page. No router dependency, and it survives the
// static GitHub Pages hosting without a redirect shim.
function useHashRoute() {
  const [route, setRoute] = useState(() => parseRoute(getHash()));

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute(getHash()));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route;
}

function getHash() {
  return typeof window === "undefined" ? "" : window.location.hash;
}

function parseRoute(hash) {
  const value = String(hash ?? "").replace(/^#/, "");
  if (!value.startsWith("/")) return { name: "home", anchor: value };

  const [head, ...rest] = value.split("/").filter(Boolean);
  if (head === "blog") {
    return rest.length ? { name: "post", slug: decodeURIComponent(rest[0]) } : { name: "blog" };
  }

  return { name: "home", anchor: "" };
}

// A route change starts at the top; an anchor coming back from a page has to
// wait for the home sections to mount before it can be scrolled to.
function useRouteScroll(route) {
  const previousRoute = useRef(null);

  useEffect(() => {
    const previous = previousRoute.current;
    previousRoute.current = route;
    if (!previous) return;

    if (route.name === "home" && route.anchor) {
      const frame = window.requestAnimationFrame(() => {
        const element = document.getElementById(route.anchor);
        if (element) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 86 });
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (route.name !== previous.name || route.slug !== previous.slug) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    return undefined;
  }, [route]);
}

function useRevealOnScroll(routeKey) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(".reveal"));
    if (!nodes.length) return undefined;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.02 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [routeKey]);
}

function runAfterInitialLoad(callback) {
  let timeoutId = 0;

  const run = () => {
    timeoutId = window.setTimeout(callback, 0);
  };

  if (document.readyState === "complete") {
    run();
    return () => window.clearTimeout(timeoutId);
  }

  window.addEventListener("load", run, { once: true });
  return () => {
    window.removeEventListener("load", run);
    window.clearTimeout(timeoutId);
  };
}

function runWhenIdle(callback, timeout = 1000) {
  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(callback, timeout);
  return () => window.clearTimeout(timeoutId);
}

function splitTrailingYear(value) {
  const match = value.match(/^(.*),\s*(\d{4})$/);
  if (!match) return { title: value, year: "" };
  return { title: match[1], year: match[2] };
}

function splitServiceYears(value) {
  const match = value.match(/^(.+?)\s((?:\d{4}(?:,\s*)?)+)$/);
  if (!match) return { title: value, year: "" };
  return { title: match[1], year: match[2].replace(/,\s*/g, " / ") };
}

function formatNumber(value) {
  return new Intl.NumberFormat("en").format(value);
}

function formatGithubCount(value) {
  if (value >= 1000) {
    const rounded = Math.round((value / 1000) * 10) / 10;
    return `${rounded.toString().replace(/\.0$/, "")}k`;
  }
  return value.toString();
}

function getInitials(value = "") {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";
}

function isRasterImage(src) {
  return /\.(png|jpe?g)$/i.test(src);
}

function toWebpPath(src) {
  return src.replace(/\.(png|jpe?g)$/i, ".webp");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default App;
