import ky from 'ky'

export type RepoStats = {
  stars: number
  forks: number
}

export class RepoStatsService {
  static async getGithubRepoStats(repoUrl: string): Promise<RepoStats | null> {
    if (!repoUrl) return null
    try {
      const match = repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git|\/|$)/i)
      if (!match) return null
      const [, owner, repo] = match
      const data = await ky.get(`https://api.github.com/repos/${owner}/${repo}`).json<any>()
      return { stars: data?.stargazers_count || 0, forks: data?.forks_count || 0 }
    } catch {
      return null
    }
  }
}
