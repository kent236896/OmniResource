import { pipeline, env } from '@xenova/transformers';
import { getDB } from '../db/index.js';

env.allowLocalModels = false;
env.useBrowserCache = false;

// ── Taxonomy ───────────────────────────────────────────────────────────────────
// Top-level broad categories
const TOP_LABELS = [
  'animals', 'people', 'nature', 'food', 'architecture', 'technology',
  'sports', 'fashion', 'art', 'vehicles', 'interior', 'urban',
  'abstract', 'science', 'health', 'education', 'music',
];

// Sub-categories per broad label — CLIP classifies into whichever matches best
const SUBTAXONOMY: Record<string, string[]> = {
  animals: [
    'dog', 'cat', 'bird', 'horse', 'rabbit', 'bear', 'lion', 'tiger',
    'elephant', 'fish', 'deer', 'fox', 'wolf', 'monkey', 'penguin',
    'cow', 'sheep', 'pig', 'snake', 'turtle', 'parrot', 'owl',
  ],
  dog: [
    'golden retriever', 'corgi', 'husky', 'labrador', 'poodle', 'bulldog',
    'german shepherd', 'beagle', 'chihuahua', 'pomeranian', 'shiba inu',
    'border collie', 'dalmatian', 'dachshund', 'maltese',
  ],
  cat: [
    'persian cat', 'siamese cat', 'british shorthair', 'maine coon',
    'ragdoll', 'bengal cat', 'scottish fold', 'sphynx', 'abyssinian',
  ],
  bird: [
    'eagle', 'parrot', 'owl', 'penguin', 'flamingo', 'peacock',
    'sparrow', 'pigeon', 'hummingbird', 'crow',
  ],
  people: [
    'man', 'woman', 'child', 'elderly person', 'baby', 'couple',
    'group of people', 'athlete', 'businessperson', 'student',
  ],
  nature: [
    'forest', 'ocean', 'mountain', 'desert', 'lake', 'river',
    'waterfall', 'beach', 'flower', 'tree', 'valley', 'canyon',
    'glacier', 'volcano', 'cave', 'meadow',
  ],
  food: [
    'pizza', 'sushi', 'burger', 'pasta', 'salad', 'cake', 'coffee',
    'ramen', 'steak', 'sandwich', 'soup', 'tacos', 'bread', 'fruit',
    'vegetables', 'dessert', 'seafood', 'noodles',
  ],
  architecture: [
    'skyscraper', 'house', 'bridge', 'church', 'castle', 'stadium',
    'museum', 'airport', 'temple', 'lighthouse', 'tower', 'library',
    'shopping mall', 'barn', 'apartment building',
  ],
  technology: [
    'smartphone', 'laptop', 'robot', 'circuit board', 'camera',
    'drone', 'satellite', 'server', 'smartwatch', 'headphones',
    '3d printer', 'solar panel', 'electric car',
  ],
  vehicles: [
    'car', 'motorcycle', 'truck', 'bus', 'bicycle', 'airplane',
    'helicopter', 'boat', 'train', 'submarine', 'rocket', 'tractor',
  ],
  sports: [
    'football', 'basketball', 'tennis', 'swimming', 'cycling', 'running',
    'skiing', 'surfing', 'boxing', 'gymnastics', 'golf', 'baseball',
    'volleyball', 'skateboarding', 'rock climbing',
  ],
  fashion: [
    'dress', 'suit', 'casual wear', 'streetwear', 'sportswear', 'accessories',
    'shoes', 'bag', 'jewelry', 'hat',
  ],
  interior: [
    'living room', 'bedroom', 'kitchen', 'bathroom', 'office',
    'restaurant', 'library', 'gym', 'classroom', 'hospital room',
  ],
  urban: [
    'street', 'cityscape', 'traffic', 'market', 'park', 'subway',
    'cafe', 'rooftop', 'alley', 'plaza', 'night city',
  ],
};

// Score threshold for accepting a tag
const TOP_THRESHOLD = 0.15;
const SUB_THRESHOLD = 0.20;

let classifier: any = null;

export async function initCLIP(): Promise<void> {
  try {
    console.log('Loading CLIP model...');
    classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
    console.log('CLIP model loaded.');
  } catch (error) {
    console.error('Failed to load CLIP model:', error);
  }
}

export async function tagResource(resourceId: string, imageUrl: string): Promise<void> {
  if (!classifier) return;
  try {
    const collectedTags = new Set<string>();

    // ── Pass 1: top-level broad classification ────────────────────────────────
    const topResults: { label: string; score: number }[] =
      await classifier(imageUrl, TOP_LABELS);

    const topMatches = topResults.filter((r) => r.score >= TOP_THRESHOLD).slice(0, 3);
    for (const r of topMatches) collectedTags.add(r.label);

    // ── Pass 2: sub-classification for each matched broad label ───────────────
    for (const match of topMatches) {
      const subLabels = SUBTAXONOMY[match.label];
      if (!subLabels) continue;

      const subResults: { label: string; score: number }[] =
        await classifier(imageUrl, subLabels);

      const subMatches = subResults.filter((r) => r.score >= SUB_THRESHOLD).slice(0, 3);
      for (const r of subMatches) collectedTags.add(r.label);

      // ── Pass 3: one level deeper (e.g. dog → golden retriever) ─────────────
      for (const sub of subMatches) {
        const deepLabels = SUBTAXONOMY[sub.label];
        if (!deepLabels) continue;

        const deepResults: { label: string; score: number }[] =
          await classifier(imageUrl, deepLabels);

        const deepMatches = deepResults.filter((r) => r.score >= SUB_THRESHOLD).slice(0, 2);
        for (const r of deepMatches) collectedTags.add(r.label);
      }
    }

    const db = getDB();
    for (const tag of collectedTags) {
      await db.run('INSERT OR IGNORE INTO tags (resourceId, tag) VALUES (?, ?)', [resourceId, tag]);
    }
    console.log(`Tagged ${resourceId}: ${[...collectedTags].join(', ')}`);
  } catch (error) {
    console.error(`Failed to tag resource ${resourceId}:`, error);
  }
}

export function isClassifierReady(): boolean {
  return !!classifier;
}
