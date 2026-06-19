import dataset from './data/projects.generated.json';

const defaultProfile = {
  siteTitle: '移花香的项目游乐园',
  name: '移花香',
  handle: 'yihuaxiang',
  eyebrow: 'Personal Project Index',
  headline: '把项目、工具和实验集中放在一个入口。',
  intro: '这里收纳了我做过的在线工具、小服务、交互实验和长期维护的产品项目。',
  siteUrl: 'https://yihuaxiang.github.io/',
  blogUrl: 'https://z.wiki',
  githubUrl: 'https://github.com/yihuaxiang',
  sourceUrl: 'https://playground.z.wiki/',
  dataUrl: 'https://playground2.z.wiki/api/projects',
};

const profile = { ...defaultProfile, ...(dataset.profile || {}) };
const projects = Array.isArray(dataset.projects) ? dataset.projects : [];
const sections = getSections(dataset.sections, projects);
const featuredProjects = projects.filter((project) => project.featured).slice(0, 4);
const heroProjects = featuredProjects.length ? featuredProjects : projects.slice(0, 4);

function getSections(providedSections, allProjects) {
  if (Array.isArray(providedSections) && providedSections.length) return providedSections;

  const seen = new Set();
  return allProjects.reduce((result, project) => {
    if (!project.categoryId || seen.has(project.categoryId)) return result;
    seen.add(project.categoryId);
    result.push({
      id: project.categoryId,
      title: project.category || '未分类',
      description: '',
    });
    return result;
  }, []);
}

function countByCategory(category) {
  return projects.filter((project) => project.category === category).length;
}

function getProjectsForSection(section) {
  return projects.filter((project) => project.categoryId === section.id || project.category === section.title);
}

function getInitials(name) {
  return String(name || '移花香').slice(0, 1).toUpperCase();
}

function handleImageError(event) {
  const image = event.currentTarget;
  image.style.display = 'none';
  image.closest('.project-card__media')?.classList.add('project-card__media--fallback');
}

function App() {
  const stats = [
    { value: projects.length, label: '项目总数' },
    { value: featuredProjects.length || heroProjects.length, label: '精选代表作' },
    { value: sections.length, label: '主题分区' },
    { value: countByCategory('网站能力 / 小服务'), label: '在线服务' },
  ];

  return (
    <>
      <a className="skip-link" href="#featured-projects">跳到项目列表</a>
      <Header />
      <main className="page-shell">
        <Hero stats={stats} />
        <FeaturedSection />
        <GroupedProjects />
        <About />
      </main>
    </>
  );
}

function Header() {
  return (
    <header className="topbar" aria-label="站点导航">
      <a className="brand" href="#top" aria-label={`${profile.siteTitle} 首页`}>
        <span className="brand__mark">{getInitials(profile.name)}</span>
        <span>
          <span className="brand__title">{profile.siteTitle}</span>
          <span className="brand__subtitle">@{profile.handle} / build-time synced</span>
        </span>
      </a>
      <nav className="topbar__links" aria-label="主要链接">
        <a href="#featured-projects">精选</a>
        <a href="#grouped-projects">分区</a>
        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href={profile.blogUrl} target="_blank" rel="noopener noreferrer">博客</a>
      </nav>
    </header>
  );
}

