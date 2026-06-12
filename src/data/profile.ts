export const contact = {
  name: 'Sylwester Czmil',
  title: 'Senior AI Software Engineer',
  degree: 'PhD',
  location: 'Poland',
  linkedin: 'https://www.linkedin.com/in/sylwekczmil/',
  github: 'https://github.com/sylwekczmil/',
  scholar: 'https://scholar.google.com/citations?user=r1VFMZEAAAAJ',
  orcid: 'https://orcid.org/0000-0002-4635-6702',
  avatar: 'https://avatars.githubusercontent.com/u/75016919?v=4',
}

// The email is assembled from parts at runtime, so the full address never
// appears as a single string in the static HTML or the minified JS bundle —
// naive harvesters that regex for "x@y.z" or scrape `mailto:` links find nothing.
const emailUser = 'sylwekczmil'
const emailDomain = ['gmail', 'com'].join('.')
export const getEmail = () => `${emailUser}@${emailDomain}`

export const summary = {
  lead: 'I design and ship production AI systems, from LLM agents and geospatial analytics to real-time ML pipelines processing 25,000+ events per second.',
  body: [
    'For the last 10+ years I have been building software where machine learning meets engineering reality: distributed cloud platforms, large-scale data pipelines and AI products for Fortune Global 500 clients across energy, technology and healthcare.',
    'AI is my focus, not my ceiling. I have worn every hat in the stack: backend and frontend engineering, data platforms, DevOps and cloud architecture. That means I build the model and the production system around it.',
    'Alongside industry work I completed a PhD in incremental machine learning, published peer-reviewed research and released open-source libraries downloaded tens of thousands of times. The best engineering happens when theory and production inform each other.',
  ],
  facts: [
    { label: 'Currently', value: 'Senior AI Software Engineer @ Craftware' },
    { label: 'Based in', value: 'Poland · remote-friendly' },
    { label: 'Focus', value: 'LLM agents · incremental ML · cloud platforms' },
    { label: 'Languages', value: 'Polish (native) · English (C1)' },
  ],
}

export const stats = [
  { value: 10, suffix: '+', label: 'years of experience' },
  { value: 6, suffix: '', label: 'peer-reviewed publications' },
  { value: 69, suffix: 'k+', label: 'PyPI package downloads' },
  { value: 25, suffix: 'k/s', label: 'sensor events processed in real time' },
]

export interface Role {
  company: string
  role: string
  period: string
  note?: string
  clients?: string[]
  tags: string[]
  highlights: string[]
}

export const experience: Role[] = [
  {
    company: 'Craftware',
    role: 'Senior AI Software Engineer',
    period: '2026 – present',
    note: 'client work for',
    clients: ['a global chemical & pharmaceutical company'],
    tags: ['LLM agents', 'Conversational analytics', 'RAG'],
    highlights: [
      'Building LLM agents that let business teams talk to their data, turning natural-language questions into grounded, validated answers over enterprise datasets.',
      'Designing the retrieval, tool-use and guardrail layers that keep agent responses accurate and traceable on real production data.',
    ],
  },
  {
    company: 'Blue Language Labs',
    role: 'Senior AI Software Engineer',
    period: '2025 – 2026',
    tags: ['LLM agents', 'TypeScript', 'Cloud'],
    highlights: [
      'Developed LLM-powered agents that generate, interpret and execute Blue Documents: verifiable agreements that combine data, rules and deterministic state evaluation across distributed processors.',
      'Built PayNotes: programmable payment agreements that trigger conditional financial flows based on verifiable events, cutting manual reconciliation overhead.',
      'Implemented cloud backend services, APIs and automation for document lifecycle management and agent-driven agreement workflows.',
    ],
  },
  {
    company: 'Semantive',
    role: 'Technical Leader · Senior Software Engineer · Data Scientist · DevOps',
    period: '2019 – 2025',
    note: 'client work for',
    clients: ['a global oil & gas supermajor', 'a multinational technology group'],
    tags: ['LangGraph', 'RAG', 'CNN', 'AWS', 'Databricks'],
    highlights: [
      'Built a Text-to-SQL + RAG system with multi-LLM agent workflows (LangGraph), bridging Databricks and ArcGIS so analysts query complex geospatial datasets in plain language, dramatically reducing query turnaround.',
      'Created a CNN-powered system identifying geological features from core images, thin sections and borehole logs, capturing knowledge from expert geologists.',
      'Enhanced and deployed OSDU, the industry-standard oil & gas data platform, on AWS, automating CI/CD for multi-client deployments and shortening release cycles.',
      'Developed an AWS service-management platform for automated provisioning of client environments, cutting infrastructure setup time significantly.',
    ],
  },
  {
    company: 'SoftSystem',
    role: 'Software Engineer · Data Scientist · DevOps',
    period: '2016 – 2019',
    note: 'client work for',
    clients: ['a US healthcare-IT company'],
    tags: ['Kafka', 'Microservices', 'InfluxDB', 'ElasticSearch'],
    highlights: [
      'Built a real-time predictive-maintenance platform for CNC machines: AI classification over 25,000+ sensor readings per second, microservices, Apache Kafka and hybrid InfluxDB/PostgreSQL storage.',
      'Developed web-based cytometry analysis software with advanced cell gating, statistics and visualization, optimizing MongoDB for multidimensional data traversal.',
      'Contributed to a large-scale biorepository management system, implementing high-performance ElasticSearch services for demanding specimen-collection queries.',
      'Automated cloud deployments and ensured HIPAA / FDA regulatory compliance across all solutions.',
    ],
  },
  {
    company: 'Xebia',
    role: 'Java Intern',
    period: '2015',
    tags: [],
    highlights: ['Java internship while studying, my first taste of professional software engineering.'],
  },
]

