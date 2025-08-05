import type { Option } from '@/types/option.type';

export function getTagOptions(
  t: (key: string) => string,
  posSet: string[],
  nerSet: string[],
  semSet: string[]
): Option[] {
  return [
    {
      value: 'none',
      label: t('none'),
    },
    {
      value: 'pos',
      label: t('pos'),
      children: posSet.map((pos: string) => ({
        value: pos,
        label: pos,
      })),
    },
    {
      value: 'ner',
      label: t('ner'),
      children: nerSet.map((ner: string) => ({
        value: ner,
        label: ner
      })),
    },
    {
      value: 'semantic',
      label: t('semantic'),
      children: semSet.map((sem: string) => ({
        value: sem,
        label: sem
      })),
    }
  ];
}