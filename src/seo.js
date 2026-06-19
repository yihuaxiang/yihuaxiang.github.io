import dataset from './data/projects.generated.json';

const fallbackProfile = {
  siteTitle: '移花香的项目游乐园',
  name: '移花香',
  handle: 'yihuaxiang',
  headline: '把项目、工具和实验集中放在一个入口。',
  intro: '这里收纳了我做过的在线工具、小服务、交互实验和长期维护的产品项目。',
  siteUrl: 'https://yihuaxiang.github.io/',
  blogUrl: 'https://z.wiki',
  githubUrl: 'https://github.com/yihuaxiang',
};

export const profile = { ...fallbackProfile, ...(dataset.profile || {}) };
export const projects = Array.isArray(dataset.projects) ? dataset.projects : [];
export const sections = Array.isArray(dataset.sections) ? dataset.sections : [];

const featuredProjects = projects.filter((project) => project.featured);
const primaryImage = featuredProjects.find((project) => project.image)?.image || projects.find((project) => project.image)?.image;
const canonicalUrl = normalizeUrl(profile.siteUrl || fallbackProfile.siteUrl);
const title = `${profile.siteTitle} | 在线工具、项目作品集与交互实验`;
const description = `${profile.name}（${profile.handle}）的个人项目索引，收录 ${projects.length || 69} 个在线工具、小服务、AI 自动化、可视化交互实验与历史项目。`;
const keywords = [
  profile.name,
  profile.handle,
  '敖武',
  '项目游乐园',
  '个人主页',
  '在线工具',
  '图床',
  'GitHub Pages',
  ...sections.map((section) => section.title),
  ...featuredProjects.map((project) => project.title),
].filter(Boolean);

export const seo = {
  title,
  description,
  keywords: [...new Set(keywords)].join(', '),
  canonicalUrl,
  image: primaryImage,
  locale: 'zh_CN',
};

function normalizeUrl(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function jsonScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function meta(name, content) {
  if (!content) return '';
  return `<meta name="${escapeAttribute(name)}" content="${escapeAttribute(content)}">`;
}

function property(name, content) {
  if (!content) return '';
  return `<meta property="${escapeAttribute(name)}" content="${escapeAttribute(content)}">`;
}

function projectListSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${profile.name}的项目列表`,
    description: seo.description,
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: project.url,
      name: project.title,
      description: project.description,
      image: project.image || undefined,
    })),
  };
}

function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: profile.siteTitle,
    url: seo.canonicalUrl,
    inLanguage: 'zh-CN',
    description: seo.description,
    author: {
      '@type': 'Person',
      name: profile.name,
      alternateName: profile.handle,
      url: profile.blogUrl,
      sameAs: [profile.githubUrl, profile.blogUrl].filter(Boolean),
    },
  };
}

function breadcrumbSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: profile.siteTitle,
        item: seo.canonicalUrl,
      },
    ],
  };
}

export function createSeoMarkup() {
  const tags = [
    `<title>${escapeAttribute(seo.title)}</title>`,
    meta('description', seo.description),
    meta('keywords', seo.keywords),
    meta('author', profile.name),
    meta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'),
    meta('googlebot', 'index, follow, max-image-preview:large'),
    `<link rel="canonical" href="${escapeAttribute(seo.canonicalUrl)}">`,
    property('og:type', 'website'),
    property('og:locale', seo.locale),
    property('og:site_name', profile.siteTitle),
    property('og:title', seo.title),
    property('og:description', seo.description),
    property('og:url', seo.canonicalUrl),
    property('og:image', seo.image),
    property('og:image:alt', `${profile.siteTitle} 代表项目预览`),
    meta('twitter:card', seo.image ? 'summary_large_image' : 'summary'),
    meta('twitter:title', seo.title),
    meta('twitter:description', seo.description),
    meta('twitter:image', seo.image),
    `<script type="application/ld+json">${jsonScript(websiteSchema())}</script>`,
    `<script type="application/ld+json">${jsonScript(projectListSchema())}</script>`,
    `<script type="application/ld+json">${jsonScript(breadcrumbSchema())}</script>`,
  ];

  return tags.filter(Boolean).join('\n    ');
}
