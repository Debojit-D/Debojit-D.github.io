export const projects = [
  {
    title: "SciML for Chaotic Dynamics: Learning Double-Pendulum Trajectories",
    status: "Completed",
    summary:
      "Built a MuJoCo-based data pipeline for planar double-pendulum rollouts under ideal and stiction-dominated regimes. Trained Lagrangian Neural Networks with a learned dissipation term and a physics-aware SINDy/PySINDy library, comparing models via long-horizon rollouts and energy diagnostics.",
    tags: ["Scientific ML", "Lagrangian Neural Networks", "SINDy"]
  },
  {
    title: "Null-Space Manipulability Optimization (Franka, MuJoCo)",
    status: "Completed",
    summary:
      "Formulated redundancy optimization using a D-optimality objective with a Damped Least Squares velocity tracker and Quadratic Programming in joint velocities. Compared null-space optimizers (Steepest Ascent + Armijo, PR+ Conjugate Gradient, L-BFGS) against a no-null-space baseline on a Franka Panda in MuJoCo.",
    tags: ["Redundancy Optimization", "Quadratic Programming", "MuJoCo"]
  },
  {
    title: "Mink - Inverse Kinematics Toolkit for MuJoCo",
    status: "Released",
    summary:
      "Open-source contributor to Mink 0.0.11, a Python inverse-kinematics and motion-planning toolkit for MuJoCo. Implemented new single- and dual-arm Franka Panda examples demonstrating bimanual manipulation and motion-planning pipelines.",
    tags: ["Open Source", "Inverse Kinematics", "MuJoCo"],
    links: [{ label: "Code", href: "https://github.com/kevinzakka/mink" }]
  },
  {
    title: "Trajectory Control Framework for a 6-DoF Robot",
    status: "Completed",
    summary:
      "Implemented a trajectory control framework using the Time-Optimal Path Parameterization (TOPP-RA) approach, enabling precise joint-space and Cartesian-space trajectory execution for a 6-DoF industrial manipulator, in collaboration with Orangewood Automation Pvt. Ltd.",
    tags: ["Trajectory Planning", "TOPP-RA", "Industrial Robots"]
  },
  {
    title: "Wearable Child Abuse Detection & Monitoring System",
    status: "Completed",
    summary:
      "Led a team of 30 students to design a wearable IoT device ecosystem for real-time child abuse detection using FSR sensor data, integrating machine-learning models with a mobile app interface. The project received national media coverage.",
    tags: ["IoT", "Wearables", "Machine Learning"]
  }
];
