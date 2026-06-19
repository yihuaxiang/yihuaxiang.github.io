import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DEFAULT_PROJECTS_API_URL = 'https://playground2.z.wiki/api/projects';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seedPath = path.join(rootDir, 'src/data/projects.seed.json');
const outputPath = path.join(rootDir, 'src/data/projects.generated.json');

const apiUrl = process.env.PROJECTS_API_URL?.trim() || DEFAULT_PROJECTS_API_URL;
const apiToken = process.env.PROJECTS_API_TOKEN?.trim();
const categoryDefaults = [
  { id: 'service-projects', title: '网站能力 / 小服务', description: '偏产品化、能直接被别人使用的线上服务和核心站点能力。' },
  { id: 'ai-projects', title: 'AI / 自动化', description: '把 AI 能力接进真实产品流程里，强调效率、生成和自动化。' },
  { id: 'tool-projects', title: '工具类', description: '解决具体问题的效率工具，适合快速打开即用。' },
  { id: 'visual-projects', title: '可视化 / 交互实验', description: '更偏前端表达和交互体验的项目，包含实验、演示和创意作品。' },
  { id: 'history-projects', title: '历史项目', description: '时间稍久但仍值得被保留的项目，它们记录了我的探索路径。' },
];

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
  return [];
}

function slugify(value, fallback) {
  const source = String(value || '').toLowerCase();
  const slug = source.replace(/https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function defaultCategoryId(category, fallback) {
  return categoryDefaults.find((item) => item.title === category)?.id || slugify(category, fallback);
}

function getProjects(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.projects)) return payload.projects;
  if (Array.isArray(payload?.data?.projects)) return payload.data.projects;
  if (Array.isArray(payload?.data)) return payload.data;
  return null;
}

function getProvidedSections(payload) {
  if (Array.isArray(payload?.sections)) return payload.sections;
  if (Array.isArray(payload?.data?.sections)) return payload.data.sections;
  return null;
}

function getSections(payload, projects, fallbackSections = categoryDefaults) {
  const providedSections = getProvidedSections(payload);

  if (providedSections) {
    return providedSections.map((section, index) => ({
      id: section.id || defaultCategoryId(section.title || section.name, `section-${index + 1}`),
      title: section.title || section.name || `分区 ${index + 1}`,
      description: section.description || '',
    }));
  }

  const activeCategories = new Set(projects.map((project) => project.category || '未分类'));
  const sectionByTitle = new Map(fallbackSections.map((section) => [section.title, section]));
  const sections = [];
  const seen = new Set();

  for (const fallbackSection of fallbackSections) {
    if (!activeCategories.has(fallbackSection.title)) continue;
    sections.push(fallbackSection);
    seen.add(fallbackSection.title);
  }

  for (const project of projects) {
    const title = project.category || '未分类';
    if (seen.has(title)) continue;
    const fallbackSection = sectionByTitle.get(title);
    sections.push({
      id: project.categoryId || fallbackSection?.id || defaultCategoryId(title, `section-${sections.length + 1}`),
      title,
      description: fallbackSection?.description || '',
    });
    seen.add(title);
  }

  return sections;
}

function normalizePayload(payload, fallbackProfile = {}, fallbackSections = categoryDefaults) {
  const rawProjects = getProjects(payload);
  if (!rawProjects) {
    throw new Error('Project payload must be an array or contain a projects array.');
  }

  const usedIds = new Map();
  const categoryIds = new Map();
  const projects = rawProjects
    .filter((project) => project && (project.title || project.name))
    .map((project, index) => {
      const title = project.title || project.name;
      const category = project.category || project.group || project.section || '未分类';
      const baseId = String(project.id || slugify(project.url || project.link || title, `project-${index + 1}`));
      const nextCount = (usedIds.get(baseId) || 0) + 1;
      const tags = asArray(project.tags || project.meta || project.stack);
      const status = project.status || project.badge || '';
      usedIds.set(baseId, nextCount);

      if (status && !tags.includes(status)) tags.unshift(status);
      const id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;
      const categoryId = project.categoryId || (() => {
        if (categoryIds.has(category)) return categoryIds.get(category);
        const generatedId = defaultCategoryId(category, `section-${categoryIds.size + 1}`);
        categoryIds.set(category, generatedId);
        return generatedId;
      })();

      return {
        id,
        title,
        url: project.url || project.link || '#',
        description: project.description || project.summary || project.tagline || '',
        tagline: project.tagline || project.summary || project.description || '',
        image: project.image || project.preview || project.cover || project.thumbnail || '',
        imageAlt: project.imageAlt || project.alt || title,
        badge: status || (project.featured ? '精选项目' : ''),
        category,
        categoryId,
        tags,
        featured: Boolean(project.featured),
        createdAt: project.createdAt || '',
        sortOrder: Number.isFinite(Number(project.sortOrder)) ? Number(project.sortOrder) : 0,
      };
    });

  return {
    profile: {
      ...fallbackProfile,
      ...(payload.profile || payload.data?.profile || {}),
      dataUrl: apiUrl,
    },
    sections: getSections(payload, projects, fallbackSections),
    projects,
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function fetchRemotePayload() {
  const headers = { Accept: 'application/json' };
  if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function writeIfChanged(payload) {
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  let previous = '';
  try {
    previous = await readFile(outputPath, 'utf8');
  } catch {
    // The file is expected to be created on first build.
  }

  if (previous !== content) {
    await writeFile(outputPath, content, 'utf8');
    console.log(`synced ${payload.projects.length} projects -> ${path.relative(rootDir, outputPath)}`);
  } else {
    console.log(`projects already up to date (${payload.projects.length})`);
  }
}

async function main() {
  const seed = await readJson(seedPath);
  let payload = seed;

  try {
    const remote = await fetchRemotePayload();
    payload = normalizePayload(remote, seed.profile, seed.sections || categoryDefaults);
    console.log(`loaded project data from ${apiUrl}`);
  } catch (error) {
    console.warn(`could not load project API, using seed data: ${error.message}`);
  }

  await writeIfChanged(normalizePayload(payload, seed.profile, seed.sections || categoryDefaults));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
