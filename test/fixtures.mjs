export const metadata = {
  title: 'How to export a screenshot', description: 'Prepare a clear screenshot export on your Mac.',
  slug: 'export-a-screenshot', locale: 'en', publishedAt: '2026-07-20', updatedAt: '2026-11-19', status: 'published',
  primaryQuery: 'export app store screenshot', topics: ['screenshot-mockups'],
  sources: [{ title: 'Apple screenshot specifications', url: 'https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications' }],
  related: [], translationKey: 'export-a-screenshot'
};
export function source(data = metadata, body = '## Prepare the image\n\nImport your own capture, then check its dimensions.\n') {
  return `---\n${Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n${body}`;
}
