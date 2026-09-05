// Blog entries for the dedicated /#/blog page.
//
// Every post needs: slug, title, date (YYYY-MM-DD), collection, summary, body.
// Body blocks: p | h2 | h3 | quote | list | code | note | image | divider.
// Paragraph text accepts the same rich-text arrays as profile.about.
// Set `draft: true` to keep a post out of the listing, `pinned: true` to feature it.

export const blogMeta = {
  title: "Writing",
  kicker: "Notes, essays, and lab logs",
  intro:
    "Working notes on manipulation, control, and the parts of robotics research that rarely make it into a paper — half-finished ideas included."
};

// Order here is the display order of the collection rail.
export const blogCollections = [
  { name: "Essays", note: "Longer arguments about where manipulation research is going." },
  { name: "Control Notes", note: "Derivations, intuitions, and failure modes from the lab." },
  { name: "Lab Log", note: "What is actually happening week to week." },
  { name: "Reading", note: "Papers worth your evening." }
];

export const posts = [
  {
    slug: "why-robots-cant-make-vada-pav",
    title: "Why robots can backflip but still can't make a vada pav",
    date: "2025-12-14",
    collection: "Essays",
    tags: ["manipulation", "contact", "talks"],
    pinned: true,
    summary:
      "The talk I gave at ROSCon India 2025, written down: locomotion solved a problem manipulation does not have, and we keep borrowing the wrong lessons from it.",
    body: [
      {
        type: "p",
        text: "Every few months a humanoid does something spectacular on video — a backflip, a sprint over broken ground, a recovery from a shove that would put me on the floor. And every few months someone asks me why, if that is possible, a robot still cannot fry a vada pav. It is a fair question, and the answer is not that manipulation researchers are lazy."
      },
      {
        type: "p",
        text: "The honest answer is that locomotion and manipulation are not the same problem wearing different hardware. Locomotion has a property that manipulation does not: the contact schedule is mostly known in advance."
      },
      { type: "h2", text: "Locomotion has a script. Manipulation does not." },
      {
        type: "p",
        text: "A walking gait is a periodic contact sequence. Left foot down, right foot down, repeat. The controller does not have to discover that its feet touch the ground — that is given. What it has to do is stabilise a known sequence against disturbance, and we have sixty years of very good machinery for exactly that."
      },
      {
        type: "p",
        text: "Frying a vada pav has no such script. The batter sticks or it does not. The pav tears where it was already weak. The ladle finds the edge of the kadai a centimetre earlier than the model said. Contact is not the boundary condition of the task; contact is the task, and its schedule is discovered while you are doing it."
      },
      {
        type: "quote",
        text: "In locomotion, contact is a constraint you satisfy. In manipulation, contact is the decision variable.",
        cite: "The one line from the talk people actually remembered"
      },
      { type: "h2", text: "The borrowed lesson that keeps hurting us" },
      {
        type: "p",
        text: "Because locomotion went so well, manipulation keeps importing its playbook: build a big simulator, randomise the physics, train a policy, deploy. This works startlingly well for tasks that are locomotion-shaped — repetitive, low-precision, forgiving of a wrong millimetre. It works much worse when the task is defined by a contact event that only happens once and has to be right."
      },
      {
        type: "list",
        items: [
          "Domain randomisation blurs exactly the contact parameters the task depends on.",
          "Reward shaping quietly encodes the contact schedule the researcher already had in mind.",
          "Benchmarks reward completion, so policies learn to shove through contact rather than negotiate it."
        ]
      },
      {
        type: "p",
        text: "None of these are fatal. They are just a reminder that a method tuned for a problem where contact is scheduled will find it awkward when contact is the thing being decided."
      },
      { type: "h2", text: "What I think the ingredient is" },
      {
        type: "p",
        text: [
          "My bet is on control architectures that keep stability guarantees while letting the contact schedule stay open — the direction I work on in the ",
          { text: "dual-arm handover work", href: "#/blog/consensus-as-a-handover-primitive", strong: false },
          ". A dynamical system that is stable under any contact ordering is worth more than a policy that is excellent under one."
        ]
      },
      {
        type: "note",
        text: "Slides, and the vada pav that was harmed in the making of the demo, are available on request."
      },
      {
        type: "p",
        text: "The talk ended with the obvious caveat: I do not have the recipe either. But I am increasingly convinced that the missing piece is not scale. It is that we are still writing controllers that expect to be told when they will touch something."
      }
    ]
  },
  {
    slug: "consensus-as-a-handover-primitive",
    title: "Consensus as a handover primitive",
    date: "2026-03-02",
    collection: "Control Notes",
    tags: ["dynamical systems", "bimanual", "control"],
    summary:
      "Why we stopped treating dual-arm handover as a planning problem and started treating it as two dynamical systems agreeing on where the object should be.",
    body: [
      {
        type: "p",
        text: "The usual way to write a dual-arm handover is as a sequence: arm A grasps, arm A moves to a rendezvous pose, arm B closes, arm A releases. It is easy to specify and it fails in a very specific way — every transition between phases is a place where the plan can be wrong and the controller has no opinion about it."
      },
      { type: "h2", text: "Two systems, one agreement" },
      {
        type: "p",
        text: "The reframing is small. Instead of one leader and one follower, give each arm its own attractor dynamics toward the object, and add a coupling term that drives the two toward agreement on the object's motion. The handover is then not a phase boundary at all; it is the interval during which both systems are stable and their agreement error is shrinking."
      },
      {
        type: "code",
        lang: "text",
        code: "x_a' = f_a(x_a) + K (x_b - x_a)\nx_b' = f_b(x_b) + K (x_a - x_b)\n\n# f_a, f_b : individually stable attractors toward the object\n# K        : consensus gain, scheduled by contact confidence"
      },
      {
        type: "p",
        text: "If f_a and f_b are each contraction-stable and K is symmetric positive definite, the coupled system inherits stability from the pieces. That is the entire appeal: you get to keep the guarantee while giving up the script."
      },
      { type: "h2", text: "Where the interesting part lives" },
      {
        type: "p",
        text: "The gain K is where the tactile signal enters. Low confidence that the second arm has purchase means weak coupling and both arms hold their own attractors. Rising confidence tightens the coupling until the two systems are effectively tracking one trajectory, at which point the first arm's release is not an event to be triggered — it is what happens when its share of the load has already gone to zero."
      },
      {
        type: "quote",
        text: "The release stops being a decision. It becomes a measurement."
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Both arms approach with independent attractors; coupling near zero.",
          "Contact confidence rises on the receiving arm; K grows smoothly.",
          "Load share crosses over; the giving arm's contribution decays out.",
          "Coupling relaxes; the receiving arm continues on its own attractor."
        ]
      },
      { type: "h2", text: "What broke first" },
      {
        type: "p",
        text: "Predictably, the confidence estimate. Early runs used force magnitude alone, which is fragile the moment the object is compliant — a soft object gives you a slow, ambiguous ramp exactly when you need a decision. Adding a shear-direction term from the tactile array fixed most of it, at the cost of a calibration step I still do not love."
      },
      {
        type: "note",
        text: "This note is the intuition behind the ICRA 2026 paper, not a substitute for it — the proofs and the ablations live there."
      }
    ]
  },
  {
    slug: "notes-from-sendai",
    title: "Notes from Sendai: the first months in a new lab",
    date: "2026-06-11",
    collection: "Lab Log",
    tags: ["lab", "research life", "tohoku"],
    summary:
      "Moving research countries mid-project, what transferred cleanly, what did not, and the small operational things nobody warns you about.",
    body: [
      {
        type: "p",
        text: "I arrived at the Smart Robots Design Lab expecting the hard part to be technical. It was not. The hard part was that half of my working knowledge turned out to be lab-specific — cable routing conventions, whose calibration file to trust, which of the three robot descriptions is the one that matches the hardware in the room."
      },
      { type: "h2", text: "What transferred" },
      {
        type: "list",
        items: [
          "The controller. Written against an interface, not against a robot, which paid for itself in the first week.",
          "The evaluation harness — same metrics, same plots, so results are comparable across two labs.",
          "Habits: log everything, name runs after what changed, never trust a result you cannot re-run tomorrow."
        ]
      },
      { type: "h2", text: "What did not" },
      {
        type: "p",
        text: "Everything with a physical constant in it. Gains that were quietly tuned for one arm's friction profile, a grasp width that assumed a specific gripper pad, timing that assumed a control rate I no longer had. None of it was documented as an assumption because in the old lab it was never violated."
      },
      {
        type: "quote",
        text: "A constant you never had to change is an assumption you never had to write down."
      },
      { type: "h2", text: "The operational things" },
      {
        type: "p",
        text: "Ship a written setup document with your code before you move. Not a README — an actual sequence of the steps you take between walking into the room and the robot moving. I wrote mine three weeks late and it cost me most of those three weeks."
      },
      {
        type: "p",
        text: "Also: learn the lab's failure vocabulary early. Every group has a shared shorthand for the five things that usually go wrong, and until you have it, you will describe a known problem as if it were new."
      }
    ]
  },
  {
    slug: "reading-contact-rich-manipulation",
    title: "A reading path into contact-rich manipulation",
    date: "2026-08-20",
    collection: "Reading",
    tags: ["reading list", "contact", "tactile"],
    summary:
      "The order I wish someone had given me: classical compliance first, then the learning literature, then tactile — with the reason each step exists.",
    body: [
      {
        type: "p",
        text: "People usually enter this area from the learning side and work backwards, which makes the classical results look like historical trivia rather than the constraints they actually are. The order below is the one I would give a new student."
      },
      { type: "h2", text: "1. Compliance before contact" },
      {
        type: "p",
        text: "Start with impedance and admittance control until the difference is obvious in your hands, not just on paper. Almost every modern contact-rich method is choosing an effective impedance whether or not it says so, and you cannot read those papers critically until you can see that choice."
      },
      { type: "h2", text: "2. Then the hybrid position/force lineage" },
      {
        type: "p",
        text: "Not because you will implement it, but because it names the decomposition — which directions are position-controlled and which are force-controlled — that every later method has to answer somehow."
      },
      { type: "h2", text: "3. Then learning, with a specific question in hand" },
      {
        type: "p",
        text: "Read the learning literature asking one thing: what is this method assuming about the contact schedule? Some assume it is fixed, some assume it is discoverable from reward, a few genuinely leave it open. The answer predicts where the method will break better than any benchmark number."
      },
      { type: "h2", text: "4. Tactile last, on purpose" },
      {
        type: "p",
        text: "Tactile sensing is easiest to appreciate once you have felt the ambiguity it resolves. Read it after you have watched a controller fail because it could not tell contact from near-contact — otherwise it reads as an extra sensor rather than as the missing state estimate."
      },
      {
        type: "note",
        text: "Deliberately no citation list here. The path matters more than the specific papers, and the specific papers change every year."
      }
    ]
  }
];
