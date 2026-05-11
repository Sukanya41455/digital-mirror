/**
 * Data-Driven Archetype Matcher for Team USA Digital Mirror
 * Compares user biometrics against historical averages from CSV datasets.
 */

export interface ArchetypeData {
  name: string;
  avgHeightCm: string;
  avgWeightKg: string;
  sports: string;
  conditionalInsight: string;
}

export interface SportFamilyStat {
  family: string;
  avgHeightCm: string;
  avgWeightKg: string;
  topSports: string;
  count: string;
}

export interface MatchInput {
  heightCm: number;
  weightKg: number;
  age: number;
  region: string;
  sportInterest: string;
  pathway: 'olympic' | 'paralympic' | 'both';
  impairmentContext: string;
  // Historical data source
  archetypes: ArchetypeData[];
  sportStats: SportFamilyStat[];
  paralympicData: any[];
}

export interface ArchetypeMatch {
  name: string;
  score: number;
  confidence: 'Strong Historical Alignment' | 'Moderate Historical Alignment' | 'Exploratory Alignment';
  insight: string;
  factor: string;
  breakdown: {
    heightSimilarity: number;
    weightSimilarity: number;
    bmiSimilarity: number;
    sportAffinity: number;
    historicalAlignment: number;
    pathwayFit: number;
  };
}

export interface MatchResult {
  bmi: number;
  heightBand: 'short' | 'average' | 'tall';
  weightBand: 'light' | 'average' | 'strong';
  matches: ArchetypeMatch[];
}

export function matchArchetypes(input: MatchInput): MatchResult {
  const { 
    heightCm, weightKg, pathway, impairmentContext, 
    sportInterest, archetypes, sportStats 
  } = input;
  
  // 1. Compute BMI
  const bmi = weightKg / ((heightCm / 100) ** 2);
  
  // 2. Compute Bands
  const heightBand = heightCm < 165 ? 'short' : heightCm > 185 ? 'tall' : 'average';
  const weightBand = bmi < 20 ? 'light' : bmi > 28 ? 'strong' : 'average';
  
  // 3. Process matches against CSV archetypes
  const matches: ArchetypeMatch[] = archetypes.map(arch => {
    const targetH = parseFloat(arch.avgHeightCm);
    const targetW = parseFloat(arch.avgWeightKg);
    const targetBmi = targetW / ((targetH / 100) ** 2);

    // Compute Physical Similarity (0-100)
    // Using normalized Euclidean distance components
    const hDiff = Math.abs(heightCm - targetH) / 20; // 20cm as a large diff
    const wDiff = Math.abs(weightKg - targetW) / 30; // 30kg as a large diff
    const bmiDiff = Math.abs(bmi - targetBmi) / 10; // 10 BMI points as large diff
    
    const heightSimilarity = Math.max(0, 100 - (hDiff * 100));
    const weightSimilarity = Math.max(0, 100 - (wDiff * 100));
    const bmiSimilarity = Math.max(0, 100 - (bmiDiff * 100));
    const physicalScore = Math.max(0, 100 - (hDiff * 30 + wDiff * 30 + bmiDiff * 40));

    // Compute Interest Affinity
    let interestScore = 50; // Baseline
    const lowerInterest = sportInterest.toLowerCase();
    const lowerSports = arch.sports.toLowerCase();
    const archKeywords = arch.name.toLowerCase().split(' ');
    
    if (archKeywords.some(k => lowerInterest.includes(k)) || lowerSports.includes(lowerInterest)) {
      interestScore = 90;
    } else if (lowerSports.split(',').some(s => lowerInterest.includes(s.trim()))) {
      interestScore = 80;
    }

    // Pathway Affinity (Equal Depth Logic)
    let pathwayScore = 70;
    const isParaUser = pathway === 'paralympic' || pathway === 'both' || (impairmentContext !== 'none' && impairmentContext !== 'neurotypical');

    if (isParaUser) {
      // If user has a Paralympic focus or impairment, we boost based on sport family alignment
      const archSports = arch.sports.toLowerCase();
      // Look for sports with known para pathways (Athletics, Swimming, Basketball/Hockey/Bobsleigh)
      const paraFriendlyKeywords = ['athletics', 'swimming', 'hockey', 'basketball', 'skiing', 'cycling', 'rowing'];
      
      if (paraFriendlyKeywords.some(k => archSports.includes(k.toLowerCase()))) {
        pathwayScore = 100; // Strong alignment with recognized Para-sports pathways
      } else {
        pathwayScore = 90; // General Paralympic potential
      }
    } else {
      // Olympic-only focus
      pathwayScore = pathway === 'olympic' ? 100 : 80;
    }

    // Weighted Final Score
    const finalScore = (physicalScore * 0.5) + (interestScore * 0.3) + (pathwayScore * 0.2);

    // Confidence Label
    let confidence: ArchetypeMatch['confidence'] = 'Exploratory Alignment';
    if (finalScore > 85) confidence = 'Strong Historical Alignment';
    else if (finalScore > 70) confidence = 'Moderate Historical Alignment';

    return {
      name: arch.name,
      score: Math.round(finalScore),
      confidence,
      insight: arch.conditionalInsight || "This profile could align with historical success patterns.",
      factor: physicalScore > 80 ? "High Morphological Match" : "Statistical Cluster Affinity",
      breakdown: {
        heightSimilarity: Math.round(heightSimilarity),
        weightSimilarity: Math.round(weightSimilarity),
        bmiSimilarity: Math.round(bmiSimilarity),
        sportAffinity: Math.round(interestScore),
        historicalAlignment: Math.round(physicalScore),
        pathwayFit: Math.round(pathwayScore)
      }
    };
  });

  // 4. Sort and return top 3
  return {
    bmi: parseFloat(bmi.toFixed(1)),
    heightBand,
    weightBand,
    matches: matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    }).slice(0, 3)
  };
}
