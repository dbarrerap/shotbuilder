export const DEFAULT_PREVIEW_MODEL = 'black-forest-labs/FLUX.1-schnell';

export const PREVIEW_MODELS = [
  {
    label: 'Free',
    options: [
      { id: 'black-forest-labs/FLUX.1-schnell', label: 'FLUX.1-schnell' },
      { id: 'Tongyi-MAI/Z-Image-Turbo', label: 'Z-Image-Turbo' },
      { id: 'Qwen/Qwen-Image', label: 'Qwen-Image' },
    ],
  },
  {
    label: 'Pro Models',
    options: [
      { id: 'black-forest-labs/FLUX.1-pro', label: 'FLUX.1 Pro' },
      { id: 'stabilityai/stable-diffusion-3-medium', label: 'Stable Diffusion 3 Medium' },
      { id: 'stabilityai/stable-diffusion-xl-base-1.0', label: 'SDXL Base' },
      { id: 'Kwai-Kolors/Kolors', label: 'Kolors' },
    ],
  },
];
