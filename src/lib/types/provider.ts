export type ActivationMethod = 'qr' | 'app' | 'both';

export type Provider = {
  id: string;
  name: string;
  slug: string;
  /** Used for the logo tile until real provider marks are licensed. */
  brandColor: string;
  activation: ActivationMethod;
};
