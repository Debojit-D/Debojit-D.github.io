import avatarImage from "../pictures/self/IEEEHumanoids-bw.jpg";

export const profile = {
  name: "Debojit Das",
  affiliations: [
    {
      status: "B.Tech.–M.Tech. Dual-Degree Student, Mechanical Engineering",
      institution: "IIT Gandhinagar",
      timeline: "Expected June 2027",
      info: "Currently pursuing IIT Gandhinagar’s five-year B.Tech.–M.Tech. Dual-Degree programme. The programme awards separate B.Tech. and M.Tech. degrees upon completion; expected graduation is June 2027."
    },
    {
      status: "Visiting Foreign Researcher",
      institution: "Tohoku University, Japan"
    }
  ],
  location: "Sendai, Japan",
  email: "personal@debojit.in",
  avatar: avatarImage,
  focus: [
    "Dynamical Systems Control",
    "Bimanual Manipulation",
    "Contact-Rich Manipulation",
    "Tactile Sensing"
  ],
  highlightNames: ["Debojit Das", "D. Das"],
  about: [
    "I build dynamical-systems-based control architectures that let bimanual robots coordinate, make and maintain contact, and adapt through touch and high-level reasoning — without giving up the stability guarantees of classical control.",
    [
      "I am currently a Visiting Foreign Researcher at the Smart Robots Design Lab, Tohoku University, advised by Prof. Ankit A. Ravankar, and a Student Researcher at the ",
      { text: "IITGN Robotics Lab", href: "https://debojit-d.github.io/", strong: false },
      " under Dr. Harish Palanthandalam-Madapusi."
    ]
  ],
  links: [
    { label: "Email", href: "mailto:personal@debojit.in", icon: "Email" },
    { label: "Google Scholar", href: "TODO_ADD_YOUR_SCHOLAR_URL", icon: "Google Scholar" },
    { label: "GitHub", href: "https://github.com/Debojit-D", icon: "GitHub" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/debojitdas842/", icon: "LinkedIn" },
    { label: "ORCID", href: "https://orcid.org/0009-0003-7027-0102", icon: "ORCID" },
    { label: "CV", href: "cv.pdf", icon: "CV" }
  ]
};
