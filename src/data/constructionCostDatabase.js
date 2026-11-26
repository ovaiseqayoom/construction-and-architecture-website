/**
 * Demo Construction Cost Benchmarks & Estimation Helper
 * Provides sample baseline planning numbers for architectural and turnkey scopes.
 */

export const AUDIT_METADATA = {
  organization: "Structura Architecture & Construction",
  headquarters: "123 Architecture Ave, Design District",
  auditDate: "2026-01-15",
  currency: "USD ($)",
  protocolsEnforced: [
    "Itemized Bill of Quantities (BOQ) split across structure, finishes, MEP, and envelope",
    "Separate labor, primary commodity, and finish allowance baselines",
    "Explicit contingency and thermal/seismic structural code allowances",
  ],
};

export const TURNKEY_BUILD_RATES = {
  residential: {
    basic: {
      ratePerSqFt: 165,
      label: "Essential / Core Shell + Standard Finishes",
      description:
        "Code-compliant RC frame, standard masonry infill, durable porcelain tile flooring, concealed electrical/plumbing, and exterior elastomeric coating.",
    },
    standard: {
      ratePerSqFt: 225,
      minRate: 205,
      maxRate: 250,
      label: "Standard Residential (Recommended Baseline)",
      description:
        "Ductile seismic-resistant RC structure, insulated cavity walls, double-glazed aluminum frames, modular millwork allowances, and full waterproof membrane systems.",
    },
    premium: {
      ratePerSqFt: 310,
      label: "Premium Architectural",
      description:
        "Hybrid steel-and-concrete framing, continuous rigid exterior insulation, acoustic glazing, radiant hydronic floor prep, and architectural facade cladding.",
    },
    luxury: {
      ratePerSqFt: 425,
      label: "Bespoke Signature Estate",
      description:
        "Long-span architectural cantilevers, exposed board-formed concrete or mass timber ceilings, natural stone facades, custom joinery, and smart HVAC zoning.",
    },
  },
  metroBenchmarks: {
    designDistrict: 245,
    northside: 225,
    riverfront: 260,
    harborview: 275,
    westbridge: 215,
  },
};

export const BOQ_PERCENTAGE_DISTRIBUTION = {
  civilAndStructural: 0.48,
  finishingAndFlooring: 0.24,
  mepServices: 0.16,
  roofingAndInsulation: 0.12,
};

export const MATERIAL_CONSUMPTION_PER_SQFT = {
  cementBags: 0.42,
  steelKg: 4.3,
  sandCft: 1.8,
  aggregatesCft: 1.35,
  bricksCount: 8.5,
  flooringSqFt: 0.85,
};

export const VERIFIED_MATERIAL_RATES = {
  steelPerTon: 980,
  concretePerCuYd: 155,
  brickPerThousand: 640,
  glazingPerSqFt: 38,
  insulationPerSqFt: 3.4,
};

export const LABOUR_PRICING_TABLE = {
  framingCrewPerSqFt: 34,
  masonryAndPlasterPerSqFt: 24,
  mepRoughInPerSqFt: 28,
  finishCarpentryPerSqFt: 22,
};

export const AREA_UNIT_CONVERSIONS = {
  sqFtToSqMeters: (sqFt) => Number((sqFt * 0.092903).toFixed(2)),
  sqMetersToSqFt: (sqM) => Math.round(sqM * 10.7639),
  formatMetricLabel: (sqFt) => `${Math.round(sqFt).toLocaleString("en-US")} sq ft (${(sqFt * 0.092903).toFixed(1)} sq m)`,
};

export const ESTIMATION_PROTOCOLS = [
  "Rates reflect schematic planning benchmarks excluding land acquisition, utility tap fees, and municipal permit assessments.",
  "Deep foundations (piles or caissons) and sloped hillside retaining walls require site-specific geotechnical verification.",
  "Milestone disbursements align cleanly with excavation, structural framing, MEP rough-in, envelope close-in, and final handover.",
];

