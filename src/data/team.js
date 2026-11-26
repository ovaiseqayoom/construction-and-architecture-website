export const TEAM_SECTIONS = [
  { id: "leadership", label: "Leadership Team" },
  { id: "architecture", label: "Architecture Team" },
  { id: "construction", label: "Field Operations Team" },
];

export const teamMembers = [
  {
    employeeId: "studio-0101",
    slug: "daniel-reyes",
    name: "Daniel Reyes",
    designation: "Principal Architect",
    credentials: "M.Arch, AIA, Studio Founding Principal",
    gender: "Male",
    department: "Board of Directors",
    teamSection: "leadership",
    contact: { email: "hello@example.com", phone: "+1 (555) 010-0001" },
    image: "/images/team/avatar-01.svg",
    quote:
      "Great architecture balances structural honesty, daylight performance, and effortless daily circulation.",
    bio: "Daniel Reyes leads architectural direction at Structura Architecture & Construction, guiding studio design standards, masterplanning, and long-term sustainability initiatives.",
    stats: [
      { label: "Experience", value: "18+ Yrs" },
      { label: "Built Works", value: "85+" },
      { label: "Focus", value: "Masterplanning" },
    ],
    skills: [
      "Architectural Design",
      "Masterplanning",
      "Daylight Modeling",
      "Design Governance",
      "Client Advisory",
    ],
    projects: [
      "Cantilever Courtyard Villa",
      "Northpoint Civic Commons",
      "Terraced Courtyard Lofts",
    ],
  },
  {
    employeeId: "studio-0102",
    slug: "elena-cho",
    name: "Elena Cho",
    designation: "Structural Engineering Lead",
    credentials: "M.S. Structural Engineering, PE, Seismic Specialist",
    gender: "Female",
    department: "Structural Engineering",
    teamSection: "leadership",
    contact: { email: "hello@example.com", phone: "+1 (555) 010-0002" },
    image: "/images/team/avatar-02.svg",
    quote:
      "Resilient structures make ambitious architectural cantilevers feel calm, light, and enduring.",
    bio: "Elena Cho oversees structural analysis, lateral-force seismic engineering, and BIM coordination across complex residential and commercial developments.",
    stats: [
      { label: "Experience", value: "12+ Yrs" },
      { label: "Structural Audits", value: "140+" },
      { label: "BIM Coordination", value: "100%" },
    ],
    skills: [
      "ETABS & Finite Element Analysis",
      "Ductile RC Frame Detailing",
      "Geotechnical Foundation Design",
      "Steel & Timber Hybrids",
      "Peer Structural Review",
    ],
    projects: [
      "Ridgeline Timber Residence",
      "Northpoint Civic Commons",
      "Cantilever Courtyard Villa",
    ],
  },
  {
    employeeId: "studio-0103",
    slug: "marcus-patel",
    name: "Marcus Patel",
    designation: "Director – Construction & Field QA",
    credentials: "B.S. Civil Engineering, PE, Turnkey Operations",
    gender: "Male",
    department: "Construction Operations",
    teamSection: "leadership",
    contact: { email: "hello@example.com", phone: "+1 (555) 010-0003" },
    image: "/images/team/avatar-03.svg",
    quote:
      "Disciplined milestone schedules and transparent Bills of Quantities protect both craftsmanship and client trust.",
    bio: "Marcus Patel directs turnkey construction delivery, materials laboratory testing, site safety protocols, and subcontractor quality audits.",
    stats: [
      { label: "Experience", value: "14+ Yrs" },
      { label: "On-Time Handover", value: "97%" },
      { label: "QA Checklists", value: "40+ Points" },
    ],
    skills: [
      "Turnkey Site Execution",
      "BOQ & Cost Control",
      "Concrete & Rebar QA",
      "Vendor Procurement",
      "HSE Compliance",
    ],
    projects: [
      "Terraced Courtyard Lofts",
      "Atelier Acoustic Fit-Out",
      "Timber & Stone Pavilion",
    ],
  },
  {
    employeeId: "studio-0104",
    slug: "sophia-laurent",
    name: "Sophia Laurent",
    designation: "Director – Interior & Envelope Systems",
    credentials: "M.Arch, Building Physics & Interior Architecture",
    gender: "Female",
    department: "Interior & Envelope Studio",
    teamSection: "leadership",
    contact: { email: "hello@example.com", phone: "+1 (555) 010-0004" },
    image: "/images/team/avatar-04.svg",
    quote:
      "Acoustic calm, thermal comfort, and durable natural finishes define how a building feels years after handover.",
    bio: "Sophia Laurent directs building envelope performance, passive thermal assemblies, bespoke modular joinery, and interior material palettes.",
    stats: [
      { label: "Experience", value: "10+ Yrs" },
      { label: "Envelope Audits", value: "60+" },
      { label: "Specialty", value: "Modular Millwork" },
    ],
    skills: [
      "Interior Architecture",
      "Thermal Envelope Design",
      "Modular Joinery Detailing",
      "Acoustic Treatments",
      "Daylight & Glazing Specs",
    ],
    projects: [
      "Atelier Acoustic Fit-Out",
      "Cantilever Courtyard Villa",
      "Timber & Stone Pavilion",
    ],
  },
  {
    employeeId: "studio-0105",
    slug: "omar-brooks",
    name: "Omar Brooks",
    designation: "Senior BIM & CAD Coordinator",
    credentials: "B.Arch, Autodesk Certified Revit Professional",
    gender: "Male",
    department: "Architecture & Visualization",
    teamSection: "architecture",
    contact: { email: "hello@example.com", phone: "+1 (555) 010-0005" },
    image: "/images/team/avatar-05.svg",
    quote:
      "Resolving MEP and structural clashes in the digital model eliminates costly rework on site.",
    bio: "Omar Brooks manages cross-disciplinary BIM models, working drawing packages, and construction documentation standards.",
    stats: [
      { label: "Experience", value: "7+ Yrs" },
      { label: "LOD Standard", value: "LOD 350" },
      { label: "Drafting", value: "Revit / CAD" },
    ],
    skills: [
      "Autodesk Revit",
      "Clash Detection",
      "MEP Coordination",
      "Working Drawings",
      "Permit Submittals",
    ],
    projects: ["Northpoint Civic Commons", "Terraced Courtyard Lofts"],
  },
  {
    employeeId: "studio-0106",
    slug: "hannah-kim",
    name: "Hannah Kim",
    designation: "Project Architect & 3D Lead",
    credentials: "M.Arch, Computational Design Specialist",
    gender: "Female",
    department: "Architecture & Visualization",
    teamSection: "architecture",
    contact: { email: "hello@example.com", phone: "+1 (555) 010-0006" },
    image: "/images/team/avatar-06.svg",
    quote:
      "Clear physical proportions and honest material studies help clients step inside a design before breaking ground.",
    bio: "Hannah Kim leads schematic facade development, daylight simulations, and real-time architectural visualization.",
    stats: [
      { label: "Experience", value: "6+ Yrs" },
      { label: "Visualizations", value: "90+" },
      { label: "Focus", value: "Passive Design" },
    ],
    skills: [
      "Schematic Design",
      "3D Visualization",
      "Facade Detailing",
      "Material Curation",
      "Solar Studies",
    ],
    projects: ["Cantilever Courtyard Villa", "Ridgeline Timber Residence"],
  },
  {
    employeeId: "studio-0107",
    slug: "thomas-miller",
    name: "Thomas Miller",
    designation: "Geotechnical & Survey Lead",
    credentials: "B.S. Civil Engineering, Land Surveying Specialist",
    gender: "Male",
    department: "Site Engineering",
    teamSection: "construction",
    contact: { email: "hello@example.com", phone: "+1 (555) 010-0007" },
    image: "/images/team/avatar-07.svg",
    quote:
      "Accurate contour mapping and soil bearing validation form the bedrock of predictable budgeting.",
    bio: "Thomas Miller oversees Total Station boundary surveys, soil investigation coordination, and municipal zoning compliance packages.",
    stats: [
      { label: "Experience", value: "9+ Yrs" },
      { label: "Site Surveys", value: "160+" },
      { label: "Accuracy", value: "Sub-cm" },
    ],
    skills: [
      "Total Station Surveying",
      "SPT Geotechnical Coordination",
      "Zoning Setback Audits",
      "Excavation Layout",
      "Stormwater Grading",
    ],
    projects: ["Ridgeline Timber Residence", "Timber & Stone Pavilion"],
  },
  {
    employeeId: "studio-0108",
    slug: "robert-garcia",
    name: "Robert Garcia",
    designation: "Senior Site Superintendent",
    credentials: "Diploma Civil Engineering, Certified Site Manager",
    gender: "Male",
    department: "Field Operations",
    teamSection: "construction",
    contact: { email: "hello@example.com", phone: "+1 (555) 010-0008" },
    image: "/images/team/avatar-08.svg",
    quote:
      "Daily pour logs, cube testing, and clean formwork tolerances turn good blueprints into lasting concrete.",
    bio: "Robert Garcia coordinates daily field supervision, steel reinforcement inspections, and finishing tolerances across active job sites.",
    stats: [
      { label: "Experience", value: "15+ Yrs" },
      { label: "Active Sites", value: "35+" },
      { label: "Specialty", value: "RC Formwork" },
    ],
    skills: [
      "Formwork & Shoring",
      "Rebar Verification",
      "Concrete Slump & Cube QA",
      "Crew Scheduling",
      "Site Safety",
    ],
    projects: ["Terraced Courtyard Lofts", "Northpoint Civic Commons"],
  },
  {
    employeeId: "studio-0109",
    slug: "aria-morales",
    name: "Aria Morales",
    designation: "Quantity Surveyor & Cost Engineer",
    credentials: "B.S. Construction Management, Certified Cost Estimator",
    gender: "Female",
    department: "Cost & Procurement",
    teamSection: "construction",
    contact: { email: "hello@example.com", phone: "+1 (555) 010-0009" },
    image: "/images/team/avatar-09.svg",
    quote:
      "Granular quantity takeoffs give property owners confidence long before site mobilization begins.",
    bio: "Aria Morales prepares milestone BOQ schedules, supplier tender comparisons, and value-engineering budget models.",
    stats: [
      { label: "Experience", value: "7+ Yrs" },
      { label: "BOQs Audited", value: "110+" },
      { label: "Variance", value: "< 3%" },
    ],
    skills: [
      "Quantity Takeoffs",
      "BOQ Preparation",
      "Milestone Billing",
      "Value Engineering",
      "Material Forecasting",
    ],
    projects: ["Atelier Acoustic Fit-Out", "Cantilever Courtyard Villa"],
  },
  {
    employeeId: "studio-0110",
    slug: "jonas-weber",
    name: "Jonas Weber",
    designation: "Master Timber & Millwork Lead",
    credentials: "Architectural Carpentry & Custom Joinery Specialist",
    gender: "Male",
    department: "Field Operations",
    teamSection: "construction",
    contact: { email: "hello@example.com", phone: "+1 (555) 010-0010" },
    image: "/images/team/avatar-10.svg",
    quote:
      "Precision joinery relies on moisture testing, tight tolerances, and respecting grain direction.",
    bio: "Jonas Weber directs architectural timber trusses, soffits, custom acoustic wall paneling, and modular kitchen installations.",
    stats: [
      { label: "Experience", value: "16+ Yrs" },
      { label: "Custom Works", value: "70+" },
      { label: "Specialty", value: "Heavy Timber" },
    ],
    skills: [
      "Exposed Timber Trusses",
      "Custom Cabinetry",
      "Acoustic Wall Paneling",
      "Finish Tolerance QA",
      "Architectural Door Systems",
    ],
    projects: ["Timber & Stone Pavilion", "Ridgeline Timber Residence"],
  },
];

const employeeIndexById = new Map();
teamMembers.forEach((member, index) => {
  if (member.employeeId) {
    employeeIndexById.set(member.employeeId.toLowerCase(), index);
  }
  if (member.slug) {
    employeeIndexById.set(member.slug.toLowerCase(), index);
  }
});

export function getEmployeeById(employeeId) {
  if (!employeeId) return undefined;
  const index = employeeIndexById.get(String(employeeId).toLowerCase());
  return index === undefined ? undefined : teamMembers[index];
}

export function getMembersBySection(sectionId) {
  return teamMembers.filter((member) => member.teamSection === sectionId);
}

export function getAdjacentEmployees(employeeId) {
  const index = employeeIndexById.get(employeeId?.toLowerCase());
  if (index === undefined) return { previous: null, next: null };

  const total = teamMembers.length;
  const previous = teamMembers[(index - 1 + total) % total];
  const next = teamMembers[(index + 1) % total];

  return { previous, next };
}

export function shouldBlurEmployeeFace() {
  return false;
}