export interface Project {
  name: string
  abbr: string
  description: string
  downloads: string
  install: string
  docs: string
  repo: string
  accentVar: string
  badges: string[]
}

export const projects: Project[] = [
  {
    name: 'SEVQ',
    abbr: 'Simple Evolving Vector Quantization',
    description:
      'Novel incremental ML algorithm born from my PhD research: a real-time classifier with minimal tunable parameters. Benchmarked on 36 datasets against 25 algorithms, ranking as the best incremental classifier by AUC. Implemented in Python and FPGA hardware. Published in AMCS.',
    downloads: '9k+ downloads',
    install: 'pip install sevq',
    docs: 'https://sevq.readthedocs.io/',
    repo: 'https://github.com/sylwekczmil/sevq',
    accentVar: 'var(--c-lime)',
    badges: ['Python', 'FPGA', 'AMCS journal'],
  },
  {
    name: 'CACP',
    abbr: 'Classification Algorithms Comparison Pipeline',
    description:
      'Universal benchmarking framework with a GUI for comparing classification algorithms, traditional and incremental, with statistical validation and publication-ready output (CSV + LaTeX). Two versions published in SoftwareX (Elsevier).',
    downloads: '52k+ downloads',
    install: 'pip install cacp',
    docs: 'https://cacp.readthedocs.io/',
    repo: 'https://github.com/sylwekczmil/cacp',
    accentVar: 'var(--c-cyan)',
    badges: ['Python', 'GUI', 'SoftwareX ×2'],
  },
]

export const projectsFootnote = {
  text: 'Also on PyPI: evq, Evolving Vector Quantization (8k+ downloads) · plus 25+ more repos on',
  linkLabel: 'GitHub',
  link: 'https://github.com/sylwekczmil/',
}

export interface Publication {
  year: string
  authors: string
  title: string
  venue: string
  doi: string
}

export const publicationsNote = '≈50 citations · most-cited paper: 25×'

