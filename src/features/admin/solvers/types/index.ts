export type SolverRow = {
  solve_id: string
  username: string
  challenge_title: string
  solved_at: string
}

export type PendingDeleteDetail = {
  username: string
  challenge_title: string
} | null

