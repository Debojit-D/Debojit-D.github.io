export const publications = [
  {
    title: "Consensus-Driven Dynamical Systems Control for Dual-Arm Handover",
    venue: "IEEE ICRA 2026",
    year: "2026",
    type: "Conference",
    group: "Robotics & Control",
    authors: "D. Das, S. Jain, R. Kumar, H. J. Palanthandalam-Madapusi",
    summary: "A dynamical-systems bimanual handover controller enabling phase-locked, obstacle-aware, real-time handovers by unifying asynchronous and synchronous motion via coupled translational and quaternion DS laws.",
    tags: ["dynamical systems", "bimanual manipulation", "handover"],
    featured: true,
    links: [{ label: "Project Page", href: "https://debojit-d.github.io/consensus-handover/" }] // TODO: add ICRA proceedings link once indexed, plus video
  },
  {
    title: "Towards Coordinated Dual-Arm SnapFit Assembly Skill for Delicate Applications",
    venue: "IEEE T-ASE (under review)",
    year: "2025",
    type: "Journal",
    group: "Robotics & Control",
    authors: "S. Kumar, S. Barat, D. Das, S. Jain, R. Kumar, H. J. Palanthandalam-Madapusi",
    tags: ["contact-rich manipulation", "compliant control"],
    links: [{ label: "Paper", href: "https://arxiv.org/abs/2511.18153" }]
  },
  {
    title: "Task-Specific Manipulability Metrics for Redundancy Optimization in Cooperative Manipulation",
    venue: "Industrial Robot — Accepted, 2026",
    year: "2026",
    type: "Journal",
    group: "Robotics & Control",
    authors: "D. Das, S. Barat, H. J. Palanthandalam-Madapusi",
    tags: ["redundancy optimization", "manipulability"],
    links: [
      { label: "DOI", href: "https://doi.org/10.1108/IR-05-2026-0221" },
      { label: "Project Page", href: "https://debojit-d.github.io/Bimanual-Redundancy-Optimization/" },
      { label: "Code", href: "https://github.com/Debojit-D/Bimanual-Redundancy-Optimization" }
    ]
  },
  {
    title: "Grasp Dexterity Index: Manipulability of Objects Grasped by Multi-fingered Robotic Hands",
    venue: "International Journal of Humanoid Robotics (submitted)",
    year: "2026",
    type: "Journal",
    group: "Robotics & Control",
    authors: "S. Barat, V. K. Joshi, D. Das, H. J. Palanthandalam-Madapusi",
    tags: ["grasping", "manipulability"],
    links: [{ label: "Preprint", href: "https://doi.org/10.21203/rs.3.rs-9620791/v1" }]
  },
  {
    title: "Geometric Transfer and Few-Trial Adaptation of Iteratively Learned Control Inputs for Robotic Manipulation Against Unknown Resistance Fields",
    venue: "Industrial Robot (submitted)",
    year: "2026",
    type: "Journal",
    group: "Robotics & Control",
    authors: "S. Barat, S. Patidar, D. Das, S. Jadav, S. Kumar, H. J. Palanthandalam-Madapusi",
    tags: ["iterative learning control"],
    links: []
  },
  {
    title: "Dynamical-System Coordination Primitives for Bimanual Manipulation via Semantic Grounding",
    venue: "Manuscript in preparation",
    year: "2026",
    type: "Report",
    group: "Robotics & Control",
    authors: "D. Das, H. Ruparel, H. J. Palanthandalam-Madapusi",
    tags: ["LLM/VLM-conditioned control"],
    links: []
  }
];
