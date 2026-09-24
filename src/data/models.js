import catalog from './catalog.json'

/** Portfolio models stored in this project. Files live in public/models and public/thumbnails. */
export const sampleModels = catalog

/** @deprecated use sampleModels — kept for compatibility */
export const models = sampleModels

export const studio = {
  name: 'MUTHU KRISHNAN',
  shortName: 'MK',
  title: 'Senior 3D Artist · 3D Generalist · AR / VR / XR',
  tagline: 'Realtime 3D, AR/VR/XR, and immersive worlds.',
  heroSupport:
    '7+ years from product viz to metaverse — Blender, Unity, Unreal, and spatial experiences.',
  blurb:
    'Senior 3D Artist and 3D Generalist with 7+ years across product visualization, architectural visualization, animation, and immersive AR/VR/XR content. I take 3D work from CAD and technical briefs through materials, lighting, cameras, animation, rendering, and realtime delivery for marketing, corporate communication, and spatial experiences.',
  location: 'Chennai',
  email: 'Krishmuthu2195@gmail.com',
  phone: '+91 8344838219',
  phoneHref: 'tel:+918344838219',
  workSamples:
    'https://drive.google.com/drive/folders/1ksO3WT4EnlQ9xAUBEZpfffKfYE1VwbRf?usp=sharing',
  award: {
    title: '14th Aegis Graham Bell Awards',
    year: '2024',
    category: 'Metaverse Innovation',
    note: 'Core team member on Hexaware’s Metaverse Innovation project — immersive AR/VR/XR and spatial experiences that won the 14th Aegis Graham Bell Awards (2024).',
  },
  education: {
    degree: 'BE — Computer Science and Engineering',
    school: 'Government College of Engineering, Theni',
    years: '2012 — 2016',
  },
  certifications: [
    'Adobe XD Essentials',
    'Udemy — Figma UI/UX',
    'Microsoft Azure Fundamentals',
  ],
  experience: [
    {
      role: 'Senior 3D Artist',
      company: 'Hexaware Technologies',
      period: 'Aug 2021 — Present',
      points: [
        'Core team on the Metaverse Innovation project that won Hexaware the 14th Aegis Graham Bell Awards (2024) — immersive AR/VR/XR and spatial experiences.',
        'Built realtime 3D assets and scenes for VR/AR/XR pipelines using Unreal Engine, Unity, NVIDIA Omniverse, and USD workflows.',
        'Prepared interactive and spatial-ready content (GLB, GLTF, USD/USDZ) for immersive demos, client experiences, and metaverse use cases.',
        'Created product visualizations, animations, and rendered assets to support marketing and business communication.',
        'Developed motion graphics, transitions, titles, and VFX for corporate and promotional video alongside 3D delivery.',
        'Partnered with marketing, engineering, and design teams to ship on-brand 3D, multimedia, and immersive content on deadline.',
      ],
    },
    {
      role: '3D Interior Designer / Visual Designer',
      company: 'iPro-Visuals',
      period: 'Mar 2020 — Jul 2021',
      points: [
        'Built high-quality interior and exterior visualizations from 2D CAD plans.',
        'Produced photorealistic renders, walkthroughs, and 360° content for design presentations.',
        'Owned materials, lighting, composition, and client-driven asset optimization.',
      ],
    },
    {
      role: '3D Animator',
      company: 'Detroit Engineered Products',
      period: 'Oct 2018 — Jan 2020',
      points: [
        'Imported engineering CAD into Blender; cleaned geometry and set materials, lighting, cameras, and animation.',
        'Created 3D simulations and promotional videos for websites and digital platforms.',
        'Edited advertising content in Premiere Pro and After Effects with color grading and audio.',
      ],
    },
  ],
  skillGroups: [
    {
      label: 'AR / VR / XR',
      items:
        'Metaverse experiences · Spatial storytelling · Realtime scenes · Interactive demos · Immersive walkthroughs · USD / USDZ pipelines',
    },
    {
      label: '3D pipeline',
      items:
        'Product viz · Archviz · CAD to 3D · Materials · Lighting · Rendering · Walkthroughs · 360° · Simulations',
    },
    {
      label: 'Realtime engines & formats',
      items:
        'Unreal Engine · Unity · Blender · Substance Painter · Pixyz · NVIDIA Omniverse · GLB / GLTF / FBX / USD',
    },
    {
      label: 'Motion & finishing',
      items:
        'After Effects · Premiere Pro · Photoshop · Illustrator · Adobe XD · Figma · Color grading · AI tools',
    },
  ],
  roles: [
    'Senior 3D Artist',
    'AR / VR / XR',
    'Metaverse',
    'Realtime Visualization',
    '3D Generalist',
    'Unreal Engine',
    'Unity',
    'Product Visualization',
  ],
}
