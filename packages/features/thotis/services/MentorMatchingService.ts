import type { StudentProfileWithUser } from "../repositories/ProfileRepository";

// Define the intent interface locally until the Prisma client is generated
export interface ThotisOrientationIntent {
  targetFields: string[];
  academicLevel: string;
  scheduleConstraints?: Record<string, unknown> | null;
  zone?: string | null;
  goals?: string[];
}

export interface ScoredMentor extends StudentProfileWithUser {
  matchScore: number;
  matchReasons: string[];
}

export class MentorMatchingService {
  // Weight constants
  private readonly WEIGHTS = {
    FIELD_MATCH: 25,
    GOAL_MATCH: 15,
    SCHEDULE_MATCH: 10,
    LEVEL_MATCH: 15,
    AVAILABILITY: 15,
    RATING: 10,
    COMPLETION_RATE: 5,
    MENTOR_LOAD: 5,
  };

  /**
   * Calculate a match score for a mentor based on student intent
   */
  scoreMentor(mentor: StudentProfileWithUser, intent: ThotisOrientationIntent): ScoredMentor {
    let score = 0;
    const reasons: string[] = [];

    // 1. Field Match (25%)
    if (intent.targetFields.length > 0 && intent.targetFields.includes(mentor.field)) {
      score += this.WEIGHTS.FIELD_MATCH;
      reasons.push("Matches your target field");
    }

    // 2. Goal & Expertise Match (15%)
    if (intent.goals && intent.goals.length > 0) {
      const expertise = mentor.expertise || [];
      const matchingGoals = intent.goals.filter((goal) =>
        expertise.some((exp) => exp.toLowerCase().includes(goal.toLowerCase()))
      );

      if (matchingGoals.length > 0) {
        const bonus = Math.min(this.WEIGHTS.GOAL_MATCH, matchingGoals.length * 5);
        score += bonus;
        reasons.push(`Expert in: ${matchingGoals.join(", ")}`);
      }
    }

    // 3. Schedule Constraints (10%)
    if (intent.scheduleConstraints) {
      const constraints = intent.scheduleConstraints as { preferredTimes?: string[] };
      if (constraints.preferredTimes && constraints.preferredTimes.length > 0) {
        // Heuristic: Active mentors are weighted higher if student has constraints
        if (mentor.isActive) {
          score += this.WEIGHTS.SCHEDULE_MATCH;
          reasons.push("Available during preferred times");
        }
      }
    }

    // 4. Academic Level (15%)
    // Prefer older students for orientation
    if (mentor.currentYear >= 3) {
      score += this.WEIGHTS.LEVEL_MATCH;
      reasons.push("Senior student with perspective");
    } else if (mentor.currentYear >= 2) {
      score += this.WEIGHTS.LEVEL_MATCH * 0.6;
      reasons.push("Experienced student");
    }

    // 5. Availability & Activity (15%)
    if (mentor.isActive) {
      score += this.WEIGHTS.AVAILABILITY * 0.5;
      if (mentor.totalSessions > 10) {
        score += this.WEIGHTS.AVAILABILITY * 0.5;
        reasons.push("Very active mentor");
      }
    }

    // 6. Rating & Quality (10%)
    const rating = mentor.averageRating ? Number(mentor.averageRating) : 0;
    if (rating >= 4.8) {
      score += this.WEIGHTS.RATING;
      reasons.push("Exceptionally high rating");
    } else if (rating >= 4.5) {
      score += this.WEIGHTS.RATING * 0.7;
    }

    // 7. Completion Rate (5%)
    const total = mentor.totalSessions || 0;
    const completed = mentor.completedSessions || 0;
    if (total > 5 && completed / total > 0.9) {
      score += this.WEIGHTS.COMPLETION_RATE;
    }

    // 8. Mentor Load (5%)
    if (mentor.totalSessions < 20) {
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
