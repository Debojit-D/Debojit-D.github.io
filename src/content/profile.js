import avatarImage from "../pictures/self/IEEEHumanoids.jpg";

export const profile = {
  name: "Debojit Das",
  affiliations: [
    {
      status: "B.Tech.–M.Tech. Dual-Degree Student, Mechanical Engineering",
      institution: "IIT Gandhinagar",
      timeline: "Expected June 2027",
      info: "Initially enrolled in the Bachelor of Technology (B.Tech.) programme in Mechanical Engineering at IIT Gandhinagar, I later opted to continue through the institute’s five-year Bachelor of Technology and Master of Technology (B.Tech.-M.Tech.) Dual-Degree pathway. Separate B.Tech. and M.Tech. degrees are awarded upon completion; expected graduation is June 2027."
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
    "During undergrad, whenever I showed my mother a fancy robot demo or one of my own research videos, her very Bengali response was often: “কাজের কাজ কী? আমার রান্নাঘরের কাজ করে দেবে?” (“But what useful thing does it actually do? Will it do my kitchen chores?”). I think that question stuck with me more than I realized, and perhaps says something about how far robotics still has to go beyond impressive demos.",
    [
      "What draws me to manipulation is the challenge of getting robots to coordinate their bodies, interact through contact, adapt when objects or environments behave unexpectedly, and remain capable outside carefully controlled setups. I’m especially interested in ideas that sit between ",
      { text: "structure and learning", strong: true },
      ", using what we know about geometry, motion, forces, and dynamics without pretending we can model everything. Neural networks and more data are powerful tools, but I’m not convinced every robotics problem is simply waiting for a bigger model and a larger dataset. Ultimately, I want to build robots that are less clumsy, more capable, and perhaps one day good enough to survive my mother’s kitchen test."
    ],
    [
      "My research has taken shape across IIT Gandhinagar with ",
      { text: "Prof. Harish Palanthandalam-Madapusi", href: "https://harish.people.iitgn.ac.in/", strong: false },
      ", industrial robotics at Addverb with ",
      { text: "Dr. Rajesh Kumar", href: "https://in.linkedin.com/in/rajesh-kumar-7a4329109", strong: false },
      ", and now Tohoku University with ",
      { text: "Prof. Ankit Ravankar", href: "https://ravankit.github.io/", strong: false },
      " and ",
      { text: "Prof. Yasuhisa Hirata", href: "https://www.r-info.tohoku.ac.jp/en/a3cee6d57c95f29922276f8397b81ac5.html", strong: false },
      ". Moving between academic and industrial settings has shaped how I think about robotics: elegant ideas matter, but so does carrying them far enough to survive ",
      { text: "real hardware, real constraints, and real tasks", strong: true },
      "."
    ]
  ],
  links: [
    { label: "Email", href: "mailto:personal@debojit.in", icon: "Email" },
    { label: "Google Scholar", href: "https://scholar.google.com/citations?user=jxemIXEAAAAJ&hl=en", icon: "Google Scholar" },
    { label: "GitHub", href: "https://github.com/Debojit-D", icon: "GitHub" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/debojitdas842/", icon: "LinkedIn" },
    { label: "ORCID", href: "https://orcid.org/0009-0003-7027-0102", icon: "ORCID" },
    { label: "CV", href: "cv.pdf", icon: "CV" }
  ]
};
