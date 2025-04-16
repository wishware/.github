import { markdownTable } from 'markdown-table';
import config from '#/config';
import { logger, formatTimestamp } from '#/utils';

export async function updateRepositorys(username: string): Promise<string> {
  try {
    if (!username) throw new Error('You must provide a GitHub username.');

    logger.event(`Getting repositories for ${username}`);

    const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`[${username}] ${err.message || 'Failed to fetch repositories'}`);
    }

    const repos: Repository[] = await res.json();

    if (!repos.length) throw new Error('No repositories found.');

    logger.ready(`Top ${config.repository.max_lines} repositories fetched for ${username}.`);

    const tableData = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .filter((repo) => repo.name !== '.github')
      .map((repo, _) => {
        return [
          `<code>${formatTimestamp(repo.created_at).replace(/`/g, '')}</code>`,
          `[${repo.name}](${repo.html_url})`,
          `<code>${repo.stargazers_count}</code> <img src="https://github.com/user-attachments/assets/320cf792-938e-491f-b54c-62b7c653ce31" alt="Star icon" height="20" width="20" />`,
          `${repo.description ? repo.description.slice(0, 35) + (repo.description.length > 35 ? '...' : '') : 'No description'}`,
          `<code>${repo.language}</code> <img src="https://skillicons.dev/icons?i=${repo.language.toLowerCase()}" alt="${repo.language} icon" height="20" width="20" />`,
        ];
      })
      .slice(0, config.repository.max_lines || 5);

    const headers = ['Published', 'Repository', 'Stars', 'Description', 'Language'];
    const table = markdownTable([headers, ...tableData], {
      align: ['c', 'l', 'c', 'l', 'c'],
      padding: true,
    });

    return `${table}\n<!-- Last update: ${new Date().toISOString()} -->`;
  } catch (error) {
    logger.error(`Failed to fetch top repositories: ${error}`);
    return '';
  }
}