export function calculateConstructionEstimate({
  builtUpAreaSqFt = 2000,
  floorsCount = 2,
  tier = "standard",
  includeThermalEnvelope = true,
  includeArchitecturalTimber = false,
  regionKey = "designDistrict",
}) {
  const area = Math.max(200, Number(builtUpAreaSqFt) || 2000);
  const floors = Math.max(1, Number(floorsCount) || 1);
  const totalArea = area * floors;

  const tierConfig =
    TURNKEY_BUILD_RATES.residential[tier] || TURNKEY_BUILD_RATES.residential.standard;
  const regionBenchmark = TURNKEY_BUILD_RATES.metroBenchmarks[regionKey] || 225;
  const baseRate =
    tier === "standard"
      ? Math.round((tierConfig.ratePerSqFt + regionBenchmark) / 2)
      : tierConfig.ratePerSqFt;

  let addonCost = 0;
  if (includeThermalEnvelope && tier === "standard") {
    addonCost += area * 8;
  }
  if (includeArchitecturalTimber) {
    addonCost += Math.round(totalArea * 0.25 * 28);
  }

  const grandTotal = totalArea * baseRate + addonCost;
  const effectiveRatePerSqFt = Math.round(grandTotal / totalArea);

  const civilCost = Math.round(grandTotal * BOQ_PERCENTAGE_DISTRIBUTION.civilAndStructural);
  const finishingCost = Math.round(grandTotal * BOQ_PERCENTAGE_DISTRIBUTION.finishingAndFlooring);
  const mepCost = Math.round(grandTotal * BOQ_PERCENTAGE_DISTRIBUTION.mepServices);
  const roofingCost = Math.round(grandTotal * BOQ_PERCENTAGE_DISTRIBUTION.roofingAndInsulation);

  const estimatedMaterials = {
    cementBags: Math.round(totalArea * MATERIAL_CONSUMPTION_PER_SQFT.cementBags),
    steelTons: Number(((totalArea * MATERIAL_CONSUMPTION_PER_SQFT.steelKg) / 1000).toFixed(2)),
    sandCft: Math.round(totalArea * MATERIAL_CONSUMPTION_PER_SQFT.sandCft),
    aggregatesCft: Math.round(totalArea * MATERIAL_CONSUMPTION_PER_SQFT.aggregatesCft),
    bricksCount: Math.round(totalArea * MATERIAL_CONSUMPTION_PER_SQFT.bricksCount),
    flooringSqFt: Math.round(totalArea * MATERIAL_CONSUMPTION_PER_SQFT.flooringSqFt),
  };

  return {
    inputs: {
      singleFloorAreaSqFt: area,
      floorsCount: floors,
      totalBuiltUpAreaSqFt: totalArea,
      areaSummary: AREA_UNIT_CONVERSIONS.formatMetricLabel(totalArea),
      tier,
      tierLabel: tierConfig.label,
      regionKey,
    },
    costSummary: {
      baseRatePerSqFt: baseRate,
      effectiveRatePerSqFt,
      grandTotal,
      formattedTotal: `$${grandTotal.toLocaleString("en-US")}`,
    },
    boqBreakdown: {
      civilAndStructural: {
        amount: civilCost,
        percentage: 48,
        label: "Civil & Structural Frame (Foundations, Slabs, Lateral Systems)",
      },
      finishingAndFlooring: {
        amount: finishingCost,
        percentage: 24,
        label: "Exterior Cladding, Flooring & Interior Finishes",
      },
      mepServices: {
        amount: mepCost,
        percentage: 16,
        label: "Mechanical, Electrical, Plumbing & Controls",
      },
      roofingAndInsulation: {
        amount: roofingCost,
        percentage: 12,
        label: "Roof Assembly, Weatherproofing & Thermal Envelope",
      },
    },
    materialEstimates: estimatedMaterials,
  };
}

export default {
  AUDIT_METADATA,
  TURNKEY_BUILD_RATES,
  BOQ_PERCENTAGE_DISTRIBUTION,
  MATERIAL_CONSUMPTION_PER_SQFT,
  VERIFIED_MATERIAL_RATES,
  LABOUR_PRICING_TABLE,
  AREA_UNIT_CONVERSIONS,
  ESTIMATION_PROTOCOLS,
  calculateConstructionEstimate,
};
