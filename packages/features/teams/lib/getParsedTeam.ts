export const getParsedTeam = (team: any) => {
  if (!team) return null;
  return {
    ...team,
    metadata: typeof team.metadata === "string" ? JSON.parse(team.metadata) : team.metadata,
  };
};
