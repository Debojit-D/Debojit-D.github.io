export const profileIconMap = {
  Email: "fa-solid fa-envelope",
  Scholar: "ai ai-google-scholar",
  "Google Scholar": "ai ai-google-scholar",
  GitHub: "fa-brands fa-github",
  GitLab: "fa-solid fa-code",
  HuggingFace: "fa-brands fa-hugging-face",
  LinkedIn: "fa-brands fa-linkedin-in",
  ORCID: "ai ai-orcid",
  DBLP: "ai ai-dblp",
  Website: "fa-solid fa-globe",
  Lab: "fa-solid fa-globe",
  CV: "fa-solid fa-file-pdf",
  Resume: "fa-solid fa-file-pdf",
  X: "fa-solid fa-link",
  Bluesky: "fa-solid fa-link",
  Mastodon: "fa-solid fa-link",
  SemanticScholar: "fa-solid fa-book",
  Twitter: "fa-solid fa-link"
};

// Monochrome geometry replaces the coloured emoji markers: square, diamond, or circle.
export const newsShapeMap = {
  release: "diamond",
  accepted: "square",
  dataset: "square",
  code: "diamond",
  talk: "diamond",
  teaching: "square",
  award: "round",
  career: "square",
  degree: "round",
  visit: "round",
  service: "round"
};

export function getActionIcon(link) {
  const label = normalize(link.label);
  const href = normalize(link.href);

  if (href.includes("github.com")) return "fa-brands fa-github";
  if (href.includes("huggingface.co")) return "fa-brands fa-hugging-face";
  if (href.includes("doi.org") || label.includes("doi")) return "fa-solid fa-link";
  if (label.includes("paper") || label.includes("pdf")) return "fa-solid fa-file-lines";
  if (label.includes("report") || label.includes("preprint")) return "fa-solid fa-file-lines";
  if (label.includes("code") || label.includes("github") || label.includes("repo")) return "fa-solid fa-code";
  if (label.includes("dataset") || label.includes("data") || label.includes("benchmark")) return "fa-solid fa-database";
  if (label.includes("site") || label.includes("project")) return "fa-solid fa-globe";
  if (label.includes("demo")) return "fa-solid fa-play";
  if (label.includes("video") || label.includes("recording")) return "fa-solid fa-video";
  if (label.includes("slide") || label.includes("talk")) return "fa-solid fa-chalkboard";
  if (label.includes("poster")) return "fa-solid fa-images";
  if (label.includes("bib") || label.includes("cite")) return "fa-solid fa-quote-right";
  if (label.includes("doc")) return "fa-solid fa-book";
  if (label.includes("download")) return "fa-solid fa-download";
  return "fa-solid fa-arrow-up-right-from-square";
}

function normalize(value = "") {
  return value.toString().toLowerCase();
}