export const publications: Publication[] = [
  {
    year: '2024',
    authors: 'Czmil S., Kluska J., Czmil A.',
    title: 'Version [1.0.3] - CACP: Classification Algorithms Comparison Pipeline',
    venue: 'SoftwareX, Vol. 28, Elsevier',
    doi: 'https://doi.org/10.1016/j.softx.2024.101938',
  },
  {
    year: '2024',
    authors: 'Czmil S., Kluska J., Czmil A.',
    title:
      'An empirical study of a simple incremental classifier based on vector quantization and adaptive resonance theory',
    venue: 'International Journal of Applied Mathematics and Computer Science (AMCS), Vol. 34',
    doi: 'https://doi.org/10.61822/amcs-2024-0011',
  },
  {
    year: '2023',
    authors: 'Czmil A., Kluska J., Czmil S.',
    title:
      'GPR: A Python implementation of an extremely simple classifier based on fuzzy logic and gene expression programming',
    venue: 'SoftwareX, Vol. 22, Elsevier',
    doi: 'https://doi.org/10.1016/j.softx.2023.101362',
  },
  {
    year: '2022',
    authors: 'Czmil S., Kluska J., Czmil A.',
    title: 'CACP: Classification Algorithms Comparison Pipeline',
    venue: 'SoftwareX, Vol. 19, Elsevier',
    doi: 'https://doi.org/10.1016/j.softx.2022.101134',
  },
  {
    year: '2022',
    authors: 'Czmil A., Wronski M., Czmil S., et al.',
    title:
      'NanoForms: an integrated server for processing, analysis and assembly of raw sequencing data of microbial genomes',
    venue: 'PeerJ, Vol. 10',
    doi: 'https://doi.org/10.7717/peerj.13056',
  },
  {
    year: '2019',
    authors: 'Czmil A., Czmil S., Mazur D.',
    title:
      'A method to detect type 1 diabetes based on physical activity measurements using a mobile device',
    venue: 'Applied Sciences, Vol. 9(12)',
    doi: 'https://doi.org/10.3390/app9122555',
  },
]

export const skills: { group: string; items: string[]; accentVar: string }[] = [
  {
    group: 'AI / ML',
    accentVar: 'var(--c-lime)',
    items: [
      'LangChain',
      'LangGraph',
      'LangSmith',
      'AI SDK',
      'scikit-learn',
      'TensorFlow',
      'HuggingFace',
      'Pandas',
      'NumPy',
    ],
  },
  {
    group: 'Languages',
    accentVar: 'var(--c-pink)',
    items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'SQL', 'Bash'],
  },
  {
    group: 'Backend',
    accentVar: 'var(--c-cyan)',
    items: ['FastAPI', 'Flask', 'Django', 'Spring', 'Hibernate'],
  },
  {
    group: 'Frontend',
    accentVar: 'var(--c-amber)',
    items: ['React', 'HTML', 'CSS', 'Dash', 'Streamlit'],
  },
  {
    group: 'Data',
    accentVar: 'var(--c-pink)',
    items: [
      'PostgreSQL',
      'Oracle',
      'MongoDB',
      'ElasticSearch',
      'DynamoDB',
      'InfluxDB',
      'ArcGIS',
      'Databricks',
      'Kafka',
    ],
  },
  {
    group: 'Cloud & DevOps',
    accentVar: 'var(--c-cyan)',
    items: [
      'AWS',
      'Azure',
      'GCP',
      'Linux',
      'Docker',
      'Podman',
      'Kubernetes',
      'Terraform',
      'CloudFormation',
      'GitHub Actions',
      'GitLab CI',
      'Jenkins',
    ],
  },
  {
    group: 'Tools',
    accentVar: 'var(--c-amber)',
    items: ['Git', 'Claude Code', 'Codex', 'LaTeX'],
  },
]

export const education = [
  {
    degree: 'PhD, Information Technology',
    school: 'Rzeszów University of Technology',
    period: '2019 – 2025',
    thesis:
      'Supervised incremental machine learning algorithms and evaluation of their classification quality. Developed the SEVQ algorithm, benchmarked against 25 classifiers with statistical validation (Scott-Knott, Wilcoxon) and implemented in both Python and FPGA hardware.',
  },
  {
    degree: 'MSc, Information Technology',
    school: 'Rzeszów University of Technology',
    period: '2017 – 2018',
    thesis:
      'Advanced system for analysis and monitoring of software development processes: AI and data mining over development data streams, built on Spring Cloud Data Flow and Weka.',
  },
  {
    degree: 'BEng, Information Technology',
    school: 'Rzeszów University of Technology',
    period: '2013 – 2016',
    thesis:
      'IoT Smart Building management system, a full-stack build: Spring Boot backend, Angular frontend, remote control of devices and security cameras.',
  },
]

export const certifications = [
  { name: 'AWS Certified DevOps Engineer – Professional', period: '2023 – 2026', org: 'aws' },
  { name: 'Microsoft Certified: DevOps Engineer Expert', period: '2021 – 2023', org: 'azure' },
]