function Hero({ stats }) {
  return (
    <section className="hero" id="top">
      <div className="hero__main reveal">
        <p className="hero__eyebrow"><span />{profile.eyebrow}</p>
        <h1>{profile.siteTitle}</h1>
        <p className="hero__headline">{profile.headline}</p>
        <p className="hero__intro">{profile.intro}</p>
        <div className="hero__actions" aria-label="快捷操作">
          <a className="button button--primary" href="#featured-projects">查看精选项目</a>
          <a className="button button--ghost" href={profile.sourceUrl} target="_blank" rel="noopener noreferrer">数据源站点</a>
        </div>
      </div>
      <aside className="hero__side reveal" aria-label="首页导览">
        <div className="terminal-card" aria-hidden="true">
          <div className="terminal-card__dots"><span /><span /><span /></div>
          <pre>{`$ whoami\n${profile.handle}\n\n$ status\nprojects: ${projects.length}\napi: playground2.z.wiki`}</pre>
        </div>
        <div className="stat-grid">
          {stats.map((item) => (
            <div className="stat-card" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <nav className="anchor-nav" aria-label="项目分区导航">
          <a href="#featured-projects">精选项目</a>
          {sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>{section.title}</a>
          ))}
        </nav>
      </aside>
    </section>
  );
}

function FeaturedSection() {
  return (
    <section className="section reveal" id="featured-projects">
      <SectionHeader
        eyebrow="Featured"
        title="先看这些代表作"
        description="如果你第一次来到这里，建议先从这几项开始。它们更能代表我正在持续打磨的产品能力、审美取向和技术组合。"
      />
      <div className="featured-grid">
        {heroProjects.map((project, index) => (
          <ProjectCard project={project} variant="featured" key={project.id} style={{ '--delay': `${index * 70}ms` }} />
        ))}
      </div>
    </section>
  );
}

function GroupedProjects() {
  return (
    <section className="section section--flush reveal" id="grouped-projects">
      <SectionHeader
        eyebrow="Browse By Topic"
        title="按主题继续探索"
        description="这里把所有项目重新分区，便于按兴趣快速浏览。不同分区代表不同的问题域：有些偏产品化，有些偏工具效率，有些更接近创意和交互实验。"
      />
      <div className="group-list">
        {sections.map((section) => (
          <ProjectGroup section={section} key={section.id} projects={getProjectsForSection(section)} />
        ))}
      </div>
    </section>
  );
}

function ProjectGroup({ section, projects: groupProjects }) {
  return (
    <section className="group-block" id={section.id}>
      <div className="group-block__header">
        <div>
          <p className="group-block__count">{groupProjects.length} projects</p>
          <h3>{section.title}</h3>
        </div>
        {section.description && <p>{section.description}</p>}
      </div>
      <div className="project-grid">
        {groupProjects.map((project, index) => (
          <ProjectCard project={project} key={project.id} style={{ '--delay': `${index * 24}ms` }} />
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="section__header">
      <p className="section__eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function ProjectCard({ project, variant = 'default', style }) {
  const tags = Array.isArray(project.tags) ? project.tags.slice(0, 3) : [];
  const badge = variant === 'featured' ? '精选项目' : project.badge || project.category || 'Project';

  return (
    <article className={`project-card project-card--${variant}`} style={style}>
      <a href={project.url} target="_blank" rel="noopener noreferrer" title={project.title}>
        <div className="project-card__media" data-title={project.title}>
          {project.image && (
            <img src={project.image} alt={project.imageAlt || project.title} loading="lazy" decoding="async" onError={handleImageError} />
          )}
          <span className="project-card__badge">{badge}</span>
        </div>
        <div className="project-card__content">
          <div className="project-card__meta">
            {tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <h3>{project.title}</h3>
          {project.tagline && <p className="project-card__tagline">{project.tagline}</p>}
          {project.description && <p className="project-card__description">{project.description}</p>}
        </div>
      </a>
    </article>
  );
}

function About() {
  return (
    <section className="about reveal" id="about">
      <div>
        <p className="section__eyebrow">About</p>
        <h2>一个持续更新的个人项目索引</h2>
      </div>
      <p>
        这个页面运行在 GitHub Pages 上，构建时会同步项目 JSON 数据；当前接口来自
        <a href={profile.dataUrl} target="_blank" rel="noopener noreferrer"> {profile.dataUrl}</a>，seed 数据来自
        <a href={profile.sourceUrl} target="_blank" rel="noopener noreferrer"> {profile.sourceUrl}</a>。
      </p>
      <p>
        如果后续需要更新项目，只需要让接口返回新的项目列表，GitHub Actions 会在发布时重新构建页面。
      </p>
    </section>
  );
}

export default App;
