import config from '#/config';
import { logger } from '#/utils';

export async function updateMostUsedLanguages(username: string, type: 'org' | 'user'): Promise<string> {
  try {
    if (!username) throw new Error('You must provide a GitHub username.');

    const headers = {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'GitHub-Lang-Analyzer',
    };

    const languagesCount: Record<string, number> = {};

    let page = 1;
    const allRepos: Repository[] = [];

    while (true) {
      const res = await fetch(`https://api.github.com/${type === 'org' ? `orgs/${username}` : `user`}/repos?per_page=100&page=${page}&visibility=all`, {
        headers,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(`[${username}] ${err.message || 'Failed to fetch repositories'}`);
      }

      const repos: Repository[] = await res.json();
      if (repos.length === 0) break;

      allRepos.push(...repos);
      page++;
    }

    if (!allRepos.length) throw new Error('No repositories found.');

    logger.event(`Getting languages for ${username}`);

    for (const repo of allRepos) {
      const repoName = repo.name;
      const repoLanguagesRes = await fetch(repo.languages_url, { headers });

      if (!repoLanguagesRes.ok) {
        const err = await repoLanguagesRes.json();
        throw new Error(`[${repoName}] ${err.message || 'Failed to fetch languages'}`);
      }

      const languages = await repoLanguagesRes.json();

      for (const language in languages) {
        languagesCount[language] = (languagesCount[language] || 0) + languages[language];
      }
    }

    const sortedLanguages = Object.entries(languagesCount);
    if (!sortedLanguages.length) throw new Error('No languages found.');

    logger.ready(`Top ${sortedLanguages.length} languages fetched for ${username}`);

    const content = await Promise.all(
      sortedLanguages
        .sort(([, a], [, b]) => b - a)
        .map(async ([language]) => {
          const icon = `https://skillicons.dev/icons?i=${language.toLowerCase()}`;
          try {
            const res = await fetch(icon);
            if (!res.ok) throw new Error('Error in the fetch');
            const svg = await res.text();
            if (svg.includes(`undefined`)) throw new Error('Unknown or not found icon');
            return `<code><img src="${icon}" alt="${language} icon" height="30" width="30" /></code>`;
          } catch (_error) {
            return `<code><img src="https://github.com/user-attachments/assets/76a9fd72-22ac-46f0-a3bd-d2a7dc1119f9" alt="${language} icon unknown" height="30" width="30" /></code>`;
          }
        })
        .slice(0, config.languages.max_lines || 5)
    );

    return `${content.join('\n')}\n<!-- Last update: ${new Date().toISOString()} -->`;
  } catch (error) {
    logger.error(`Failed to fetch top languages: ${error}`);
    return '';
  }
}
