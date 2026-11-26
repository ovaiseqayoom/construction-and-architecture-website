export const AUTHOR_REGISTRY = {
  "studio-0101": {
    id: "studio-0101",
    name: "Daniel Reyes",
    honorificPrefix: "AIA,",
    role: "Principal Architect",
    designation: "Principal Architect",
    credentials: "M.Arch, Licensed Architectural Principal",
    avatar: "/images/team/avatar-01.svg",
    bio: "Daniel Reyes leads architectural vision, spatial masterplanning, and climate-responsive studio governance across residential and civic works.",
    din: null,
    url: "/about#studio-0101",
  },
  "studio-0102": {
    id: "studio-0102",
    name: "Elena Cho",
    honorificPrefix: "PE,",
    role: "Structural Engineering Lead",
    designation: "Structural Engineering Lead",
    credentials: "M.S. Structural Engineering, Seismic Systems Specialist",
    avatar: "/images/team/avatar-02.svg",
    bio: "Elena Cho directs structural analysis, ductile lateral-force design, and BIM structural coordination across multi-story frames.",
    din: null,
    url: "/about#studio-0102",
  },
  "studio-0103": {
    id: "studio-0103",
    name: "Marcus Patel",
    honorificPrefix: "PE,",
    role: "Director of Construction & Field QA",
    designation: "Director of Construction & Field QA",
    credentials: "B.S. Civil Engineering, Turnkey Delivery Lead",
    avatar: "/images/team/avatar-03.svg",
    bio: "Marcus Patel oversees field construction schedules, materials testing, site safety protocols, and transparent BOQ execution.",
    din: null,
    url: "/about#studio-0103",
  },
  "studio-0104": {
    id: "studio-0104",
    name: "Sophia Laurent",
    role: "Senior Interior & Envelope Architect",
    designation: "Senior Interior & Envelope Architect",
    credentials: "M.Arch, High-Performance Building Envelopes",
    avatar: "/images/team/avatar-04.svg",
    bio: "Sophia Laurent specializes in passive thermal envelopes, modular millwork systems, and integrated acoustic interior architecture.",
    din: null,
    url: "/about#studio-0104",
  },
};

export function getAuthorProfile(nameOrId) {
  if (!nameOrId) {
    return AUTHOR_REGISTRY["studio-0102"];
  }

  if (AUTHOR_REGISTRY[nameOrId]) {
    return AUTHOR_REGISTRY[nameOrId];
  }

  const clean = String(nameOrId).toLowerCase().trim();

  for (const profile of Object.values(AUTHOR_REGISTRY)) {
    if (
      profile.id.toLowerCase() === clean ||
      profile.name.toLowerCase() === clean
    ) {
      return profile;
    }
  }

  if (clean.includes("reyes")) return AUTHOR_REGISTRY["studio-0101"];
  if (clean.includes("cho")) return AUTHOR_REGISTRY["studio-0102"];
  if (clean.includes("patel")) return AUTHOR_REGISTRY["studio-0103"];
  if (clean.includes("laurent")) return AUTHOR_REGISTRY["studio-0104"];

  return {
    id: "studio-author-guest",
    name: String(nameOrId).trim() || "Structura Editorial Team",
    role: "Architecture & Engineering Editorial",
    designation: "Architecture & Engineering Editorial",
    credentials: "Architecture & Civil Engineering Practice",
    avatar: "/images/team/avatar-01.svg",
    bio: "Engineering and architectural contributors documenting structural design, cost clarity, and building envelope performance.",
    din: null,
    url: "/about",
  };
}
