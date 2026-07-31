export const CATEGORIES = [
  { id: 'personaje', label: 'Character', baseId: 100 },
  { id: 'vestimenta', label: 'Clothing', baseId: 200 },
  { id: 'pose', label: 'Pose', baseId: 300 },
  { id: 'escena', label: 'Location', baseId: 400 },
  { id: 'camara', label: 'Camera Settings', baseId: 500 },
];

export const DEFAULT_DATA = Object.fromEntries(
  CATEGORIES.map(c => [c.id, []])
);
