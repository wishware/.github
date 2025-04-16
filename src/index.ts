import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import config from '#/config';
import { updateActivities, updateRepositorys, updateMostUsedLanguages } from '#/fetchers';
import { logger, updateSection } from '#/utils';

const { activity, repository, languages } = config;

const SOURCE_README = path.join(process.cwd(), 'profile', 'README.md');
const FINAL_README = path.join(process.cwd(), 'README.md');

logger.info(`Updating source README: ${SOURCE_README}`);

const start: number = Date.now();

[SOURCE_README, FINAL_README].forEach((file) => {
  if (!fs.existsSync(file)) {
    logger.error(`File not found at path: ${file}`);
    process.exit(1);
  }
});

try {
  let sourceContent = fs.readFileSync(SOURCE_README, 'utf-8');

  const [languagesList, activityList, repositorysList] = await Promise.all([updateMostUsedLanguages(languages.githubName, 'org'), updateActivities(activity.githubName), updateRepositorys(repository.githubName)]);

  sourceContent = await updateSection(sourceContent, activity, activityList);
  sourceContent = await updateSection(sourceContent, repository, repositorysList);
  sourceContent = await updateSection(sourceContent, languages, languagesList);

  fs.writeFileSync(SOURCE_README, sourceContent.trim());
  logger.ready(`Source readme updated: ${path.relative(process.cwd(), SOURCE_README)}`);

  fs.writeFileSync(FINAL_README, sourceContent.trim());
  logger.ready(`Final readme synchronized: ${path.relative(process.cwd(), FINAL_README)}`);

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  logger.ready(`Process completed in ${duration}s`);
} catch (error) {
  logger.error(`Error during update: ${error}`);
}
