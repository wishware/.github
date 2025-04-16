// Inspired by https://github.com/cheesits456/github-activity-readme/blob/master/index.js

import config from '#/config';
import { logger, formatTimestamp, capitalize } from '#/utils';

export async function updateActivities(username: string): Promise<string> {
  try {
    if (!username) throw new Error('You must provide a GitHub username.');

    const formatLink = (text: string, url: string, title?: string) => `[\`${text}\`](${url}${title ? ` '${title.replace(/'/g, "\\'")}'` : ''})`;

    const toUrlFormat = (item: Activities | string, branch: string | null, repoPublic: boolean): string => {
      if (typeof item === 'string') {
        return `[${branch ? `\`${branch}\`` : item}](https://github.com/${item}${branch ? `/tree/${branch}` : ''})`;
      }

      const repo = item.repo.name;
      const { payload } = item;

      if (!payload) return '';

      const { issue } = payload;
      const pr = payload.pull_request;

      if (issue) {
        const { title } = issue;
        return repoPublic ? formatLink(`#${issue.number}`, `https://github.com/${repo}/issues/${issue.number}`, title) : `\`#${issue.number}\``;
      }

      if (pr) {
        const { title } = pr;
        return repoPublic ? formatLink(`#${pr.number}`, `https://github.com/${repo}/pull/${pr.number}`, title) : `\`#${pr.number}\``;
      }

      return `[${branch ? `\`${branch}\`` : repo}](https://github.com/${repo}${branch ? `/tree/${branch}` : ''})`;
    };

    const serializers: Serializer = {
      DeleteEvent: ({ payload, repo, public: isPublic }) => (payload?.ref ? `❌ Deleted \`${payload.ref.slice(0, 30)}${payload.ref.length >= 30 ? '...' : ''}\` from ${toUrlFormat(repo.name, null, isPublic)}` : ''),

      ForkEvent: ({ repo, payload }) => (payload?.forkee ? `🍴 Forked ${toUrlFormat(repo.name, null, true)} to ${toUrlFormat(payload.forkee.full_name, null, payload.forkee.public)}` : ''),

      PullRequestEvent: (item) => {
        const pr = item.payload.pull_request;
        if (!pr) return '';
        const emoji = item.payload.action === 'opened' ? '✅' : '❌';
        const actionText = pr.merged ? '🎉 Merged' : `${emoji} ${capitalize(item.payload.action || '')}`;
        return `${actionText} PR ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`;
      },

      PullRequestReviewEvent: (item) => `🔍 Reviewed ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`,

      PushEvent: ({ repo, payload, public: isPublic }) => `📝 Made \`${payload.size}\` commit${payload.size === 1 ? '' : 's'} in ${toUrlFormat(repo.name, null, isPublic)}`,

      ReleaseEvent: ({ payload, repo, public: isPublic }) => (payload.release ? `🏷 Released ${isPublic ? formatLink(payload.release.tag_name, payload.release.html_url) : `\`${payload.release.tag_name}\``} in ${toUrlFormat(repo.name, null, isPublic)}` : ''),

      WatchEvent: ({ repo, public: isPublic }) => `⭐ Starred repository ${toUrlFormat(repo.name, null, isPublic)}`,

      IssueCommentEvent: (item) => `🗣 Commented on ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`,

      IssuesEvent: (item) => {
        const { issue } = item.payload;
        return issue ? `❗️ ${capitalize(item.payload.action || '')} issue ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}` : '';
      },

      CommitCommentEvent: ({ payload, repo, public: isPublic }) => {
        const { comment } = payload;
        if (!comment) return '';
        const hash = comment.commit_id.slice(0, 7);
        return `🗣 Commented on ${isPublic ? formatLink(hash, comment.html_url) : `\`${hash}\``} in ${toUrlFormat(repo.name, null, isPublic)}`;
      },

      CreateEvent: ({ payload, repo, public: isPublic }) => {
        if (!payload) return '';
        switch (payload.ref_type) {
          case 'repository':
            return `➕ Created repository ${toUrlFormat(repo.name, null, isPublic)}`;
          case 'branch':
            return `📂 Created branch ${toUrlFormat(repo.name, payload.ref ?? null, isPublic)} in ${toUrlFormat(repo.name, null, isPublic)}`;
          case 'tag':
            return `🔖 Created tag \`${payload.ref}\` in ${toUrlFormat(repo.name, null, isPublic)}`;
          default:
            return '';
        }
      },
    };

    logger.event(`Getting activity for ${username}`);

    const allEvents: Activities[] = [];
    const maxPages = 3;

    for (let i = 1; i <= maxPages; i++) {
      const res = await fetch(`https://api.github.com/users/${username}/events?per_page=100&page=${i}`, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(`[${username}] ${err.message || 'Failed to fetch activities'}`);
      }
      allEvents.push(...(await res.json()));
    }

    if (!allEvents.length) throw new Error('No events found.');

    logger.ready(`Top ${allEvents.length} activities in total ${username}.`);

    // Merge consecutive PushEvents on same repo
    const mergedEvents: Activities[] = [];
    for (const event of allEvents) {
      const last = mergedEvents[mergedEvents.length - 1];
      if (last && event.type === 'PushEvent' && last.type === 'PushEvent' && event.repo.name === last.repo.name) {
        last.payload.size = (last.payload.size || 0) + (event.payload.size || 0);
      } else {
        mergedEvents.push(event);
      }
    }

    const content = mergedEvents
      .filter((event) => event.public && event.type in serializers)
      .map((event) => `${formatTimestamp(event.created_at)} ${serializers[event.type](event)}`)
      .filter((text) => text && !/^`\[\d{1,2}\/\d{1,2} \d{1,2}:\d{2}]` undefined$/.test(text))
      .slice(0, config.activity.max_lines || 15);

    if (content.length < 5) throw new Error('Found less than 5 valid activities!');

    return `<details><summary>🎯 If you click you will see the history</summary>\n\n${content.join('<br/>\n')}\n\n</details>\n<!-- Last update: ${new Date().toISOString()} -->`;
  } catch (error) {
    logger.error(`Failed to fetch top activity: ${error}`);
    return '';
  }
}
