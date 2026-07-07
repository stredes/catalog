export interface Family {
  id: string;
  name: string;
}

const DEFAULT_FAMILIES: Family[] = [
  { id: 'family-1', name: 'General' },
];

export function getDefaultFamilies(): Family[] {
  return DEFAULT_FAMILIES;
}
