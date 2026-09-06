export const siteMeta = {
  brand: "Debojit Das",
  title: "Debojit Das — Bimanual & Contact-Rich Manipulation",
  description: "Dynamical-systems control for bimanual and contact-rich robotic manipulation.",
  socialDescription: "Building dynamical-systems control for bimanual robots that coordinate, make contact, and adapt through touch and reasoning.",
  url: "https://debojit-d.github.io/", // TODO: change to https://debojit.in/ once the domain is repointed
  image: "https://debojit-d.github.io/images/og.png", // TODO: add a real 1200x630 image at public/images/og.png
  repositoryUrl: ""
};

export const sections = [
  { id: "about", title: "About", nav: "About" },
  // Metrics section disabled per request
  // { id: "metrics", title: "Metrics", nav: "Metrics", note: "Publication record snapshot." },
  // News lives only in the sidebar's Recent News block.
  { id: "publications", title: "Selected Research", nav: "Selected Research" },
  { id: "talks", title: "Talks", nav: "Talks", note: "Invited talks and speaking." },
  { id: "experience", title: "Experience", nav: "Experience" },
  { id: "education", title: "Education", nav: "Education" },
  { id: "awards", title: "Awards", nav: "Awards", enabled: false },
  { id: "projects", title: "Projects", nav: "Projects" },
  {
    id: "academic-service",
    title: "Academic Service & Teaching",
    nav: "Academic Service & Teaching",
    note: "Reviewing, workshops, and teaching."
  },
  // The header's Blog pill is this section's nav entry, so it has none of its own.
  { id: "writing", title: "Writing", nav: false, note: "Latest from the blog." }
];

export const publicationGroups = [
  "Robotics & Control"
];
