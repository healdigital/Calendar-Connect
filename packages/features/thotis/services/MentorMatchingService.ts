import type { StudentProfileWithUser } from "../repositories/ProfileRepository";

// Define the intent interface locally until the Prisma client is generated
export interface ThotisOrientationIntent {
  targetFields: string[];
  academicLevel: string;
  scheduleConstraints?: Record<string, unknown> | null;
  zone?: string | null;
  goals: string[];
}

export interface ScoredMentor extends StudentProfileWithUser {
  matchScore: number;
  matchReasons: string[];
}

export class MentorMatchingService {
  // Weight constants
  private readonly WEIGHTS = {
    FIELD_MATCH: 30,
    LEVEL_MATCH: 20,
    AVAILABILITY: 20,
    RATING: 15,
    COMPLETION_RATE: 10,
    MENTOR_LOAD: 5,
  };

  /**
   * Calculate a match score for a mentor based on student intent
   */
  scoreMentor(mentor: StudentProfileWithUser, intent: ThotisOrientationIntent): ScoredMentor {
    let score = 0;
    const reasons: string[] = [];

    // 1. Field Match (30%)
    if (intent.targetFields.length > 0 && intent.targetFields.includes(mentor.field)) {
      score += this.WEIGHTS.FIELD_MATCH;
      reasons.push("Matches your target field");
    }

    // 2. Academic Level (20%)
    // Simple heuristic: Higher year students might be better for orientation?
    // Or maybe matching level? For now, we prefer experienced students (Year 2+)
    if (mentor.currentYear >= 2) {
      score += this.WEIGHTS.LEVEL_MATCH;
      reasons.push("Experienced student");
    }

    // 3. Availability (20%)
    // Placeholder: Check if scheduleConstraints overlap with mentor availability
    // For now, we give partial points if mentor is active
    if (mentor.isActive) {
      score += this.WEIGHTS.AVAILABILITY;
    }

    // 4. Rating (15%)
    const rating = mentor.averageRating ? Number(mentor.averageRating) : 0;
    if (rating >= 4.5) {
      score += this.WEIGHTS.RATING;
      reasons.push("Highly rated mentor");
    } else if (rating >= 4.0) {
      score += this.WEIGHTS.RATING * 0.7;
    }

    // 5. Completion Rate (10%)
    const total = mentor.totalSessions || 0;
    const completed = mentor.completedSessions || 0;
    if (total > 5) {
      const rate = completed / total;
      if (rate > 0.9) {
        score += this.WEIGHTS.COMPLETION_RATE;
        reasons.push("Reliable attendance");
      }
    }

    // 6. Mentor Load (5%)
    // diverse load balancing - if they haven't had a session recently/today?
    // For now, small bonus if they have less than 50 sessions total (fresh faces)
    // or conversely, if they are super popular. Let's maximize usage of "available" mentors.
    if (mentor.totalSessions < 20) {
      // Boost for new mentors to get them started
      score += this.WEIGHTS.MENTOR_LOAD;
    }

    return {
      ...mentor,
      matchScore: Math.round(score),
      matchReasons: reasons,
    };
  }

  /**
   * Sort mentors by score
   */
  sortMentors(mentors: StudentProfileWithUser[], intent: ThotisOrientationIntent): ScoredMentor[] {
    const scored = mentors.map((m) => this.scoreMentor(m, intent));

    return scored.sort((a, b) => b.matchScore - a.matchScore);
  }
}
